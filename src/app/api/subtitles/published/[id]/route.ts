import { NextRequest, NextResponse } from "next/server";
import {
  getPublishedSubtitleById,
  incrementSubtitleView,
  incrementSubtitleDownload,
} from "@/lib/subtitles/publishedStore";
import { serializeSubtitles } from "@/lib/subtitles/serializer";

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

    return NextResponse.json({
      success: true,
      subtitle,
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

    await incrementSubtitleDownload(id);

    const { content, mimeType, extension } = serializeSubtitles(subtitle.cues, {
      format,
      mode,
      normalizeLineBreaks: true,
    });

    const safeTitle = subtitle.title.replace(/[^a-zA-Z0-9_-]/g, "_");
    const downloadFilename = `${safeTitle}_${subtitle.targetLang}_${mode}.${extension}`;

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadFilename)}"`,
      },
    });
  } catch (error: unknown) {
    console.error("Download subtitle error:", error);
    const message = error instanceof Error ? error.message : "Download failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
