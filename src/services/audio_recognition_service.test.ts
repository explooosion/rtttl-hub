import { describe, expect, it } from "vitest";
import { Timestamp } from "firebase/firestore";

import { sortRecognitionRecordsByNewest } from "./audio_recognition_service";

describe("sortRecognitionRecordsByNewest", () => {
  it("sorts records by newest first without relying on a Firestore composite index", () => {
    const first: { id: string; createdAt: ReturnType<typeof Timestamp.fromDate> } = {
      id: "older",
      createdAt: Timestamp.fromDate(new Date("2024-01-01T10:00:00Z")),
    };
    const second: { id: string; createdAt: ReturnType<typeof Timestamp.fromDate> } = {
      id: "newer",
      createdAt: Timestamp.fromDate(new Date("2024-01-02T10:00:00Z")),
    };
    const third: { id: string; createdAt: ReturnType<typeof Timestamp.fromDate> } = {
      id: "newest",
      createdAt: Timestamp.fromDate(new Date("2024-01-03T10:00:00Z")),
    };

    expect(
      sortRecognitionRecordsByNewest([first, third, second]).map((record) => record.id),
    ).toEqual(["newest", "newer", "older"]);
  });
});
