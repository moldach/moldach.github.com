import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { finishTier } from '../src/components/page-turn/finish-policy.mjs';
test('finish tier remains conservative for touch, small viewports and constrained memory', () => {
  assert.equal(
    finishTier({ width: 1440, coarse: false, memory: 8 }),
    'enhanced',
  );
  for (const properties of [
    { width: 768, coarse: false, memory: 8 },
    { width: 1200, coarse: true, memory: 8 },
    { width: 1200, coarse: false, memory: 4 },
  ])
    assert.equal(finishTier(properties), 'compact');
  assert.equal(finishTier({ width: 1200, coarse: false }), 'enhanced');
});
test('finished Work assets retain materials, rigid hinges, project links and one book per tier', async () => {
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const manifest = JSON.parse(
    await readFile('public/models/work-finish/v1/manifest.json', 'utf8'),
  );
  for (const [tier, parts] of Object.entries(manifest.tiers)) {
    let books = 0;
    const urls = new Set(),
      ids = new Set();
    for (const [kind, asset] of Object.entries(parts)) {
      const doc = await io.read('public' + asset.fallback);
      for (const accessor of doc.getRoot().listAccessors())
        assert.ok([...accessor.getArray()].every(Number.isFinite));
      for (const n of doc.getRoot().listNodes()) {
        const data = n.getExtras();
        if (data.role === 'shared-book') books++;
        if (data.href) urls.add(data.href);
        if (data.chapterIndex !== undefined) ids.add(data.chapterIndex);
        if (data.rigId) {
          assert.deepEqual(data.rest.scale, [1, 1, 1]);
          assert.deepEqual(data.folded.scale, [1, 1, 1]);
          assert.ok(asset.rigs.includes(data.rigId));
        }
      }
      if (kind === 'work')
        assert.deepEqual([...asset.rigs].sort(), [
          'hinuhinu-chart',
          'puttpulse-basket',
          'shiny-device',
        ]);
      for (const url of [asset.url, asset.fallback])
        assert.ok((await readFile('public' + url)).byteLength > 0);
    }
    assert.equal(books, 1);
    assert.deepEqual([...ids].sort(), [0, 1, 2, 3, 4, 5]);
    for (const url of [
      '/work/#puttpulse',
      '/work/#shiny-filters',
      '/work/#hinuhinu',
    ])
      assert.ok(urls.has(url), url);
    const materialIds = new Set(
      [...parts.shared.materials, ...parts.work.materials].map((m) => m.id),
    );
    for (const id of [
      'paper',
      'card',
      'cloth',
      'metal',
      'plastic',
      'glass',
      'wood',
      'leaf',
      'photo',
    ])
      assert.ok(materialIds.has(id), id);
    assert.ok(
      parts.shared.bytes + parts.work.bytes <=
        (manifest.exceptions?.[tier]?.bytes ?? manifest.budgets[tier].bytes),
      `${tier} download budget`,
    );
    assert.ok(
      parts.shared.estimatedTextureBytes + parts.work.estimatedTextureBytes <=
        manifest.budgets[tier].textureBytes,
      `${tier} texture budget`,
    );
  }
});
