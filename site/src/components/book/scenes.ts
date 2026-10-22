import * as THREE from 'three';
import {
  box,
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
}
export function buildScenes(art: Artwork, exhibits: { href: string }[]) {
  const scenes = Array.from({ length: 6 }, () => new THREE.Group());
  const start = scenes[0];
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
  const film = new THREE.Mesh(
    new THREE.TubeGeometry(ribbon, 40, 0.07, 6, false),
    new THREE.MeshStandardMaterial({ color: p.blue }),
  );
  start.add(film);
  for (let i = 0; i < 5; i++) {
    const point = ribbon.getPoint(0.08 + i * 0.21);
    const frame = panel(
      start,
      art.style,
      0.92,
      0.9,
      [point.x, point.y, point.z],
      -0.2 + i * 0.12,
    );
    frame.rotation.z = 0.16 - i * 0.07;
    for (let x = 0; x < 5; x++)
      box(frame, [0.07, 0.04, 0.015], [-0.38 + x * 0.19, 0.51, 0.01], p.ink);
  }
  const services = scenes[1];
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
        96,
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
        new THREE.Vector3(...(point as [number, number, number])),
        new THREE.Vector3(...(nodes[i + 1] as [number, number, number])),
        p.coral,
        0.045,
      );
  });
  const work = scenes[2];
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
  const writing = scenes[3];
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
    box(page, [1.9, 0.12, 0.9], [0, -0.84, 0.3], p.paper);
  });
  const about = scenes[4];
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
  const contact = scenes[5];
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
    [0, 0.8, 0.8],
  );
  [-2, 2].forEach((x) => {
    box(contact, [0.8, 0.15, 0.8], [x, 0.7, 0.4], p.coral);
    box(contact, [0.8, 0.8, 0.15], [x, 1.1, 0.04], p.coral);
    for (const z of [0.1, 0.7])
      for (const dx of [-0.3, 0.3])
        box(contact, [0.07, 0.6, 0.07], [x + dx, 0.35, z], p.ink);
  });
  scenes.forEach((scene) => {
    scene.position.y = 0.24;
  });
  return scenes;
}
