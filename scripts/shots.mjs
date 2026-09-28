/**
 * Full-page captures for visual review.
 * Usage: node scripts/shots.mjs <url> <outDir>
 */
import { launch } from './cdp.mjs';
import { mkdir } from 'node:fs/promises';

const URL = process.argv[2] ?? 'http://127.0.0.1:4173/';
const OUT = process.argv[3] ?? './shots';

await mkdir(OUT, { recursive: true });

const SHOTS = [
  { w: 1440, h: 1000, name: 'desktop-1440' },
  { w: 768, h: 1000, name: 'tablet-768' },
  { w: 390, h: 844, name: 'phone-390' },
  { w: 360, h: 800, name: 'phone-360' },
  { w: 844, h: 390, name: 'phone-landscape' },
];

const browser = await launch({ width: 1440, height: 1000, port: 9361 });
for (const s of SHOTS) {
  await browser.setViewport(s.w, s.h);
  await browser.goto(URL, 1400);
  await browser.shot(`${OUT}/${s.name}.png`, { fullPage: true });
  console.log(`${OUT}/${s.name}.png`);
}

// dark scheme
await browser.send('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-color-scheme', value: 'dark' }],
});
await browser.setViewport(1440, 1000);
await browser.goto(URL, 1400);
await browser.shot(`${OUT}/desktop-1440-dark.png`, { fullPage: true });
console.log(`${OUT}/desktop-1440-dark.png`);

await browser.close();
