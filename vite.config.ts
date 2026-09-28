import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// `||` not `??`: CI exports an unset variable as an empty string, which is a
// defined value, so `??` would skip this default and ship empty og tags.
// This default is deliberately a placeholder — pages-check.mjs FAILS the build
// on any `.example` domain, so nothing ships with a fake canonical. Set
// SITE_URL in the environment (or edit this line) when you actually deploy.
const SITE_URL = (process.env.SITE_URL || 'https://vastraa-labs.example').replace(/\/$/, '');
const OG_IMAGE = `${SITE_URL}/og.png`;

/**
 * Substitutes the two deployment-dependent absolute URLs at build time, so
 * `index.html` never hardcodes a domain and moving to a custom domain is a single
 * environment variable rather than a source edit.
 */
function siteUrls(): Plugin {
  return {
    name: 'vastraa-site-urls',
    transformIndexHtml(html) {
      return html.split('__SITE_URL__').join(SITE_URL).split('__OG_IMAGE__').join(OG_IMAGE);
    },
    // Written into dist/ so the sitemap always carries the real origin.
    closeBundle() {
      const out = path.resolve(__dirname, 'dist/sitemap.xml');
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(
        out,
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${SITE_URL}/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`,
      );
    },
  };
}

// `base: './'` keeps every asset reference relative, so the production build works
// unchanged from a user/organisation Pages subpath (…/vastraa-labs/), from a custom
// domain root, or from a local file:// preview. The site is one page with no client
// router, so relative paths are sufficient; adding routing would require switching
// this to an absolute base.
export default defineConfig({
  base: './',
  plugins: [react(), siteUrls()],
  build: {
    target: 'es2020',
    cssTarget: 'chrome100',
    assetsInlineLimit: 2048,
    reportCompressedSize: true,
  },
});
