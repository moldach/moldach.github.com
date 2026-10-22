import type { APIRoute } from 'astro';
import { siteConfig } from '../lib/site-config.mjs';
export const GET: APIRoute = () => {
  const config = siteConfig(process.env);
  // Previews allow fetching so robots meta/X-Robots-Tag can be observed.
  const sitemap = config.production
    ? `Sitemap: ${config.origin}/sitemap.xml\n`
    : '';
  return new Response(`User-agent: *\nAllow: /\n${sitemap}`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
