import { NextRequest, NextResponse } from "next/server";
import { getPublishedSubtitles } from "@/lib/subtitles/publishedStore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") || undefined;
    const targetLang = searchParams.get("targetLang") || undefined;
    const format = searchParams.get("format") || undefined;
    const category = searchParams.get("category") || undefined;
    const visibility = searchParams.get("visibility") || "public";

    const subtitles = await getPublishedSubtitles({
      search,
      targetLang,
      format,
      category,
      visibility,
    });

    return NextResponse.json({
      success: true,
      subtitles,
      total: subtitles.length,
    });
  } catch (error: unknown) {
    console.error("Failed to fetch published subtitles:", error);
    const message = error instanceof Error ? error.message : "Server error fetching subtitles";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
