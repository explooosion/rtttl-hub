/**
 * replicate_proxy.ts
 *
 * Server-side proxy for the Replicate API.
 * Keeps REPLICATE_API_TOKEN off the client and resolves the CORS block
 * that occurs when browsers call api.replicate.com directly.
 */

const REPLICATE_API_BASE = "https://api.replicate.com/v1";
const DEPLOYMENT_OWNER = "explooosion";
const DEPLOYMENT_NAME = "rtttl-hub-ai";

export interface CreatePredictionInput {
  audioDataUri: string;
  startTime: number;
  endTime: number;
  stems: string;
}

export interface ReplicatePrediction {
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

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function createReplicatePrediction(
  input: CreatePredictionInput,
): Promise<ReplicatePrediction> {
  const token = process.env["REPLICATE_API_TOKEN"] ?? "";
  if (!token) {
    throw new Error("REPLICATE_API_TOKEN is not configured");
  }

  const endpoint = `${REPLICATE_API_BASE}/deployments/${DEPLOYMENT_OWNER}/${DEPLOYMENT_NAME}/predictions`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { ...authHeaders(token), Prefer: "respond-async" },
    body: JSON.stringify({
      input: {
        audio: input.audioDataUri,
        start_time: input.startTime,
        end_time: input.endTime,
        stems: input.stems,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Replicate API error (${response.status}): ${body}`);
  }

  return response.json() as Promise<ReplicatePrediction>;
}

export async function getReplicatePrediction(id: string): Promise<ReplicatePrediction> {
  const token = process.env["REPLICATE_API_TOKEN"] ?? "";
  if (!token) {
    throw new Error("REPLICATE_API_TOKEN is not configured");
  }

  const response = await fetch(`${REPLICATE_API_BASE}/predictions/${id}`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Replicate API error (${response.status}): ${body}`);
  }

  return response.json() as Promise<ReplicatePrediction>;
}
