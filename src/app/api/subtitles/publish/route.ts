import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { savePublishedSubtitle } from "@/lib/subtitles/publishedStore";
import { SubtitleCue } from "@/lib/subtitles/types";
import { serializeSubtitles } from "@/lib/subtitles/serializer";
import { uploadSubtitleToB2, isB2Configured } from "@/lib/storage/b2";

const PublishRequestSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().optional().default(""),
  filename: z.string().min(1, "Filename is required"),
  format: z.enum(["srt", "vtt"]).default("srt"),
  sourceLang: z.string().min(1),
  targetLang: z.string().min(1),
  visibility: z.enum(["public", "unlisted", "private"]).default("public"),
  authorName: z.string().optional().default("Subtivio Community"),
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

    const id = data.id || `sub_${Math.random().toString(36).substring(2, 9)}`;

    // Prepare Backblaze B2 storage metadata
    let b2Key: string | undefined;
    let b2Bucket: string | undefined;
    let b2Stored: boolean = false;

    // Check if Backblaze B2 is configured
    if (isB2Configured()) {
      try {
        const { content, mimeType, extension } = serializeSubtitles(cues, {
          format: data.format,
          mode: "translated",
          normalizeLineBreaks: true,
        });

        // Safe filename for S3/B2 key
        const safeBase = data.filename.replace(/\.(srt|vtt)$/i, "").replace(/[^a-zA-Z0-9._-]/g, "_");
        const objectKey = `subtitles/${id}/${safeBase}.${extension}`;

        const uploadResult = await uploadSubtitleToB2({
          key: objectKey,
          content,
          contentType: mimeType,
          metadata: {
            title: encodeURIComponent(data.title.substring(0, 80)),
            sourcelang: data.sourceLang,
            targetlang: data.targetLang,
            format: data.format,
            cuescount: String(cuesCount),
          },
        });

        if (uploadResult.success && uploadResult.key) {
          b2Key = uploadResult.key;
          b2Bucket = uploadResult.bucket;
          b2Stored = true;
        } else {
          console.warn("[PUBLISH] Backblaze B2 upload did not succeed, fallback to database:", uploadResult.error);
        }
      } catch (b2Err) {
        console.warn("[PUBLISH] B2 upload error during publish, continuing gracefully:", b2Err);
      }
    }

    const publishedItem = await savePublishedSubtitle({
      id,
      title: data.title.trim(),
      description: data.description?.trim() || "",
      filename: data.filename,
      format: data.format,
      sourceLang: data.sourceLang,
      targetLang: data.targetLang,
      visibility: data.visibility,
      authorName: data.authorName || "Subtivio Localizer",
      authorEmail: data.authorEmail,
      cuesCount,
      translatedCuesCount,
      durationFormatted: data.durationFormatted,
      durationSeconds: data.durationSeconds,
      category: data.category,
      cues,
      tags: data.tags || [data.category, data.targetLang],
      b2Key,
      b2Bucket,
      b2Stored,
    });

    return NextResponse.json({
      success: true,
      id: publishedItem.id,
      url: `/subtitles/${publishedItem.id}`,
      subtitle: publishedItem,
      b2: {
        configured: isB2Configured(),
        stored: b2Stored,
        key: b2Key,
        bucket: b2Bucket,
      },
    });
  } catch (error: unknown) {
    console.error("Publish subtitle API error:", error);
    const message = error instanceof Error ? error.message : "Failed to publish subtitles";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

