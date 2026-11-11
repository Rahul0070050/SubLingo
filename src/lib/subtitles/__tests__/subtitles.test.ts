import { describe, it, expect } from "vitest";
import {
  parseSRT,
  parseVTT,
  timestampToSeconds,
  secondsToTimestamp,
  calculateCPS,
  shiftCueTimings,
} from "../parser";
import { serializeSRT, serializeVTT } from "../serializer";
import { SubtitleCue } from "../types";

describe("Subtitle Parser & Timestamp Math", () => {
  it("converts timestamps to seconds and back correctly", () => {
    const srtTime = "00:01:23,456";
    const sec = timestampToSeconds(srtTime);
    expect(sec).toBeCloseTo(83.456, 3);

    const backToSrt = secondsToTimestamp(sec, "srt");
    expect(backToSrt).toBe("00:01:23,456");

    const backToVtt = secondsToTimestamp(sec, "vtt");
    expect(backToVtt).toBe("00:01:23.456");
  });

  it("calculates CPS (characters per second)", () => {
    const text = "Hello world!"; // 12 chars
    const duration = 2; // 2 seconds
    const cps = calculateCPS(text, duration);
    expect(cps).toBe(6);
  });

  it("parses valid SRT subtitle string", () => {
    const sampleSRT = `1
00:00:01,000 --> 00:00:03,500
First subtitle line

2
00:00:04,000 --> 00:00:07,200
Second subtitle line with
multiple text lines
`;

    const result = parseSRT(sampleSRT);
    expect(result.success).toBe(true);
    expect(result.file?.cues.length).toBe(2);

    const cue1 = result.file!.cues[0];
    expect(cue1.id).toBe(1);
    expect(cue1.startSeconds).toBe(1);
    expect(cue1.endSeconds).toBe(3.5);
    expect(cue1.originalText).toBe("First subtitle line");

    const cue2 = result.file!.cues[1];
    expect(cue2.id).toBe(2);
    expect(cue2.startSeconds).toBe(4);
    expect(cue2.endSeconds).toBe(7.2);
    expect(cue2.originalText).toBe("Second subtitle line with\nmultiple text lines");
  });

  it("parses valid WebVTT subtitle string", () => {
    const sampleVTT = `WEBVTT - Sample

1
00:00:02.000 --> 00:00:05.000 align:middle
Welcome to WebVTT

2
00:00:06.500 --> 00:00:09.000
Second cue text
`;

    const result = parseVTT(sampleVTT);
    expect(result.success).toBe(true);
    expect(result.file?.cues.length).toBe(2);
    expect(result.file?.cues[0].startSeconds).toBe(2);
    expect(result.file?.cues[0].settings).toBe("align:middle");
  });
});

describe("Subtitle Serializer", () => {
  const cues: SubtitleCue[] = [
    {
      id: 1,
      startTime: "00:00:01,000",
      endTime: "00:00:04,000",
      startSeconds: 1,
      endSeconds: 4,
      originalText: "Hello world",
      translatedText: "Hola mundo",
    },
  ];

  it("serializes translated cues to SRT format", () => {
    const srt = serializeSRT(cues, { format: "srt", mode: "translated" });
    expect(srt).toContain("1\n00:00:01,000 --> 00:00:04,000\nHola mundo");
  });

  it("serializes bilingual stacked mode", () => {
    const srt = serializeSRT(cues, { format: "srt", mode: "bilingual-stacked" });
    expect(srt).toContain("Hola mundo\nHello world");
  });

  it("applies timing offset shifts", () => {
    const srt = serializeSRT(cues, {
      format: "srt",
      mode: "translated",
      timeOffsetMs: 1500, // +1.5 seconds
    });
    expect(srt).toContain("00:00:02,500 --> 00:00:05,500");
  });
});

describe("shiftCueTimings", () => {
  const cues: SubtitleCue[] = [
    {
      id: 1,
      startTime: "00:00:01,000",
      endTime: "00:00:04,000",
      startSeconds: 1.0,
      endSeconds: 4.0,
      originalText: "Line 1",
      translatedText: "Línea 1",
    },
    {
      id: 2,
      startTime: "00:00:05.500",
      endTime: "00:00:08.000",
      startSeconds: 5.5,
      endSeconds: 8.0,
      originalText: "Line 2 (VTT)",
      translatedText: "Línea 2",
    },
  ];

  it("shifts cues forward by +50ms", () => {
    const shifted = shiftCueTimings(cues, 50);
    expect(shifted[0].startSeconds).toBeCloseTo(1.05, 3);
    expect(shifted[0].endSeconds).toBeCloseTo(4.05, 3);
    expect(shifted[0].startTime).toBe("00:00:01,050");
    expect(shifted[0].endTime).toBe("00:00:04,050");

    // VTT cue preserves dot delimiter
    expect(shifted[1].startSeconds).toBeCloseTo(5.55, 3);
    expect(shifted[1].startTime).toBe("00:00:05.550");
  });

  it("shifts cues backward by -50ms", () => {
    const shifted = shiftCueTimings(cues, -50);
    expect(shifted[0].startSeconds).toBeCloseTo(0.95, 3);
    expect(shifted[0].endSeconds).toBeCloseTo(3.95, 3);
    expect(shifted[0].startTime).toBe("00:00:00,950");
    expect(shifted[0].endTime).toBe("00:00:03,950");
  });

  it("clamps start time to 0 and ensures minimum cue duration", () => {
    const nearZeroCue: SubtitleCue[] = [
      {
        id: 1,
        startTime: "00:00:00,020",
        endTime: "00:00:00,080",
        startSeconds: 0.02,
        endSeconds: 0.08,
        originalText: "Brief flash",
        translatedText: "",
      },
    ];

    const shifted = shiftCueTimings(nearZeroCue, -50);
    expect(shifted[0].startSeconds).toBe(0);
    expect(shifted[0].startTime).toBe("00:00:00,000");
    expect(shifted[0].endSeconds).toBeGreaterThanOrEqual(0.1);
  });

  it("returns original array when offset is 0", () => {
    const shifted = shiftCueTimings(cues, 0);
    expect(shifted).toBe(cues);
  });
});

