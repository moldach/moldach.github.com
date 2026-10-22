import * as THREE from 'three';

export const palette = {
  paper: '#f4e8d1',
  cream: '#fff8e7',
  ink: '#17202c',
  blue: '#1646cd',
  coral: '#cf593c',
  green: '#647b51',
  mulch: '#806048',
};
export function material(color: string) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.86 });
}
export function box(
  parent: THREE.Object3D,
  size: number[],
  position: number[],
  color: string,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...(size as [number, number, number])),
    material(color),
  );
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
  lines.forEach((line, i) => ctx.fillText(line, 64, 100 + i * size * 1.3));
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
export function disposeTree(root: THREE.Object3D) {
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    for (const mat of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      if ('map' in mat && mat.map instanceof THREE.Texture)
        textures.add(mat.map);
      mat.dispose();
    }
  });
  textures.forEach((texture) => texture.dispose());
}
