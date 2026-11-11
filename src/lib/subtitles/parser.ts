import { ParseResult, SubtitleCue, SubtitleFile, SubtitleFormat } from "./types";

/**
 * Convert timestamp string to seconds
 * Supports "HH:MM:SS,mmm", "HH:MM:SS.mmm", and "MM:SS.mmm"
 */
export function timestampToSeconds(timestamp: string): number {
  const clean = timestamp.trim().replace(",", ".");
  const parts = clean.split(":");

  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }

  return 0;
}

/**
 * Format seconds to timestamp string
 * format: "srt" -> "00:01:23,456", "vtt" -> "00:01:23.456"
 */
export function secondsToTimestamp(totalSeconds: number, format: SubtitleFormat = "srt"): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);

  const pad = (num: number, size = 2) => String(num).padStart(size, "0");
  const msPad = String(Math.min(milliseconds, 999)).padStart(3, "0");

  const delimiter = format === "srt" ? "," : ".";
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}${delimiter}${msPad}`;
}

/**
 * Calculate characters per second (CPS) reading speed
 */
export function calculateCPS(text: string, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  const cleanText = text.replace(/<[^>]*>/g, "").trim();
  return Number((cleanText.length / durationSeconds).toFixed(1));
}

/**
 * Parse an SRT formatted string
 */
export function parseSRT(rawContent: string, filename = "subtitles.srt"): ParseResult {
  const normalized = rawContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalized.trim().split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];
  const warnings: string[] = [];

  let cueIndex = 1;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;

    const lines = block.split("\n");
    let timingLineIndex = -1;

    for (let j = 0; j < lines.length; j++) {
      if (lines[j].includes("-->")) {
        timingLineIndex = j;
        break;
      }
    }

    if (timingLineIndex === -1) {
      warnings.push(`Skipped block ${i + 1}: no valid timing arrow (-->) found.`);
      continue;
    }

    const timingLine = lines[timingLineIndex];
    const timingMatch = timingLine.match(/(\d{1,2}:\d{2}:\d{2}[,.]\d{2,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{2,3})/);

    if (!timingMatch) {
      warnings.push(`Skipped block ${i + 1}: unable to parse timestamps from '${timingLine}'.`);
      continue;
    }

    const startTimeRaw = timingMatch[1].replace(".", ",");
    const endTimeRaw = timingMatch[2].replace(".", ",");
    const startSeconds = timestampToSeconds(startTimeRaw);
    const endSeconds = timestampToSeconds(endTimeRaw);

    const originalId = timingLineIndex > 0 ? lines[0].trim() : cueIndex;
    const textLines = lines.slice(timingLineIndex + 1);
    const text = textLines.join("\n").trim();

    if (!text) {
      warnings.push(`Block ${i + 1} has empty subtitle text.`);
    }

    const duration = Math.max(0.1, endSeconds - startSeconds);

    cues.push({
      id: cueIndex++,
      originalId,
      startTime: startTimeRaw,
      endTime: endTimeRaw,
      startSeconds,
      endSeconds,
      originalText: text,
      translatedText: "",
      status: "pending",
      charCount: text.length,
      readingSpeedCps: calculateCPS(text, duration),
    });
  }

  if (cues.length === 0) {
    return {
      success: false,
      error: "No valid subtitle cues found. Please ensure the file conforms to standard SRT format.",
      warnings,
    };
  }

  return {
    success: true,
    file: {
      filename,
      format: "srt",
      sizeBytes: new Blob([rawContent]).size,
      cues,
    },
    warnings,
  };
}

/**
 * Parse a WebVTT formatted string
 */
export function parseVTT(rawContent: string, filename = "subtitles.vtt"): ParseResult {
  const normalized = rawContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const warnings: string[] = [];

  if (!normalized.startsWith("WEBVTT")) {
    warnings.push("File does not start with WEBVTT header. Attempting tolerant parsing.");
  }

  const lines = normalized.split("\n");
  const cues: SubtitleCue[] = [];
  let headerText = "";
  let cueIndex = 1;

  let inHeader = true;
  let currentBlock: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (inHeader) {
      if (line.trim() === "") {
        inHeader = false;
      } else {
        headerText += line + "\n";
      }
      continue;
    }

    if (line.trim() === "") {
      if (currentBlock.length > 0) {
        processVTTBlock(currentBlock, cueIndex, cues, warnings);
        cueIndex = cues.length + 1;
        currentBlock = [];
      }
    } else {
      currentBlock.push(line);
    }
  }

  if (currentBlock.length > 0) {
    processVTTBlock(currentBlock, cueIndex, cues, warnings);
  }

  if (cues.length === 0) {
    return {
      success: false,
      error: "No valid WebVTT cues found. Please ensure the file contains valid timestamped cues.",
      warnings,
    };
  }

  return {
    success: true,
    file: {
      filename,
      format: "vtt",
      sizeBytes: new Blob([rawContent]).size,
      cues,
      header: headerText.trim(),
    },
    warnings,
  };
}

function processVTTBlock(
  blockLines: string[],
  fallbackIndex: number,
  cues: SubtitleCue[],
  warnings: string[]
) {
  // Check for NOTE comments
  if (blockLines[0].trim().startsWith("NOTE")) {
    return;
  }

  let timingLineIndex = -1;
  for (let j = 0; j < blockLines.length; j++) {
    if (blockLines[j].includes("-->")) {
      timingLineIndex = j;
      break;
    }
  }

  if (timingLineIndex === -1) {
    warnings.push(`Skipped non-cue block: '${blockLines[0]}'`);
    return;
  }

  const timingLine = blockLines[timingLineIndex];
  // VTT timestamp regex: (\d{2}:)?\d{2}:\d{2}\.\d{3}
  const timingMatch = timingLine.match(
    /((?:\d{1,2}:)?\d{2}:\d{2}[,.]\d{2,3})\s*-->\s*((?:\d{1,2}:)?\d{2}:\d{2}[,.]\d{2,3})(.*)?/
  );

  if (!timingMatch) {
    warnings.push(`Could not parse VTT timing line: '${timingLine}'`);
    return;
  }

  const startTimeRaw = timingMatch[1].replace(",", ".");
  const endTimeRaw = timingMatch[2].replace(",", ".");
  const cueSettings = (timingMatch[3] || "").trim();

  const startSeconds = timestampToSeconds(startTimeRaw);
  const endSeconds = timestampToSeconds(endTimeRaw);
  const originalId = timingLineIndex > 0 ? blockLines[0].trim() : fallbackIndex;

  const textLines = blockLines.slice(timingLineIndex + 1);
  const text = textLines.join("\n").trim();
  const duration = Math.max(0.1, endSeconds - startSeconds);

  cues.push({
    id: fallbackIndex,
    originalId,
    startTime: startTimeRaw,
    endTime: endTimeRaw,
    startSeconds,
    endSeconds,
    originalText: text,
    translatedText: "",
    settings: cueSettings || undefined,
    status: "pending",
    charCount: text.length,
    readingSpeedCps: calculateCPS(text, duration),
  });
}

/**
 * Universal auto-detection parser for SRT and VTT
 */
export function parseSubtitleFile(content: string, filename: string): ParseResult {
  const ext = filename.split(".").pop()?.toLowerCase();
  const trimmed = content.trim();

  if (ext === "vtt" || trimmed.startsWith("WEBVTT")) {
    return parseVTT(content, filename);
  } else if (ext === "srt" || /\d+\s*\n\s*\d{2}:\d{2}:\d{2}/.test(trimmed)) {
    return parseSRT(content, filename);
  } else {
    // Try SRT first, if fails try VTT
    const srtAttempt = parseSRT(content, filename);
    if (srtAttempt.success) return srtAttempt;

    const vttAttempt = parseVTT(content, filename);
    if (vttAttempt.success) return vttAttempt;

    return {
      success: false,
      error: "Unrecognized subtitle format. Subtivio supports .srt and .vtt files.",
    };
  }
}

/**
 * Shift all subtitle cues by a given millisecond offset.
 * Positive offset delays cues (plays later); negative offset advances cues (plays earlier).
 * Start time is clamped to 0s, and end time is guaranteed to be >= start + 0.1s.
 */
export function shiftCueTimings(
  cues: SubtitleCue[],
  offsetMs: number,
  defaultFormat: SubtitleFormat = "srt"
): SubtitleCue[] {
  if (!offsetMs || cues.length === 0) return cues;
  const offsetSeconds = offsetMs / 1000;

  return cues.map((cue) => {
    const isVtt = cue.startTime.includes(".") || cue.endTime.includes(".");
    const format: SubtitleFormat = isVtt ? "vtt" : defaultFormat;

    const rawStart = cue.startSeconds + offsetSeconds;
    const rawEnd = cue.endSeconds + offsetSeconds;

    const newStart = Math.max(0, Math.round(rawStart * 1000) / 1000);
    const newEnd = Math.max(newStart + 0.1, Math.round(rawEnd * 1000) / 1000);
    const duration = Math.max(0.1, newEnd - newStart);

    return {
      ...cue,
      startSeconds: newStart,
      endSeconds: newEnd,
      startTime: secondsToTimestamp(newStart, format),
      endTime: secondsToTimestamp(newEnd, format),
      readingSpeedCps: calculateCPS(cue.translatedText || cue.originalText, duration),
    };
  });
}

