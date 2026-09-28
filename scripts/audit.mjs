/**
 * The project's checker.
 *
 * Measures what a screenshot cannot decide: horizontal overflow, prose measure,
 * heading order, landmark structure, computed WCAG contrast on real rendered
 * pairs, keyboard reachability and focus rings, the Rivet state machine, and
 * prefers-reduced-motion behaviour.
 *
 * Usage: node scripts/audit.mjs [url]
 * Exits non-zero on any failure. Fails closed — a measurement it cannot take is
 * a failure, not a pass.
 */
import { launch } from './cdp.mjs';
import { CONTRAST_PROBE } from './contrast-probe.mjs';

const URL = process.argv[2] ?? 'http://127.0.0.1:4173/';
// 384 is here because a real Samsung A03 reports exactly 384 CSS px, which is
// neither of the round numbers this list was originally built from.
const WIDTHS = [360, 384, 390, 430, 768, 1024, 1440, 1920];
const LANDSCAPE = [
  [844, 390, 'phone-landscape'],
  [1180, 820, 'tablet-landscape'],
];
const TITLES = [
  'small phone',
  'Samsung A03 — real device width',
  'iPhone',
  'large phone',
  'tablet portrait',
  'tablet landscape',
  'laptop',
  'desktop',
];

let failures = 0;
const checks = [];
function check(ok, label, detail = '') {
  checks.push({ ok, label });
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ' — ' + detail : ''}`);
}

const srgbToLin = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]) => 0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);
const ratio = (a, b) => {
  const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)];
  return (hi + 0.05) / (lo + 0.05);
};

const PROBE = () => {
  const de = document.documentElement;
  const limit = de.clientWidth;
  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const b = el.getBoundingClientRect();
    if (b.width === 0 && b.height === 0) continue;
    if (b.right > limit + 1 || b.left < -1) {
      const raw =
        el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className;
      const cls = String(raw || '').split(' ')[0];
      offenders.push(
        `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''} [${b.left.toFixed(0)}→${b.right.toFixed(0)}] vs ${limit}`,
      );
    }
  }
  const wide = [];
  for (const el of document.querySelectorAll('p, li, dd')) {
    const b = el.getBoundingClientRect();
    if (b.width === 0 || el.textContent.trim().length < 90) continue;
    const approxCh = parseFloat(getComputedStyle(el).fontSize) * 0.5;
    const n = b.width / approxCh;
    if (n > 80) wide.push(`${el.className || el.tagName} ~${Math.round(n)}ch`);
  }
  return {
    scrollW: de.scrollWidth,
    clientW: limit,
    offenders: offenders.slice(0, 6),
    wide: wide.slice(0, 6),
    headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({
      level: Number(h.tagName[1]),
      text: h.textContent.trim().slice(0, 44),
    })),
    h1: document.querySelectorAll('h1').length,
    landmarks: {
      header: document.querySelectorAll('header').length,
      nav: document.querySelectorAll('nav').length,
      main: document.querySelectorAll('main').length,
      footer: document.querySelectorAll('footer').length,
    },
    labelledNavs: [...document.querySelectorAll('nav')].every(
      (n) => n.getAttribute('aria-label') || n.getAttribute('aria-labelledby'),
    ),
    focusables: document.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ).length,
    title: document.title,
    desc: document.querySelector('meta[name=description]')?.content ?? '',
    canonical: document.querySelector('link[rel=canonical]')?.href ?? '',
    ogImage: document.querySelector('meta[property="og:image"]')?.content ?? '',
    themeColor: document.querySelector('meta[name=theme-color]')?.content ?? '',
    svgUnlabelled: [...document.querySelectorAll('svg')].filter(
      (s) => s.getAttribute('aria-hidden') !== 'true' && !s.getAttribute('aria-label'),
    ).length,
    extLinks: [...document.querySelectorAll('a[href^="http"]')].map((a) => ({
      href: a.getAttribute('href'),
      target: a.getAttribute('target'),
      rel: a.getAttribute('rel') || '',
    })),
    deadLinks: [...document.querySelectorAll('a')]
      .map((a) => a.getAttribute('href'))
      .filter((h) => h === null || h === '' || h === '#'),
    // Touch targets. An inline link's box is its line box, which is routinely
    // under the 24px minimum even when the text is perfectly legible.
    smallTargets: [...document.querySelectorAll('a[href], button:not([disabled])')]
      .map((el) => {
        const b = el.getBoundingClientRect();
        return {
          text: (el.textContent || '').trim().slice(0, 22),
          w: Math.round(b.width),
          h: Math.round(b.height),
        };
      })
      .filter((t) => t.w > 0 && t.h > 0 && (t.h < 24 || t.w < 24)),
    lang: document.documentElement.lang,
  };
};

/** One pass of geometry + structure + contrast at the current viewport. */
async function sweep(browser, width, label) {
  await browser.setViewport(width, 900);
  await browser.goto(URL, 1100);
  const r = await browser.evaluate(PROBE);

  console.log(`\n== ${width}px · ${label}`);
  check(
    r.scrollW <= r.clientW,
    'no horizontal overflow',
    r.scrollW > r.clientW ? `scrollWidth ${r.scrollW} > ${r.clientW}: ${r.offenders.join(' ; ')}` : '',
  );
  check(r.wide.length === 0, 'prose measure <= ~80ch', r.wide.join(', '));
  check(r.h1 === 1, 'exactly one h1', `found ${r.h1}`);
  check(
    r.landmarks.main === 1 && r.landmarks.footer === 1 && r.landmarks.header === 1,
    'header + main + footer landmarks',
    JSON.stringify(r.landmarks),
  );
  check(r.labelledNavs, 'every nav is labelled');
  check(r.lang === 'en', 'html lang set', r.lang);

  let jump = null;
  for (let i = 1; i < r.headings.length; i += 1) {
    if (r.headings[i].level - r.headings[i - 1].level > 1) {
      jump = `${r.headings[i - 1].level} → ${r.headings[i].level} at "${r.headings[i].text}"`;
      break;
    }
  }
  check(!jump, 'no heading-level jumps', jump ?? '');
  check(r.svgUnlabelled === 0, 'every svg hidden from AT', `${r.svgUnlabelled} unlabelled`);

  const ext = r.extLinks;
  check(
    ext.every((l) => l.target === '_blank' && l.rel.includes('noopener')),
    'external links open safely in a new tab',
    ext
      .filter((l) => l.target !== '_blank' || !l.rel.includes('noopener'))
      .map((l) => l.href)
      .join(', '),
  );
  // An earlier build shipped three invented URLs. Every one of them 404'd.
  const placeholders = ext.filter((l) => /\.example\b|example\.(com|org|net)/i.test(l.href));
  check(
    placeholders.length === 0,
    'no placeholder destinations left in external links',
    placeholders.map((l) => l.href).join(', '),
  );
  check(
    r.deadLinks.length === 0,
    'no dead or placeholder hrefs',
    `${r.deadLinks.length}: ${r.deadLinks.join(', ')}`,
  );
  check(
    r.smallTargets.length === 0,
    'every touch target is at least 24x24',
    r.smallTargets.map((t) => `"${t.text}" ${t.w}x${t.h}`).join(', '),
  );
  check(r.focusables > 0, 'has keyboard stops', `${r.focusables} focusable`);

  if (width === 1440) {
    check(/Vastraa Labs/.test(r.title), 'title names the studio', r.title);
    check(r.desc.length > 60, 'meta description present', `${r.desc.length} chars`);
    check(r.canonical.startsWith('http'), 'canonical is absolute', r.canonical);
    check(r.ogImage.startsWith('http'), 'og:image is absolute', r.ogImage);
    check(!!r.themeColor, 'theme-color set', r.themeColor);
  }

  const probe = await browser.evaluate(CONTRAST_PROBE);
  const pairs = probe.text;
  const seen = new Set();
  let worst = 99;
  for (const p of pairs) {
    const key = `${p.fg.map(Math.round)}|${p.bg.map(Math.round)}|${p.size}|${p.weight}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const cr = ratio(p.fg, p.bg);
    const large = p.size >= 24 || (p.size >= 18.66 && Number(p.weight) >= 700);
    const min = large ? 3 : 4.5;
    worst = Math.min(worst, cr);
    if (cr < min) {
      check(false, `contrast ${cr.toFixed(2)}:1 (min ${min})`, `${p.cls} ${p.size}px "${p.sample}"`);
    }
  }

  // WCAG 1.4.11: a graphic that carries meaning needs 3:1. Icons are excluded
  // from the text pass above, and an `opacity` on an svg quietly halves the
  // colour it was given, so they are measured separately against the painted
  // background.
  const icons = probe.icons;
  let worstIcon = 99;
  for (const p of icons) {
    const cr = ratio(p.fg, p.bg);
    worstIcon = Math.min(worstIcon, cr);
    if (cr < 3) {
      check(false, `icon contrast ${cr.toFixed(2)}:1 (min 3)`, `${p.cls} "${p.sample}"`);
    }
  }
  check(worst >= 3, `lowest rendered contrast >= 3:1`, `${worst.toFixed(2)}:1 over ${seen.size} pairs`);
  check(
    worstIcon >= 3,
    'lowest icon contrast >= 3:1 (WCAG 1.4.11)',
    `${worstIcon.toFixed(2)}:1 over ${icons.length} icons`,
  );
  return worst;
}

