import * as THREE from 'three';

type Point = [number, number];
type Patch = { points: Point[]; depth: number };
const polygon = (depth: number, points: Point[]): Patch => ({ depth, points });
const rect = (depth: number, x: number, y: number, w: number, h: number) =>
  polygon(depth, [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ]);
const ellipse = (depth: number, x: number, y: number, rx: number, ry: number) =>
  polygon(
    depth,
    Array.from(
      { length: 24 },
      (_, i) =>
        [
          x + Math.cos((i / 24) * Math.PI * 2) * rx,
          y + Math.sin((i / 24) * Math.PI * 2) * ry,
        ] as Point,
    ),
  );

// Authored image-space relief, not inferred or reconstructed object geometry.
// Coordinates use the approved 1536×1024 illustrations, origin at top left.
const profiles: Patch[][] = [
  [
    polygon(1.25, [
      [0.58, 0.34],
      [0.8, 0.35],
      [0.86, 0.72],
      [0.54, 0.68],
    ]),
    polygon(0.85, [
      [0.1, 0.46],
      [0.27, 0.39],
      [0.34, 0.44],
      [0.31, 0.67],
      [0.1, 0.65],
    ]),
    polygon(0.7, [
      [0.28, 0.45],
      [0.56, 0.39],
      [0.58, 0.54],
      [0.3, 0.6],
    ]),
    polygon(1.65, [
      [0.76, 0.02],
      [0.9, 0.07],
      [0.93, 0.13],
      [0.85, 0.34],
      [0.77, 0.32],
      [0.83, 0.14],
      [0.75, 0.09],
    ]),
    polygon(1.45, [
      [0.56, 0.14],
      [0.67, 0.13],
      [0.74, 0.22],
      [0.71, 0.33],
      [0.62, 0.34],
      [0.58, 0.25],
    ]),
    polygon(1.2, [
      [0.47, 0.25],
      [0.55, 0.22],
      [0.61, 0.31],
      [0.62, 0.42],
      [0.56, 0.43],
      [0.49, 0.37],
    ]),
    polygon(0.9, [
      [0.82, 0.43],
      [0.95, 0.46],
      [0.94, 0.68],
      [0.81, 0.65],
    ]),
  ],
  [
    rect(0.6, 0.13, 0.43, 0.23, 0.16),
    ellipse(1.3, 0.27, 0.36, 0.08, 0.11),
    polygon(1, [
      [0.23, 0.4],
      [0.3, 0.38],
      [0.32, 0.48],
      [0.19, 0.53],
      [0.17, 0.49],
    ]),
    rect(0.65, 0.4, 0.43, 0.24, 0.16),
    rect(0.95, 0.41, 0.35, 0.06, 0.1),
    rect(1.15, 0.47, 0.29, 0.07, 0.11),
    rect(1.1, 0.54, 0.28, 0.06, 0.1),
    rect(1.2, 0.5, 0.37, 0.05, 0.11),
    rect(0.95, 0.45, 0.46, 0.06, 0.09),
    rect(0.95, 0.55, 0.46, 0.06, 0.09),
    polygon(0.95, [
      [0.7, 0.28],
      [0.79, 0.32],
      [0.89, 0.3],
      [0.88, 0.5],
      [0.76, 0.49],
      [0.67, 0.46],
    ]),
    ellipse(1.2, 0.75, 0.49, 0.025, 0.055),
    ellipse(1.2, 0.81, 0.49, 0.025, 0.055),
  ],
  [
    ellipse(0.65, 0.23, 0.47, 0.17, 0.14),
    rect(1.4, 0.2, 0.27, 0.06, 0.18),
    polygon(1.6, [
      [0.4, 0.11],
      [0.54, 0.12],
      [0.54, 0.54],
      [0.38, 0.54],
    ]),
    polygon(0.85, [
      [0.37, 0.29],
      [0.55, 0.07],
      [0.63, 0.23],
      [0.61, 0.55],
      [0.37, 0.57],
    ]),
    polygon(0.75, [
      [0.59, 0.38],
      [0.68, 0.28],
      [0.82, 0.34],
      [0.96, 0.46],
      [0.92, 0.67],
      [0.65, 0.67],
      [0.56, 0.55],
    ]),
    polygon(1.15, [
      [0.64, 0.32],
      [0.7, 0.29],
      [0.78, 0.35],
      [0.8, 0.45],
      [0.71, 0.5],
      [0.65, 0.43],
    ]),
    polygon(1.1, [
      [0.74, 0.17],
      [0.88, 0.2],
      [0.89, 0.35],
      [0.74, 0.32],
    ]),
  ],
  [
    polygon(1.5, [
      [0.43, 0.08],
      [0.65, 0.13],
      [0.6, 0.55],
      [0.4, 0.48],
    ]),
    polygon(1.35, [
      [0.65, 0.17],
      [0.81, 0.21],
      [0.77, 0.59],
      [0.6, 0.51],
    ]),
    polygon(1.2, [
      [0.81, 0.24],
      [0.96, 0.31],
      [0.94, 0.65],
      [0.76, 0.59],
    ]),
    polygon(0.9, [
      [0.28, 0.4],
      [0.58, 0.48],
      [0.62, 0.61],
      [0.38, 0.66],
      [0.27, 0.56],
    ]),
    ellipse(1.25, 0.68, 0.53, 0.055, 0.045),
    rect(0.75, 0.09, 0.48, 0.16, 0.13),
    rect(0.55, 0.1, 0.62, 0.1, 0.06),
    rect(0.55, 0.61, 0.63, 0.12, 0.06),
  ],
  [
    polygon(1.5, [
      [0.52, 0.09],
      [0.75, 0.13],
      [0.74, 0.43],
      [0.51, 0.38],
    ]),
    polygon(1.05, [
      [0.77, 0.17],
      [0.92, 0.23],
      [0.93, 0.48],
      [0.76, 0.43],
    ]),
    ellipse(0.85, 0.45, 0.43, 0.065, 0.055),
    polygon(0.8, [
      [0.13, 0.36],
      [0.24, 0.35],
      [0.26, 0.55],
      [0.14, 0.59],
    ]),
    polygon(0.65, [
      [0.25, 0.37],
      [0.36, 0.38],
      [0.38, 0.49],
      [0.24, 0.49],
    ]),
    polygon(0.7, [
      [0.48, 0.42],
      [0.86, 0.49],
      [0.86, 0.72],
      [0.43, 0.65],
    ]),
    ellipse(1.1, 0.63, 0.47, 0.025, 0.04),
    ellipse(1.2, 0.69, 0.52, 0.025, 0.045),
    ellipse(1.1, 0.77, 0.5, 0.03, 0.05),
    polygon(1.15, [
      [0.39, 0.54],
      [0.5, 0.51],
      [0.55, 0.62],
      [0.46, 0.72],
      [0.38, 0.67],
    ]),
    polygon(1.15, [
      [0.83, 0.51],
      [0.94, 0.53],
      [0.97, 0.66],
      [0.87, 0.64],
      [0.79, 0.58],
    ]),
  ],
  [
    polygon(1.5, [
      [0.35, 0.21],
      [0.45, 0.09],
      [0.6, 0.08],
      [0.71, 0.17],
      [0.75, 0.33],
      [0.75, 0.54],
      [0.7, 0.54],
      [0.67, 0.3],
      [0.6, 0.22],
      [0.48, 0.2],
      [0.42, 0.28],
      [0.39, 0.44],
      [0.34, 0.43],
    ]),
    ellipse(0.45, 0.54, 0.6, 0.25, 0.1),
    ellipse(1.2, 0.49, 0.52, 0.105, 0.06),
    polygon(1.05, [
      [0.3, 0.41],
      [0.39, 0.39],
      [0.45, 0.48],
      [0.44, 0.6],
      [0.32, 0.59],
    ]),
    polygon(1.05, [
      [0.59, 0.42],
      [0.67, 0.4],
      [0.71, 0.51],
      [0.67, 0.63],
      [0.55, 0.59],
    ]),
    rect(0.95, 0.76, 0.33, 0.15, 0.22),
    rect(0.95, 0.17, 0.36, 0.1, 0.2),
  ],
];
const spread = polygon(0.18, [
  [0.13, 0.14],
  [0.49, 0.2],
  [0.9, 0.13],
  [0.99, 0.81],
  [0.53, 0.85],
  [0.01, 0.8],
]);
export const tagCenters = [
  [0.16, 0.27, 0.39, 0.58, 0.7, 0.81],
  [0.186, 0.3, 0.41, 0.6, 0.715, 0.835],
  [0.17, 0.29, 0.41, 0.59, 0.71, 0.83],
  [0.19, 0.3, 0.41, 0.6, 0.71, 0.83],
  [0.19, 0.3, 0.4, 0.59, 0.697, 0.82],
  [0.18, 0.3, 0.41, 0.6, 0.71, 0.84],
];
function contains(points: Point[], x: number, y: number) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i],
      [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}
