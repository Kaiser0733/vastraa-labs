import { launch } from './cdp.mjs';
import { SLOP_PROBE } from './slop-probe.mjs';

const URL = process.argv[2] || 'http://127.0.0.1:4173/';
const browser = await launch();

const BANNED_FONTS = [
  'Inter', 'system-ui', '-apple-system', 'Helvetica', 'Arial', 'DM Sans', 'Plus Jakarta Sans',
  'Manrope', 'SF Pro Display', 'Space Grotesk', 'Instrument Serif', 'Fraunces',
  'Bricolage Grotesque', 'Sora', 'Young Serif', 'Bodoni', 'Syne',
];
const BANNED_HEX = ['#6366f1', '#4f46e5', '#4338ca', '#8b5cf6', '#7c3aed', '#a855f7'];

let fails = 0;
const v = (ok, label, detail) => {
  if (!ok) fails++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ' — ' + detail : ''}`);
};

for (const scheme of ['light', 'dark']) {
  await browser.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: scheme }],
  });
  await browser.goto(URL);
  const p = await browser.evaluate(SLOP_PROBE);
  console.log(`\n== ${scheme}`);

  const badFont = p.fonts.find((f) => BANNED_FONTS.some((b) => f.toLowerCase().includes(b.toLowerCase())));
  v(!badFont, 'no default/anti-slop font', badFont ? `uses ${badFont}` : p.fonts.join(', '));

  v(!p.bg.cream, 'not the cream/beige default', p.bg.cream
      ? `rgb(${p.bg.rgb}) warmth gap ${p.bg.warmthGap}` : `rgb(${p.bg.rgb})`);

  v(p.canvas.accentPct <= 3, 'accent <= 3% of viewport', `${p.canvas.accentPct}%`);

  v(p.clipText === 0, 'no background-clip:text hero', `${p.clipText}`);
  v(p.gradients === 0, 'no gradients at all', `${p.gradients} elements`);
  v(p.backdrop <= 1, 'glass used at most once, on an edge', `${p.backdrop} elements`);
  v(p.glows === 0, 'no coloured glow', `${p.glows} elements`);
  v(p.stripes === 0, 'no accent stripe on any card edge', `${p.stripes}`);
  v(!p.iconGrids.length, 'no three-column icon-card grid', JSON.stringify(p.iconGrids));
  v(p.pulses === 0, 'no pulsing Live/New dots', `${p.pulses} animated`);
  v(p.serifItalic === 0, 'no italic accent word', `${p.serifItalic}`);
  v(p.h1 && !(p.h1.px >= 72 && p.h1.chars >= 40), 'H1 not a blown-up sentence',
      p.h1 ? `${p.h1.px}px / ${p.h1.chars} chars` : 'none');

  v(p.typeRatio >= 2, 'type hierarchy is not flat', `ratio ${p.typeRatio}`);
  v(p.radii.length <= 3, 'at most three radius values', p.radii.join(', '));
  const heavy = p.shadowAlphas.filter((a) => parseFloat(a) > 0.1);
  v(heavy.length === 0, 'no framework shadow alphas (>0.1)', p.shadowAlphas.join(', ') || 'no shadows');
  v(p.capsTracked === 0, 'no tracked all-caps labels', `${p.capsTracked} of ${p.capsLabels} caps`);
  v(p.minSectionPad >= 64, 'section padding >= 64px', `${p.minSectionPad}px`);
  v(p.weights.every((w) => parseInt(w) <= 600), 'no 700+ display weight', p.weights.join(','));
}

await browser.close();
console.log(`\nSLOP FAILURES: ${fails}`);
process.exit(fails ? 1 : 0);
