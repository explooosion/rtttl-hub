import { httpsCallable } from "firebase/functions";

import { functions } from "../lib/firebase";
import { fileToBase64 } from "../utils/file_to_base64";

export type StemType = "vocals" | "bass" | "drums" | "other";

export const ALL_STEMS: StemType[] = ["vocals", "bass", "drums", "other"];

export interface ExtractionOptions {
  startTime: number;
  endTime: number;
  stems: StemType[];
}

export interface TrackResult {
  stem: StemType;
  rtttl: string;
  noteCount: number;
  durationSec: number;
  bpm: number;
  error?: string;
}

export interface ExtractionResult {
  tracks: TrackResult[];
  trimmedDurationSec: number;
  startTime: number;
  endTime: number;
  logs?: string;
}

const POLL_INTERVAL_MS = 2000;

interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output: {
    tracks: Array<{
      stem: string;
      rtttl: string;
      note_count: number;
      duration_sec: number;
      bpm: number;
      error?: string;
    }>;
    trimmed_duration_sec: number;
    start_time: number;
    end_time: number;
  } | null;
  error: string | null;
  logs: string;
}

const createPredictionFn = httpsCallable<
  { audioDataUri: string; startTime: number; endTime: number; stems: string },
  ReplicatePrediction
>(functions, "replicateCreatePrediction");

const getPredictionFn = httpsCallable<{ id: string }, ReplicatePrediction>(
  functions,
  "replicateGetPrediction",
);

async function createPrediction(
  audioDataUri: string,
  options: ExtractionOptions,
): Promise<ReplicatePrediction> {
  const result = await createPredictionFn({
    audioDataUri,
    startTime: options.startTime,
    endTime: options.endTime,
    stems: options.stems.join(","),
  });
  return result.data;
}

async function getPrediction(id: string): Promise<ReplicatePrediction> {
  const result = await getPredictionFn({ id });
  return result.data;
}

/**
 * Submit a trimmed audio file to the Demucs+BasicPitch pipeline on Replicate.
 * Returns up to 4 RTTTL tracks extracted from the separated stems.
 */
export async function extractMelody(
  file: File,
  options: ExtractionOptions,
  onStatusChange?: (status: ReplicatePrediction["status"], logs: string) => void,
): Promise<ExtractionResult> {
  const dataUri = await fileToBase64(file);

  const prediction = await createPrediction(dataUri, options);
  let current = prediction;

  onStatusChange?.(current.status, current.logs ?? "");

  while (
    current.status !== "succeeded" &&
    current.status !== "failed" &&
    current.status !== "canceled"
  ) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    current = await getPrediction(current.id);
    onStatusChange?.(current.status, current.logs ?? "");
  }

  if (current.status === "failed") {
    throw new Error(current.error ?? "Extraction failed");
  }

  if (current.status === "canceled") {
    throw new Error("Extraction was canceled");
  }

  if (!current.output) {
    throw new Error("No output returned from model");
  }

  return {
    tracks: current.output.tracks.map((t) => ({
      stem: t.stem as StemType,
      rtttl: t.rtttl,
      noteCount: t.note_count,
      durationSec: t.duration_sec,
      bpm: t.bpm,
      error: t.error,
    })),
    trimmedDurationSec: current.output.trimmed_duration_sec,
    startTime: current.output.start_time,
    endTime: current.output.end_time,
    logs: current.logs ?? "",
  };
}
