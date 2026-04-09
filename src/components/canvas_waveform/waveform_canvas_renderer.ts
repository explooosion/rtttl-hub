import type { WaveformBar } from "./waveform_bar_generator";
import {
  GAP,
  MIN_BAR_W,
  RADIUS,
  COLOR_HOVER_LIGHT,
  COLOR_HOVER_DARK,
  COLOR_DEFAULT_LIGHT,
  COLOR_DEFAULT_DARK,
} from "./waveform_constants";

export function drawBars(
  ctx: CanvasRenderingContext2D,
  bars: WaveformBar[],
  w: number,
  h: number,
  dpr: number,
  playedBarIndex: number,
  hoverIndex: number | null,
  isPlaying: boolean,
  hasSeek: boolean,
  isDark: boolean,
  playedColor: string,
) {
  ctx.clearRect(0, 0, w * dpr, h * dpr);
  if (bars.length === 0) {
    return;
  }
  const barW = Math.max(MIN_BAR_W, (w - GAP * (bars.length - 1)) / bars.length);
  const step = barW + GAP;

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const x = i * step;
    const barH = bar.height * h;
    const y = (h - barH) / 2;

    const isPlayed = isPlaying && i < playedBarIndex;
    let isHovered = false;
    if (hoverIndex !== null && hasSeek) {
      if (isPlaying) {
        const lo = Math.min(playedBarIndex, hoverIndex);
        const hi = Math.max(playedBarIndex, hoverIndex);
        isHovered = !isPlayed && i >= lo && i <= hi;
      } else {
        isHovered = i <= hoverIndex;
      }
    }

    if (isPlayed) {
      ctx.fillStyle = playedColor;
    } else if (isHovered) {
      ctx.fillStyle = isDark ? COLOR_HOVER_DARK : COLOR_HOVER_LIGHT;
    } else {
      ctx.fillStyle = isDark ? COLOR_DEFAULT_DARK : COLOR_DEFAULT_LIGHT;
    }

    const r = Math.min(RADIUS, barW / 2, barH / 2);
    ctx.beginPath();
    ctx.roundRect(x * dpr, y * dpr, barW * dpr, barH * dpr, r * dpr);
    ctx.fill();
  }
}
