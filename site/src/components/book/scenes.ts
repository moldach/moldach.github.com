import * as THREE from 'three';
import {
  box,
  batchStatic,
  cylinder,
  panel,
  connection,
  textTexture,
  palette as p,
} from './primitives';
export type Artwork = Record<
  'style' | 'filters' | 'umap' | 'fitbit' | 'brain' | 'portrait',
  THREE.Texture
>;

function terminal(parent: THREE.Group) {
  const group = new THREE.Group();
  group.position.set(1.5, 0.28, 0.1);
  group.rotation.y = -0.14;
  parent.add(group);
  box(group, [2.2, 1.45, 0.55], [0, 1.05, 0], p.cream);
  panel(
    group,
    textTexture(
      [
        '> make something useful',
        'input → review → action',
        '',
        'human judgment: on',
      ],
      p.ink,
      '#b3c9ff',
      45,
    ),
    1.85,
    1.1,
    [0, 1.08, 0.3],
  );
  box(group, [2.4, 0.18, 1.15], [0, 0.25, 0.5], p.paper);
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 10; col++)
      box(
        group,
        [0.16, 0.05, 0.16],
        [-0.9 + col * 0.2, 0.37, 0.22 + row * 0.21],
        col === 0 ? p.blue : p.cream,
      );
}
function basket(parent: THREE.Group) {
  const group = new THREE.Group();
  group.position.set(0.9, 0.3, 0);
  parent.add(group);
  cylinder(group, 1.25, 0.13, [0, 0.04, 0], p.mulch, 48);
  cylinder(group, 0.045, 2.45, [0, 1.23, 0], '#8e9699');
  cylinder(group, 0.61, 0.13, [0, 2.3, 0], p.blue);
  const tray = new THREE.Mesh(
    new THREE.TorusGeometry(0.63, 0.035, 8, 48),
    new THREE.MeshStandardMaterial({
      color: '#9a9f9b',
      metalness: 0.65,
      roughness: 0.42,
    }),
  );
  tray.rotation.x = Math.PI / 2;
  tray.position.y = 1.0;
  group.add(tray);
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    connection(
      group,
      new THREE.Vector3(Math.cos(angle) * 0.5, 2.23, Math.sin(angle) * 0.5),
      new THREE.Vector3(Math.cos(angle) * 0.18, 1.1, Math.sin(angle) * 0.18),
      '#a1a5a4',
      0.014,
    );
    connection(
      group,
      new THREE.Vector3(Math.cos(angle) * 0.63, 1, Math.sin(angle) * 0.63),
      new THREE.Vector3(Math.cos(angle) * 0.43, 0.8, Math.sin(angle) * 0.43),
      '#a1a5a4',
      0.018,
    );
    if (i % 2 === 0)
      box(
        group,
        [0.045, 0.08, 0.045],
        [Math.cos(angle) * 1.58, 0.01, Math.sin(angle) * 1.58],
        p.coral,
      );
  }
  const disc = cylinder(group, 0.28, 0.045, [-1, 1.1, 0.9], p.coral);
  disc.name = 'disc';
  disc.userData = { motion: 'float', baseY: 1.1 };
  for (let i = 0; i < 50; i++) {
    const a = i * 2.39996,
      r = Math.sqrt((i + 0.5) / 50) * 1.17;
    const chip = box(
      group,
      [0.13, 0.02, 0.04],
      [Math.cos(a) * r, 0.12, Math.sin(a) * r],
      i % 2 ? '#a18159' : '#624831',
    );
    chip.rotation.y = a;
  }
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.28, 0.045, 6, 64),
    new THREE.MeshStandardMaterial({ color: '#b8ac8c' }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  group.add(ring);
}
export async function buildScene(
  art: Artwork,
  exhibits: { href: string }[],
  index: number,
) {
  const scene = new THREE.Group();
  if (index === 0) {
    const start = scene;
    terminal(start);
    panel(
      start,
      textTexture(
        ['Practical AI.', 'Less busywork.', '', 'Ideas, made useful.'],
        p.cream,
        p.ink,
        90,
      ),
      2.7,
      1.7,
      [-1.8, 1.25, 0.3],
      0.1,
    );
    const ribbon = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-2, 0.7, -1.5),
      new THREE.Vector3(-2.5, 3.7, -2),
      new THREE.Vector3(2.2, 3.4, -2),
      new THREE.Vector3(3, 1, -0.7),
    );
    // A continuous, curved photographic film strip, rather than floating tiles.
    const stripCanvas = document.createElement('canvas');
    stripCanvas.width = 2048;
    stripCanvas.height = 384;
    const ctx = stripCanvas.getContext('2d')!;
    ctx.fillStyle = '#fff5dc';
    ctx.fillRect(0, 0, 2048, 384);
    for (let i = 0; i < 8; i++) {
      ctx.drawImage(
        art.style.image as HTMLImageElement,
        i * 256 + 12,
        40,
        232,
        304,
      );
      ctx.fillStyle = '#594a35';
      for (let j = 0; j < 5; j++) {
        ctx.fillRect(i * 256 + 20 + j * 46, 12, 20, 14);
        ctx.fillRect(i * 256 + 20 + j * 46, 358, 20, 14);
      }
    }
    const stripTexture = new THREE.CanvasTexture(stripCanvas);
    stripTexture.colorSpace = THREE.SRGBColorSpace;
    const vertices: number[] = [],
      uvs: number[] = [],
      indices: number[] = [];
    for (let i = 0; i <= 96; i++) {
      const t = i / 96,
        point = ribbon.getPoint(t),
        tangent = ribbon.getTangent(t);
      const across = new THREE.Vector3(-tangent.y, tangent.x, 0)
        .normalize()
        .multiplyScalar(0.5);
      for (const sign of [-1, 1]) {
        const v = point.clone().addScaledVector(across, sign);
        vertices.push(v.x, v.y, v.z);
        uvs.push(t, (sign + 1) / 2);
      }
      if (i < 96) {
        const k = i * 2;
        indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    }
    const strip = new THREE.BufferGeometry();
    strip.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    strip.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    strip.setIndex(indices);
    strip.computeVertexNormals();
    const film = new THREE.Mesh(
      strip,
      new THREE.MeshStandardMaterial({
        map: stripTexture,
        side: THREE.DoubleSide,
        roughness: 0.5,
      }),
    );
    film.castShadow = true;
    start.add(film);
    // File tray, folded documents and an annotated desk lamp complete the workshop.
    box(start, [1.5, 0.12, 1.05], [-2.25, 0.35, 1.45], p.coral);
    for (const x of [-2.98, -1.52])
      box(start, [0.06, 0.4, 1.05], [x, 0.56, 1.45], p.coral);
    box(start, [1.5, 0.4, 0.06], [-2.25, 0.56, 1.95], p.coral);
    for (let i = 0; i < 4; i++) {
      const document = box(
        start,
        [1.13, 0.03, 0.8],
        [-2.23 + i * 0.02, 0.45 + i * 0.08, 1.37 - i * 0.05],
        i % 2 ? '#e0e9fc' : p.cream,
      );
      document.rotation.y = -0.1 + i * 0.06;
    }
    cylinder(start, 0.3, 0.06, [3.05, 0.4, 0.7], p.ink);
    connection(
      start,
      new THREE.Vector3(3.05, 0.45, 0.7),
      new THREE.Vector3(3.05, 1.5, 0.5),
      p.ink,
      0.035,
    );
    connection(
      start,
      new THREE.Vector3(3.05, 1.5, 0.5),
      new THREE.Vector3(2.6, 1.85, 0.5),
      p.ink,
      0.035,
    );
    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.26, 0.3, 24, 1, true),
      new THREE.MeshStandardMaterial({
        color: p.coral,
        side: THREE.DoubleSide,
      }),
    );
    shade.position.set(2.6, 1.75, 0.5);
    start.add(shade);
    for (let i = 0; i < 5; i++) {
      const chip = panel(
        start,
        textTexture(
          [['{ }', '01', '→', 'AI', '✓'][i]],
          i % 2 ? p.blue : p.coral,
          '#ffffff',
          190,
        ),
        0.4,
        0.3,
        [-0.5 + i * 0.5, 2.55 + (i % 2) * 0.35, -1.25],
        -0.1,
      );
      chip.userData = { motion: 'float', baseY: chip.position.y };
    }
  }
  if (index === 1) {
    const services = scene;
    const nodes = [
      [-2, 1, 0.4],
      [0, 1.6, -0.4],
      [2, 1, 0.4],
    ];
    nodes.forEach((point, i) => {
      panel(
        services,
        textTexture(
          [
            ['Find the', 'opportunity'],
            ['Build the', 'workflow'],
            ['Bring the', 'team along'],
          ][i],
          i === 1 ? p.blue : p.cream,
          i === 1 ? '#ffffff' : p.ink,
          160,
        ),
        1.65,
        1.2,
        point,
        0.1 - i * 0.1,
      );
      box(services, [1.8, 0.12, 1.1], [point[0], 0.4, point[2]], p.paper);
      if (i < 2)
        connection(
          services,
          new THREE.Vector3(point[0], 0.46, point[2]),
          new THREE.Vector3(nodes[i + 1][0], 0.46, nodes[i + 1][2]),
          p.coral,
          0.045,
        );
    });
    for (let i = 0; i < 3; i++) {
      const x = -2 + i * 2;
      cylinder(
        services,
        0.55,
        0.09,
        [x, 0.32, 0.4],
        i === 1 ? p.blue : p.paper,
        48,
      );
      for (let j = 0; j < 5; j++) {
        const tile = box(
          services,
          [0.32, 0.045, 0.23],
          [x - 0.6 + j * 0.3, 0.35, 1.55],
          j === i ? p.coral : p.paper,
        );
        tile.rotation.y = (j - 2) * 0.12;
      }
      panel(
        services,
        textTexture([['DISCOVER', 'BUILD', 'ENABLE'][i]], p.cream, p.ink, 120),
        1.2,
        0.3,
        [x, 0.63, 1.1],
      );
    }
  }
  if (index === 2) {
    const work = scene;
    basket(work);
    panel(work, art.filters, 1.05, 2.05, [-2, 1.38, 0.15], 0.18);
    panel(
      work,
      textTexture(['PuttPulse', 'Practice with purpose.'], p.cream, p.ink, 78),
      2.1,
      0.85,
      [-1.5, 0.85, 1.35],
      0.15,
    );
  }
  if (index === 3) {
    const writing = scene;
    panel(
      writing,
      textTexture(
        ['FIELD NOTES / 03', 'Experiments worth opening.'],
        p.cream,
        p.ink,
        55,
      ),
      3.1,
      0.65,
      [0, 2.65, -1.1],
    );
    [art.umap, art.fitbit, art.brain].forEach((texture, i) => {
      const page = panel(
        writing,
        texture,
        1.75,
        1.35,
        [-2.05 + i * 2.05, 1.3, i === 1 ? -0.5 : 0.35],
        0.16 - i * 0.16,
      );
      page.userData.href = exhibits[i].href;
      panel(
        page,
        textTexture(
          [['UMAP / 2023', 'FITBIT / 2018', 'BRAIN / 2018'][i]],
          p.blue,
          '#ffffff',
          90,
        ),
        1.45,
        0.22,
        [0, -0.85, 0.16],
      );
      for (let j = 0; j < 3; j++)
        box(
          page,
          [1.9, 0.04, 1],
          [0.015 * j, -0.95 - j * 0.055, 0.3],
          j % 2 ? p.paper : p.cream,
        );
      box(page, [1.9, 0.12, 0.9], [0, -0.84, 0.3], p.paper);
    });
  }
  if (index === 4) {
    const about = scene;
    // Folded mountain silhouettes belong only to the personal chapter.
    for (let i = 0; i < 3; i++) {
      const mountain = new THREE.Mesh(
        new THREE.ConeGeometry(0.65, 1.6 + i * 0.18, 3),
        new THREE.MeshStandardMaterial({
          color: ['#98a9bd', '#e4dfd0', '#6e83a0'][i],
          flatShading: true,
        }),
      );
      mountain.position.set(0.5 + i * 0.8, 1.1, -1.55);
      mountain.rotation.y = 0.4;
      mountain.castShadow = true;
      about.add(mountain);
    }
    box(about, [3, 0.15, 2.5], [-0.7, 0.4, 0.25], p.paper);
    for (let z = 0; z < 4; z++)
      for (let x = 0; x < 4; x++)
        box(
          about,
          [0.64, 0.025, 0.52],
          [-1.7 + x * 0.68, 0.5, -0.7 + z * 0.56],
          (x + z) % 2 ? p.cream : '#dcccb1',
        );
    [
      [-1.7, 0],
      [-0.35, 0.6],
      [0.35, -0.6],
    ].forEach(([x, z], i) =>
      cylinder(about, 0.14, 0.4, [x, 0.73, z], i === 1 ? p.coral : p.blue, 6),
    );
    panel(about, art.portrait, 1.1, 1.1, [2, 1.3, -0.2], -0.2);
    panel(
      about,
      textTexture(
        ['Curiosity.', 'Strategy.', 'A useful next move.'],
        p.cream,
        p.ink,
        76,
      ),
      2,
      1.25,
      [-1.4, 1.4, -1],
      0.1,
    );
  }
  if (index === 5) {
    const contact = scene;
    // A small conversation table, cups, plant and a letter in flight.
    cylinder(contact, 1.05, 0.12, [0, 0.6, 0.85], p.paper);
    cylinder(contact, 0.09, 0.4, [0, 0.35, 0.85], p.ink);
    for (const x of [-0.55, 0.55]) {
      cylinder(contact, 0.14, 0.22, [x, 0.79, 0.8], p.cream);
      const handle = new THREE.Mesh(
        new THREE.TorusGeometry(0.09, 0.025, 8, 20),
        new THREE.MeshStandardMaterial({ color: p.coral }),
      );
      handle.position.set(x + 0.16, 0.8, 0.8);
      contact.add(handle);
    }
    cylinder(contact, 0.25, 0.4, [2.8, 0.55, -1.1], p.coral);
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 12, 8),
        new THREE.MeshStandardMaterial({ color: p.green }),
      );
      leaf.scale.set(0.45, 1.8, 0.15);
      leaf.position.set(2.8 + Math.sin(i * 2) * 0.2, 1 + i * 0.07, -1.1);
      leaf.rotation.z = Math.sin(i * 2) * 0.65;
      contact.add(leaf);
    }
    const letter = panel(
      contact,
      textTexture(['HELLO ↗'], p.cream, p.blue, 130),
      0.8,
      0.5,
      [1.6, 2.5, -0.6],
      -0.2,
    );
    letter.userData = { motion: 'float', baseY: 2.5 };
    box(contact, [2.5, 1.5, 0.15], [0, 1.4, -0.3], p.cream);
    connection(
      contact,
      new THREE.Vector3(-1.2, 2.1, -0.2),
      new THREE.Vector3(0, 1.25, -0.18),
      p.coral,
      0.035,
    );
    connection(
      contact,
      new THREE.Vector3(1.2, 2.1, -0.2),
      new THREE.Vector3(0, 1.25, -0.18),
      p.coral,
      0.035,
    );
    panel(
      contact,
      textTexture(['Let’s make', 'work work better.'], p.blue, '#ffffff', 92),
      2.1,
      0.95,
      [0, 2.65, -0.5],
    );
    [-2, 2].forEach((x) => {
      box(contact, [0.8, 0.15, 0.8], [x, 0.7, 0.4], p.coral);
      box(contact, [0.8, 0.8, 0.15], [x, 1.1, 0.04], p.coral);
      for (const z of [0.1, 0.7])
        for (const dx of [-0.3, 0.3])
          box(contact, [0.07, 0.6, 0.07], [x + dx, 0.35, z], p.ink);
    });
  }
  batchStatic(scene);
  scene.position.y = 0.24;
  return scene;
}
