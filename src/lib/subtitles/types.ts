export type SubtitleFormat = "srt" | "vtt";

export interface SubtitleCue {
  id: number;
  originalId?: string | number;
  startTime: string; // e.g. "00:01:23,456" or "00:01:23.456"
  endTime: string;   // e.g. "00:01:26,789" or "00:01:26.789"
  startSeconds: number;
  endSeconds: number;
  originalText: string;
  translatedText: string;
  settings?: string; // VTT settings e.g. "line:0% align:center"
  status?: "pending" | "translating" | "completed" | "error";
  error?: string;
  charCount?: number;
  readingSpeedCps?: number; // Characters per second
}

export interface SubtitleFile {
  filename: string;
  format: SubtitleFormat;
  sizeBytes: number;
  cues: SubtitleCue[];
  header?: string; // e.g. WEBVTT header comments
  detectedLanguage?: string;
}

export interface TranslationSettings {
  sourceLang: string; // "auto" or language code like "en", "es", "ja"
  targetLang: string; // "es", "fr", "de", "ja", "zh", etc.
  provider: "free-engine" | "gemini" | "openai" | "deepl";
  apiKey?: string;
  model?: string;
  tone?: "natural" | "formal" | "casual" | "literal";
  glossary?: Record<string, string>;
  batchSize?: number;
}

export interface ParseResult {
  success: boolean;
  file?: SubtitleFile;
  error?: string;
  warnings?: string[];
}

export interface ExportOptions {
  format: SubtitleFormat;
  mode: "translated" | "original" | "bilingual-stacked" | "bilingual-inline";
  normalizeLineBreaks?: boolean;
  timeOffsetMs?: number; // Shift timings if needed
}
