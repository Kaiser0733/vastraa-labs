/**
 * Contrast probe.
 *
 * Self-contained on purpose: it is stringified and evaluated inside the page, so
 * it carries its own colour resolution and depends on nothing.
 *
 * Chromium's computed style keeps colours in their authored space — `oklch` stays
 * `oklch`, `color-mix` becomes `oklab` — and this build's 2D canvas refuses both.
 * A regex over the computed string therefore measures nothing, and the first two
 * versions of this probe reported 1.00:1 for text that is plainly legible. This
 * converts properly and composites alpha over the backdrop.
 */
export const CONTRAST_PROBE = () => {
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const gamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

  function oklabToRgb(L, a, b) {
    const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
    const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
    const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ].map((v) => clamp01(gamma(v)) * 255);
  }

  function parseColor(css) {
    const str = String(css).trim();
    let m = str.match(/^rgba?\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
      return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 };
    }
    m = str.match(/^oklch\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(/[\s/]+/).filter(Boolean);
      const C = parseFloat(p[1] ?? '0');
      const h = (parseFloat(p[2] ?? '0') * Math.PI) / 180;
      return {
        rgb: oklabToRgb(parseFloat(p[0]), C * Math.cos(h), C * Math.sin(h)),
        a: p[3] !== undefined ? parseFloat(p[3]) : 1,
      };
    }
    m = str.match(/^oklab\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(/[\s/]+/).filter(Boolean);
      return {
        rgb: oklabToRgb(parseFloat(p[0]), parseFloat(p[1] ?? '0'), parseFloat(p[2] ?? '0')),
        a: p[3] !== undefined ? parseFloat(p[3]) : 1,
      };
    }
    m = str.match(/^color\(srgb\s+([^)]+)\)/);
    if (m) {
      const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number);
      return { rgb: p.slice(0, 3).map((v) => v * 255), a: p[3] !== undefined ? p[3] : 1 };
    }
    m = str.match(/^#([0-9a-f]{3,8})$/i);
    if (m) {
      let h = m[1];
      if (h.length === 3) h = h.split('').map((c) => c + c).join('');
      return {
        rgb: [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)],
        a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
      };
    }
    if (str === 'transparent') return { rgb: [0, 0, 0], a: 0 };
    return null;
  }

  const over = (fg, bg) => fg.rgb.map((c, i) => fg.a * c + (1 - fg.a) * bg[i]);

  /**
   * Composite every ancestor background down to the canvas, bottom-up.
   *
   * Two things matter here. Stopping at the first opaque ancestor is wrong: a
   * 1px rule element is a 38%-alpha layer, and text sitting beside it reads
   * against the darkened paper behind it. But an ancestor the text does not
   * actually overlap is irrelevant — a label positioned 16px ABOVE a hairline is
   * not composited onto that hairline. Compositing by ancestry alone reported
   * 2.23:1 for a full-strength label, which is the tool lying rather than the page
   * failing. So each layer is only counted when its box intersects the text.
   */
  const effectiveBg = (el) => {
    const rect = el.getBoundingClientRect();
    const layers = [];
    let n = el;
    while (n) {
      const b = n.getBoundingClientRect();
      const overlaps =
        b.width > 0 &&
        b.height > 0 &&
        b.left < rect.right &&
        b.right > rect.left &&
        b.top < rect.bottom &&
        b.bottom > rect.top;
      layers.push([getComputedStyle(n).backgroundColor, overlaps]);
      n = n.parentElement;
    }
    let base = [255, 255, 255];
    for (let i = layers.length - 1; i >= 0; i -= 1) {
      if (!layers[i][1]) continue;
      const c = parseColor(layers[i][0]);
      if (c && c.a > 0) base = over(c, base);
    }
    return base;
  };

  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    if (el.children.length > 0) continue;
    const txt = (el.textContent || '').trim();
    if (!txt) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const cls = String(
      el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '',
    );
    const fgParsed = parseColor(cs.color);
    if (!fgParsed) continue;
    const bg = effectiveBg(el);
    out.push({
      cls: cls.split(' ')[0] || el.tagName.toLowerCase(),
      fg: over(fgParsed, bg),
      bg,
      size: parseFloat(cs.fontSize),
      weight: cs.fontWeight,
      sample: txt.slice(0, 26),
    });
  }
  return { text: out, icons: icons() };

  /** Icons are graphics, not text, so WCAG 1.4.11 asks for 3:1 rather than
   *  4.5:1 — but `opacity` on an svg silently halves whatever colour it is
   *  given, and a text-only pass reads the link's colour and never notices.
   *  Kept inside this closure so the colour helpers are in scope. */
  function icons() {
    const seen = new Map();
    for (const svg of document.querySelectorAll('svg')) {
      const host = svg.closest('a, button');
      if (!host) continue;
      const cs = getComputedStyle(svg);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const r = svg.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;

      const fg = parseColor(cs.color);
      if (!fg) continue;
      const bg = effectiveBg(svg);
      const painted = over({ rgb: fg.rgb, a: fg.a * Number(cs.opacity) }, bg);
      const key = `${cs.color}|${cs.opacity}|${host.className}`;
      if (seen.has(key)) continue;
      seen.set(key, {
        cls: String(host.className || host.tagName.toLowerCase()),
        fg: painted,
        bg,
        sample:
          (host.getAttribute('aria-label') || host.textContent || '').trim().slice(0, 20) ||
          host.tagName.toLowerCase(),
      });
    }
    return [...seen.values()];
  }
};
