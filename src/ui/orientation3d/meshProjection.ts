import { rotateBodyPoint } from './droneSceneGeometry';
import type {
  DroneOrientationDeg,
  DroneSceneAirframe,
  Vec3,
} from './droneSceneGeometry';
import quad from './models/quad_x.mesh.json';
import tri from './models/tricopter.mesh.json';
import y6 from './models/y6.mesh.json';
import y4 from './models/y4.mesh.json';
import hexPlus from './models/hex_plus.mesh.json';
import hexX from './models/hex_x.mesh.json';
import aTail from './models/quad_atail.mesh.json';
import vTail from './models/quad_vtail.mesh.json';
import plane from './models/airplane.mesh.json';

export type AirframeMesh = {
  source: string;
  vertices: readonly (readonly number[])[];
  triangles: readonly (readonly number[])[];
  colors: readonly string[];
};
const MODELS: Readonly<Record<number, AirframeMesh>> = {
  1: tri,
  3: quad,
  6: y6,
  7: hexPlus,
  9: y4,
  10: hexX,
  14: plane,
  17: vTail,
  22: aTail,
  26: quad,
};
const generated = new WeakMap<DroneSceneAirframe, AirframeMesh>();
/** Unknown never becomes a quad. Unsupported upstream assets are built from the verified topology. */
export function meshForAirframe(
  frame: DroneSceneAirframe | undefined,
): AirframeMesh | undefined {
  if (!frame) return undefined;
  const found =
    frame.mixerModeRaw === undefined ? undefined : MODELS[frame.mixerModeRaw];
  if (found) return found;
  const cached = generated.get(frame);
  if (cached) return cached;
  const mesh = authorMesh(frame);
  generated.set(frame, mesh);
  return mesh;
}
function authorMesh(frame: DroneSceneAirframe): AirframeMesh {
  const vertices: number[][] = [],
    triangles: number[][] = [],
    colors = ['#637087', '#A8B4C7', '#F4B917', '#E75965', '#263044'];
  const box = (center: Vec3, size: Vec3, yaw: number, color: number) => {
    const start = vertices.length,
      c = Math.cos(yaw),
      s = Math.sin(yaw);
    for (const y of [-1, 1])
      for (const z of [-1, 1])
        for (const x of [-1, 1]) {
          const px = (x * size.x) / 2,
            pz = (z * size.z) / 2;
          vertices.push([
            center.x + c * px + s * pz,
            center.y + (y * size.y) / 2,
            center.z - s * px + c * pz,
          ]);
        }
    for (const face of [
      [0, 1, 3, 2],
      [4, 6, 7, 5],
      [0, 4, 5, 1],
      [2, 3, 7, 6],
      [0, 2, 6, 4],
      [1, 5, 7, 3],
    ]) {
      triangles.push(
        [start + face[0], start + face[1], start + face[2], color],
        [start + face[0], start + face[2], start + face[3], color],
      );
    }
  };
  const cylinder = (center: Vec3, r: number, h: number, color: number) => {
    const start = vertices.length,
      n = 12;
    for (const side of [-1, 1])
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        vertices.push([
          center.x + Math.cos(a) * r,
          center.y + (side * h) / 2,
          center.z + Math.sin(a) * r,
        ]);
      }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      triangles.push(
        [start + i, start + j, start + n + i, color],
        [start + j, start + n + j, start + n + i, color],
      );
      if (i > 0 && i < n - 1)
        triangles.push(
          [start, start + i, start + i + 1, color],
          [start + n, start + n + i + 1, start + n + i, color],
        );
    }
  };
  const wing = (side: number) => {
    const pts = [
        [0.9, 0],
        [-1, side * 1.55],
        [-0.35, side * 0.2],
      ],
      start = vertices.length;
    for (const y of [-0.035, 0.035])
      for (const [x, z] of pts) vertices.push([x, y, z]);
    triangles.push(
      [start, start + 2, start + 1, 1],
      [start + 3, start + 4, start + 5, 1],
    );
    for (let i = 0; i < 3; i++) {
      const j = (i + 1) % 3;
      triangles.push(
        [start + i, start + j, start + j + 3, 0],
        [start + i, start + j + 3, start + i + 3, 0],
      );
    }
  };
  if (frame.silhouette === 'ROTARY')
    box({ x: 0, y: 0.04, z: 0 }, { x: 0.65, y: 0.1, z: 0.45 }, 0, 0);
  else {
    wing(-1);
    wing(1);
    box({ x: 0.05, y: 0.06, z: 0 }, { x: 1.5, y: 0.12, z: 0.17 }, 0, 0);
  }
  const stations = new Set<string>();
  for (const rotor of frame.rotors) {
    const x = -rotor.y * 1.35,
      z = rotor.x * 1.35,
      y = rotor.deck === 'UPPER' ? 0.2 : rotor.deck === 'LOWER' ? -0.15 : 0.08;
    const key = `${x}:${z}`;
    if (frame.silhouette === 'ROTARY' && !stations.has(key)) {
      stations.add(key);
      box(
        { x: x / 2, y: 0, z: z / 2 },
        { x: Math.hypot(x, z), y: 0.07, z: 0.11 },
        -Math.atan2(z, x),
        0,
      );
    }
    cylinder({ x, y, z }, 0.12, 0.14, 1);
    cylinder({ x, y: y + 0.08, z }, 0.06, 0.04, 4);
    const color = x >= 0 ? 2 : 3;
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      box(
        { x: x + Math.cos(a) * 0.22, y: y + 0.12, z: z + Math.sin(a) * 0.22 },
        { x: 0.43, y: 0.018, z: 0.09 },
        -a,
        color,
      );
    }
  }
  const radius = Math.max(
    ...vertices.map(v => Math.hypot(...(v as [number, number, number]))),
  );
  return {
    source: 'fiercon-authored-topology',
    vertices: vertices.map(v => v.map(x => x / Math.max(radius, 0.01))),
    triangles,
    colors,
  };
}
const elevation = Math.atan2(1.05, 2.9),
  distance = Math.hypot(2.9, 1.05),
  focal = 1 / Math.tan((21 * Math.PI) / 180);
