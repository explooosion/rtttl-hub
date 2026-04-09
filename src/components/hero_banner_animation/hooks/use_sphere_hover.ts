import { useEffect } from "react";
import type { MutableRefObject, RefObject } from "react";

import type { AnimPhase } from "../utils/particle_factory";

export function useSphereHover(
  targetRef: RefObject<HTMLElement | null>,
  canvasRef: MutableRefObject<HTMLCanvasElement | null>,
  particlesRef: MutableRefObject<unknown[]>,
  phaseRef: MutableRefObject<AnimPhase>,
  targetTiltXRef: MutableRefObject<number>,
  targetTiltYRef: MutableRefObject<number>,
  mouseRef: MutableRefObject<{ x: number; y: number }>,
) {
  useEffect(() => {
    const btn = targetRef.current;
    if (!btn) {
      return;
    }

    const onEnter = () => {
      const phase = phaseRef.current;
      if (phase === "scatter" || phase === "dispersing") {
        phaseRef.current = "gathering";
      }
    };

    const onLeave = () => {
      const phase = phaseRef.current;
      if (phase === "orbiting" || phase === "gathering") {
        phaseRef.current = "dispersing";
        targetTiltXRef.current = 0;
        targetTiltYRef.current = 0;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    btn.addEventListener("mouseenter", onEnter);
    btn.addEventListener("mouseleave", onLeave);
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => {
      btn.removeEventListener("mouseenter", onEnter);
      btn.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [targetRef, canvasRef, particlesRef, phaseRef, targetTiltXRef, targetTiltYRef, mouseRef]);
}
