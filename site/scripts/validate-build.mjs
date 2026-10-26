import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { load } from 'cheerio';
import { canonicalUrl } from '../src/lib/site-config.mjs';

export async function htmlFiles(dir) {
  const results = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const name = resolve(dir, entry.name);
    if (entry.isDirectory()) results.push(...(await htmlFiles(name)));
    else if (entry.name.endsWith('.html')) results.push(name);
  }
  return results;
}

export async function validateBuild(dist, config) {
  const errors = [];
  const titles = new Set();
  const routes = new Set();
  for (const file of await htmlFiles(dist)) {
    const local = relative(dist, file).replaceAll('\\', '/');
    const route =
      local === 'index.html' ? '/' : `/${local.replace(/index\.html$/, '')}`;
    const is404 = local === '404.html';
    if (!is404) routes.add(route);
    const html = await readFile(file, 'utf8');
    const $ = load(html);
    const fail = (message) => errors.push(`${route}: ${message}`);
    const title = $('title').text().trim();
    if (!title || titles.has(title)) fail('title missing or duplicated');
    titles.add(title);
    if (!$('meta[name="description"]').attr('content')?.trim())
      fail('description missing');
    if ($('main h1').length !== 1) fail('expected one main H1');
    if (!$('main').text().trim()) fail('primary HTML content missing');
    const robots = $('meta[name="robots"]').attr('content') || '';
    const canonical = $('link[rel="canonical"]');
    if (config.production && !is404) {
      if (/noindex/i.test(robots)) fail('production page is noindexed');
      if (
        canonical.length !== 1 ||
        canonical.attr('href') !== canonicalUrl(config.origin, route)
      )
        fail('canonical must match production route');
      if (
        $('meta[property="og:url"]').attr('content') !==
        canonicalUrl(config.origin, route)
      )
        fail('social URL mismatch');
    } else if (!/noindex/i.test(robots))
      fail('preview/error page must be noindexed');
    for (const script of $('script[type="application/ld+json"]')) {
      try {
        const data = JSON.parse($(script).text());
        if (
          data['@context'] !== 'https://schema.org' ||
          !Array.isArray(data['@graph'])
        )
          fail('invalid structured-data graph');
        if (
          config.production &&
          /https?:\/\/([^/]+\.)?(example\.(com|net|org)|localhost|[^/]+\.pages\.dev)[/"#]/i.test(
            JSON.stringify(data),
          )
        )
          fail('placeholder/provider URL in structured data');
      } catch {
        fail('invalid JSON-LD');
      }
    }
    for (const element of $(
      'a[href],img[src],link[href],script[src],video[src],source[src]',
    )) {
      const node = $(element);
      const value = node.attr('href') || node.attr('src');
      if (!value || !value.startsWith('/') || value.startsWith('//')) continue;
      let path;
      try {
        path = decodeURIComponent(value.split(/[?#]/)[0]);
      } catch {
        fail(`invalid encoded URL ${value}`);
        continue;
      }
      const target = resolve(dist, `.${path}`);
      if (!target.startsWith(`${dist}/`) && target !== dist) {
        fail(`unsafe path ${value}`);
        continue;
      }
      const candidates = [target, resolve(target, 'index.html')];
      let found = false;
      for (const candidate of candidates) {
        try {
          if ((await stat(candidate)).isFile()) {
            found = true;
            break;
          }
        } catch {}
      }
      if (!found) fail(`broken local destination ${value}`);
    }
    for (const video of $('video[poster]')) {
      const poster = $(video).attr('poster');
      if (poster?.startsWith('/')) {
        try {
          if (!(await stat(resolve(dist, `.${poster}`))).isFile())
            fail(`missing video poster ${poster}`);
        } catch {
          fail(`missing video poster ${poster}`);
        }
      }
    }
    for (const image of $('img'))
      if (!$(image).attr('alt')?.trim())
        fail('image missing descriptive alternative');
  }
  const sitemap = load(await readFile(resolve(dist, 'sitemap.xml'), 'utf8'), {
    xmlMode: true,
  });
  const locations = sitemap('loc')
    .map((_, item) => sitemap(item).text())
    .get();
  if (!config.production && locations.length)
    errors.push('Preview sitemap must be empty.');
  if (config.production) {
    const expected = [...routes]
      .map((route) => canonicalUrl(config.origin, route))
      .sort();
    if (JSON.stringify([...locations].sort()) !== JSON.stringify(expected))
      errors.push('Sitemap and published HTML routes differ.');
  }
  const robots = await readFile(resolve(dist, 'robots.txt'), 'utf8');
  if (
    config.production &&
    !robots.includes(`Sitemap: ${config.origin}/sitemap.xml`)
  )
    errors.push('Robots sitemap origin mismatch.');
  if (!config.production && /Sitemap:/i.test(robots))
    errors.push('Preview advertises a sitemap.');
  if (errors.length)
    throw new Error(`SEO validation failed:\n${errors.join('\n')}`);
  return { pages: routes.size, indexable: config.production ? routes.size : 0 };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const dist = resolve('dist');
  const context = JSON.parse(
    await readFile(resolve(dist, 'build-context.json'), 'utf8'),
  );
  console.log(await validateBuild(dist, context));
}
