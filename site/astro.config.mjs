import { rm } from 'node:fs/promises';
import { defineConfig } from 'astro/config';
import { siteConfig } from './src/lib/site-config.mjs';

const site = siteConfig(process.env);
export default defineConfig({
  output: 'static',
  integrations: [
    {
      name: 'work-finish-review-assets',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          if (site.production)
            await rm(new URL('models/work-finish/', dir), {
              recursive: true,
              force: true,
            });
        },
      },
    },
  ],
  site: site.origin,
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
