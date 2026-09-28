/**
 * Social preview image.
 *
 * The site ships no image assets, so the preview is built from the page's own
 * primitives and rasterised by the browser the build already depends on. Run
 * after `npm run build`; writes public/og.png.
 */
import { launch } from './cdp.mjs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const assets = resolve(here, '../dist/assets');
const cssFile = (await readdir(assets)).find((f) => f.endsWith('.css'));
if (!cssFile) throw new Error('no built CSS in dist/assets — run the build first');
const css = await readFile(resolve(assets, cssFile), 'utf8');

// Every class here is prefixed og-. The stylesheet above is the real site CSS,
// and it already defines .rule, .mono and .mark — reusing those names made the
// hairline inherit a border box and render as a grey slab.
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}
  :root{--paper:oklch(0.972 0.004 95);--ink:oklch(0.2 0.008 250);--ink-3:oklch(0.46 0.01 250);
        --rule:oklch(0.2 0.008 250/0.16);--rule-strong:oklch(0.2 0.008 250/0.38);
        --accent:oklch(0.52 0.14 255)}
  html,body{margin:0;background:var(--paper)}
  .og-card{width:1200px;height:630px;background:var(--paper);color:var(--ink);padding:74px 82px;
        display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;
        overflow:hidden}
  .og-lock{display:flex;align-items:center;gap:18px}
  .og-logo{width:44px;height:44px;flex:none}
  .og-title{font-size:82px;line-height:1;letter-spacing:-0.03em;font-weight:600;margin:0}
  .og-hair{height:1px;background:var(--rule-strong);position:relative;margin:0;border:0}
  .og-datum{position:absolute;left:0;top:0;width:12px;height:12px;background:var(--accent);
         transform:translate(-1px,-6px)}
  .og-mono{font-family:var(--mono);font-weight:300;font-size:18px;letter-spacing:0.08em;
        text-transform:uppercase;font-variant-numeric:tabular-nums;color:var(--ink-3);margin:0}
  .og-stand{font-size:42px;line-height:1.16;letter-spacing:-0.02em;max-width:26ch;margin:0}
  .og-facts{display:flex;gap:44px;margin:0;padding:0;list-style:none}
  .og-facts li{display:flex;flex-direction:column;gap:7px}
  .og-facts b{font-size:23px;font-weight:500;letter-spacing:-0.01em;color:var(--ink)}
</style></head><body><div class="og-card">
  <div class="og-lock">
    <svg class="og-logo" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <g stroke="var(--accent)" stroke-width="3" stroke-linecap="square">
        <path d="M4 12V5a1 1 0 0 1 1-1h7"/><path d="M28 20v7a1 1 0 0 1-1 1h-7"/>
      </g><rect x="12" y="12" width="8" height="8" fill="var(--accent)"/>
    </svg>
    <h1 class="og-title">Vastraa Labs</h1>
  </div>
  <div class="og-hair"><span class="og-datum"></span></div>
  <p class="og-stand">Our first product is Rivet — a coding agent that works on a real project, from your phone.</p>
  <ul class="og-facts">
    <li><span class="og-mono">Studio</span><b>Two people</b></li>
    <li><span class="og-mono">Builds</span><b>AI and automation</b></li>
    <li><span class="og-mono">Shipping</span><b>Nothing released yet</b></li>
  </ul>
</div></body></html>`;

const dir = await mkdtemp(resolve(tmpdir(), 'og-'));
const page = resolve(dir, 'og.html');
await writeFile(page, html, 'utf8');

const browser = await launch({ width: 1200, height: 630, port: 9381 });
try {
  await browser.send('Page.navigate', { url: 'file://' + page });
  await new Promise((r) => setTimeout(r, 1500));
  const { data } = await browser.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(resolve(here, '../public/og.png'), Buffer.from(data, 'base64'));
  console.log('public/og.png written');
} finally {
  await browser.close();
  await rm(dir, { recursive: true, force: true });
}
