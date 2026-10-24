import { SUPPORTED_LANGUAGES } from "../translation/languages";

export interface TransliterationConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  itc: string;
  inputMode: string; // e.g., "Manglish"
  example: string; // e.g., "namaskaram ➔ നമസ്കാരം"
  description: string;
  isPhonetic: boolean;
}

export const TRANSLITERATION_MAP: Record<string, TransliterationConfig> = {
  ml: {
    code: "ml",
    name: "Malayalam",
    nativeName: "മലയാളം",
    flag: "🇮🇳",
    itc: "ml-t-i0-und",
    inputMode: "Manglish",
    example: "namaskaram ➔ നമസ്കാരം",
    description: "Type Malayalam phonetically in English (Manglish)",
    isPhonetic: true,
  },
  hi: {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    itc: "hi-t-i0-und",
    inputMode: "Hinglish",
    example: "namaste ➔ नमस्ते",
    description: "Type Hindi phonetically in English (Hinglish)",
    isPhonetic: true,
  },
  ta: {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    flag: "🇮🇳",
    itc: "ta-t-i0-und",
    inputMode: "Tanglish",
    example: "vanakkam ➔ வணக்கம்",
    description: "Type Tamil phonetically in English (Tanglish)",
    isPhonetic: true,
  },
  te: {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    flag: "🇮🇳",
    itc: "te-t-i0-und",
    inputMode: "Telugu Phonetic",
    example: "namaskaram ➔ నమస్కారం",
    description: "Type Telugu phonetically in English",
    isPhonetic: true,
  },
  bn: {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    flag: "🇧🇩",
    itc: "bn-t-i0-und",
    inputMode: "Banglish",
    example: "dhonnobad ➔ ধন্যবাদ",
    description: "Type Bengali phonetically in English",
    isPhonetic: true,
  },
  ar: {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
    itc: "ar-t-i0-und",
    inputMode: "Arabizi / Phonetic",
    example: "marhaban ➔ مرحبا",
    description: "Type Arabic phonetically in English",
    isPhonetic: true,
  },
  fa: {
    code: "fa",
    name: "Persian",
    nativeName: "فارسی",
    flag: "🇮🇷",
    itc: "fa-t-i0-und",
    inputMode: "Pinglish / Phonetic",
    example: "salam ➔ سلام",
    description: "Type Persian phonetically in English",
    isPhonetic: true,
  },
  ru: {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    flag: "🇷🇺",
    itc: "ru-t-i0-und",
    inputMode: "Russian Phonetic",
    example: "privet ➔ привет",
    description: "Type Russian phonetically in English",
    isPhonetic: true,
  },
  el: {
    code: "el",
    name: "Greek",
    nativeName: "Ελληνικά",
    flag: "🇬🇷",
    itc: "el-t-i0-und",
    inputMode: "Greeklish",
    example: "geia ➔ γεια",
    description: "Type Greek phonetically in English",
    isPhonetic: true,
  },
  he: {
    code: "he",
    name: "Hebrew",
    nativeName: "עברית",
    flag: "🇮🇱",
    itc: "he-t-i0-und",
    inputMode: "Hebrew Phonetic",
    example: "shalom ➔ שלום",
    description: "Type Hebrew phonetically in English",
    isPhonetic: true,
  },
  zh: {
    code: "zh",
    name: "Chinese (Simplified)",
    nativeName: "简体中文",
    flag: "🇨🇳",
    itc: "zh-t-i0-pinyin",
    inputMode: "Pinyin",
    example: "nihao ➔ 你好",
    description: "Type Chinese with Pinyin",
    isPhonetic: true,
  },
  "zh-TW": {
    code: "zh-TW",
    name: "Chinese (Traditional)",
    nativeName: "繁體中文",
    flag: "🇹🇼",
    itc: "zh-hant-t-i0-pinyin",
    inputMode: "Pinyin (Trad)",
    example: "nihao ➔ 你好",
    description: "Type Traditional Chinese with Pinyin",
    isPhonetic: true,
  },
  ja: {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    itc: "ja-t-i0-und",
    inputMode: "Romaji",
    example: "konnichiwa ➔ こんにちは",
    description: "Type Japanese using Romaji",
    isPhonetic: true,
  },
};

export function getTransliterationConfig(langCode?: string): TransliterationConfig {
  if (!langCode) {
    return {
      code: "en",
      name: "English",
      nativeName: "English",
      flag: "🇺🇸",
      itc: "",
      inputMode: "Direct",
      example: "",
      description: "Direct Latin character typing",
      isPhonetic: false,
    };
  }

  const normalized = langCode.toLowerCase();
  if (TRANSLITERATION_MAP[normalized]) {
    return TRANSLITERATION_MAP[normalized];
  }

  // Look up in general supported languages
  const found = SUPPORTED_LANGUAGES.find(
    (l) => l.code.toLowerCase() === normalized
  );

  return {
    code: langCode,
    name: found ? found.name : langCode.toUpperCase(),
    nativeName: found ? found.nativeName : langCode.toUpperCase(),
    flag: found ? found.flag : "🌐",
    itc: "",
    inputMode: "Direct",
    example: "",
    description: "Standard keyboard typing",
    isPhonetic: false,
  };
}
