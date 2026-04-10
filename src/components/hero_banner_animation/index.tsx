import { useRef, useEffect } from "react";
import type { RefObject } from "react";

import type { AnimPhase, Particle } from "./utils/particle_factory";
import { projectSphereParticle } from "./utils/sphere_math";
import { useCanvasInit } from "./hooks/use_canvas_init";
import { useSphereHover } from "./hooks/use_sphere_hover";
import { useRipple } from "./hooks/use_ripple";
import {
  type DrawEntry,
  runScatterPhase,
  runGatheringPhase,
  runOrbitingPhase,
  runDispersingPhase,
} from "./utils/phase_renderers";

interface HeroBannerAnimationProps {
  targetRef: RefObject<HTMLElement | null>;
}

/**
 * Hero banner particle animation.
 *
 * Scatter  — dense drifting field (default); mouse-over ripples particles apart
 * Gathering — particles lerp toward Fibonacci sphere surface around the CTA button
 * Orbiting  — sphere self-rotates; tilt angle lazily tracks mouse (residue effect)
 * Dispersing — particles explode outward, decay fast, then redistribute across canvas
 */
export function HeroBannerAnimation({ targetRef }: HeroBannerAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);

  const phaseRef = useRef<AnimPhase>("scatter");
  const selfRotYRef = useRef(0);

  // Current (lagged) tilt angles
  const tiltXRef = useRef(0);
  const tiltYRef = useRef(0);

  // Target tilt angles derived from mouse position
  const targetTiltXRef = useRef(0);
  const targetTiltYRef = useRef(0);

  // Latest raw mouse position (updated by useSphereHover)
  const mouseRef = useRef({ x: 0, y: 0 });

  // Lagged sphere centre that follows the mouse during hover
  const sphereCxRef = useRef(-1);
  const sphereCyRef = useRef(-1);

  // Per-particle random destinations assigned when dispersing begins
  const dispersionTargetsRef = useRef<Array<{ x: number; y: number }>>([]);

  const init = useCanvasInit(canvasRef, particlesRef);

  useSphereHover(
    targetRef,
    canvasRef,
    particlesRef,
    phaseRef,
    targetTiltXRef,
    targetTiltYRef,
    mouseRef,
  );

  useRipple(canvasRef, particlesRef, phaseRef);

  useEffect(() => {
    init();

    const handleResize = () => {
      init();
    };
    window.addEventListener("resize", handleResize);

    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      timeRef.current += 0.016;
      const phase = phaseRef.current;
      const particles = particlesRef.current;
      const n = particles.length;

      const canvasRect = canvas.getBoundingClientRect();

      // Raw mouse position in canvas-local CSS-pixel space
      const rawMx = mouseRef.current.x - canvasRect.left;
      const rawMy = mouseRef.current.y - canvasRect.top;

      // Sphere centre: lazily follows the mouse during hover phases
      if (phase === "gathering" || phase === "orbiting") {
        // Initialise on first entry
        if (sphereCxRef.current < 0) {
          sphereCxRef.current = rawMx;
          sphereCyRef.current = rawMy;
        }
        // Lag coefficient — same residue feel as tilt
        const lag = 0.03;
        sphereCxRef.current += (rawMx - sphereCxRef.current) * lag;
        sphereCyRef.current += (rawMy - sphereCyRef.current) * lag;
      } else if (phase === "scatter") {
        // Reset so next hover entry re-initialises from current mouse pos
        sphereCxRef.current = -1;
        sphereCyRef.current = -1;
      }

      const centerX = sphereCxRef.current >= 0 ? sphereCxRef.current : w / 2;
      const centerY = sphereCyRef.current >= 0 ? sphereCyRef.current : h / 2;

      const radius = Math.min(w, h) * 0.35;

      // ------------------------------------------------------------------
      // Sphere rotation & mouse-tilt (gathering / orbiting only)
      // ------------------------------------------------------------------
      if (phase === "gathering" || phase === "orbiting") {
        selfRotYRef.current += 0.012;

        // Tilt based on mouse offset relative to canvas centre
        targetTiltXRef.current = ((rawMy - h / 2) / h) * Math.PI * 0.5;
        targetTiltYRef.current = ((rawMx - w / 2) / w) * Math.PI * 0.5;

        // Inertial lag — 0.03 gives a "mouse residue" trailing feel
        const lag = 0.03;
        tiltXRef.current += (targetTiltXRef.current - tiltXRef.current) * lag;
        tiltYRef.current += (targetTiltYRef.current - tiltYRef.current) * lag;
      }

      // Tilt decays back to zero during dispersion so next gathering starts neutral
      if (phase === "dispersing") {
        tiltXRef.current *= 0.97;
        tiltYRef.current *= 0.97;
        targetTiltXRef.current *= 0.97;
        targetTiltYRef.current *= 0.97;
      }

      // Depth-sorted draw list (only built for sphere phases)
      let drawList: DrawEntry[] | null = null;

      if (phase === "gathering" || phase === "orbiting") {
        drawList = particles.map((p) => ({
          p,
          proj: projectSphereParticle(
            p.sphereIndex,
            n,
            selfRotYRef.current,
            tiltXRef.current,
            tiltYRef.current,
            radius,
            centerX,
            centerY,
          ),
        }));
        // Painter's algorithm: farthest (lowest pz) drawn first
        drawList.sort((a, b) => a.proj.pz - b.proj.pz);
      }

      // Phase dispatch
      if (phase === "scatter") {
        runScatterPhase(ctx, particles, w, h, timeRef.current);
      }

      if (phase === "gathering" && drawList !== null) {
        if (runGatheringPhase(ctx, drawList, timeRef.current)) {
          phaseRef.current = "orbiting";
        }
      }

      if (phase === "orbiting" && drawList !== null) {
        runOrbitingPhase(ctx, drawList);
      }

      if (phase === "dispersing") {
        const result = runDispersingPhase(
          ctx,
          particles,
          w,
          h,
          timeRef.current,
          dispersionTargetsRef.current,
        );
        dispersionTargetsRef.current = result.targets;
        if (result.allArrived) {
          dispersionTargetsRef.current = [];
          phaseRef.current = "scatter";
        }
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [init, targetRef]);

  return (
    <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />
  );
}
