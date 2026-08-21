"""
Cog predictor for Audio → RTTTL conversion pipeline.

Pipeline:
  1. Decode & trim audio to [start_time, end_time]
  2. Demucs stem separation (htdemucs → vocals, bass, drums, other)
  3. Basic Pitch note detection on each selected stem
  4. Convert detected notes to RTTTL format (max 4 tracks)
"""

from __future__ import annotations

import io
import math
import tempfile
from pathlib import Path
from typing import Any

import numpy as np
import torch
import torchaudio
from cog import BasePredictor, Input
from pydub import AudioSegment

# ---------------------------------------------------------------------------
# RTTTL conversion helpers
# ---------------------------------------------------------------------------

MIDI_NOTE_NAMES = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"]

# RTTTL supports durations: 1 (whole), 2 (half), 4 (quarter), 8, 16, 32
VALID_DURATIONS = [1, 2, 4, 8, 16, 32]


def midi_to_note_name(midi_num: int) -> tuple[str, int]:
    """Convert MIDI number to (note_name, octave). RTTTL octave 4 = MIDI 48-59."""
    octave = (midi_num // 12) - 1
    name = MIDI_NOTE_NAMES[midi_num % 12]
    return name, octave


def quantize_duration(dur_sec: float, bpm: int) -> int:
    """Snap a duration in seconds to the nearest RTTTL duration value."""
    beat_sec = 60.0 / bpm
    beats = dur_sec / beat_sec
    # whole=4beats, half=2, quarter=1, eighth=0.5, 16th=0.25, 32nd=0.125
    best = 4
    best_diff = abs(beats - 4.0)
    for rtttl_dur, beat_count in [(1, 4), (2, 2), (4, 1), (8, 0.5), (16, 0.25), (32, 0.125)]:
        diff = abs(beats - beat_count)
        if diff < best_diff:
            best_diff = diff
            best = rtttl_dur
    return best


def estimate_bpm(note_times: list[dict[str, float]], default: int = 120) -> int:
    """Estimate BPM from inter-onset intervals."""
    if len(note_times) < 2:
        return default
    intervals = []
    for i in range(1, len(note_times)):
        dt = note_times[i]["start"] - note_times[i - 1]["start"]
        if 0.1 < dt < 2.0:
            intervals.append(dt)
    if not intervals:
        return default
    median_interval = sorted(intervals)[len(intervals) // 2]
    raw_bpm = round(60.0 / median_interval)
    # Snap to common BPM values
    common = [60, 72, 80, 90, 100, 108, 112, 120, 125, 130, 140, 144, 150, 160, 180, 200]
    return min(common, key=lambda b: abs(b - raw_bpm))


def notes_to_rtttl(
    name: str,
    notes: list[dict[str, Any]],
    bpm: int | None = None,
) -> tuple[str, int, int]:
    """
    Convert a list of note dicts to an RTTTL string.
    Each note: { "midi": int, "start": float, "end": float }
    Returns (rtttl_string, bpm, note_count).
    """
    if not notes:
        return f"{name}:d=4,o=5,b=120:p", 120, 0

    if bpm is None:
        bpm = estimate_bpm(notes)

    # Sort by start time
    sorted_notes = sorted(notes, key=lambda n: n["start"])

    rtttl_notes: list[str] = []
    prev_end = sorted_notes[0]["start"]

    for note in sorted_notes:
        # Insert rest if gap > 0.05s
        gap = note["start"] - prev_end
        if gap > 0.05:
            rest_dur = quantize_duration(gap, bpm)
            if rest_dur != 4:
                rtttl_notes.append(f"{rest_dur}p")
            else:
                rtttl_notes.append("p")

        dur_sec = note["end"] - note["start"]
        if dur_sec < 0.03:
            continue

        dur = quantize_duration(dur_sec, bpm)
        note_name, octave = midi_to_note_name(note["midi"])

        # Clamp octave to RTTTL range 4-7
        octave = max(4, min(7, octave))

        parts = []
        if dur != 4:
            parts.append(str(dur))
        parts.append(note_name)
        if octave != 5:
            parts.append(str(octave))

        rtttl_notes.append("".join(parts))
        prev_end = note["end"]

    body = ",".join(rtttl_notes)
    rtttl = f"{name}:d=4,o=5,b={bpm}:{body}"
    return rtttl, bpm, len(sorted_notes)


# ---------------------------------------------------------------------------
# Audio helpers
# ---------------------------------------------------------------------------

def trim_audio(waveform: torch.Tensor, sr: int, start: float, end: float) -> torch.Tensor:
    """Trim waveform to [start, end] seconds."""
    start_sample = int(start * sr)
    end_sample = int(end * sr)
    end_sample = min(end_sample, waveform.shape[-1])
    return waveform[..., start_sample:end_sample]


def waveform_to_wav_bytes(waveform: torch.Tensor, sr: int) -> bytes:
    """Convert a waveform tensor to WAV bytes."""
    buf = io.BytesIO()
    torchaudio.save(buf, waveform, sr, format="wav")
    buf.seek(0)
    return buf.read()


# ---------------------------------------------------------------------------
# Predictor
# ---------------------------------------------------------------------------

class Predictor(BasePredictor):
    def setup(self):
        """Load Demucs model into memory."""
        from demucs.pretrained import get_model
        from demucs.apply import BagOfModels

        self.demucs = get_model("htdemucs")
        if isinstance(self.demucs, BagOfModels):
            self.demucs_sr = self.demucs.models[0].samplerate
        else:
            self.demucs_sr = self.demucs.samplerate
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.demucs.to(self.device)

    def predict(
        self,
        audio: Path = Input(description="Input audio file"),
        start_time: float = Input(
            description="Start time in seconds for trimming", default=0.0, ge=0.0
        ),
        end_time: float = Input(
            description="End time in seconds for trimming (0 = full length)",
            default=0.0,
            ge=0.0,
        ),
        stems: str = Input(
            description="Comma-separated list of stems to extract (vocals,bass,drums,other)",
            default="vocals,other",
        ),
        default_bpm: int = Input(
            description="Default BPM if auto-detection fails", default=120, ge=40, le=300
        ),
    ) -> Any:
        """Run the full pipeline: trim → separate → pitch detect → RTTTL."""
        from basic_pitch.inference import predict as bp_predict
        from basic_pitch import ICASSP_2022_MODEL_PATH

        # 1. Load audio
        waveform, sr = torchaudio.load(str(audio))

        # 2. Trim
        total_duration = waveform.shape[-1] / sr
        if end_time <= 0 or end_time > total_duration:
            end_time = total_duration
        if start_time >= end_time:
            start_time = 0.0

        waveform = trim_audio(waveform, sr, start_time, end_time)

        # 3. Resample to Demucs sample rate if needed
        if sr != self.demucs_sr:
            waveform = torchaudio.functional.resample(waveform, sr, self.demucs_sr)
            sr = self.demucs_sr

        # Ensure stereo
        if waveform.shape[0] == 1:
            waveform = waveform.repeat(2, 1)
        elif waveform.shape[0] > 2:
            waveform = waveform[:2]

        # 4. Run Demucs separation
        from demucs.apply import apply_model

        ref = waveform.mean(0)
        waveform_normalized = (waveform - ref.mean()) / ref.std()
        waveform_input = waveform_normalized.unsqueeze(0).to(self.device)

        with torch.no_grad():
            sources = apply_model(self.demucs, waveform_input, shifts=1, overlap=0.25)
        sources = sources.squeeze(0).cpu()

        # Demucs htdemucs sources order: drums, bass, other, vocals
        source_names = ["drums", "bass", "other", "vocals"]

        # 5. Parse requested stems
        requested = [s.strip().lower() for s in stems.split(",") if s.strip()]
        requested = [s for s in requested if s in source_names]
        if not requested:
            requested = ["vocals"]

        # Limit to 4 tracks
        requested = requested[:4]

        # 6. For each stem: run Basic Pitch → convert to RTTTL
        tracks = []
        for stem_name in requested:
            idx = source_names.index(stem_name)
            stem_audio = sources[idx]  # shape: (2, samples)

            # Convert to mono for pitch detection
            mono = stem_audio.mean(0).numpy()

            # Save to temp file for Basic Pitch
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp_path = tmp.name
                mono_tensor = torch.from_numpy(mono).unsqueeze(0)
                torchaudio.save(tmp_path, mono_tensor, sr)

            # Run Basic Pitch
            try:
                model_output, midi_data, note_events = bp_predict(
                    tmp_path,
                    model_or_model_path=ICASSP_2022_MODEL_PATH,
                )
            except Exception as e:
                tracks.append({
                    "stem": stem_name,
                    "rtttl": f"{stem_name}:d=4,o=5,b=120:p",
                    "note_count": 0,
                    "duration_sec": round(end_time - start_time, 2),
                    "bpm": 120,
                    "error": str(e),
                })
                continue
            finally:
                Path(tmp_path).unlink(missing_ok=True)

            # Convert note_events to our format
            # note_events is a list of (start_time, end_time, midi_pitch, amplitude, [pitch_bends])
            notes = []
            for event in note_events:
                start_t, end_t, midi_pitch, amplitude = event[:4]
                if amplitude < 0.3:  # Skip very quiet notes
                    continue
                notes.append({
                    "midi": int(round(midi_pitch)),
                    "start": float(start_t),
                    "end": float(end_t),
                })

            # Convert to RTTTL
            rtttl_str, detected_bpm, note_count = notes_to_rtttl(
                stem_name, notes, bpm=None
            )

            tracks.append({
                "stem": stem_name,
                "rtttl": rtttl_str,
                "note_count": note_count,
                "duration_sec": round(end_time - start_time, 2),
                "bpm": detected_bpm,
            })

        return {
            "tracks": tracks,
            "trimmed_duration_sec": round(end_time - start_time, 2),
            "start_time": start_time,
            "end_time": end_time,
        }
