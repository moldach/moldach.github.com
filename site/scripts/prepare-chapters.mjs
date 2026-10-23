/** Publish geometry-backed chapter scenes without replacing their editable sources. */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import {
  dedup,
  join,
  weld,
  simplify,
  meshopt,
  textureCompress,
} from '@gltf-transform/functions';
import {
  MeshoptEncoder,
  MeshoptDecoder,
  MeshoptSimplifier,
} from 'meshoptimizer';
import sharp from 'sharp';
import { mkdir, writeFile, stat } from 'node:fs/promises';
await Promise.all([
  MeshoptEncoder.ready,
  MeshoptDecoder.ready,
  MeshoptSimplifier.ready,
]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'meshopt.encoder': MeshoptEncoder,
    'meshopt.decoder': MeshoptDecoder,
  });
const out = 'public/models/chapters';
await mkdir(out, { recursive: true });
const report = [];
for (const slug of ['services', 'work', 'writing', 'about', 'contact']) {
  const doc = await io.read(`../research/models/${slug}/${slug}-geometry.glb`);
  await doc.transform(
    dedup(),
    join({
      filter: (node) => Object.keys(node.getExtras()).length === 0,
      cleanup: false,
    }),
    weld(),
    simplify({
      simplifier: MeshoptSimplifier,
      ratio: 0.7,
      error: 0.0005,
      lockBorder: true,
    }),
    textureCompress({
      encoder: sharp,
      targetFormat: 'jpeg',
      quality: 90,
      resize: [1024, 1024],
      slots: /baseColorTexture/,
    }),
    meshopt({
      encoder: MeshoptEncoder,
      level: 'high',
      quantizePosition: 16,
      quantizeTexcoord: 14,
    }),
  );
  const indices = new Set(
    doc
      .getRoot()
      .listNodes()
      .map((n) => n.getExtras().chapterIndex)
      .filter((i) => i !== undefined),
  );
  if (indices.size !== 6) throw new Error(`Chapter tabs lost: ${slug}`);
  await io.write(`${out}/${slug}.glb`, doc);
  await sharp(`../research/models/${slug}/${slug}-render.png`)
    .webp({ quality: 90 })
    .toFile(`${out}/${slug}.webp`);
  report.push({
    chapter: slug,
    bytes: (await stat(`${out}/${slug}.glb`)).size,
    meshNodes: doc
      .getRoot()
      .listNodes()
      .filter((n) => n.getMesh()).length,
    chapterIds: [...indices].sort(),
    lightingBaked: false,
    normalBaking:
      'Original draft materials; per-chapter surface baking remains pending',
  });
}
await writeFile(
  '../research/verification/start-webgl/chapter-assets.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