function height(patch: Patch, x: number, y: number) {
  if (!contains(patch.points, x, y)) return 0;
  let distance = 1;
  for (let i = 0; i < patch.points.length; i++) {
    const a = patch.points[i],
      b = patch.points[(i + 1) % patch.points.length];
    const dx = b[0] - a[0],
      dy = b[1] - a[1];
    const t = Math.max(
      0,
      Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)),
    );
    distance = Math.min(
      distance,
      Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy),
    );
  }
  const edge = Math.min(1, distance / 0.008);
  return patch.depth * edge * edge * (3 - 2 * edge);
}
export function reliefGeometry(index: number) {
  const geometry = new THREE.PlaneGeometry(10, 20 / 3, 192, 128);
  const positions = geometry.attributes.position,
    uv = geometry.attributes.uv;
  const patches = [spread, ...profiles[index]].map((patch) => ({
    patch,
    minX: Math.min(...patch.points.map((p) => p[0])),
    maxX: Math.max(...patch.points.map((p) => p[0])),
    minY: Math.min(...patch.points.map((p) => p[1])),
    maxY: Math.max(...patch.points.map((p) => p[1])),
  }));
  for (let i = 0; i < positions.count; i++) {
    const x = uv.getX(i),
      y = 1 - uv.getY(i);
    let z = 0;
    for (const { patch, minX, maxX, minY, maxY } of patches) {
      if (x >= minX && x <= maxX && y >= minY && y <= maxY)
        z = Math.max(z, height(patch, x, y));
    }
    positions.setZ(i, z);
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
