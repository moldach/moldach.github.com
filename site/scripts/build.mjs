import { spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir, copyFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { load } from 'cheerio';
import { siteConfig } from '../src/lib/site-config.mjs';
import { htmlFiles, validateBuild } from './validate-build.mjs';

try {
  process.loadEnvFile('.env');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const config = siteConfig(process.env);
const dist = resolve(process.env.SITE_BUILD_DIR || 'dist');
if (
  dist !== resolve('dist') &&
  !dist.startsWith(`${resolve('.verification')}/`)
)
  throw new Error(
    'Build output must be dist or a directory under .verification.',
  );
const astroPackage = JSON.parse(
  await readFile('node_modules/astro/package.json', 'utf8'),
);
const cli = resolve('node_modules/astro', astroPackage.bin.astro);
const build = spawnSync(process.execPath, [cli, 'build', '--outDir', dist], {
  stdio: 'inherit',
  env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
});
if (build.status !== 0) process.exit(build.status || 1);
const root = resolve('..');
const inventory = JSON.parse(
  await readFile(resolve(root, 'docs/migration/inventory.json'), 'utf8'),
);
const knownAssets = new Map(
  inventory.assets.map((asset) => [asset.oldRoute, asset]),
);
// Crawl controls are generated for the new site, never migrated as downloads.
const generatedRoutes = new Set(['/robots.txt', '/sitemap.xml', '/rss.xml']);
const required = new Set(
  inventory.assets
    .filter((asset) => asset.isDownload && !generatedRoutes.has(asset.oldRoute))
    .map((asset) => asset.oldRoute),
);
for (const file of await htmlFiles(dist)) {
  const $ = load(await readFile(file, 'utf8'));
  for (const element of $('[src],[href]')) {
    const value = $(element).attr('src') || $(element).attr('href');
    if (value?.startsWith('/') && knownAssets.has(value.split(/[?#]/)[0]))
      required.add(value.split(/[?#]/)[0]);
  }
}
for (const route of required) {
  const asset = knownAssets.get(route);
  const dest = resolve(dist, `.${route}`);
  try {
    await stat(dest);
    throw new Error(`Legacy asset would overwrite generated output: ${route}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await mkdir(dirname(dest), { recursive: true });
  await copyFile(resolve(root, asset.sourcePath), dest);
}
// Actual HTTP redirects on the new host; the old published tree is untouched.
const redirects = [
  'drake',
  'faststyletransfer',
  'ninjutsu',
  'rprofile',
  'supervised-umap',
].map((id) => `/post/${id}/ /writing/${id}/ 301`);
redirects.push(
  '/project/fitbit-project/ /writing/fitbit-gamification/ 301',
  '/fitbit-project/ /writing/fitbit-gamification/ 301',
  '/project/3d-brain/ https://towardsdatascience.com/how-to-highlight-3d-brain-regions-2e6c15a35574 301',
);
await writeFile(resolve(dist, '_redirects'), `${redirects.join('\n')}\n`);
await writeFile(
  resolve(dist, '_headers'),
  config.production
    ? inventory.assets
        .filter(
          (asset) => asset.isDownload && !generatedRoutes.has(asset.oldRoute),
        )
        .map((asset) => `${asset.oldRoute}\n  X-Robots-Tag: noindex, follow\n`)
        .join('\n')
    : '/*\n  X-Robots-Tag: noindex, follow\n',
);
await writeFile(
  resolve(dist, 'build-context.json'),
  `${JSON.stringify({ production: config.production, origin: config.origin || null, mirroredLegacyAssets: required.size }, null, 2)}\n`,
);
await validateBuild(dist, config);
console.log(
  `Validated ${config.production ? 'production' : 'non-indexable preview'} output; mirrored ${required.size} original media/download files.`,
);
