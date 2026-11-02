import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://vastraalabs.online',
  output: 'static',
  build: { format: 'directory' },
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        return path !== '/rivet/' && path !== '/404/' && path !== '/404.html';
      },
    }),
  ],
});
