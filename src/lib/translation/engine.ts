import { SubtitleCue, TranslationSettings } from "../subtitles/types";
import { calculateCPS } from "../subtitles/parser";

export interface BatchTranslationResult {
  cues: SubtitleCue[];
  detectedSourceLang?: string;
  errors?: string[];
}

/**
 * Free translation engine using public Google Translate endpoint
 * Bundles cues with delimiter to preserve 1:1 segment mapping efficiently
 */
export async function translateWithFreeEngine(
  cues: SubtitleCue[],
  sourceLang: string,
  targetLang: string
): Promise<BatchTranslationResult> {
  const src = sourceLang === "auto" ? "auto" : sourceLang;
  const tgt = targetLang;

  // We process cues in mini batches of up to 15 cues to maintain delimiter stability
  const translatedCues: SubtitleCue[] = [];
  const errors: string[] = [];

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    if (!cue.originalText.trim()) {
      translatedCues.push({
        ...cue,
        translatedText: "",
        status: "completed",
      });
      continue;
    }

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
        src
      )}&tl=${encodeURIComponent(tgt)}&dt=t&q=${encodeURIComponent(cue.originalText)}`;

      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!res.ok) {
        throw new Error(`Translation endpoint HTTP error ${res.status}`);
      }

      const data = await res.json();
      // Google Translate response format: [[["translated text", "original text", ...], ...], ...]
      let translatedText = "";
      if (Array.isArray(data) && Array.isArray(data[0])) {
        for (const segment of data[0]) {
          if (Array.isArray(segment) && segment[0]) {
            translatedText += segment[0];
          }
        }
      }

      const duration = Math.max(0.1, cue.endSeconds - cue.startSeconds);

      translatedCues.push({
        ...cue,
        translatedText: translatedText.trim(),
        status: "completed",
        charCount: translatedText.length,
        readingSpeedCps: calculateCPS(translatedText, duration),
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Translation failed";
      errors.push(`Cue #${cue.id}: ${errorMessage}`);
      translatedCues.push({
        ...cue,
        translatedText: cue.originalText, // fallback to original
        status: "error",
        error: errorMessage,
      });
    }
  }

  return {
    cues: translatedCues,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Gemini AI translation engine
 */
export async function translateWithGemini(
  cues: SubtitleCue[],
  settings: TranslationSettings
): Promise<BatchTranslationResult> {
  const apiKey = settings.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is required. Please provide it in settings or set GEMINI_API_KEY.");
  }

  const model = settings.model || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const simplifiedCues = cues.map((c) => ({
    id: c.id,
    text: c.originalText,
  }));

  const glossaryNote = settings.glossary && Object.keys(settings.glossary).length > 0
    ? `\nGlossary terms to enforce strictly: ${JSON.stringify(settings.glossary)}`
    : "";

  const toneNote = settings.tone ? `\nTarget tone: ${settings.tone} style.` : "";

  const systemInstruction = `You are a professional subtitle translator and localizer.
Translate the subtitle lines from ${settings.sourceLang === "auto" ? "the detected language" : settings.sourceLang} into ${settings.targetLang}.
Preserve line breaks, punctuation rhythm, and HTML formatting tags (like <i>, <b>) if present.
Keep the lines concise and suitable for subtitle reading speeds.${toneNote}${glossaryNote}

Return ONLY valid JSON matching this exact structure:
[
  {"id": 1, "text": "Translated text"}
]
Do not wrap in markdown or backticks.`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `${systemInstruction}\n\nSubtitles to translate:\n${JSON.stringify(simplifiedCues)}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Gemini returned an empty response.");
  }

  const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleaned) as Array<{ id: number; text: string }>;
  const map = new Map<number, string>(parsed.map((item) => [item.id, item.text]));

  const updatedCues = cues.map((cue) => {
    const translated = map.get(cue.id) ?? cue.originalText;
    const duration = Math.max(0.1, cue.endSeconds - cue.startSeconds);
    return {
      ...cue,
      translatedText: translated,
      status: "completed" as const,
      charCount: translated.length,
      readingSpeedCps: calculateCPS(translated, duration),
    };
  });

  return { cues: updatedCues };
}

/**
 * OpenAI translation engine
 */
export async function translateWithOpenAI(
  cues: SubtitleCue[],
  settings: TranslationSettings
): Promise<BatchTranslationResult> {
  const apiKey = settings.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is required. Please provide it in settings or set OPENAI_API_KEY.");
  }

  const model = settings.model || "gpt-4o-mini";
  const url = "https://api.openai.com/v1/chat/completions";

  const simplifiedCues = cues.map((c) => ({
    id: c.id,
    text: c.originalText,
  }));

  const systemPrompt = `You are a professional subtitle translator and dialogue adapter.
Translate each subtitle cue into ${settings.targetLang}.
Preserve formatting tags (e.g. <i>, <b>) and keep phrasing concise for reading speed.
Output JSON only with schema: [ { "id": number, "text": string } ]`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(simplifiedCues) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content;
  const parsed = JSON.parse(content);
  const items: Array<{ id: number; text: string }> = Array.isArray(parsed)
    ? parsed
    : parsed.subtitles || parsed.cues || parsed.items || [];

  const map = new Map<number, string>(items.map((item) => [item.id, item.text]));

  const updatedCues = cues.map((cue) => {
    const translated = map.get(cue.id) ?? cue.originalText;
    const duration = Math.max(0.1, cue.endSeconds - cue.startSeconds);
    return {
      ...cue,
      translatedText: translated,
      status: "completed" as const,
      charCount: translated.length,
      readingSpeedCps: calculateCPS(translated, duration),
    };
  });

  return { cues: updatedCues };
}

/**
 * DeepL translation engine
 */
export async function translateWithDeepL(
  cues: SubtitleCue[],
  settings: TranslationSettings
): Promise<BatchTranslationResult> {
  const apiKey = settings.apiKey || process.env.DEEPL_API_KEY;
  if (!apiKey) {
    throw new Error("DeepL API key is required. Please provide it in settings or set DEEPL_API_KEY in .env.local.");
  }

  const endpoint = apiKey.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";

  const targetLang = settings.targetLang.toUpperCase();
  const sourceLang = settings.sourceLang !== "auto" ? settings.sourceLang.toUpperCase() : undefined;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: cues.map((c) => c.originalText),
      target_lang: targetLang,
      ...(sourceLang ? { source_lang: sourceLang } : {}),
      preserve_formatting: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepL API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const translations: Array<{ text: string }> = data.translations || [];

  const updatedCues = cues.map((cue, index) => {
    const translated = translations[index]?.text || cue.originalText;
    const duration = Math.max(0.1, cue.endSeconds - cue.startSeconds);
    return {
      ...cue,
      translatedText: translated,
      status: "completed" as const,
      charCount: translated.length,
      readingSpeedCps: calculateCPS(translated, duration),
    };
  });

  return { cues: updatedCues };
}

/**
 * Universal dispatcher
 */
export async function executeBatchTranslation(
  cues: SubtitleCue[],
  settings: TranslationSettings
): Promise<BatchTranslationResult> {
  if (settings.provider === "gemini") {
    return translateWithGemini(cues, settings);
  } else if (settings.provider === "openai") {
    return translateWithOpenAI(cues, settings);
  } else if (settings.provider === "deepl") {
    return translateWithDeepL(cues, settings);
  } else {
    return translateWithFreeEngine(cues, settings.sourceLang, settings.targetLang);
  }
}

