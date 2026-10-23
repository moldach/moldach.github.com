import type { APIRoute } from 'astro';
import { publishedRoutes } from '../lib/registry';
import { siteConfig, canonicalUrl } from '../lib/site-config.mjs';
const escapeXml = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (c) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
      })[c]!,
  );
export const GET: APIRoute = async () => {
  const config = siteConfig(process.env);
  const routes = config.production ? await publishedRoutes() : [];
  const urls = routes
    .map(
      (route) =>
        `<url><loc>${escapeXml(canonicalUrl(config.origin, route)!)}</loc></url>`,
    )
    .join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
