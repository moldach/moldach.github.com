import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateBuild } from '../scripts/validate-build.mjs';

const origin = 'https://consulting-fixture.com';
async function fixture(t, production = false) {
  const dist = await mkdtemp(join(tmpdir(), 'website-seo-'));
  t.after(() => rm(dist, { recursive: true, force: true }));
  await writeFile(
    join(dist, 'index.html'),
    `<html lang="en"><head><title>Fixture</title><meta name="description" content="Fixture description"><meta name="robots" content="${production ? 'index,follow' : 'noindex,follow'}">${production ? `<link rel="canonical" href="${origin}/"><meta property="og:url" content="${origin}/">` : ''}</head><body><main><h1>Fixture</h1><p>Readable content without JavaScript.</p><a href="/">Home</a></main></body></html>`,
  );
  await writeFile(
    join(dist, 'sitemap.xml'),
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${production ? `<url><loc>${origin}/</loc></url>` : ''}</urlset>`,
  );
  await writeFile(
    join(dist, 'robots.txt'),
    `User-agent: *\nAllow: /\n${production ? `Sitemap: ${origin}/sitemap.xml` : ''}`,
  );
  return {
    dist,
    config: { production, origin: production ? origin : undefined },
  };
}

test('preview has crawlable HTML but no indexed pages or advertised sitemap', async (t) => {
  const { dist, config } = await fixture(t);
  assert.deepEqual(await validateBuild(dist, config), {
    pages: 1,
    indexable: 0,
  });
});
test('legacy robots file cannot silently advertise a preview sitemap', async (t) => {
  const { dist, config } = await fixture(t);
  await writeFile(
    join(dist, 'robots.txt'),
    'Sitemap: https://example.com/sitemap.xml',
  );
  await assert.rejects(
    validateBuild(dist, config),
    /Preview advertises a sitemap/,
  );
});
test('production canonical and sitemap must match the published route', async (t) => {
  const { dist, config } = await fixture(t, true);
  assert.deepEqual(await validateBuild(dist, config), {
    pages: 1,
    indexable: 1,
  });
  await writeFile(join(dist, 'sitemap.xml'), '<urlset></urlset>');
  await assert.rejects(
    validateBuild(dist, config),
    /Sitemap and published HTML routes differ/,
  );
});
test('missing local article destinations fail validation', async (t) => {
  const { dist, config } = await fixture(t);
  const { readFile } = await import('node:fs/promises');
  await writeFile(
    join(dist, 'index.html'),
    (await readFile(join(dist, 'index.html'), 'utf8')).replace(
      'href="/"',
      'href="/writing/missing/"',
    ),
  );
  await assert.rejects(validateBuild(dist, config), /broken local destination/);
});

test('project video posters must exist in the static output', async (t) => {
  const { dist, config } = await fixture(t);
  const { readFile } = await import('node:fs/promises');
  await writeFile(join(dist, 'clip.mp4'), 'fixture');
  await writeFile(
    join(dist, 'index.html'),
    (await readFile(join(dist, 'index.html'), 'utf8')).replace(
      '</main>',
      '<video src="/clip.mp4" poster="/missing-poster.webp" aria-label="Project clip"></video></main>',
    ),
  );
  await assert.rejects(validateBuild(dist, config), /missing video poster/);
});
