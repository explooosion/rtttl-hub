export interface SphereProjection {
  /** Canvas x position (CSS pixels) */
  px: number;
  /** Canvas y position (CSS pixels) */
  py: number;
  /** World-space z — used for painter's-algorithm depth sorting */
  pz: number;
  /** 0 = farthest, 1 = nearest — drives opacity and size scaling */
  depth: number;
  /** Perspective scale factor (>1 near, <1 far) */
  perspScale: number;
}

/**
 * Fibonacci sphere distribution.
 * Returns a normalised (x, y, z) unit vector for point i out of n,
 * evenly covering the sphere surface using the golden angle.
 */
export function fibonacciSpherePoint(i: number, n: number): [number, number, number] {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (2 * i) / Math.max(n - 1, 1);
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = goldenAngle * i;
  return [Math.cos(theta) * r, y, Math.sin(theta) * r];
}

function rotateX(x: number, y: number, z: number, a: number): [number, number, number] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x, y * c - z * s, y * s + z * c];
}

function rotateY(x: number, y: number, z: number, a: number): [number, number, number] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c + z * s, y, -x * s + z * c];
}

/**
 * Projects one Fibonacci-sphere particle onto canvas 2D space.
 *
 * Rotation order applied per frame:
 *   1. selfRotY  — continuous Y-axis spin
 *   2. tiltX     — mouse-Y driven tilt (lagged)
 *   3. tiltY     — mouse-X driven tilt (lagged)
 *
 * Camera sits at z = +focal looking toward −z.
 * perspScale = focal / (focal − wz) → increases when wz > 0 (closer to viewer).
 */
export function projectSphereParticle(
  sphereIndex: number,
  count: number,
  selfRotY: number,
  tiltX: number,
  tiltY: number,
  radius: number,
  cx: number,
  cy: number,
): SphereProjection {
  const focal = 600;
  let [sx, sy, sz] = fibonacciSpherePoint(sphereIndex, count);

  [sx, sy, sz] = rotateY(sx, sy, sz, selfRotY);
  [sx, sy, sz] = rotateX(sx, sy, sz, tiltX);
  [sx, sy, sz] = rotateY(sx, sy, sz, tiltY);

  const wx = sx * radius;
  const wy = sy * radius;
  const wz = sz * radius;

  const perspScale = focal / Math.max(focal - wz, 1);

  return {
    px: cx + wx * perspScale,
    py: cy + wy * perspScale,
    pz: wz,
    depth: (wz + radius) / (2 * radius),
    perspScale,
  };
}
