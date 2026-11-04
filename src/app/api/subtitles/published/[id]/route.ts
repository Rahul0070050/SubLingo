import { NextRequest, NextResponse } from "next/server";
import {
  getPublishedSubtitleById,
  incrementSubtitleView,
  incrementSubtitleDownload,
} from "@/lib/subtitles/publishedStore";
import { serializeSubtitles } from "@/lib/subtitles/serializer";
import { getSubtitleFromB2, getSubtitlePresignedUrl, isB2Configured } from "@/lib/storage/b2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subtitle = await getPublishedSubtitleById(id);

    if (!subtitle) {
      return NextResponse.json(
        { success: false, error: "Published subtitle release not found" },
        { status: 404 }
      );
    }

    // Increment view count in background
    await incrementSubtitleView(id);

    // If subtitle is backed by Backblaze B2, optionally generate a pre-signed URL
    let presignedUrl: string | null = null;
    if (subtitle.b2Key && isB2Configured()) {
      presignedUrl = await getSubtitlePresignedUrl(subtitle.b2Key, 3600); // 1 hour validity
    }

    return NextResponse.json({
      success: true,
      subtitle,
      b2: {
        stored: Boolean(subtitle.b2Stored),
        key: subtitle.b2Key,
        presignedUrl,
      },
    });
  } catch (error: unknown) {
    console.error("Fetch subtitle details error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subtitle = await getPublishedSubtitleById(id);

    if (!subtitle) {
      return NextResponse.json(
        { success: false, error: "Published subtitle not found" },
        { status: 404 }
      );
    }

    const json = await req.json().catch(() => ({}));
    const mode = json.mode || "translated";
    const format = json.format || subtitle.format;
    const wantsPresigned = Boolean(json.presigned);

    // If client requested a direct pre-signed B2 download URL
    if (wantsPresigned && subtitle.b2Key && isB2Configured()) {
      const presignedUrl = await getSubtitlePresignedUrl(subtitle.b2Key, 1800);
      if (presignedUrl) {
        await incrementSubtitleDownload(id);
        return NextResponse.json({
          success: true,
          presignedUrl,
          b2Key: subtitle.b2Key,
        });
      }
    }

    await incrementSubtitleDownload(id);

    const safeTitle = subtitle.title.replace(/[^a-zA-Z0-9_-]/g, "_");
    let content: string = "";
    let mimeType = format === "vtt" ? "text/vtt;charset=utf-8" : "application/x-subrip;charset=utf-8";
    const extension = format;
    let storageSource = "local-serializer";

    // If the requested file is the original published format and translated mode, attempt to stream from Backblaze B2
    if (mode === "translated" && format === subtitle.format && subtitle.b2Key && isB2Configured()) {
      try {
        const b2Data = await getSubtitleFromB2(subtitle.b2Key);
        if (b2Data.success && b2Data.content) {
          content = b2Data.content;
          mimeType = b2Data.contentType || mimeType;
          storageSource = "backblaze-b2";
        }
      } catch (err) {
        console.warn("[DOWNLOAD] B2 streaming fetch failed, falling back to local serialization:", err);
      }
    }

    // Fallback: Dynamic serialization from cues (supports all modes e.g., bilingual-stacked, format conversions)
    if (!content) {
      const serialized = serializeSubtitles(subtitle.cues, {
        format,
        mode,
        normalizeLineBreaks: true,
      });
      content = serialized.content;
      mimeType = serialized.mimeType;
    }

    const downloadFilename = `${safeTitle}_${subtitle.targetLang}_${mode}.${extension}`;

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadFilename)}"`,
        "X-SubLingo-Storage": storageSource,
      },
    });
  } catch (error: unknown) {
    console.error("Download subtitle error:", error);
    const message = error instanceof Error ? error.message : "Download failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

