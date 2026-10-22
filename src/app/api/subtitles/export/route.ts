import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { serializeSubtitles } from "@/lib/subtitles/serializer";
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
});

const ExportRequestSchema = z.object({
  cues: z.array(CueSchema).min(1, "Subtitle cues cannot be empty"),
  filename: z.string().default("subtitles"),
  format: z.enum(["srt", "vtt"]).default("srt"),
  mode: z.enum(["translated", "original", "bilingual-stacked", "bilingual-inline"]).default("translated"),
  timeOffsetMs: z.number().optional().default(0),
  normalizeLineBreaks: z.boolean().optional().default(true),
  vttHeader: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = ExportRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid export payload",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const { cues, filename, format, mode, timeOffsetMs, normalizeLineBreaks, vttHeader } = parsed.data;

    const { content, mimeType, extension } = serializeSubtitles(
      cues as SubtitleCue[],
      {
        format,
        mode,
        timeOffsetMs,
        normalizeLineBreaks,
      },
      vttHeader
    );

    const baseName = filename.replace(/\.(srt|vtt)$/i, "");
    const downloadName = `${baseName}_${mode}.${extension}`;

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadName)}"`,
      },
    });
  } catch (error: unknown) {
    console.error("Subtitle export API error:", error);
    const message = error instanceof Error ? error.message : "Export server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
