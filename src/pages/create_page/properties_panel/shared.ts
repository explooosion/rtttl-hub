import type { RtttlCategory } from "../../../utils/rtttl_parser";

const COLLAPSE_KEY = "rtttl-properties-collapse";

export interface CollapsePrefs {
  track: boolean;
  project: boolean;
}

export interface TrackDefaults {
  duration: number;
  octave: number;
  bpm: number;
}

export interface TrackStats {
  duration: number;
  notes: number;
  codeLength: number;
}

export interface PropertiesPanelProps {
  name: string;
  nameInputRef?: React.RefObject<HTMLInputElement | null>;
  tracks: string[];
  focusedTrackIndex: number;
  onNameChange: (value: string) => void;
  onRenameTrack: (newName: string) => void;
  onTrackCodeChange: (nextCode: string) => void;
  categories: RtttlCategory[];
  onCategoriesChange: (value: RtttlCategory[]) => void;
  errors: string[];
}

export function loadCollapsePrefs(): CollapsePrefs {
  try {
    const raw = localStorage.getItem(COLLAPSE_KEY);
    if (raw) {
      return JSON.parse(raw) as CollapsePrefs;
    }
  } catch {
    // ignore
  }
  return { track: true, project: true };
}

export function saveCollapsePrefs(prefs: CollapsePrefs) {
  try {
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function parseTrackDefaults(defaultsPart: string): TrackDefaults {
  const result: TrackDefaults = { duration: 4, octave: 5, bpm: 140 };
  const parts = defaultsPart.split(",");
  for (const part of parts) {
    const [rawKey, rawVal] = part.trim().split("=");
    const value = parseInt(rawVal ?? "", 10);
    if (Number.isNaN(value)) {
      continue;
    }
    if (rawKey === "d") {
      result.duration = value;
    } else if (rawKey === "o") {
      result.octave = value;
    } else if (rawKey === "b") {
      result.bpm = value;
    }
  }
  return result;
}

export function splitTrackParts(code: string) {
  const firstColonIdx = code.indexOf(":");
  if (firstColonIdx <= 0) {
    return null;
  }
  const secondColonIdx = code.indexOf(":", firstColonIdx + 1);
  if (secondColonIdx === -1) {
    return null;
  }
  return {
    namePart: code.slice(0, firstColonIdx),
    defaultsPart: code.slice(firstColonIdx + 1, secondColonIdx),
    notesPart: code.slice(secondColonIdx + 1),
  };
}
