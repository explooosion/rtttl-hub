import { useRef, useEffect, useCallback } from "react";

interface HeroBannerAnimationProps {
  boosted: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  type: "note" | "wave" | "circuit" | "dot";
  phase: number;
}

function createParticle(width: number, height: number): Particle {
  const types: Particle["type"][] = ["note", "wave", "circuit", "dot"];
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3 - 0.1,
    size: 8 + Math.random() * 18,
    opacity: 0.04 + Math.random() * 0.08,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.01,
    type: types[Math.floor(Math.random() * types.length)],
    phase: Math.random() * Math.PI * 2,
  };
}

function drawNote(ctx: CanvasRenderingContext2D, size: number) {
  ctx.beginPath();
  // Simple note shape
  ctx.arc(0, size * 0.3, size * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(size * 0.2, -size * 0.5, size * 0.06, size * 0.8);
  // Flag
  ctx.beginPath();
  ctx.moveTo(size * 0.26, -size * 0.5);
  ctx.quadraticCurveTo(size * 0.5, -size * 0.3, size * 0.26, -size * 0.1);
  ctx.fill();
}

function drawWave(ctx: CanvasRenderingContext2D, size: number, phase: number) {
  ctx.beginPath();
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 20; i++) {
    const px = (i / 20 - 0.5) * size;
    const py = Math.sin((i / 20) * Math.PI * 3 + phase) * size * 0.15;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function drawCircuit(ctx: CanvasRenderingContext2D, size: number) {
  ctx.lineWidth = 1.2;
  // Horizontal line with nodes
  ctx.beginPath();
  ctx.moveTo(-size * 0.4, 0);
  ctx.lineTo(size * 0.4, 0);
  ctx.stroke();
  // Nodes
  ctx.beginPath();
  ctx.arc(-size * 0.4, 0, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(size * 0.4, 0, 2, 0, Math.PI * 2);
  ctx.fill();
  // Branch
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -size * 0.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -size * 0.3, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawDot(ctx: CanvasRenderingContext2D, size: number) {
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
  ctx.fill();
}

export function HeroBannerAnimation({ boosted }: HeroBannerAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const boostedRef = useRef(boosted);

  useEffect(() => {
    boostedRef.current = boosted;
  }, [boosted]);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Create particles — dense field
    const count = Math.floor((rect.width * rect.height) / 4000);
    particlesRef.current = Array.from({ length: Math.min(count, 100) }, () =>
      createParticle(rect.width, rect.height),
    );
  }, []);

  useEffect(() => {
    init();

    const handleResize = () => init();
    window.addEventListener("resize", handleResize);

    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      timeRef.current += 0.016;
      const isBoosted = boostedRef.current;
      const speedMul = isBoosted ? 4 : 1;
      const opacityMul = isBoosted ? 3 : 1;

      for (const p of particlesRef.current) {
        // Update position
        p.x += p.vx * speedMul;
        p.y += p.vy * speedMul;
        p.rotation += p.rotationSpeed * speedMul;
        p.phase += 0.02 * speedMul;

        // Boosted: add slight random jitter for energy
        if (isBoosted) {
          p.x += (Math.random() - 0.5) * 0.6;
          p.y += (Math.random() - 0.5) * 0.6;
        }

        // Wrap around
        if (p.x < -p.size) p.x = w + p.size;
        if (p.x > w + p.size) p.x = -p.size;
        if (p.y < -p.size) p.y = h + p.size;
        if (p.y > h + p.size) p.y = -p.size;

        const baseOpacity = p.opacity * opacityMul;
        // Pulsing opacity — faster pulse when boosted
        const pulseSpeed = isBoosted ? 2.4 : 0.8;
        const pulse = 0.7 + 0.3 * Math.sin(timeRef.current * pulseSpeed + p.phase);
        const finalOpacity = Math.min(baseOpacity * pulse, isBoosted ? 0.45 : 0.25);

        // Boosted: grow particles slightly
        const sizeMul = isBoosted ? 1.3 : 1;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
        ctx.strokeStyle = `rgba(255, 255, 255, ${finalOpacity})`;

        const drawSize = p.size * sizeMul;
        switch (p.type) {
          case "note":
            drawNote(ctx, drawSize);
            break;
          case "wave":
            drawWave(ctx, drawSize, p.phase);
            break;
          case "circuit":
            drawCircuit(ctx, drawSize);
            break;
          case "dot":
            drawDot(ctx, drawSize);
            break;
        }

        ctx.restore();
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [init]);

  return (
    <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />
  );
}
