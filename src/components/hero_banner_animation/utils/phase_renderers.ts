import type { Particle } from "./particle_factory";
import type { SphereProjection } from "./sphere_math";

import { renderParticle } from "./particle_renderer";

export interface DrawEntry {
  p: Particle;
  proj: SphereProjection;
}

export interface DisperseResult {
  allArrived: boolean;
  /** Same reference if already initialised; new array on first dispersing frame. */
  targets: Array<{ x: number; y: number }>;
}

export function runScatterPhase(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  w: number,
  h: number,
  time: number,
): void {
  for (const p of particles) {
    p.vx += (p.baseVx - p.vx) * 0.05;
    p.vy += (p.baseVy - p.vy) * 0.05;
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.rotationSpeed;
    p.phase += 0.02;

    if (p.x < -p.size) {
      p.x = w + p.size;
    }
    if (p.x > w + p.size) {
      p.x = -p.size;
    }
    if (p.y < -p.size) {
      p.y = h + p.size;
    }
    if (p.y > h + p.size) {
      p.y = -p.size;
    }

    const pulse = 0.7 + 0.3 * Math.sin(time * 0.8 + p.phase);
    renderParticle(ctx, p, Math.min(p.opacity * pulse, 0.45), p.size);
  }
}

/** Returns true when all particles have reached their sphere surface positions. */
export function runGatheringPhase(
  ctx: CanvasRenderingContext2D,
  drawList: DrawEntry[],
  time: number,
): boolean {
  let allGathered = true;
  for (const { p, proj } of drawList) {
    p.x += (proj.px - p.x) * 0.08;
    p.y += (proj.py - p.y) * 0.08;
    p.rotation += p.rotationSpeed;
    p.phase += 0.025;

    if (Math.hypot(p.x - proj.px, p.y - proj.py) > 5) {
      allGathered = false;
    }

    const pulse = 0.7 + 0.3 * Math.sin(time * 1.5 + p.phase);
    renderParticle(ctx, p, Math.min(p.opacity * 2.2 * pulse, 0.75), p.size);
  }
  return allGathered;
}

export function runOrbitingPhase(ctx: CanvasRenderingContext2D, drawList: DrawEntry[]): void {
  for (const { p, proj } of drawList) {
    p.x = proj.px;
    p.y = proj.py;
    p.rotation += p.rotationSpeed * 2;
    p.phase += 0.03;

    const depth = proj.depth;
    const opacity = Math.min(0.15 + depth * 0.75, 0.9);
    const sizeMul = (0.5 + depth * 0.8) * proj.perspScale;
    renderParticle(ctx, p, opacity, p.size * sizeMul);
  }
}

export function runDispersingPhase(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  w: number,
  h: number,
  time: number,
  currentTargets: Array<{ x: number; y: number }>,
): DisperseResult {
  let targets = currentTargets;
  if (targets.length !== particles.length) {
    targets = particles.map(() => ({ x: Math.random() * w, y: Math.random() * h }));
    for (const p of particles) {
      p.vx = 0;
      p.vy = 0;
    }
  }

  let allArrived = true;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]!;
    const target = targets[i]!;

    const nextX = p.x + (target.x - p.x) * 0.04;
    const nextY = p.y + (target.y - p.y) * 0.04;
    p.vx = nextX - p.x;
    p.vy = nextY - p.y;
    p.x = nextX;
    p.y = nextY;
    p.rotation += p.rotationSpeed;
    p.phase += 0.02;

    if (Math.hypot(p.x - target.x, p.y - target.y) > 2) {
      allArrived = false;
    }

    const pulse = 0.7 + 0.3 * Math.sin(time * 0.8 + p.phase);
    renderParticle(ctx, p, Math.min(p.opacity * pulse, 0.45), p.size);
  }

  return { allArrived, targets };
}
