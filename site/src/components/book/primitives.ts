import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const palette = {
  paper: '#f4e8d1',
  cream: '#fff8e7',
  ink: '#17202c',
  blue: '#1646cd',
  coral: '#cf593c',
  green: '#647b51',
  mulch: '#806048',
};
const materials = new Map<string, THREE.MeshStandardMaterial>();
const boxes = new Map<string, THREE.BufferGeometry>();
let grain: THREE.CanvasTexture | undefined;
export function material(color: string) {
  const cached = materials.get(color);
  if (cached) return cached;
  if (!grain) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const pixels = ctx.createImageData(128, 128);
    let seed = 42;
    for (let i = 0; i < pixels.data.length; i += 4) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const shade = 160 + (seed % 80);
      pixels.data.set([shade, shade, shade, 255], i);
    }
    ctx.putImageData(pixels, 0, 0);
    grain = new THREE.CanvasTexture(canvas);
    grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
    grain.repeat.set(3, 3);
  }
  const result = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.78,
    bumpMap: grain,
    bumpScale: 0.012,
  });
  materials.set(color, result);
  return result;
}
export function box(
  parent: THREE.Object3D,
  size: number[],
  position: number[],
  color: string,
) {
  const key = size.join(',');
  let geometry = boxes.get(key);
  if (!geometry) {
    geometry = new RoundedBoxGeometry(
      size[0],
      size[1],
      size[2],
      1,
      Math.min(...size) * 0.18,
    );
    boxes.set(key, geometry);
  }
  const mesh = new THREE.Mesh(geometry, material(color));
  mesh.position.set(...(position as [number, number, number]));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
export function cylinder(
  parent: THREE.Object3D,
  radius: number,
  height: number,
  position: number[],
  color: string,
  segments = 32,
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, segments),
    material(color),
  );
  mesh.position.set(...(position as [number, number, number]));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
export function textTexture(
  lines: string[],
  background = palette.cream,
  color = palette.ink,
  size = 60,
) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 1024, 640);
  ctx.fillStyle = color;
  ctx.font = `500 ${size}px "Workshop Serif", Georgia, serif`;
  const top = Math.max(
    size + 20,
    (640 - (lines.length - 1) * size * 1.3) / 2 + size * 0.3,
  );
  lines.forEach((line, i) => ctx.fillText(line, 64, top + i * size * 1.3));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
export function panel(
  parent: THREE.Object3D,
  texture: THREE.Texture,
  width: number,
  height: number,
  position: number[],
  angle = 0,
) {
  const group = new THREE.Group();
  group.position.set(...(position as [number, number, number]));
  group.rotation.y = angle;
  parent.add(group);
  box(group, [width + 0.12, height + 0.12, 0.06], [0, 0, -0.04], palette.cream);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      side: THREE.DoubleSide,
    }),
  );
  group.add(mesh);
  mesh.castShadow = true;
  return group;
}
export function connection(
  parent: THREE.Object3D,
  start: THREE.Vector3,
  end: THREE.Vector3,
  color = palette.blue,
  radius = 0.022,
) {
  const difference = end.clone().sub(start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, difference.length(), 8),
    material(color),
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    difference.normalize(),
  );
  parent.add(mesh);
  return mesh;
}
// Merge rigid paper pieces by material. Moving pieces and article hit targets
// keep their own object hierarchies so interaction and animation remain intact.
export function batchStatic(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert();
  const batches = new Map<THREE.Material, THREE.Mesh[]>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || Array.isArray(object.material))
      return;
    let node: THREE.Object3D | null = object;
    while (node && node !== root) {
      if (node.userData.motion || node.userData.href) return;
      node = node.parent;
    }
    const batch = batches.get(object.material) || [];
    batch.push(object);
    batches.set(object.material, batch);
  });
  for (const [material, meshes] of batches) {
    if (meshes.length < 2) continue;
    const transformed = meshes.map((mesh) => {
      const geometry = mesh.geometry.index
        ? mesh.geometry.toNonIndexed()
        : mesh.geometry.clone();
      return geometry.applyMatrix4(inverse.clone().multiply(mesh.matrixWorld));
    });
    const geometry = mergeGeometries(transformed);
    transformed.forEach((item) => item.dispose());
    if (!geometry) continue;
    const merged = new THREE.Mesh(geometry, material);
    merged.castShadow = meshes.some((mesh) => mesh.castShadow);
    merged.receiveShadow = meshes.some((mesh) => mesh.receiveShadow);
    meshes.forEach((mesh) => mesh.removeFromParent());
    root.add(merged);
  }
}
export function disposeTree(root: THREE.Object3D) {
  const textures = new Set<THREE.Texture>(),
    geometries = new Set<THREE.BufferGeometry>(),
    mats = new Set<THREE.Material>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const mat of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      if ('map' in mat && mat.map instanceof THREE.Texture)
        textures.add(mat.map);
      if ('bumpMap' in mat && mat.bumpMap instanceof THREE.Texture)
        textures.add(mat.bumpMap);
      mats.add(mat);
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  mats.forEach((mat) => mat.dispose());
  textures.forEach((texture) => texture.dispose());
}
