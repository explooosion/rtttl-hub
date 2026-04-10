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

function drawBeam(ctx: CanvasRenderingContext2D, size: number) {
  // Left note head
  ctx.beginPath();
  ctx.arc(-size * 0.22, size * 0.22, size * 0.18, 0, Math.PI * 2);
  ctx.fill();
  // Right note head
  ctx.beginPath();
  ctx.arc(size * 0.18, size * 0.08, size * 0.18, 0, Math.PI * 2);
  ctx.fill();
  // Left stem
  ctx.fillRect(-size * 0.06, -size * 0.38, size * 0.05, size * 0.57);
  // Right stem
  ctx.fillRect(size * 0.33, -size * 0.28, size * 0.05, size * 0.53);
  // Beam bar connecting tops of both stems
  ctx.beginPath();
  ctx.moveTo(-size * 0.06, -size * 0.38);
  ctx.lineTo(size * 0.38, -size * 0.28);
  ctx.lineTo(size * 0.38, -size * 0.2);
  ctx.lineTo(-size * 0.06, -size * 0.3);
  ctx.closePath();
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

function drawResistor(ctx: CanvasRenderingContext2D, size: number) {
  ctx.lineWidth = 1.2;
  // Terminal wires
  ctx.beginPath();
  ctx.moveTo(-size * 0.5, 0);
  ctx.lineTo(-size * 0.27, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(size * 0.27, 0);
  ctx.lineTo(size * 0.5, 0);
  ctx.stroke();
  // EU-style body rectangle
  ctx.strokeRect(-size * 0.27, -size * 0.14, size * 0.54, size * 0.28);
}

function drawCapacitor(ctx: CanvasRenderingContext2D, size: number) {
  ctx.lineWidth = 1.4;
  // Left plate
  ctx.beginPath();
  ctx.moveTo(-size * 0.08, -size * 0.3);
  ctx.lineTo(-size * 0.08, size * 0.3);
  ctx.stroke();
  // Right plate
  ctx.beginPath();
  ctx.moveTo(size * 0.08, -size * 0.3);
  ctx.lineTo(size * 0.08, size * 0.3);
  ctx.stroke();
  // Wires
  ctx.beginPath();
  ctx.moveTo(-size * 0.45, 0);
  ctx.lineTo(-size * 0.08, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(size * 0.08, 0);
  ctx.lineTo(size * 0.45, 0);
  ctx.stroke();
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
    case "note": {
      drawNote(ctx, drawSize);
      break;
    }
    case "beam": {
      drawBeam(ctx, drawSize);
      break;
    }
    case "wave": {
      drawWave(ctx, drawSize, p.phase);
      break;
    }
    case "resistor": {
      drawResistor(ctx, drawSize);
      break;
    }
    case "capacitor": {
      drawCapacitor(ctx, drawSize);
      break;
    }
  }
  ctx.restore();
}