const browser = await launch({ width: 1440, height: 900, port: 9341 });
try {
  for (let i = 0; i < WIDTHS.length; i += 1) {
    await sweep(browser, WIDTHS[i], TITLES[i]);
  }

  for (const [w, h, label] of LANDSCAPE) {
    await browser.setViewport(w, h);
    await browser.goto(URL, 800);
    const r = await browser.evaluate(PROBE);
    console.log(`\n== ${label} ${w}x${h}`);
    check(r.scrollW <= r.clientW, 'no horizontal overflow', `${r.scrollW} vs ${r.clientW}`);
  }

  console.log('\n== prefers-color-scheme: dark');
  await browser.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: 'dark' }],
  });
  const darkWorst = await sweep(browser, 1440, 'dark');
  await browser.send('Emulation.setEmulatedMedia', { features: [] });

  console.log('\n== keyboard');
  await browser.setViewport(1440, 900);
  await browser.goto(URL, 1000);
  const stops = [];
  for (let i = 0; i < 16; i += 1) {
    await browser.key('Tab', 'Tab', 9);
    stops.push(
      await browser.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return { tag: 'BODY' };
        const cs = getComputedStyle(el);
        return {
          tag: el.tagName,
          text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 26),
          shadow: cs.boxShadow,
          outline: cs.outlineStyle,
        };
      }),
    );
  }
  const real = stops.filter((s) => s.tag !== 'BODY');
  check(real.length >= 12, 'tab reaches interactive elements', `${real.length} stops`);
  const noRing = real.filter((s) => s.shadow === 'none' && s.outline === 'none');
  check(
    noRing.length === 0,
    'every focus stop paints a ring',
    noRing.map((s) => `${s.tag}:"${s.text}"`).join(', '),
  );
  console.log('  order: ' + real.map((s) => `${s.tag} "${s.text}"`).join(' → '));

  console.log('\n== rivet ledger');
  await browser.goto(URL, 1000);
  const initial = await browser.evaluate(() => {
    const steps = [...document.querySelectorAll('.ledger__step')];
    return {
      total: steps.length,
      // The invariant that matters: readable at first paint, nothing gated.
      allVisible: steps.every((s) => {
        const cs = getComputedStyle(s);
        return cs.visibility !== 'hidden' && +cs.opacity === 1 && !s.hasAttribute('aria-hidden');
      }),
      text: document.querySelector('.ledger').textContent,
    };
  });
  check(initial.total === 6, 'six steps in the ledger', `${initial.total}`);
  check(
    initial.allVisible,
    'no step is hidden or aria-hidden at first paint',
    'every step is readable without waiting',
  );
  check(
    /Approve/.test(initial.text) && /crash/.test(initial.text) && /undo|review/i.test(initial.text),
    'the whole exchange is in the DOM before any interaction',
  );

  // Playhead advances on its own, then holds at the gate.
  await new Promise((r) => setTimeout(r, 9000));
  const held = await browser.evaluate(() => ({
    current: document.querySelectorAll('.ledger__step[data-state="current"]').length,
    counter: document.querySelector('.track__count')?.textContent?.trim(),
    waiting: document.body.textContent.includes('Waiting on you.'),
  }));
  check(
    held.counter === '04/06' && held.waiting,
    'playhead advances and holds at the approval gate',
    `counter ${held.counter}`,
  );

  await new Promise((r) => setTimeout(r, 5000));
  const stillHeld = await browser.evaluate(
    () => document.querySelector('.track__count')?.textContent?.trim(),
  );
  check(stillHeld === '04/06', 'playhead does not run past an unanswered gate', stillHeld);

  await browser.click('.gate .btn--primary');
  const approved = await browser.evaluate(() => ({
    gateGone: !document.querySelector('.gate'),
    rows: document.querySelectorAll('.diff__row').length,
    foot: (document.querySelector('.diff__foot')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
  }));
  check(
    approved.gateGone && approved.rows === 3,
    'approve reveals the three changed files',
    `${approved.rows} rows`,
  );
  check(/3/.test(approved.foot), 'diff totals rendered', approved.foot);

  await browser.click('.diff__row');
  const expanded = await browser.evaluate(() => ({
    expanded: document.querySelector('.diff__row').getAttribute('aria-expanded'),
  }));
  check(expanded.expanded === 'true', 'changed-file row expands');

  const undone = await browser.evaluate(() => {
    const b = [...document.querySelectorAll('.diff__foot .btn')].find(
      (x) => x.textContent.trim() === 'Undo',
    );
    if (!b) return 'no-button';
    b.click();
    return 'clicked';
  });
  check(undone === 'clicked', 'undo control is reachable', undone);
  await new Promise((r) => setTimeout(r, 400));
  const reverted = await browser.evaluate(() => document.body.textContent.includes('Reverted.'));
  check(reverted, 'undo restores the project');

  await browser.goto(URL, 1200);
  await browser.click('.gate .btn:not(.btn--primary)');
  const declined = await browser.evaluate(() => ({
    empty: document.body.textContent.includes('No files changed. Nothing to review'),
    rows: document.querySelectorAll('.diff__row').length,
    written: document.body.textContent.includes('Held back.'),
  }));
  check(
    declined.empty && declined.rows === 0 && declined.written,
    'declining yields a genuinely different, empty outcome',
    `${declined.rows} diff rows`,
  );

  console.log('\n== prefers-reduced-motion');
  const rm = await launch({ width: 1440, height: 900, port: 9342 });
  await rm.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await rm.goto(URL, 1600);
  const rmState = await rm.evaluate(() => ({
    counter: document.querySelector('.track__count')?.textContent?.trim(),
    transition: getComputedStyle(document.querySelector('.ledger__step')).transitionDuration,
  }));
  check(rmState.counter === '06/06', 'reduced motion shows the whole exchange at once', rmState.counter);
  check(
    parseFloat(rmState.transition) < 0.01,
    'reduced motion collapses transitions',
    rmState.transition,
  );
  await rm.close();

  console.log('\n== console');
  const errs = browser.consoleErrors.filter((e) => !/favicon|net::ERR_/i.test(e));
  check(errs.length === 0, 'no console errors or page exceptions', errs.join(' | '));
} finally {
  await browser.close();
}

const passed = checks.filter((c) => c.ok).length;
console.log(`\n${passed}/${checks.length} checks passed`);
console.log(`TOTAL FAILURES: ${failures}`);
process.exit(failures > 0 ? 1 : 0);
