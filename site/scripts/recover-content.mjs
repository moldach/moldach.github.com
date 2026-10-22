// One-time content recovery, deliberately separate from the offline build.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve, relative } from 'node:path';
import { load } from 'cheerio';
import TurndownService from 'turndown';

const root = resolve('..');
const output = resolve('src/content/writing');
const assets = resolve('src/assets/recovered');
await mkdir(output, { recursive: true });
await mkdir(assets, { recursive: true });
const inventory = JSON.parse(
  await readFile(resolve(root, 'docs/migration/inventory.json'), 'utf8'),
);
const jobs = [
  {
    id: 'supervised-umap',
    source: 'slides/supervised-umap/index.html',
    legacy: 'post/supervised-umap/index.html',
    featuredOrder: 0,
    topics: ['Dimensionality reduction', 'R', 'Python'],
    description:
      'A slideshow on supervised dimensionality reduction, random forests and UMAP, with the original examples and plots.',
  },
  {
    id: 'fitbit-gamification',
    source:
      'https://raw.githubusercontent.com/moldach/fitbit-project/gh-pages/index.html',
    legacy: 'project/fitbit-project/index.html',
    featuredOrder: 1,
    topics: ['APIs', 'R', 'Gamification'],
    description:
      'The original Fitbit API and gamification article: data analysis, code and visual experiments connecting fitness activity with games.',
  },
  ...['drake', 'faststyletransfer', 'ninjutsu', 'rprofile'].map((id) => ({
    id,
    source: `post/${id}/index.html`,
    legacy: `post/${id}/index.html`,
    topics: ['Software', 'R'],
    description: {
      drake:
        'An introduction to reproducible data workflows with drake in R, with links to the original talk and presentation.',
      rprofile:
        'An R workflow for automating routine tasks with .Rprofile and log files, including scheduling context and original examples.',
      faststyletransfer:
        'A TensorFlow style-transfer experiment inspired by board sports, with original images, animations and implementation notes.',
    }[id],
  })),
];
const report = [];
for (const job of jobs) {
  const original = job.source.startsWith('https:')
    ? execFileSync('curl', ['-fsSL', '--max-time', '40', job.source], {
        maxBuffer: 20_000_000,
      }).toString()
    : await readFile(resolve(root, job.source), 'utf8');
  const sourceHash = createHash('sha256').update(original).digest('hex');
  const $ = load(original);
  const content = $('.article-style').first().length
    ? $('.article-style').first()
    : $('.main-container').first();
  if (!content.length)
    throw new Error(`No original article container: ${job.source}`);
  content
    .find(
      'script, style, link, meta, button, form, nav, footer, #header, #TOC, .tocify, .navbar, .floating, .github-corner',
    )
    .remove();
  for (const node of content.find('*')) {
    for (const name of Object.keys(node.attribs || {})) {
      if (/^on/i.test(name) || ['style', 'srcdoc'].includes(name))
        $(node).removeAttr(name);
    }
  }
  // Local copies retain legacy media paths; the build mirrors their source files.
  for (const node of content.find('a[href]')) {
    const href = $(node).attr('href');
    if (/^(javascript|data):/i.test(href)) $(node).removeAttr('href');
    else if (href.startsWith('/') && !href.startsWith('//'))
      $(node).attr('href', `https://moldach.github.io${href}`);
  }
  let embedded = 0;
  for (const node of content.find('img')) {
    const image = $(node);
    const src = image.attr('src') || '';
    const match = /^data:image\/(png|jpe?g|gif|webp);base64,(.+)$/s.exec(src);
    if (match) {
      const bytes = Buffer.from(match[2], 'base64');
      const name = `${job.id}-${createHash('sha256').update(bytes).digest('hex').slice(0, 16)}.${match[1] === 'jpeg' ? 'jpg' : match[1]}`;
      const target = resolve(assets, name);
      await writeFile(target, bytes);
      image.attr('src', `../../assets/recovered/${name}`);
      embedded++;
    } else if (src.startsWith('/') && !src.startsWith('//')) {
      // Explicit public source images stay on the preserved media paths.
      image.attr('src', src);
    } else if (src && !/^(https?:|\/\/)/.test(src)) {
      image.attr(
        'src',
        new URL(src, `https://moldach.github.io/${job.source}`).href,
      );
    }
    if (!image.attr('alt'))
      image.attr(
        'alt',
        `Original illustration from ${job.id.replaceAll('-', ' ')}`,
      );
  }
  for (const node of content.find('iframe')) {
    const frame = $(node);
    const src = frame.attr('src') || '';
    if (!/^https?:\/\//.test(src) && !src.startsWith('/')) {
      frame.remove();
      continue;
    }
    if (src.startsWith('/'))
      frame.attr('src', `https://moldach.github.io${src}`);
    frame.attr('title', 'Original presentation or demonstration');
    frame.attr('loading', 'lazy');
  }
  for (const node of content.find('h1,h2,h3,h4,h5')) {
    node.tagName = `h${Math.min(6, Number(node.tagName.slice(1)) + 1)}`;
  }
  const converter = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    fence: '```',
  });
  converter.keep(['iframe', 'table']);
  let body = converter
    .turndown(content.html())
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');
  let redactions = 0;
  body = body.replace(/Bearer\s+[A-Za-z0-9._~-]{25,}/g, () => {
    redactions++;
    return 'Bearer [redacted]';
  });
  const legacy = inventory.pages.find((page) => page.sourcePath === job.legacy);
  if (!legacy) throw new Error(`Missing preserved metadata: ${job.legacy}`);
  const title = legacy.title.replace(/ \| Academic$/, '');
  const metadata = {
    title,
    seoTitle: `${title} | Matthew Oldach`,
    description:
      job.description ||
      legacy.description.trim() ||
      `${title}: original technical writing and examples by Matthew Oldach.`,
    primaryIntent: `Read the original ${title} article`,
    publishedAt: legacy.publishedAt.slice(0, 10),
    author: 'Matthew Oldach',
    topics: job.topics,
    sourceUrl: job.source.startsWith('https:')
      ? 'https://moldach.github.io/fitbit-project/'
      : `https://moldach.github.io/${job.legacy.replace(/index.html$/, '')}`,
    ...(job.featuredOrder !== undefined
      ? { featuredOrder: job.featuredOrder }
      : {}),
  };
  const frontmatter = Object.entries(metadata)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n');
  await writeFile(
    resolve(output, `${job.id}.md`),
    `---\n${frontmatter}\n---\n\n${body}\n`,
  );
  report.push({
    id: job.id,
    original: job.source,
    metadataSource: job.legacy,
    sourceSha256: sourceHash,
    embeddedImages: embedded,
    redactions,
    output: relative(resolve('.'), resolve(output, `${job.id}.md`)),
    limitations:
      'Source scripts/styles removed; no historical R code executed or integrations revalidated. Original media/source credits preserved.',
  });
}
await mkdir(resolve(root, 'docs/seo'), { recursive: true });
await writeFile(
  resolve(root, 'docs/seo/article-recovery.json'),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(
  `Recovered ${report.length} full articles/slideshow transcripts; extracted ${report.reduce((n, entry) => n + entry.embeddedImages, 0)} original image references.`,
);
