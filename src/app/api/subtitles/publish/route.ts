import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { savePublishedSubtitle } from "@/lib/subtitles/publishedStore";
import { SubtitleCue } from "@/lib/subtitles/types";

const PublishRequestSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().optional().default(""),
  filename: z.string().min(1, "Filename is required"),
  format: z.enum(["srt", "vtt"]).default("srt"),
  sourceLang: z.string().min(1),
  targetLang: z.string().min(1),
  visibility: z.enum(["public", "unlisted", "private"]).default("public"),
  authorName: z.string().optional().default("SubLingo Community"),
  authorEmail: z.string().optional(),
  cuesCount: z.number().int().nonnegative().optional(),
  translatedCuesCount: z.number().int().nonnegative().optional(),
  durationFormatted: z.string().optional().default("00m 00s"),
  durationSeconds: z.number().nonnegative().optional().default(0),
  category: z
    .enum(["Sci-Fi", "Tech", "Documentary", "Anime", "Cinema", "Educational", "General"])
    .optional()
    .default("General"),
  cues: z.array(z.any()).min(1, "At least one cue is required"),
  tags: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = PublishRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid publish payload",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const cues = data.cues as SubtitleCue[];
    const cuesCount = data.cuesCount ?? cues.length;
    const translatedCuesCount =
      data.translatedCuesCount ??
      cues.filter((c) => c.translatedText && c.translatedText.trim().length > 0).length;

    const publishedItem = await savePublishedSubtitle({
      id: data.id,
      title: data.title.trim(),
      description: data.description?.trim() || "",
      filename: data.filename,
      format: data.format,
      sourceLang: data.sourceLang,
      targetLang: data.targetLang,
      visibility: data.visibility,
      authorName: data.authorName || "SubLingo Localizer",
      authorEmail: data.authorEmail,
      cuesCount,
      translatedCuesCount,
      durationFormatted: data.durationFormatted,
      durationSeconds: data.durationSeconds,
      category: data.category,
      cues,
      tags: data.tags || [data.category, data.targetLang],
    });

    return NextResponse.json({
      success: true,
      id: publishedItem.id,
      url: `/subtitles/${publishedItem.id}`,
      subtitle: publishedItem,
    });
  } catch (error: unknown) {
    console.error("Publish subtitle API error:", error);
    const message = error instanceof Error ? error.message : "Failed to publish subtitles";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
