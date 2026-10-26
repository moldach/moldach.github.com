/** Separate animation exports. Original Blender/GLB baselines are never modified. */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import {
  dedup,
  join,
  weld,
  simplify,
  meshopt,
  textureCompress,
  getBounds,
  prune,
} from '@gltf-transform/functions';
import {
  MeshoptEncoder,
  MeshoptDecoder,
  MeshoptSimplifier,
} from 'meshoptimizer';
import sharp from 'sharp';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
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
const out = 'public/models/page-turn';
await mkdir(out, { recursive: true });
const names = ['Start', 'Services', 'Work', 'Writing', 'About', 'Contact'];
const reports = [];
for (const chapter of names.map((name) => name.toLowerCase())) {
  const doc = await io.read(
      `../research/models/${chapter}/${chapter}-geometry.glb`,
    ),
    scene = doc.getRoot().listScenes()[0];
  const staticRoot = doc
      .createNode('Shared book')
      .setExtras({ role: 'shared-book' }),
    content = doc
      .createNode('Chapter content')
      .setExtras({ role: 'chapter-content', chapter });
  const groups = new Map();
  const parts = [...scene.listChildren()];
  for (const n of parts) {
    const name = n.getName();
    const tab = names.findIndex(
      (label) => name === `Chapter tab ${label}` || name === `Printed ${label}`,
    );
    const base =
      tab >= 0 ||
      /^(Cobalt lower cover|Paper leaf |Leaf fore-edge|Reading spread)/.test(
        name,
      );
    scene.removeChild(n);
    if (base) {
      if (chapter !== 'start') {
        n.dispose();
        continue;
      }
      if (tab >= 0) {
        n.setExtras({
          ...n.getExtras(),
          chapterIndex: tab,
          tabSurface: name.startsWith('Chapter tab'),
        });
      }
      staticRoot.addChild(n);
      continue;
    }
    let id;
    if (chapter === 'start') {
      if (/^(Opening)/.test(name)) {
        content.addChild(n);
        continue;
      }
      if (/^(High|Middle|Small) film loop/.test(name))
        id = name.split(' film')[0].toLowerCase() + '-film';
      else if (/^(Keyboard key|Cobalt spacebar|Key printed)/.test(name))
        id = 'keyboard';
      else if (/^(Accordion|Proof editorial)/.test(name)) id = 'accordion';
      else if (/^(Tray proof \d+)/.test(name))
        id = name
          .match(/^Tray proof \d+/)[0]
          .replaceAll(' ', '-')
          .toLowerCase();
      else if (
        /^(Content style output proof|Referenced activation atlas|Resolved output photograph)/.test(
          name,
        )
      )
        id = name
          .replace(/ (cream mount|original print|caption)$/, '')
          .replaceAll(' ', '-')
          .toLowerCase();
      else if (/^(Photo tray|Tray (folded|front|rear))/.test(name))
        id = 'photo-tray';
      else id = 'terminal';
    } else if (chapter === 'services') {
      if (
        /^(Services heading|Small footer|Fold-out blueprint|Folded blueprint side wall|Fine .* drafting rule|Side fold drafting rule|Printed ivory|Printed arrowhead|Printed connection)/.test(
          name,
        )
      ) {
        content.addChild(n);
        continue;
      }
      const bounds = getBounds(n),
        x = (bounds.min[0] + bounds.max[0]) / 2;
      id = x < -1.6 ? 'assessment' : x > 1.6 ? 'adoption' : 'implementation';
    } else {
      if (
        /^(Work heading|Printed title underline|Printed Notes from|Printed the work|Printed Experiments|About subtitle|About title|Contact heading|Contact subtitle)/.test(
          name,
        )
      ) {
        content.addChild(n);
        continue;
      }
      // Stable export-time hinges; runtime never infers animation groups from names.
      const bounds = getBounds(n),
        x = (bounds.min[0] + bounds.max[0]) / 2;
      id =
        x < -1.6
          ? 'left-assembly'
          : x > 1.6
            ? 'right-assembly'
            : 'center-assembly';
    }
    if (!groups.has(id)) groups.set(id, doc.createNode(`Hinge ${id}`));
    groups.get(id).addChild(n);
  }
  if (chapter === 'start') scene.addChild(staticRoot);
  else staticRoot.dispose();
  scene.addChild(content);
  let order = 0;
  for (const [id, g] of groups) {
    const bounds = getBounds(g);
    const pivot = [
      (bounds.min[0] + bounds.max[0]) / 2,
      Math.max(0.45, Math.min(bounds.min[1], 0.8)),
      Math.min(bounds.max[2], 1.3),
    ];
    for (const n of g.listChildren()) {
      const t = n.getTranslation();
      n.setTranslation(t.map((v, i) => v - pivot[i]));
    }
    g.setTranslation(pivot).setExtras({
      rigId: id,
      order:
        chapter === 'services'
          ? ['assessment', 'implementation', 'adoption'].indexOf(id)
          : order++,
      rest: { rotation: [0, 0, 0, 1], scale: [1, 1, 1] },
      folded: {
        rotation: [Math.sin(0.76), 0, 0, Math.cos(0.76)],
        scale: [1, 0.35, 0.04],
      },
    });
    content.addChild(g);
  }
  // Surface-only detail from the existing Start preparation, never baked illumination.
  const normal = doc
    .createTexture('Paper surface normal')
    .setImage(await readFile('../research/models/start/webgl/paper-normal.png'))
    .setMimeType('image/png');
  for (const m of doc.getRoot().listMaterials())
    if (/paper|cream|ivory|card|leaf/i.test(m.getName()))
      m.setNormalTexture(normal).setNormalScale(0.2);
  await doc.transform(
    dedup(),
    join({
      filter: (n) => Object.keys(n.getExtras()).length === 0,
      cleanup: false,
    }),
    weld(),
    simplify({
      simplifier: MeshoptSimplifier,
      ratio: 0.5,
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
    prune(),
    meshopt({
      encoder: MeshoptEncoder,
      level: 'high',
      quantizePosition: 16,
      quantizeTexcoord: 14,
    }),
  );
  const imageIds = [
    ...new Set(
      doc
        .getRoot()
        .listNodes()
        .map((n) => n.getExtras().approvedImageNumber)
        .filter(Boolean),
    ),
  ].sort((a, b) => a - b);
  if (chapter === 'start' && imageIds.length !== 10)
    throw Error('Approved image identities lost');
  const path = `${out}/${chapter}.glb`;
  await io.write(path, doc);
  reports.push({
    chapter,
    url: `/models/page-turn/${chapter}.glb`,
    bytes: (await stat(path)).size,
    rigs: [...groups.keys()],
    imageIds,
    meshNodes: doc
      .getRoot()
      .listNodes()
      .filter((n) => n.getMesh()).length,
    sharedBook: chapter === 'start',
  });
}
await writeFile(
  `${out}/manifest.json`,
  JSON.stringify({ version: 1, chapters: reports }, null, 2) + '\n',
);
console.log(JSON.stringify(reports, null, 2));
