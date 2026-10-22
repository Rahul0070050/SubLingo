import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseSubtitleFile } from "@/lib/subtitles/parser";

const ParseRequestSchema = z.object({
  content: z.string().min(1, "Subtitle content is empty"),
  filename: z.string().min(1, "Filename is required"),
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = ParseRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const { content, filename } = parsed.data;

    // Enforce size limit
    const byteSize = new Blob([content]).size;
    if (byteSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File exceeds maximum allowed size of 10MB (Current: ${(byteSize / (1024 * 1024)).toFixed(2)}MB).`,
        },
        { status: 413 }
      );
    }

    const parseResult = parseSubtitleFile(content, filename);

    if (!parseResult.success || !parseResult.file) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error || "Failed to parse subtitle content",
          warnings: parseResult.warnings,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      file: parseResult.file,
      warnings: parseResult.warnings,
    });
  } catch (error: unknown) {
    console.error("Subtitle parse API error:", error);
    const message = error instanceof Error ? error.message : "Internal parse error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
