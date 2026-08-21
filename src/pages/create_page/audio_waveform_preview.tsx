import { useRef, useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FaPlay, FaPause } from "react-icons/fa";

interface AudioWaveformPreviewProps {
  file: File;
  startTime: number;
  endTime: number;
  onStartTimeChange: (v: number) => void;
  onEndTimeChange: (v: number) => void;
  durationSec: number;
}

export function AudioWaveformPreview({
  file,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  durationSec,
}: AudioWaveformPreviewProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const objectUrlRef = useRef<string | null>(null);

  // Decode audio to get waveform data
  useEffect(
    function decodeAudioForWaveform() {
      let cancelled = false;
      const audioCtx = new AudioContext();

      file.arrayBuffer().then((buffer) => {
        if (cancelled) {
          return;
        }
        audioCtx
          .decodeAudioData(buffer)
          .then((decoded) => {
            if (cancelled) {
              return;
            }
            const channelData = decoded.getChannelData(0);
            const barCount = 200;
            const samplesPerBar = Math.floor(channelData.length / barCount);
            const bars: number[] = [];
            for (let i = 0; i < barCount; i++) {
              let sum = 0;
              const offset = i * samplesPerBar;
              for (let j = 0; j < samplesPerBar; j++) {
                sum += Math.abs(channelData[offset + j] || 0);
              }
              bars.push(sum / samplesPerBar);
            }
            // Normalize
            const max = Math.max(...bars, 0.001);
            setWaveformData(bars.map((v) => v / max));
          })
          .catch(() => {
            // Fallback: generate placeholder bars
            if (!cancelled) {
              setWaveformData(Array.from({ length: 200 }, () => Math.random() * 0.5 + 0.1));
            }
          });
      });

      return () => {
        cancelled = true;
        void audioCtx.close();
      };
    },
    [file],
  );

  // Create audio element for playback
  useEffect(
    function createAudioElement() {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
      });

      return () => {
        audio.pause();
        URL.revokeObjectURL(url);
        objectUrlRef.current = null;
      };
    },
    [file],
  );

  // Draw waveform
  useEffect(
    function drawWaveform() {
      const canvas = canvasRef.current;
      if (!canvas || waveformData.length === 0) {
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;
      const barCount = waveformData.length;
      const barWidth = w / barCount;
      const gap = 1;
      const isDark = document.documentElement.classList.contains("dark");

      ctx.clearRect(0, 0, w, h);

      // Draw selection region
      const selStartPx = (startTime / durationSec) * w;
      const selEndPx = (endTime / durationSec) * w;
      ctx.fillStyle = isDark ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.1)";
      ctx.fillRect(selStartPx, 0, selEndPx - selStartPx, h);

      // Draw bars
      for (let i = 0; i < barCount; i++) {
        const x = i * barWidth;
        const barH = waveformData[i] * (h * 0.8);
        const y = (h - barH) / 2;
        const barTimeFraction = i / barCount;
        const barTimeSec = barTimeFraction * durationSec;

        const inSelection = barTimeSec >= startTime && barTimeSec <= endTime;

        if (inSelection) {
          ctx.fillStyle = isDark ? "#818cf8" : "#6366f1";
        } else {
          ctx.fillStyle = isDark ? "#4b5563" : "#d1d5db";
        }

        ctx.fillRect(x + gap / 2, y, Math.max(barWidth - gap, 1), barH);
      }

      // Draw playhead
      if (currentTime > 0) {
        const playheadPx = (currentTime / durationSec) * w;
        ctx.strokeStyle = isDark ? "#f59e0b" : "#d97706";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadPx, 0);
        ctx.lineTo(playheadPx, h);
        ctx.stroke();
      }

      // Draw selection boundary lines
      ctx.strokeStyle = isDark ? "#6366f1" : "#4f46e5";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(selStartPx, 0);
      ctx.lineTo(selStartPx, h);
      ctx.moveTo(selEndPx, 0);
      ctx.lineTo(selEndPx, h);
      ctx.stroke();
      ctx.setLineDash([]);
    },
    [waveformData, startTime, endTime, durationSec, currentTime],
  );

  // Animation loop for playhead tracking
  useEffect(
    function trackPlayhead() {
      if (!isPlaying) {
        return;
      }

      function tick() {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
        animRef.current = requestAnimationFrame(tick);
      }

      animRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(animRef.current);
    },
    [isPlaying],
  );

  const handlePlayPause = useCallback(
    function handlePlayPause() {
      const audio = audioRef.current;
      if (!audio) {
        return;
      }

      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.currentTime = startTime;
        void audio.play();
        setIsPlaying(true);

        // Stop at endTime
        const checkEnd = setInterval(() => {
          if (audio.currentTime >= endTime) {
            audio.pause();
            setIsPlaying(false);
            clearInterval(checkEnd);
          }
        }, 100);
      }
    },
    [isPlaying, startTime, endTime],
  );

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const timeSec = (x / rect.width) * durationSec;
    const rounded = Math.round(timeSec * 10) / 10;

    // If closer to start boundary, move start; otherwise move end
    if (Math.abs(rounded - startTime) < Math.abs(rounded - endTime)) {
      onStartTimeChange(Math.max(0, Math.min(rounded, endTime - 0.1)));
    } else {
      onEndTimeChange(Math.max(startTime + 0.1, Math.min(rounded, durationSec)));
    }
  }

  function formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1);
    return `${m}:${s.padStart(4, "0")}`;
  }

  return (
    <div className="mb-4">
      {/* Waveform canvas */}
      <div className="relative mb-2 rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800/50">
        <canvas
          ref={canvasRef}
          className="h-20 w-full cursor-crosshair"
          onClick={handleCanvasClick}
        />
        {/* Time labels */}
        <div className="mt-1 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
          <span>0:00.0</span>
          <span>{formatTime(durationSec)}</span>
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePlayPause}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-700"
        >
          {isPlaying ? <FaPause size={10} /> : <FaPlay size={10} className="ml-0.5" />}
        </button>
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
          {formatTime(isPlaying ? currentTime : startTime)} / {formatTime(durationSec)}
        </span>
        <span className="ml-auto text-[11px] text-indigo-500 dark:text-indigo-400">
          {t("audioExtract.timeRange", { defaultValue: "Time Range (seconds)" })}:{" "}
          {startTime.toFixed(1)}s — {endTime.toFixed(1)}s
        </span>
      </div>
    </div>
  );
}
