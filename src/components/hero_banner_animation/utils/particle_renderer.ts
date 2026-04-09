import type { Particle } from "./particle_factory";

function drawNote(ctx: CanvasRenderingContext2D, size: number) {
  ctx.beginPath();
  ctx.arc(0, size * 0.3, size * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(size * 0.2, -size * 0.5, size * 0.06, size * 0.8);
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
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();
}

function drawCircuit(ctx: CanvasRenderingContext2D, size: number) {
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-size * 0.4, 0);
  ctx.lineTo(size * 0.4, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-size * 0.4, 0, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(size * 0.4, 0, 2, 0, Math.PI * 2);
  ctx.fill();
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

export function renderParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  opacity: number,
  drawSize: number,
) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.fillStyle = `rgba(255,255,255,${opacity})`;
  ctx.strokeStyle = `rgba(255,255,255,${opacity})`;
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