export function projectMeshPoint(p: Vec3, width: number, height: number) {
  // Camera exactly behind the tail: neutral remains mirror symmetric.
  const depth =
    distance + Math.cos(elevation) * p.x - Math.sin(elevation) * p.y;
  const horizontal = p.z,
    vertical = Math.sin(elevation) * p.x + Math.cos(elevation) * p.y;
  const scale = (Math.min(width, height) / 2) * focal;
  return {
    x: width / 2 + (horizontal / depth) * scale,
    y: height / 2 - (vertical / depth) * scale,
    depth,
  };
}
function shade(hex: string, intensity: number): string {
  const rgb = [1, 3, 5].map(start =>
    Number.parseInt(hex.slice(start, start + 2), 16),
  );
  return (
    '#' +
    rgb
      .map(c =>
        Math.min(255, Math.round(c * intensity))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}
export function projectAirframeMesh(
  mesh: AirframeMesh,
  pose: DroneOrientationDeg,
  width: number,
  height: number,
) {
  const rotated = mesh.vertices.map(v =>
    rotateBodyPoint({ x: v[0], y: v[1], z: v[2] }, pose),
  );
  const points = rotated.map(v => projectMeshPoint(v, width, height));
  const faces = mesh.triangles.map(t => {
    const a = rotated[t[0]],
      b = rotated[t[1]],
      c = rotated[t[2]],
      u = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z },
      v = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
    const nx = u.y * v.z - u.z * v.y,
      ny = u.z * v.x - u.x * v.z,
      nz = u.x * v.y - u.y * v.x,
      len = Math.hypot(nx, ny, nz) || 1;
    const light = Math.abs((nx * -0.35 + ny * 0.85 + nz * 0.4) / len);
    return {
      points: [points[t[0]], points[t[1]], points[t[2]]],
      depth: (points[t[0]].depth + points[t[1]].depth + points[t[2]].depth) / 3,
      color: shade(mesh.colors[t[3]] ?? '#8593A8', 0.42 + light * 0.7),
    };
  });
  faces.sort((a, b) => b.depth - a.depth);
  return faces;
}
