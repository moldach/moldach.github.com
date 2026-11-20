import { finishStudio } from '../src/components/page-turn/finish-policy.mjs';
/** Build both review tiers from the enhanced editable source. */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import {
  dedup,
  join,
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
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
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
const out = resolve('public/models/work-finish/v1'),
  temp = resolve('.verification/work-finish');
await mkdir(out, { recursive: true });
await mkdir(temp, { recursive: true });
const manifest = {
  version: 1,
  reviewOnly: true,
  tiers: {},
  lighting: finishStudio,
  exceptions: {
    compact: {
      bytes: 5300000,
      status: 'pending-visual-review',
      reason:
        'Retain individual chain links, sharp labels, map borders and rigid hinge assemblies; initial 4 MB target remains unmet.',
    },
  },
  budgets: {
    enhanced: { bytes: 8000000, textureBytes: 100663296 },
    compact: { bytes: 4000000, textureBytes: 50331648 },
    drawCalls: 150,
  },
};
for (const tier of ['enhanced', 'compact']) {
  const items = {};
  for (const kind of ['shared', 'work']) {
    const source = `../research/models/work/finish-v1/enhanced/${kind}.glb`;
    const doc = await io.read(source);
    await doc.transform(
      dedup(),
      join({
        filter: (n) => Object.keys(n.getExtras()).length === 0,
        cleanup: false,
      }),
      weld(),
      prune({ keepExtras: true, keepLeaves: true }),
    );
    if (tier === 'compact') {
      await doc.transform(
        simplify({
          simplifier: MeshoptSimplifier,
          ratio: 0.65,
          error: 0.0003,
          lockBorder: true,
        }),
        textureCompress({
          encoder: sharp,
          targetFormat: 'png',
          resize: [256, 256],
          slots: /normalTexture/,
        }),
      );
    }
    await doc.transform(
      textureCompress({
        encoder: sharp,
        targetFormat: 'png',
        resize: tier === 'enhanced' ? [512, 512] : [256, 256],
        slots: /normalTexture/,
      }),
      textureCompress({
        encoder: sharp,
        targetFormat: 'png',
        resize: tier === 'enhanced' ? [256, 256] : [128, 128],
        slots: /metallicRoughnessTexture/,
      }),
    );
    // Preserve original project imagery while scaling only fine surface detail.
    await doc.transform(
      textureCompress({
        encoder: sharp,
        targetFormat: 'webp',
        quality: 94,
        resize: tier === 'enhanced' ? [2048, 2048] : [1024, 1024],
        slots: /baseColorTexture/,
      }),
    );
    const textured = `${temp}/${kind}-${tier}-textured.glb`;
    await io.write(textured, doc);
    const nodes = doc.getRoot().listNodes();
    const rigs = nodes
      .filter((n) => n.getExtras().rigId)
      .map((n) => n.getExtras().rigId);
    const materials = doc
      .getRoot()
      .listMaterials()
      .map((m) => ({
        name: m.getName(),
        id: m.getExtras().materialId,
        normal: !!m.getNormalTexture(),
        roughness: !!m.getMetallicRoughnessTexture(),
      }));
    let triangles = 0,
      textureBytes = 0;
    for (const mesh of doc.getRoot().listMeshes())
      for (const p of mesh.listPrimitives())
        triangles +=
          (p.getIndices()?.getCount() ??
            p.getAttribute('POSITION').getCount()) / 3;
    for (const texture of doc.getRoot().listTextures()) {
      const size = texture.getSize();
      if (size) textureBytes += (size[0] * size[1] * 4 * 4) / 3;
    }
    await doc.transform(
      meshopt({
        encoder: MeshoptEncoder,
        level: 'high',
        quantizePosition: 16,
        quantizeTexcoord: 14,
      }),
    );
    const fallback = `${kind}-${tier}-fallback.glb`;
    await io.write(`${out}/${fallback}`, doc);
    const ktx = `${temp}/${kind}-${tier}-ktx.glb`;
    const command = spawnSync(
      process.execPath,
      [
        resolve('node_modules/@gltf-transform/cli/bin/cli.js'),
        'uastc',
        textured,
        ktx,
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
      throw Error('KTX2 encoding failed; supply Khronos toktx 4.4.2 on PATH');
    const compressed = await io.read(ktx);
    await compressed.transform(
      meshopt({
        encoder: MeshoptEncoder,
        level: 'high',
        quantizePosition: 16,
        quantizeTexcoord: 14,
      }),
    );
    const filename = `${kind}-${tier}.glb`;
    await io.write(`${out}/${filename}`, compressed);
    items[kind] = {
      url: `/models/work-finish/v1/${filename}`,
      fallback: `/models/work-finish/v1/${fallback}`,
      bytes: (await stat(`${out}/${filename}`)).size,
      fallbackBytes: (await stat(`${out}/${fallback}`)).size,
      estimatedTextureBytes: Math.round(textureBytes),
      triangles,
      rigs,
      materials,
    };
  }
  manifest.tiers[tier] = items;
}
await sharp('../research/models/work/finish-v1/enhanced/spread.png')
  .resize(1536)
  .webp({ quality: 92 })
  .toFile(`${out}/poster.webp`);
await writeFile(
  `${out}/manifest.json`,
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(JSON.stringify(manifest, null, 2));
