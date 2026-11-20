import type { APIRoute } from 'astro';
import { writingEntries, writingHref } from '../lib/registry';
import { siteConfig, canonicalUrl } from '../lib/site-config.mjs';
const xml = (value: string) =>
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
  const entries = config.production ? await writingEntries() : [];
  const items = entries
    .map((entry) => {
      const link =
        entry.data.externalUrl ||
        canonicalUrl(config.origin, writingHref(entry))!;
      return `<item><title>${xml(entry.data.title)}</title><link>${xml(link)}</link><guid isPermaLink="true">${xml(link)}</guid><description>${xml(entry.data.description)}</description><pubDate>${new Date(entry.data.publishedAt).toUTCString()}</pubDate></item>`;
    })
    .join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Matthew Oldach — Writing</title><link>${xml(config.origin || 'https://moldach.github.io')}</link><description>Software, data and practical experiments.</description>${items}</channel></rss>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
