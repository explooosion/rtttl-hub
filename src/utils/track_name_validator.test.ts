import { describe, it, expect } from "vitest";
import { validateTrackName, sanitizeTrackName } from "./track_name_validator";

describe("validateTrackName", () => {
  it("accepts valid ASCII track names", () => {
    expect(validateTrackName("Track 1").valid).toBe(true);
    expect(validateTrackName("My_Track-01").valid).toBe(true);
    expect(validateTrackName("Bluejay Default").valid).toBe(true);
    expect(validateTrackName("2pac_hit_em_up").valid).toBe(true);
  });

  it("rejects empty or whitespace-only names", () => {
    expect(validateTrackName("").valid).toBe(false);
    expect(validateTrackName("   ").valid).toBe(false);
    expect(validateTrackName("").error).toBe("trackNameRequired");
  });

  it("rejects names with colons (RTTTL separator)", () => {
    const result = validateTrackName("Track:1");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("trackNameNoColon");
  });

  it("rejects names with commas (RTTTL note separator)", () => {
    const result = validateTrackName("Track,1");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("trackNameNoComma");
  });

  it("rejects names with Chinese characters", () => {
    const result = validateTrackName("音軌1");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("trackNameAsciiOnly");
  });

  it("rejects names with Japanese characters", () => {
    const result = validateTrackName("トラック1");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("trackNameAsciiOnly");
  });

  it("rejects names with Korean characters", () => {
    const result = validateTrackName("트랙1");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("trackNameAsciiOnly");
  });

  it("rejects names with emoji", () => {
    const result = validateTrackName("Track 🎵");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("trackNameAsciiOnly");
  });

  it("rejects names that are too long", () => {
    const longName = "A".repeat(31);
    const result = validateTrackName(longName);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("trackNameTooLong");
  });

  it("accepts names up to 30 characters", () => {
    const maxName = "A".repeat(30);
    expect(validateTrackName(maxName).valid).toBe(true);
  });

  it("accepts special ASCII characters except : and ,", () => {
    expect(validateTrackName("Track-1_v2 (final)").valid).toBe(true);
    expect(validateTrackName("Track!@#$%^&*()").valid).toBe(true);
    expect(validateTrackName("Track[]{}|\\").valid).toBe(true);
  });
});

describe("sanitizeTrackName", () => {
  it("removes colons and commas", () => {
    expect(sanitizeTrackName("Track:1,2")).toBe("Track12");
  });

  it("removes non-ASCII characters", () => {
    expect(sanitizeTrackName("Track 音軌 1")).toBe("Track  1");
    expect(sanitizeTrackName("トラック1")).toBe("1");
  });

  it("removes emoji", () => {
    expect(sanitizeTrackName("Track 🎵 1")).toBe("Track  1");
  });

  it("trims whitespace", () => {
    expect(sanitizeTrackName("  Track 1  ")).toBe("Track 1");
  });

  it("limits length to 30 characters", () => {
    const longName = "A".repeat(50);
    expect(sanitizeTrackName(longName)).toBe("A".repeat(30));
  });

  it("handles mixed valid and invalid characters", () => {
    expect(sanitizeTrackName("My:Track,音軌🎵_01")).toBe("MyTrack_01");
  });

  it("preserves valid ASCII special characters", () => {
    expect(sanitizeTrackName("Track-1_v2 (final)!")).toBe("Track-1_v2 (final)!");
  });
});
