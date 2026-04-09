export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Natural scatter drift velocity X — used to recover from ripple disturbance */
  baseVx: number;
  /** Natural scatter drift velocity Y — used to recover from ripple disturbance */
  baseVy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  type: "note" | "wave" | "circuit" | "dot";
  phase: number;
  /** Index into the Fibonacci sphere — determines orbital position */
  sphereIndex: number;
}

export type AnimPhase = "scatter" | "gathering" | "orbiting" | "dispersing";

/** One particle per 500 px² — targets ~70-80% visual density across the banner */
export const PARTICLE_DENSITY = 500;

/** Hard performance cap */
export const PARTICLE_MAX = 500;

export function createParticle(width: number, height: number, index: number): Particle {
  const types: Particle["type"][] = ["note", "wave", "circuit", "dot"];
  const vx = (Math.random() - 0.5) * 1.4;
  const vy = (Math.random() - 0.5) * 1.4 - 0.3;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx,
    vy,
    baseVx: vx,
    baseVy: vy,
    size: 6 + Math.random() * 13,
    opacity: 0.18 + Math.random() * 0.24,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.04,
    type: types[Math.floor(Math.random() * types.length)],
    phase: Math.random() * Math.PI * 2,
    sphereIndex: index,
  };
}
