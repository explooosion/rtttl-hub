import { describe, expect, it } from "vitest";

import { isAcceptedMidiFile, isAcceptedAudioFile } from "./file_acceptance";

describe("isAcceptedMidiFile", () => {
  it("accepts standard MIDI files by extension even when MIME type is blank", () => {
    expect(isAcceptedMidiFile(new File(["abc"], "track.mid", { type: "" }))).toBe(true);
    expect(isAcceptedMidiFile(new File(["abc"], "track.MIDI", { type: "" }))).toBe(true);
  });

  it("rejects non-MIDI uploads", () => {
    expect(isAcceptedMidiFile(new File(["abc"], "notes.txt", { type: "text/plain" }))).toBe(false);
  });
});

describe("isAcceptedAudioFile", () => {
  it("accepts common audio files by MIME type or extension", () => {
    expect(isAcceptedAudioFile(new File(["abc"], "clip.mp3", { type: "audio/mpeg" }))).toBe(true);
    expect(isAcceptedAudioFile(new File(["abc"], "clip.wav", { type: "" }))).toBe(true);
    expect(isAcceptedAudioFile(new File(["abc"], "clip.flac", { type: "audio/flac" }))).toBe(true);
  });

  it("rejects unsupported file types", () => {
    expect(isAcceptedAudioFile(new File(["abc"], "image.png", { type: "image/png" }))).toBe(false);
  });
});
