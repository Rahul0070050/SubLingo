import { NextRequest, NextResponse } from "next/server";
import { getTransliterationConfig } from "@/lib/transliteration/languages";

// Simple in-memory cache to make repeated word lookups instantaneous
const memoryCache = new Map<string, string[]>();
const MAX_CACHE_SIZE = 5000;

function getCacheKey(lang: string, word: string): string {
  return `${lang}:${word.toLowerCase().trim()}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get("text") || "";
    const lang = searchParams.get("lang") || "ml";
    const num = Math.min(10, Math.max(1, parseInt(searchParams.get("num") || "5", 10)));

    if (!text.trim()) {
      return NextResponse.json({
        success: true,
        word: "",
        lang,
        candidates: [],
      });
    }

    const cleanWord = text.trim();
    const config = getTransliterationConfig(lang);

    // If language is not phonetic (e.g. English, Spanish), return the word itself
    if (!config.isPhonetic || !config.itc) {
      return NextResponse.json({
        success: true,
        word: cleanWord,
        lang,
        mode: "Direct",
        candidates: [cleanWord],
      });
    }

    const cacheKey = getCacheKey(lang, cleanWord);
    if (memoryCache.has(cacheKey)) {
      const cached = memoryCache.get(cacheKey)!;
      return NextResponse.json({
        success: true,
        word: cleanWord,
        lang,
        mode: config.inputMode,
        candidates: cached.slice(0, num),
        cached: true,
      });
    }

    // Call Google Input Tools transliteration service
    const googleUrl = `https://inputtools.google.com/request?text=${encodeURIComponent(
      cleanWord
    )}&itc=${encodeURIComponent(config.itc)}&num=${num}&cp=0&cs=1&ie=utf-8&oe=utf-8&app=sublingo`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(googleUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (SubLingo Subtitle Studio)",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Google API returned status ${res.status}`);
    }

    const data = await res.json();
    let candidates: string[] = [];

    if (data && data[0] === "SUCCESS" && data[1] && data[1][0] && data[1][0][1]) {
      candidates = data[1][0][1];
    }

    // Ensure the original typed word is in the options so the user can keep English
    if (!candidates.includes(cleanWord)) {
      candidates.push(cleanWord);
    }

    // Update cache
    if (memoryCache.size >= MAX_CACHE_SIZE) {
      // Clear oldest entries (first 500)
      const keysToDelete = Array.from(memoryCache.keys()).slice(0, 500);
      for (const k of keysToDelete) {
        memoryCache.delete(k);
      }
    }
    memoryCache.set(cacheKey, candidates);

    return NextResponse.json({
      success: true,
      word: cleanWord,
      lang,
      mode: config.inputMode,
      candidates,
    });
  } catch (error) {
    console.error("Transliteration API error:", error);
    const text = new URL(request.url).searchParams.get("text") || "";
    // Graceful fallback: return the original word
    return NextResponse.json({
      success: false,
      word: text,
      candidates: [text],
      error: error instanceof Error ? error.message : "Transliteration failed",
    });
  }
}
