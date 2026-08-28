export const DRAFT_KEY = "rtttl-hub:create-draft";

export const TRACK_COLORS = [
  "rgb(99, 102, 241)", // indigo-500  Track 1
  "rgb(16, 185, 129)", // emerald-500 Track 2
  "rgb(245, 158, 11)", // amber-500   Track 3
  "rgb(244, 63, 94)", //  rose-500    Track 4
] as const;

export const TRACK_DOT_CLASSES = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
] as const;

export const MAX_TRACKS = 100;

/** Default pixels per second for the time-aligned timeline. */
export const PX_PER_SEC_DEFAULT = 100;
export const PX_PER_SEC_MIN = 20;
export const PX_PER_SEC_MAX = 800;
/** Minimum timeline canvas width in px regardless of duration. */
export const TIMELINE_MIN_WIDTH = 600;

/** Default RTTTL body appended to every newly created track stub.
 *  Produces a single playable C5 quarter-note at 120 BPM so the
 *  track immediately shows a waveform and emits audio. */
export const NEW_TRACK_STUB_BODY = "d=4,o=5,b=140:c,c#,d,d#,e,f,f#,g,g#,a,a#,b,c6";
