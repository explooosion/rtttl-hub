import { useCallback } from "react";
import type { MutableRefObject } from "react";

import {
  createParticle,
  PARTICLE_DENSITY,
  PARTICLE_MAX,
  type Particle,
} from "../utils/particle_factory";

export function useCanvasInit(
  canvasRef: MutableRefObject<HTMLCanvasElement | null>,
  particlesRef: MutableRefObject<Particle[]>,
) {
  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const count = Math.floor((rect.width * rect.height) / PARTICLE_DENSITY);
    particlesRef.current = Array.from({ length: Math.min(count, PARTICLE_MAX) }, (_, i) =>
      createParticle(rect.width, rect.height, i),
    );
  }, [canvasRef, particlesRef]);

  return init;
}
