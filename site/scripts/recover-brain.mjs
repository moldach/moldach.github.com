// Rebuild from preserved author RSS; network is needed only for missing originals.
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import TurndownService from 'turndown';
import sharp from 'sharp';
const dir = '../research/recovery/brain';
await mkdir(`${dir}/images`, { recursive: true });
await mkdir('src/assets/recovered/brain', { recursive: true });
const rss = await readFile(
  '../research/recovery/brain-article-rss.xml',
  'utf8',
);
const html = rss.match(
  /<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/,
)?.[1];
if (!html) throw Error('Missing full article body');
const $ = load(html, null, false);
$('img[src*="medium.com/_/stat"]').remove();
$('hr').last().nextAll().remove();
$('hr').last().remove();
const images = [];
let section = 'Introduction';
let number = 0;
for (const node of $('h3,h2,img').toArray()) {
  const el = $(node);
  if (node.tagName !== 'img') {
    section = el.text();
    continue;
  }
  const url = el.attr('src');
  const id = String(++number).padStart(2, '0');
  const original = `${dir}/images/${id}.${url.includes('.jpeg') ? 'jpeg' : 'png'}`;
  try {
    await access(original);
  } catch {
    execFileSync('curl', ['-fsSL', '--max-time', '40', '-o', original, url]);
  }
  const data = await readFile(original);
  const meta = await sharp(data).metadata();
  const filename = `brain-${id}.webp`;
  await sharp(data)
    .webp({ quality: 90 })
    .toFile(`src/assets/recovered/brain/${filename}`);
  el.attr('src', `../../assets/recovered/brain/${filename}`).attr(
    'alt',
    `${section}: original article illustration ${number}`,
  );
  images.push({
    number,
    url,
    original,
    width: meta.width,
    height: meta.height,
    sha256: createHash('sha256').update(data).digest('hex'),
  });
}
// The source contains a malformed Google redirect around the contributor credit.
$('a').each((_, node) => {
  const el = $(node);
  if (el.text() === 'John Muschelli')
    el.attr('href', 'http://johnmuschelli.com/');
  if (el.text() === ',' && el.attr('href')?.includes('google.com/url'))
    el.replaceWith(',');
});
$('pre br').replaceWith('\n');
const td = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});
td.addRule('r-code', {
  filter: 'pre',
  replacement: (_content, node) =>
    '\n\n```r\n' +
    node.textContent
      .trim()
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n') +
    '\n```\n\n',
});
td.addRule('caption', {
  filter: 'figcaption',
  replacement: (content) => '\n\n*' + content + '*\n\n',
});
const body = td.turndown($.html());
if (
  images.length !== 26 ||
  !body.includes('contour3d') ||
  !body.includes('Mango')
)
  throw Error('Incomplete recovery');
const metadata = `---
title: How to Highlight 3D Brain Regions
seoTitle: How to Highlight 3D Brain Regions | Matthew Oldach
description: Three approaches to highlighting brain regions with BrainNet Viewer, Mango and R, including the original screenshots and code.
primaryIntent: Learn the original brain-region visualisation workflow
publishedAt: "2018-10-31"
topics: [Visualisation, R, MATLAB]
sourceUrl: https://medium.com/data-science/how-to-highlight-3d-brain-regions-2e6c15a35574
featuredOrder: 2
---

> Archive restoration: originally published on October 31, 2018. Recovered from Matthew’s Medium author feed with all 26 article images and original code. These are historical instructions; the software and package versions have not been revalidated. Figure credits and John Muschelli’s code contribution are preserved below.

`;
await writeFile(
  'src/content/writing/highlighting-3d-brain-regions.md',
  metadata + body + '\n',
);
await writeFile(
  `${dir}/manifest.json`,
  JSON.stringify(
    {
      source: 'https://medium.com/feed/@MattOldach_65321',
      recoveredAt: '2026-10-23',
      publishedAt: '2018-10-31',
      rssSha256: createHash('sha256').update(rss).digest('hex'),
      images,
      codeExecuted: false,
    },
    null,
    2,
  ) + '\n',
);
console.log(`Recovered article with ${images.length} local images.`);
