const PROBE = () => {
  const rgb = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2]];
  };
  const hx = (s) => {
    const m = s.match(/#([0-9a-f]{3,8})/i);
    if (!m) return null;
    let h = m[1];
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  };
  const all = [];
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    all.push({ el, cs, bg: rgb(cs.backgroundColor) });
  }

  // Canvas tells: saturation only, no lightness — where does colour actually sit?
  let painted = 0;
  let chromatic = 0;
  for (const e of document.querySelectorAll('body *')) {
    const r = e.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (getComputedStyle(e).visibility === 'hidden') continue;
    painted += r.width * r.height;
    const c = rgb(getComputedStyle(e).backgroundColor);
    if (!c) continue;
    const mx = Math.max(...c);
    const mn = Math.min(...c);
    if (mx - mn > 28) chromatic += r.width * r.height;
  }
  const w = document.documentElement.clientWidth;
  const h = document.documentElement.scrollHeight;
  const accentPct = painted ? (100 * chromatic) / (painted || 1) : 0;

  // `body` keeps the authored colour space; `html` is resolved to real rgb by
  // the engine. Reading body made the cream check pass for the wrong reason.
  const body = rgb(getComputedStyle(document.documentElement).backgroundColor);
  const warmth = body ? body[0] - body[2] : 0;
  const minCh = body ? Math.min(...body) : 255;

  const gradients = [...document.querySelectorAll('*')].filter((e) => {
    const b = getComputedStyle(e).backgroundImage;
    return b && b !== 'none' && /gradient/.test(b);
  }).length;

  const backdrop = [...document.querySelectorAll('*')].filter((e) => {
    const b = getComputedStyle(e).backdropFilter;
    return b && b !== 'none';
  }).length;

  const glows = [...document.querySelectorAll('*')].filter((e) => {
    const s = getComputedStyle(e).boxShadow;
    if (!s || s === 'none') return false;
    const m = s.match(/(\d+(?:\.\d+)?)px/g) || [];
    return m.some((v) => parseFloat(v) >= 24);
  }).length;

  const clipText = [...document.querySelectorAll('*')].filter(
    (e) => getComputedStyle(e).webkitBackgroundClip === 'text' || getComputedStyle(e).backgroundClip === 'text',
  ).length;

  // Icon-card grid: >=3 sibling cards that each contain an svg and a heading.
  const grids = [];
  for (const ul of document.querySelectorAll('ul, div')) {
    const cs = getComputedStyle(ul);
    if (!/grid|flex/.test(cs.display)) continue;
    const cols = (cs.gridTemplateColumns || '').split(' ').filter(Boolean).length;
    if (cols < 2) continue;
    const kids = [...ul.children].filter((c) => c.querySelector('svg') && c.querySelector('h1,h2,h3,h4'));
    if (kids.length >= 3) grids.push({ n: kids.length, cols, cls: ul.className });
  }

  const stripes = [...document.querySelectorAll('*')].filter((e) => {
    const s = getComputedStyle(e);
    const sides = ['Top', 'Right', 'Bottom', 'Left'].map((k) => parseFloat(s['border' + k + 'Width']) || 0);
    const mx = Math.max(...sides);
    return mx >= 3 && sides.filter((v) => v < mx - 0.5).length >= 3;
  }).length;

  const caps = [...document.querySelectorAll('*')].filter((e) => {
    const t = (e.textContent || '').trim();
    return t && t.length < 40 && t === t.toUpperCase() && /[A-Z]{3}/.test(t) && e.children.length === 0;
  }).length;
  const capsTracked = [...document.querySelectorAll('*')].filter((e) => {
    const t = (e.textContent || '').trim();
    if (!(t && t.length < 40 && t === t.toUpperCase() && /[A-Z]{3}/.test(t) && e.children.length === 0)) return false;
    return parseFloat(getComputedStyle(e).letterSpacing) > 0.4;
  }).length;

  const pulses = [...document.querySelectorAll('*')].filter((e) => {
    const s = getComputedStyle(e);
    return s.animationName !== 'none' && /pulse|glow|blink|spin/.test(s.animationName);
  }).length;

  const serifItalic = [...document.querySelectorAll('em, i')].length;

  const radii = new Set();
  for (const e of document.querySelectorAll('body *')) {
    const r = getComputedStyle(e).borderRadius;
    if (r && r !== '0px' && !/^50%|^100%/.test(r)) radii.add(r.split(' ')[0]);
  }

  const shadows = new Set();
  for (const e of document.querySelectorAll('body *')) {
    const s = getComputedStyle(e).boxShadow;
    if (s && s !== 'none') {
      const m = s.match(/rgba?\([^)]+?,\s*([\d.]+)\)/);
      if (m) shadows.add(m[1]);
    }
  }

  const sizes = new Set();
  for (const e of document.querySelectorAll('body *')) {
    if (e.children.length === 0 && (e.textContent || '').trim()) {
      sizes.add(parseFloat(getComputedStyle(e).fontSize));
    }
  }
  const arr = [...sizes].sort((a, b) => a - b);

  const weights = new Set();
  for (const e of document.querySelectorAll('h1,h2,h3,h4,p,span,a,li,button,strong,em')) {
    if (e.children.length === 0 && (e.textContent || '').trim()) {
      weights.add(getComputedStyle(e).fontWeight);
    }
  }

  const secPad = [...document.querySelectorAll('section')].map((s) => {
    const cs = getComputedStyle(s);
    return Math.max(parseFloat(cs.paddingTop), parseFloat(cs.paddingBottom));
  });

  return {
    canvas: { w, h, accentPct: +accentPct.toFixed(1) },
    bg: { rgb: body, minChannel: minCh, warmthGap: warmth, cream: minCh >= 209 && warmth >= 6 && warmth <= 48 },
    // HTML/HEAD/META inherit the browser default and paint nothing. Counting
    // them reports Times New Roman on every site ever built.
    fonts: [
      ...new Set(
        [...document.querySelectorAll('body *')]
          .filter((e) => e.children.length === 0 && (e.textContent || '').trim())
          .map((e) => getComputedStyle(e).fontFamily.split(',')[0].replace(/["']/g, '').trim()),
      ),
    ],
    gradients,
    backdrop,
    glows,
    clipText,
    stripes,
    iconGrids: grids.slice(0, 4),
    capsLabels: caps,
    capsTracked,
    pulses,
    serifItalic,
    radii: [...radii],
    shadowAlphas: [...shadows],
    typeSizes: arr,
    typeRatio: arr.length > 1 ? +(arr[arr.length - 1] / arr[0]).toFixed(2) : 0,
    weights: [...weights].sort(),
    minSectionPad: Math.min(...secPad),
    h1: (() => {
      const e = document.querySelector('h1');
      return e ? { px: parseFloat(getComputedStyle(e).fontSize), chars: e.textContent.trim().length } : null;
    })(),
  };
};

export const SLOP_PROBE = PROBE;
