import { useRef, useEffect } from "react";
import type { RefObject } from "react";

import type { AnimPhase, Particle } from "./utils/particle_factory";
import { type SphereProjection, projectSphereParticle } from "./utils/sphere_math";
import { renderParticle } from "./utils/particle_renderer";
import { useCanvasInit } from "./hooks/use_canvas_init";
import { useSphereHover } from "./hooks/use_sphere_hover";
import { useRipple } from "./hooks/use_ripple";

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

      // ------------------------------------------------------------------
      // Depth-sorted draw list (only built for sphere phases)
      // ------------------------------------------------------------------
      type DrawEntry = { p: Particle; proj: SphereProjection };
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

      // ------------------------------------------------------------------
      // SCATTER — dense drifting default state with ripple recovery
      // ------------------------------------------------------------------
      if (phase === "scatter") {
        for (const p of particles) {
          // Friction toward natural base velocity (recovers from ripple impulse)
          p.vx += (p.baseVx - p.vx) * 0.05;
          p.vy += (p.baseVy - p.vy) * 0.05;

          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rotationSpeed;
          p.phase += 0.02;

          // Wrap around canvas edges
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

          const pulse = 0.7 + 0.3 * Math.sin(timeRef.current * 0.8 + p.phase);
          const opacity = Math.min(p.opacity * pulse, 0.45);
          renderParticle(ctx, p, opacity, p.size);
        }
      }

      // ------------------------------------------------------------------
      // GATHERING — lerp each particle toward its sphere surface position
      // ------------------------------------------------------------------
      if (phase === "gathering" && drawList !== null) {
        let allGathered = true;

        for (const { p, proj } of drawList) {
          p.x += (proj.px - p.x) * 0.08;
          p.y += (proj.py - p.y) * 0.08;
          p.rotation += p.rotationSpeed;
          p.phase += 0.025;

          if (Math.hypot(p.x - proj.px, p.y - proj.py) > 5) {
            allGathered = false;
          }

          const pulse = 0.7 + 0.3 * Math.sin(timeRef.current * 1.5 + p.phase);
          const opacity = Math.min(p.opacity * 2.2 * pulse, 0.75);
          renderParticle(ctx, p, opacity, p.size);
        }

        if (allGathered) {
          phaseRef.current = "orbiting";
        }
      }

      // ------------------------------------------------------------------
      // ORBITING — particles locked to sphere, 3-D perspective rendered
      // ------------------------------------------------------------------
      if (phase === "orbiting" && drawList !== null) {
        for (const { p, proj } of drawList) {
          p.x = proj.px;
          p.y = proj.py;
          p.rotation += p.rotationSpeed * 2;
          p.phase += 0.03;

          const depth = proj.depth; // 0 = far, 1 = near
          const opacity = Math.min(0.15 + depth * 0.75, 0.9);
          const sizeMul = (0.5 + depth * 0.8) * proj.perspScale;
          renderParticle(ctx, p, opacity, p.size * sizeMul);
        }
      }

      // ------------------------------------------------------------------
      // DISPERSING — particles lerp to random canvas positions, then scatter
      // ------------------------------------------------------------------
      if (phase === "dispersing") {
        // Assign random destinations once; zero velocity so departure from
        // sphere starts from rest (orbiting locks position, not velocity).
        if (dispersionTargetsRef.current.length !== particles.length) {
          dispersionTargetsRef.current = particles.map(() => ({
            x: Math.random() * w,
            y: Math.random() * h,
          }));
          for (const p of particles) {
            p.vx = 0;
            p.vy = 0;
          }
        }

        let allArrived = true;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const target = dispersionTargetsRef.current[i];

          // Write the lerp delta back into vx/vy so that when scatter takes
          // over, its friction loop (vx → baseVx at 0.05/frame) produces a
          // smooth continuous acceleration rather than a sudden jump.
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

          const pulse = 0.7 + 0.3 * Math.sin(timeRef.current * 0.8 + p.phase);
          const opacity = Math.min(p.opacity * pulse, 0.45);
          renderParticle(ctx, p, opacity, p.size);
        }

        if (allArrived) {
          dispersionTargetsRef.current = [];
          // vx/vy ≈ 0; scatter friction naturally accelerates to baseVx/baseVy
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
