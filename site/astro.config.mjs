import { defineConfig } from 'astro/config';
import { siteConfig } from './src/lib/site-config.mjs';

const site = siteConfig(process.env);
export default defineConfig({
  output: 'static',
  site: site.origin,
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
