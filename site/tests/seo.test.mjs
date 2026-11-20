import test from 'node:test';
import assert from 'node:assert/strict';
import { siteConfig, canonicalUrl } from '../src/lib/site-config.mjs';
import {
  latestFirst,
  validDate,
  eligible,
} from '../src/lib/content-policy.mjs';

test('default builds are non-indexable; NODE_ENV is not deployment approval', () => {
  assert.deepEqual(siteConfig({ NODE_ENV: 'production' }), {
    production: false,
    origin: undefined,
  });
});
test('production requires the owned origin', () => {
  assert.throws(
    () => siteConfig({ DEPLOYMENT_ENV: 'production' }),
    /requires PUBLIC_SITE_URL/,
  );
});
test('production refuses placeholders, preview hosts and unsafe URL variants', () => {
  for (const value of [
    'https://example.com',
    'https://sub.example.org',
    'https://localhost',
    'https://127.0.0.1',
    'https://seo.test',
    'https://x.pages.dev',
    'https://moldach.github.io',
    'https://x.vercel.app',
    'http://owned-domain.com',
    'https://owned-domain.com/path',
    'https://user:pass@owned-domain.com',
    'https://owned-domain.com?x=1',
    'https://owned-domain.com#hash',
    'https://owned-domain.com:8443',
  ]) {
    assert.throws(
      () =>
        siteConfig({ DEPLOYMENT_ENV: 'production', PUBLIC_SITE_URL: value }),
      undefined,
      value,
    );
  }
});
test('production normalizes a supplied owned origin without approving its ownership', () => {
  assert.deepEqual(
    siteConfig({
      DEPLOYMENT_ENV: 'production',
      PUBLIC_SITE_URL: 'https://consulting-fixture.com/',
    }),
    { production: true, origin: 'https://consulting-fixture.com' },
  );
});
test('Cloudflare branch previews cannot inherit production indexing', () => {
  assert.equal(
    siteConfig({
      DEPLOYMENT_ENV: 'production',
      CF_PAGES: '1',
      CF_PAGES_BRANCH: 'codex/website-redesign',
      PUBLIC_SITE_URL: 'https://consulting-fixture.com',
    }).production,
    false,
  );
});
test('invalid deployment spellings fail rather than accidentally publishing', () => {
  assert.throws(
    () => siteConfig({ DEPLOYMENT_ENV: 'prod' }),
    /production or preview/,
  );
});
test('canonical routes cannot change the origin or include tracking fragments', () => {
  assert.equal(
    canonicalUrl('https://consulting-fixture.com', '/services/'),
    'https://consulting-fixture.com/services/',
  );
  for (const route of [
    '//other-host.com/',
    '/writing/?a=1',
    '/about/#x',
    'about/',
  ])
    assert.throws(() => canonicalUrl('https://consulting-fixture.com', route));
});
test('December 2023 precedes 2019 and drafts/future dates cannot enter latest writing', () => {
  const now = new Date('2026-10-22T00:00:00Z');
  const entries = [
    { id: 'old', data: { publishedAt: '2019-04-02' } },
    { id: 'umap', data: { publishedAt: '2023-12-06' } },
    { id: 'draft', data: { publishedAt: '2026-01-01', draft: true } },
    { id: 'future', data: { publishedAt: '2027-01-01' } },
  ];
  assert.deepEqual(
    latestFirst(entries, now).map((entry) => entry.id),
    ['umap', 'old'],
  );
  assert.equal(entries[0].id, 'old', 'input collection is not reordered');
});
test('calendar dates are real, including leap years, and invalid dates fail', () => {
  assert.equal(validDate('2024-02-29'), true);
  for (const value of [
    '2023-02-29',
    '2026-13-01',
    '2019-04-31',
    'yesterday',
    '2026-10-2',
  ]) {
    assert.equal(validDate(value), false);
    assert.throws(() => eligible({ publishedAt: value }));
  }
});
