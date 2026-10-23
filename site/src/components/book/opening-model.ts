import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Independent solids. Only the small illustrative ski-photo panel is sampled
// from the approved concept; it is not a historical project screenshot.
export async function openingModel(artworkUrl: string) {
  const root = new THREE.Group(),
    model = new THREE.Group();
  root.name = 'Modeled opening spread';
  model.rotation.x = 0.9;
  model.position.y = -0.65;
  model.scale.setScalar(0.9);
  root.add(model);
  const material = (color: string) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.92 });
  const paper = material('#f4e4c8'),
    edge = material('#dcc8a5'),
    blue = material('#123e82'),
    coral = material('#d9502d'),
    ink = material('#102e50'),
    cream = material('#fff3d9');
  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = 256;
  grainCanvas.height = 256;
  const grainContext = grainCanvas.getContext('2d')!,
    grainPixels = grainContext.createImageData(256, 256);
  let seed = 73;
  for (let i = 0; i < grainPixels.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const value = 115 + ((seed >>> 24) % 36);
    grainPixels.data.set([value, value, value, 255], i);
  }
  grainContext.putImageData(grainPixels, 0, 0);
  const grain = new THREE.CanvasTexture(grainCanvas);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(6, 6);
  [paper, cream, coral, blue].forEach((m) => {
    m.bumpMap = grain;
    m.bumpScale = 0.018;
  });
  const materials: THREE.Material[] = [paper, edge, blue, coral, ink, cream],
    textures: THREE.Texture[] = [grain];
  const photo = await new THREE.TextureLoader().loadAsync(artworkUrl);
  photo.colorSpace = THREE.SRGBColorSpace;
  photo.repeat.set(0.111, 0.19);
  photo.offset.set(0.814, 1 - 0.462 - 0.19);
  textures.push(photo);
  const photograph = new THREE.MeshStandardMaterial({
    map: photo,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });
  materials.push(photograph);
  const archivePhoto = photo.clone();
  archivePhoto.repeat.set(0.087, 0.063);
  archivePhoto.offset.set(0.148, 1 - 0.513 - 0.063);
  textures.push(archivePhoto);
  const archiveMaterial = new THREE.MeshStandardMaterial({
    map: archivePhoto,
    roughness: 1,
    side: THREE.DoubleSide,
  });
  materials.push(archiveMaterial);
  function box(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat = paper,
    r = 0.025,
  ) {
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, r), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function print(
    text: string,
    w: number,
    h: number,
    size: number,
    color = '#142536',
    background?: string,
  ) {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = Math.round((1024 * h) / w);
    const ctx = c.getContext('2d')!;
    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, c.width, c.height);
    }
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px Georgia`;
    ctx.textBaseline = 'top';
    text
      .split('\n')
      .forEach((line, i) => ctx.fillText(line, 24, 18 + i * size * 1.08));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    textures.push(t);
    const mat = new THREE.MeshStandardMaterial({
      map: t,
      transparent: !background,
      roughness: 1,
      side: THREE.DoubleSide,
    });
    materials.push(mat);
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h, 48, 2), mat);
  }
  const pageHeight = (x: number) =>
    0.15 +
    0.24 * Math.sin(Math.PI * Math.min(1, Math.abs(x) / 4.5)) +
    (0.06 * Math.abs(x)) / 4.5;
  function page(offset: number, mat: THREE.Material, width = 9, depth = 4.8) {
    const g = new THREE.PlaneGeometry(width, depth, 100, 16),
      p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        z = -p.getY(i);
      p.setXYZ(i, x, pageHeight(x) + offset, z);
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    model.add(m);
  }
  page(-0.45, blue, 9.3, 5.02);
  for (let i = 0; i < 15; i++)
    page(
      -0.43 + i * 0.029,
      i % 3 === 0 ? edge : paper,
      9.02 + i * 0.004,
      4.8 + i * 0.002,
    );
  page(0.018, cream);
  box(model, 0.09, 0.1, 4.94, 0, -0.26, 0, blue);
  for (const z of [-2.41, 2.41]) {
    const positions: number[] = [],
      indices: number[] = [];
    for (let i = 0; i <= 120; i++) {
      const x = -4.5 + (i * 9) / 120,
        h = pageHeight(x);
      positions.push(x, h, z, x, h - 0.43, z);
      if (i < 120) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, edge);
    m.material.side = THREE.DoubleSide;
    m.receiveShadow = true;
    model.add(m);
  }

  const title = print('Practical AI.\nLess busywork.', 3.85, 1.1, 112);
  title.rotation.x = -Math.PI / 2;
  title.position.set(-2.28, 0.39, -1.54);
  const titlePoints = title.geometry.attributes.position;
  for (let i = 0; i < titlePoints.count; i++)
    titlePoints.setZ(i, pageHeight(titlePoints.getX(i) - 2.28) - 0.39 + 0.04);
  title.geometry.computeVertexNormals();
  model.add(title);
  const subtitle = print('Useful systems. Human judgment.', 3.5, 0.26, 45);
  subtitle.rotation.x = -Math.PI / 2;
  subtitle.position.set(-2.35, 0.41, -0.81);
  const subtitlePoints = subtitle.geometry.attributes.position;
  for (let i = 0; i < subtitlePoints.count; i++)
    subtitlePoints.setZ(
      i,
      pageHeight(subtitlePoints.getX(i) - 2.35) - 0.41 + 0.04,
    );
  subtitle.geometry.computeVertexNormals();
  model.add(subtitle);
  ['Start', 'Services', 'Work', 'Writing', 'About', 'Contact'].forEach(
    (label, i) => {
      const x = -3.5 + i * 1.37;
      const tag = box(
        model,
        0.98,
        0.055,
        0.43,
        x,
        0.03,
        2.53,
        i === 0 ? blue : paper,
        0.04,
      );
      tag.userData.chapterIndex = i;
      const t = print(label, 0.88, 0.2, 200, i === 0 ? '#ffffff' : '#142536');
      t.rotation.x = -Math.PI / 2;
      t.position.set(x, 0.064, 2.54);
      model.add(t);
    },
  );
  const tray = new THREE.Group();
  tray.position.set(-3.03, 0.45, 0.62);
  tray.rotation.y = -0.08;
  tray.userData.href = '/writing/faststyletransfer/';
  model.add(tray);
  box(tray, 1.72, 0.1, 1.45, 0, 0, 0, coral);
  box(tray, 1.72, 0.37, 0.055, 0, 0.2, 0.71, coral);
  box(tray, 1.72, 0.62, 0.055, 0, 0.32, -0.71, coral);
  box(tray, 0.055, 0.47, 1.45, -0.84, 0.25, 0, coral);
  box(tray, 0.055, 0.47, 1.45, 0.84, 0.25, 0, coral);
  for (let i = 0; i < 6; i++) {
    const f = new THREE.Group();
    f.position.set((i % 2) * 0.13 - 0.1, 0.28 + i * 0.035, -0.49 + i * 0.18);
    f.rotation.x = -0.15 + i * 0.018;
    tray.add(f);
    box(f, 1.31, 0.85, 0.025, 0, 0.4, 0, cream, 0.005);
    const image = new THREE.Mesh(
      new THREE.PlaneGeometry(1.12, 0.49),
      archiveMaterial,
    );
    image.position.set(0, 0.43, 0.015);
    f.add(image);
    const cap = print('FIELD NOTES', 1.12, 0.09, 43, '#526173');
    cap.position.set(0, 0.105, 0.018);
    f.add(cap);
  }
  for (let i = 0; i < 7; i++) {
    const p = new THREE.Group();
    p.position.set(-2 + i * 0.48, 0.37, 0.2 + Math.sin(i * 1.8) * 0.32);
    p.rotation.y = i % 2 === 0 ? 0.4 : -0.46;
    model.add(p);
    box(p, 0.64, 0.81, 0.025, 0, 0.41, 0, cream, 0.005);
    const image = new THREE.Mesh(
      new THREE.PlaneGeometry(0.51, 0.48),
      archiveMaterial,
    );
    image.position.set(0, 0.43, 0.016);
    p.add(image);
    box(p, 0.32, 0.012, 0.004, 0, 0.14, 0.019, edge, 0.002);
  }
  const computer = new THREE.Group();
  computer.position.set(1.47, 0.41, 0.65);
  computer.rotation.y = -0.06;
  computer.userData.href = '/writing/faststyletransfer/';
  model.add(computer);
  box(computer, 2.15, 0.16, 1.65, 0, 0.09, 0, cream, 0.07);
  box(computer, 1.82, 0.22, 1.32, 0, 0.27, -0.11, paper, 0.07);
  box(computer, 1.8, 1.34, 0.62, 0, 1.12, -0.45, paper, 0.1);
  box(computer, 1.57, 1.1, 0.045, 0, 1.14, -0.105, edge, 0.055);
  box(computer, 1.39, 0.91, 0.045, 0, 1.17, -0.073, ink, 0.05);
  const screen = print(
    'Ideas →\nworking software',
    1.22,
    0.72,
    110,
    '#d6e6f7',
    '#123564',
  );
  screen.position.set(0, 1.19, -0.046);
  computer.add(screen);
  for (let side = -1; side <= 1; side += 2)
    for (let v = 0; v < 8; v++)
      box(
        computer,
        0.013,
        0.025,
        0.24,
        side * 0.905,
        0.96 + v * 0.056,
        -0.42,
        ink,
        0.003,
      );
  const deck = new THREE.Group();
  deck.position.set(0, 0.36, 0.43);
  deck.rotation.x = 0.12;
  computer.add(deck);
  box(deck, 1.82, 0.1, 0.72, 0, 0, 0, paper, 0.025);
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 12; col++)
      box(
        deck,
        0.117,
        0.055,
        0.125,
        -0.78 + col * 0.142,
        0.075,
        -0.235 + row * 0.15,
        col === 0 ? blue : cream,
        0.015,
      );
  box(deck, 0.7, 0.055, 0.12, 0, 0.08, 0.38, cream, 0.015);
  box(computer, 0.14, 0.08, 0.018, 0.72, 0.49, 0.812, coral, 0.01);
  const frame = new THREE.Group();
  frame.position.set(3.62, 0.5, 0.84);
  frame.rotation.set(-0.15, -0.12, 0);
  frame.userData.href = '/writing/faststyletransfer/';
  model.add(frame);
  box(frame, 1.14, 1.42, 0.05, 0, 0.71, 0, cream, 0.015);
  const framed = new THREE.Mesh(
    new THREE.PlaneGeometry(0.96, 1.02),
    photograph,
  );
  framed.position.set(0, 0.79, 0.029);
  frame.add(framed);
  box(frame, 0.09, 0.7, 0.08, 0, 0.25, -0.25, paper);
  const fc = document.createElement('canvas');
  fc.width = 512;
  fc.height = 1536;
  const ctx = fc.getContext('2d')!;
  ctx.fillStyle = '#fff1d6';
  ctx.fillRect(0, 0, 512, 1536);
  for (let i = 0; i < 4; i++) {
    ctx.drawImage(
      photo.image,
      photo.image.width * 0.814,
      photo.image.height * 0.462,
      photo.image.width * 0.111,
      photo.image.height * 0.19,
      48,
      i * 384 + 31,
      416,
      312,
    );
    for (let j = 0; j < 8; j++) {
      ctx.clearRect(13, i * 384 + j * 48 + 10, 20, 28);
      ctx.clearRect(479, i * 384 + j * 48 + 10, 20, 28);
    }
  }
  const filmTexture = new THREE.CanvasTexture(fc);
  filmTexture.colorSpace = THREE.SRGBColorSpace;
  textures.push(filmTexture);
  const filmMat = new THREE.MeshStandardMaterial({
    map: filmTexture,
    side: THREE.DoubleSide,
    roughness: 0.82,
    alphaTest: 0.5,
  });
  materials.push(filmMat);
  function ribbon(points: THREE.Vector3[], width: number, twist: number) {
    const path = new THREE.CatmullRomCurve3(points),
      g = new THREE.PlaneGeometry(width, 1, 16, 200),
      p = g.attributes.position,
      uv = g.attributes.uv;
    const frames = path.computeFrenetFrames(200, false);
    for (let i = 0; i < p.count; i++) {
      const t = 1 - uv.getY(i),
        center = path.getPoint(t),
        tangent = path.getTangent(t);
      const side = frames.normals[Math.min(200, Math.round(t * 200))]
        .clone()
        .applyAxisAngle(tangent, twist * Math.sin(t * Math.PI * 2));
      center.addScaledVector(side, (uv.getX(i) - 0.5) * width);
      p.setXYZ(i, center.x, center.y, center.z);
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, filmMat);
    m.castShadow = true;
    m.customDepthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: filmTexture,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
    });
    materials.push(m.customDepthMaterial);
    m.receiveShadow = true;
    m.userData.href = '/writing/faststyletransfer/';
    model.add(m);
  }
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  ribbon(
    [
      v(0.48, 1.73, -0.35),
      v(0.15, 2.39, -0.72),
      v(0.83, 3.02, -0.68),
      v(1.64, 2.73, -0.65),
      v(1.8, 2.1, -1),
      v(1.26, 1.85, -1.26),
    ],
    1.09,
    0.8,
  );
  ribbon(
    [
      v(2.13, 1.81, -0.51),
      v(2.85, 2.09, -0.69),
      v(3.56, 2.78, -0.97),
      v(3.24, 3.59, -1.08),
      v(2.43, 3.63, -1.4),
      v(2.1, 2.96, -1.38),
    ],
    1.19,
    0.7,
  );
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.ShadowMaterial({ opacity: 0.18 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.37;
  ground.receiveShadow = true;
  model.add(ground);
  materials.push(ground.material);
  root.userData.dispose = () => {
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
  };
  return root;
}
