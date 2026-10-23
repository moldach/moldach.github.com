import test from 'node:test';
import assert from 'node:assert/strict';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { getBounds } from '@gltf-transform/functions';
import { readFile } from 'node:fs/promises';
test('animation exports retain finite geometry, explicit rigs, ten images and one shared book', async () => {
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const manifest = JSON.parse(
    await readFile('public/models/page-turn/manifest.json', 'utf8'),
  );
  let books = 0;
  for (const item of manifest.chapters) {
    const doc = await io.read('public' + item.url);
    const nodes = doc.getRoot().listNodes();
    books += nodes.filter((n) => n.getExtras().role === 'shared-book').length;
    assert.deepEqual(
      nodes
        .filter((n) => n.getExtras().rigId)
        .map((n) => n.getExtras().rigId)
        .sort(),
      item.rigs.toSorted(),
    );
    for (const n of nodes) {
      const e = n.getExtras();
      if (e.rigId) {
        assert.equal(e.rest.rotation.length, 4);
        assert.equal(e.folded.rotation.length, 4);
        assert.ok(e.folded.scale.every((v) => v > 0));
      }
    }
    for (const a of doc.getRoot().listAccessors())
      assert.ok([...a.getArray()].every(Number.isFinite));
    const bounds = getBounds(doc.getRoot().listScenes()[0]);
    assert.ok([...bounds.min, ...bounds.max].every(Number.isFinite));
    if (item.chapter === 'start') {
      assert.deepEqual(
        [
          ...new Set(
            nodes.map((n) => n.getExtras().approvedImageNumber).filter(Boolean),
          ),
        ].sort((a, b) => a - b),
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      );
      assert.deepEqual(
        [
          ...new Set(
            nodes
              .map((n) => n.getExtras().chapterIndex)
              .filter((i) => i !== undefined),
          ),
        ].sort(),
        [0, 1, 2, 3, 4, 5],
      );
    }
    if (item.chapter === 'services')
      assert.deepEqual(
        [
          ...new Set(
            nodes
              .map((n) => n.getExtras().href)
              .filter((href) => href?.startsWith('/services/ai-')),
          ),
        ].sort(),
        [
          '/services/ai-opportunity-assessment/',
          '/services/ai-training-adoption/',
          '/services/ai-workflow-automation/',
        ],
      );
  }
  assert.equal(books, 1);
});
