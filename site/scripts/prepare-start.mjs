/** Stage two: optimize the Blender surface export, retaining semantic nodes. */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import {
  dedup,
  weld,
  simplify,
  prune,
  meshopt,
  textureCompress,
} from '@gltf-transform/functions';
import {
  MeshoptEncoder,
  MeshoptDecoder,
  MeshoptSimplifier,
} from 'meshoptimizer';
import sharp from 'sharp';
import { mkdir, copyFile, writeFile, stat, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

await Promise.all([
  MeshoptEncoder.ready,
  MeshoptDecoder.ready,
  MeshoptSimplifier.ready,
]);
const out = resolve('public/models/start');
const intermediate = resolve('.verification/start-assets');
await mkdir(out, { recursive: true });
await mkdir(intermediate, { recursive: true });
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'meshopt.encoder': MeshoptEncoder,
    'meshopt.decoder': MeshoptDecoder,
  });
const doc = await io.read('../research/models/start/webgl/start-surface.glb');
for (const material of doc.getRoot().listMaterials())
  if (material.getNormalTexture()) material.setNormalScale(0.16);
await doc.transform(
  dedup(),
  weld(),
  simplify({
    simplifier: MeshoptSimplifier,
    ratio: 0.65,
    error: 0.0005,
    lockBorder: true,
  }),
  prune({ keepExtras: true, keepLeaves: true }),
);
// Normal maps stay lossless PNG in the conventional-texture fallback.
await doc.transform(
  textureCompress({
    encoder: sharp,
    resize: [1024, 1024],
    targetFormat: 'jpeg',
    quality: 90,
    slots: /baseColorTexture/,
  }),
);
await io.write(`${intermediate}/start-textured.glb`, doc);
await doc.transform(
  meshopt({
    encoder: MeshoptEncoder,
    level: 'high',
    quantizePosition: 16,
    quantizeTexcoord: 14,
  }),
);
await io.write(`${out}/start-fallback.glb`, doc);
const cli = resolve('node_modules/@gltf-transform/cli/bin/cli.js');
const command = spawnSync(
  process.execPath,
  [
    cli,
    'uastc',
    `${intermediate}/start-textured.glb`,
    `${intermediate}/start-ktx.glb`,
    '--level',
    '2',
    '--zstd',
    '18',
    '--jobs',
    '2',
  ],
  { stdio: 'inherit', env: process.env },
);
if (command.status !== 0)
  throw new Error('KTX2 compression failed; install Khronos toktx on PATH.');
const compressed = await io.read(`${intermediate}/start-ktx.glb`);
await compressed.transform(
  meshopt({
    encoder: MeshoptEncoder,
    level: 'high',
    quantizePosition: 16,
    quantizeTexcoord: 14,
  }),
);
await io.write(`${out}/start.glb`, compressed);
await sharp('../research/models/start/start-render.png')
  .webp({ quality: 90 })
  .toFile(`${out}/poster.webp`);
const decoderOut = resolve('public/decoders/basis');
await mkdir(decoderOut, { recursive: true });
for (const name of ['basis_transcoder.js', 'basis_transcoder.wasm'])
  await copyFile(
    `node_modules/three/examples/jsm/libs/basis/${name}`,
    `${decoderOut}/${name}`,
  );
await copyFile(
  'node_modules/three/examples/jsm/libs/basis/README.md',
  resolve('public/decoders/basis/README.md'),
);
await copyFile(
  'node_modules/three/LICENSE',
  resolve('public/decoders/THREE-LICENSE.txt'),
);
const sizes = {};
for (const name of ['start.glb', 'start-fallback.glb', 'poster.webp'])
  sizes[name] = (await stat(`${out}/${name}`)).size;
const optimized = await io.read(`${out}/start-fallback.glb`);
const assignments = new Set(),
  tags = new Set();
let triangles = 0,
  primitives = 0;
for (const node of optimized.getRoot().listNodes()) {
  const number = node.getExtras().approvedImageNumber;
  if (number) {
    assignments.add(number);
    for (const primitive of node.getMesh().listPrimitives()) {
      if (
        !primitive
          .getMaterial()
          .getName()
          .startsWith(`Approved ${String(number).padStart(2, '0')} `)
      )
        throw new Error('Image assignment changed');
    }
  }
  if (node.getExtras().chapterIndex !== undefined)
    tags.add(node.getExtras().chapterIndex);
  const mesh = node.getMesh();
  if (!mesh) continue;
  for (const p of mesh.listPrimitives()) {
    primitives++;
    const pos = p.getAttribute('POSITION');
    for (const v of pos.getArray())
      if (!Number.isFinite(v)) throw new Error('Non-finite vertex');
    triangles += (p.getIndices()?.getCount() || pos.getCount()) / 3;
  }
}
if (assignments.size !== 10 || tags.size !== 6)
  throw new Error('Required image or chapter metadata lost.');
const raw = await readFile(`${out}/start.glb`);
const json = JSON.parse(raw.subarray(20, 20 + raw.readUInt32LE(12)).toString());
if (
  !json.extensionsRequired?.includes('EXT_meshopt_compression') ||
  !json.extensionsRequired?.includes('KHR_texture_basisu')
)
  throw new Error('Compression extension missing');
const report = {
  baselinePreserved: true,
  baselineSource: 'research/models/start/start.blend',
  baselineRender: 'research/models/start/start-render.png',
  sizes,
  triangles,
  meshPrimitives: primitives,
  approvedImages: [...assignments].sort((a, b) => a - b),
  chapterIndices: [...tags].sort(),
  geometryCompression: 'EXT_meshopt_compression',
  textureCompression: 'KHR_texture_basisu UASTC',
  normalBake: 'surface-only tangent normals',
  lightingBaked: false,
  sizeTargetMet: sizes['start.glb'] <= 8_000_000,
  drawCallTargetEstimateMet: primitives <= 150,
};
await writeFile(
  '../research/models/start/webgl/asset-report.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
