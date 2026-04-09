import { useEffect } from "react";
import type { MutableRefObject } from "react";

import type { AnimPhase, Particle } from "../utils/particle_factory";

/** CSS-pixel radius around cursor that triggers the ripple */
const RIPPLE_RADIUS = 48;

/** Peak repulsion force applied at the cursor centre */
const RIPPLE_STRENGTH = 2.5;

/**
 * Applies a water-ripple repulsion effect: when the mouse passes over the
 * banner (during scatter phase only), nearby particles are pushed outward.
 * Each particle's velocity then decays back toward its base drift speed via
 * the friction term in the scatter update loop (see index.tsx).
 */
export function useRipple(
  canvasRef: MutableRefObject<HTMLCanvasElement | null>,
  particlesRef: MutableRefObject<Particle[]>,
  phaseRef: MutableRefObject<AnimPhase>,
) {
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (phaseRef.current !== "scatter") {
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Only apply when cursor is actually inside the canvas bounds
      if (mx < 0 || mx > rect.width || my < 0 || my > rect.height) {
        return;
      }

      for (const p of particlesRef.current) {
        const dist = Math.hypot(p.x - mx, p.y - my);
        if (dist < RIPPLE_RADIUS && dist > 0) {
          const force = (1 - dist / RIPPLE_RADIUS) * RIPPLE_STRENGTH;
          p.vx += ((p.x - mx) / dist) * force;
          p.vy += ((p.y - my) / dist) * force;
        }
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [canvasRef, particlesRef, phaseRef]);
}
