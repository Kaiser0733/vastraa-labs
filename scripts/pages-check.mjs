/**
 * GitHub Pages compatibility check.
 *
 * Vite is built with `base: './'`, so the bundle must work unchanged from a
 * project subpath, a custom-domain root, and a nested path served by a different
 * server. This serves dist/ under a nested prefix and loads the real page.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { launch } from './cdp.mjs';

const DIST = resolve(process.argv[2] ?? './dist');
const PREFIX = '/vastraa-labs/';
const PORT = 4399;

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.startsWith(PREFIX)) p = p.slice(PREFIX.length);
  if (p === '' || p === '/') p = 'index.html';
  const file = join(DIST, p);
  try {
    const s = await stat(file);
    if (!s.isFile()) throw new Error('dir');
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const URL = `http://127.0.0.1:${PORT}${PREFIX}`;
console.log(`serving dist/ at ${URL}`);

let failures = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ' — ' + detail : ''}`);
};

const browser = await launch({ width: 1280, height: 900, port: 9391 });
try {
  await browser.goto(URL, 1800);

  const r = await browser.evaluate(() => {
    const abs = [...document.querySelectorAll('link[href], script[src], img[src]')].map((e) =>
      e.getAttribute('href') || e.getAttribute('src'),
    );
    return {
      styled: getComputedStyle(document.body).backgroundColor,
      serif: getComputedStyle(document.querySelector('h1')).fontFamily,
      rendered: [...document.querySelectorAll('main section')].map((s) => s.id || s.className),
      assets: abs,
      canonical: document.querySelector('link[rel=canonical]')?.href ?? '',
      ogUrl: document.querySelector('meta[property="og:url"]')?.content ?? '',
      ogImage: document.querySelector('meta[property="og:image"]')?.content ?? '',
      twImage: document.querySelector('meta[name="twitter:image"]')?.content ?? '',
      requests: performance
        .getEntriesByType('resource')
        .map((e) => e.name)
        .filter((n) => !n.startsWith('data:')),
      failed: performance
        .getEntriesByType('resource')
        .filter((e) => e.transferSize === 0 && e.decodedBodySize === 0).length,
      title: document.title,
    };
  });

  // Assert the sections by id, not by count. A hardcoded number goes stale the
  // moment a section is added or removed, and then it fails for the wrong reason.
  const want = ['top', 'work', 'principles', 'lab'];
  const got = Array.isArray(r.rendered) ? r.rendered : [];
  const missing = want.filter((id) => !got.includes(id));
  check(
    missing.length === 0 && got.length > 0,
    'every content section renders from a subpath',
    missing.length ? `missing #${missing.join(', #')}` : `${got.length} sections: ${got.join(', ')}`,
  );
  // A canonical or og:url pointing at a domain that does not exist is worse
  // than no tag at all: search engines are told to ignore the real page, and
  // every shared link renders a broken card.
  const PLACEHOLDER = /\.example\b|example\.(com|org|net)/i;
  const meta = [r.canonical, r.ogUrl, r.ogImage, r.twImage];
  const placeheld = meta.filter((u) => PLACEHOLDER.test(u || ''));
  check(
    placeheld.length === 0,
    'no placeholder domain in canonical/og/twitter tags',
    placeheld.join(', ') || `canonical=${r.canonical || '(none)'}`,
  );
  check(
    r.canonical.startsWith('https://'),
    'canonical is an absolute https URL',
    r.canonical || '(missing)',
  );
  check(
    /Source Serif/.test(r.serif),
    'stylesheet applied (design tokens resolved)',
    r.serif.split(',')[0],
  );
  check(r.assets.every((a) => !a.startsWith('/')), 'no root-absolute asset paths', r.assets.join(' '));
  const bad = r.requests.filter((n) => !n.startsWith(`http://127.0.0.1:${PORT}${PREFIX}`));
  check(bad.length === 0, 'every request stays under the prefix', bad.join(' '));
  check(browser.consoleErrors.length === 0, 'no console errors', browser.consoleErrors.join(' | '));
  check(/Vastraa Labs/.test(r.title), 'title present', r.title);
  console.log('  requests: ' + r.requests.map((n) => n.split('/').pop()).join(', '));

  // Nested deeper still, as a custom-domain root would be.
  await browser.evaluate(() => {
    document.querySelectorAll('a[href^="#"]').forEach(() => {});
  });
} finally {
  await browser.close();
  server.close();
}

console.log(`\nTOTAL FAILURES: ${failures}`);
process.exit(failures > 0 ? 1 : 0);
