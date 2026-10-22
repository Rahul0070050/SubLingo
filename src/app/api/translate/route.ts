import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { executeBatchTranslation } from "@/lib/translation/engine";
import { SubtitleCue } from "@/lib/subtitles/types";

const CueSchema = z.object({
  id: z.number(),
  originalId: z.union([z.string(), z.number()]).optional(),
  startTime: z.string(),
  endTime: z.string(),
  startSeconds: z.number(),
  endSeconds: z.number(),
  originalText: z.string(),
  translatedText: z.string().optional().default(""),
  settings: z.string().optional(),
  status: z.enum(["pending", "translating", "completed", "error"]).optional(),
  error: z.string().optional(),
});

const TranslateRequestSchema = z.object({
  cues: z.array(CueSchema).min(1, "At least one cue is required"),
  settings: z.object({
    sourceLang: z.string().default("auto"),
    targetLang: z.string().min(2, "Target language code is required"),
    provider: z.enum(["free-engine", "gemini", "openai", "deepl"]).default("free-engine"),
    apiKey: z.string().optional(),
    model: z.string().optional(),
    tone: z.enum(["natural", "formal", "casual", "literal"]).optional(),
    glossary: z.record(z.string(), z.string()).optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = TranslateRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request payload",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const { cues, settings } = parsed.data;

    // Execute translation on this batch
    const result = await executeBatchTranslation(cues as SubtitleCue[], settings);

    return NextResponse.json({
      success: true,
      cues: result.cues,
      detectedSourceLang: result.detectedSourceLang,
      errors: result.errors,
    });
  } catch (error: unknown) {
    console.error("Translation API error:", error);
    const message = error instanceof Error ? error.message : "Translation server error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
