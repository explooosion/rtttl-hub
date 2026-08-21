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
}

// Use local proxy in development to avoid CORS issues
// In production, this should be replaced with a serverless function
const REPLICATE_API_BASE =
  import.meta.env.MODE === "development" ? "/api/replicate" : "https://api.replicate.com/v1";

const DEPLOYMENT_OWNER = "explooosion";
const DEPLOYMENT_NAME = "rtttl-hub-ai";
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
}

function getApiToken(): string {
  const token = import.meta.env.VITE_REPLICATE_API_TOKEN as string | undefined;
  if (!token) {
    throw new Error("VITE_REPLICATE_API_TOKEN is not set. Add it to your .env file.");
  }
  return token;
}

async function createPrediction(
  audioDataUri: string,
  options: ExtractionOptions,
): Promise<ReplicatePrediction> {
  const token = getApiToken();
  const endpoint = `${REPLICATE_API_BASE}/deployments/${DEPLOYMENT_OWNER}/${DEPLOYMENT_NAME}/predictions`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "respond-async",
    },
    body: JSON.stringify({
      input: {
        audio: audioDataUri,
        start_time: options.startTime,
        end_time: options.endTime,
        stems: options.stems.join(","),
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Replicate API error (${response.status}): ${body}`);
  }

  return response.json() as Promise<ReplicatePrediction>;
}

async function getPrediction(id: string): Promise<ReplicatePrediction> {
  const token = getApiToken();
  const response = await fetch(`${REPLICATE_API_BASE}/predictions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Replicate API error (${response.status}): ${body}`);
  }

  return response.json() as Promise<ReplicatePrediction>;
}

/**
 * Submit a trimmed audio file to the Demucs+BasicPitch pipeline on Replicate.
 * Returns up to 4 RTTTL tracks extracted from the separated stems.
 */
export async function extractMelody(
  file: File,
  options: ExtractionOptions,
  onStatusChange?: (status: ReplicatePrediction["status"]) => void,
): Promise<ExtractionResult> {
  const dataUri = await fileToBase64(file);

  const prediction = await createPrediction(dataUri, options);
  let current = prediction;

  onStatusChange?.(current.status);

  while (
    current.status !== "succeeded" &&
    current.status !== "failed" &&
    current.status !== "canceled"
  ) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    current = await getPrediction(current.id);
    onStatusChange?.(current.status);
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
  };
}
