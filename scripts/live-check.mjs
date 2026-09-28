// Verifies the deployed site, not the build. A green CI run proves the pipeline
// exited 0; it does not prove Pages is serving the bytes, and a broken canonical
// is invisible in a build log.
const ORIGIN = (process.argv[2] || 'https://kaiser0733.github.io/vastraa-labs').replace(/\/$/, '');

let fails = 0;
const v = (ok, label, detail) => {
  if (!ok) fails++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ' — ' + detail : ''}`);
};

const get = async (path) => {
  const r = await fetch(`${ORIGIN}${path}`, { redirect: 'follow' });
  return { status: r.status, type: r.headers.get('content-type') || '', body: r.url ? await r.text() : '' };
};

const home = await get('/');
v(home.status === 200, 'home returns 200', String(home.status));

const canonical = home.body.match(/<link rel="canonical" href="([^"]*)"/)?.[1] || '';
v(canonical === ORIGIN, 'canonical is absolute and correct', canonical || '(missing)');

const ogUrl = home.body.match(/og:url" content="([^"]*)"/)?.[1] || '';
v(ogUrl === ORIGIN, 'og:url is absolute and correct', ogUrl || '(missing)');

const ogImage = home.body.match(/og:image" content="([^"]*)"/)?.[1] || '';
v(ogImage.startsWith(ORIGIN), 'og:image is absolute', ogImage || '(missing)');

// An og:image that 404s is the exact bug this file exists for.
if (ogImage.startsWith(ORIGIN)) {
  const img = await fetch(ogImage);
  v(img.ok, 'og:image actually resolves', `${img.status} ${img.headers.get('content-type') || ''}`);
}

const tw = home.body.match(/twitter:image" content="([^"]*)"/)?.[1] || '';
v(tw === ogImage, 'twitter:image matches og:image', tw || '(missing)');

for (const p of ['/og.png', '/favicon.svg', '/robots.txt', '/sitemap.xml']) {
  const r = await fetch(`${ORIGIN}${p}`);
  v(r.ok, `asset served: ${p}`, String(r.status));
}

const map = await get('/sitemap.xml');
v(map.body.includes(`<loc>${ORIGIN}/</loc>`), 'sitemap carries the real origin', map.body.slice(0, 90).replace(/\s+/g, ' '));

// The JS bundle has to load too, or the page is a blank shell that still
// returns 200 and still has correct meta tags.
const js = home.body.match(/src="\.?\/?(assets\/[^"]+\.js)"/)?.[1];
if (js) {
  const r = await fetch(`${ORIGIN}/${js}`);
  v(r.ok && (r.headers.get('content-type') || '').includes('javascript'), 'JS bundle served', `${r.status} ${r.headers.get('content-type') || ''}`);
} else {
  v(false, 'JS bundle referenced', 'no <script src> found in the deployed HTML');
}

console.log(`\nLIVE FAILURES: ${fails}`);
process.exit(fails ? 1 : 0);
