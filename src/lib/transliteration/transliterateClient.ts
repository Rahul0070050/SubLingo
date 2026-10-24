// Client-side cache for instantaneous typing response
const clientCache = new Map<string, string[]>();

// Common offline fallback dictionary for Malayalam (Manglish)
const MANGLISH_OFFLINE_DICTIONARY: Record<string, string[]> = {
  njan: ["ഞാൻ", "ഞാന്"],
  nammal: ["നമ്മൾ", "നമ്മള്"],
  nammude: ["നമ്മുടെ", "നമ്മുടേ"],
  namaskaram: ["നമസ്കാരം", "നമസ്‌കാരം"],
  sugham: ["സുഖം", "സുഖ"],
  sughamano: ["സുഖമാണോ", "സുഖമാണൊ"],
  entha: ["എന്താ", "എന്ത്"],
  enthanu: ["എന്താണ്", "എന്താണു"],
  evide: ["എവിടെ", "എവിടെയാ"],
  engane: ["എങ്ങനെ", "എങ്ങനെയുണ്ട്"],
  eppo: ["എപ്പോൾ", "എപ്പൊ"],
  kerala: ["കേരളം", "കേരള"],
  malayalam: ["മലയാളം", "മലയാള"],
  veedu: ["വീട്", "വീടു"],
  aanu: ["ആണ്", "ആണു"],
  alla: ["അല്ല", "അല്ലാ"],
  undu: ["ഉണ്ട്", "ഉണ്ടു"],
  illa: ["ഇല്ല", "ഇല്ലാ"],
  ithu: ["ഇത്", "ഇതു"],
  athu: ["അത്", "അതു"],
  ningal: ["നിങ്ങൾ", "നിങ്ങളോട്"],
  avan: ["അവൻ", "അവന്"],
  aval: ["അവൾ", "അവള്"],
  avaru: ["അവർ", "അവരു"],
  sheri: ["ശരി", "ശരിയാ"],
  nandi: ["നന്ദി", "നന്ദീ"],
  pinne: ["പിന്നെ", "പിന്നേ"],
  valare: ["വളരെ", "വളരേ"],
  nalla: ["നല്ല", "നല്ലത്"],
  koode: ["കൂടെ", "കൂടേ"],
  vannu: ["വന്നു", "വന്നൂ"],
  poyi: ["പോയി", "പോയീ"],
  cheyyu: ["ചെയ്യു", "ചെയ്യുക"],
  parayu: ["പറയു", "പറയുക"],
  nokku: ["നോക്കൂ", "നോക്കു"],
  varu: ["വരൂ", "വരു"],
};

export async function fetchTransliterationCandidates(
  word: string,
  lang: string
): Promise<string[]> {
  const clean = word.trim();
  if (!clean) return [];

  const cacheKey = `${lang}:${clean.toLowerCase()}`;
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!;
  }

  try {
    const res = await fetch(
      `/api/transliterate?text=${encodeURIComponent(clean)}&lang=${encodeURIComponent(
        lang
      )}&num=5`
    );
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const data = await res.json();
    if (data.success && Array.isArray(data.candidates) && data.candidates.length > 0) {
      clientCache.set(cacheKey, data.candidates);
      return data.candidates;
    }
  } catch (err) {
    console.warn("Client transliteration fetch failed, using fallback:", err);
  }

  // Fallback to offline dictionary if Malayalam
  if (lang === "ml") {
    const lower = clean.toLowerCase();
    if (MANGLISH_OFFLINE_DICTIONARY[lower]) {
      const candidates = [...MANGLISH_OFFLINE_DICTIONARY[lower], clean];
      clientCache.set(cacheKey, candidates);
      return candidates;
    }
  }

  // Ultimate fallback: keep original word
  return [clean];
}
