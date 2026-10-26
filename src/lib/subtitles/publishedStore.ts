import fs from "fs";
import path from "path";
import { SubtitleCue } from "./types";
import { getDb } from "../db/mongodb";

export interface PublishedSubtitle {
  id: string;
  title: string;
  description: string;
  filename: string;
  format: "srt" | "vtt";
  sourceLang: string;
  targetLang: string;
  visibility: "public" | "unlisted" | "private";
  authorName: string;
  authorEmail?: string;
  cuesCount: number;
  translatedCuesCount: number;
  durationFormatted: string;
  durationSeconds: number;
  category: "Sci-Fi" | "Tech" | "Documentary" | "Anime" | "Cinema" | "Educational" | "General";
  cues: SubtitleCue[];
  createdAt: string; // ISO date
  downloadsCount: number;
  viewsCount: number;
  tags: string[];
}

const STORE_FILE_PATH = path.join(process.cwd(), ".published_subtitles.json");
const memoryPublished = new Map<string, PublishedSubtitle>();

// Curated seed subtitles for initial library
const SEED_SUBTITLES: PublishedSubtitle[] = [
  {
    id: "scifi-cosmos-ml",
    title: "Deep Cosmos — Sci-Fi Dialogue",
    description: "Atmospheric sci-fi dialogue between spaceship Commander and orbital AI AURA navigating gravitational distortion.",
    filename: "deep_cosmos_dialogue.srt",
    format: "srt",
    sourceLang: "en",
    targetLang: "ml",
    visibility: "public",
    authorName: "SubLingo Studio",
    authorEmail: "studio@sublingo.ai",
    cuesCount: 6,
    translatedCuesCount: 6,
    durationFormatted: "04m 26s",
    durationSeconds: 266,
    category: "Sci-Fi",
    tags: ["Sci-Fi", "Space", "Cinematic", "AI"],
    createdAt: "2026-10-24T18:30:00.000Z",
    downloadsCount: 142,
    viewsCount: 628,
    cues: [
      {
        id: 1,
        startTime: "00:00:01,200",
        endTime: "00:00:04,500",
        startSeconds: 1.2,
        endSeconds: 4.5,
        originalText: "Commander, telemetry indicates an unexpected gravitational distortion ahead.",
        translatedText: "കമാൻഡർ, ടെലിമെട്രി മുന്നിൽ അപ്രതീക്ഷിതമായ ഒരു ഗുരുത്വാകർഷണ വ്യതിയാനം കാണിക്കുന്നു.",
        status: "completed",
      },
      {
        id: 2,
        startTime: "00:00:05,100",
        endTime: "00:00:08,400",
        startSeconds: 5.1,
        endSeconds: 8.4,
        originalText: "Can you stabilize our warp envelope, AURA?",
        translatedText: "നമ്മുടെ വാർപ്പ് എൻവലപ്പ് സ്ഥിരപ്പെടുത്താൻ നിങ്ങൾക്ക് കഴിയുമോ, ഔറ?",
        status: "completed",
      },
      {
        id: 3,
        startTime: "00:00:09,000",
        endTime: "00:00:13,200",
        startSeconds: 9.0,
        endSeconds: 13.2,
        originalText: "Diverting secondary reactor coils now. Structural integrity is holding at 84 percent.",
        translatedText: "സെക്കൻഡറി റിയാക്ടർ കോയിലുകൾ ഇപ്പോൾ തിരിച്ചുവിടുന്നു. ഘടനാപരമായ സമഗ്രത 84 ശതമാനത്തിൽ തുടരുന്നു.",
        status: "completed",
      },
      {
        id: 4,
        startTime: "00:00:14,000",
        endTime: "00:00:17,800",
        startSeconds: 14.0,
        endSeconds: 17.8,
        originalText: "Keep us steady. We didn't travel twenty light-years to turn around at the threshold.",
        translatedText: "ഞങ്ങളെ സ്ഥിരമായി നിർത്തുക. പടിവാതിൽക്കൽ നിന്ന് തിരികെ പോകാൻ നമ്മൾ ഇരുപത് പ്രകാശവർഷങ്ങൾ താണ്ടിയിട്ടില്ല.",
        status: "completed",
      },
      {
        id: 5,
        startTime: "00:00:18,500",
        endTime: "00:00:22,300",
        startSeconds: 18.5,
        endSeconds: 22.3,
        originalText: "Sensors detect atmospheric conditions on the third moon. Water vapor and oxygen confirmed.",
        translatedText: "മൂന്നാമത്തെ ചന്ദ്രനിൽ അന്തരീക്ഷ സാഹചര്യങ്ങൾ സെൻസറുകൾ കണ്ടെത്തുന്നു. നീരാവിയും ഓക്സിജനും സ്ഥിരീകരിച്ചു.",
        status: "completed",
      },
      {
        id: 6,
        startTime: "00:00:23,000",
        endTime: "00:00:26,900",
        startSeconds: 23.0,
        endSeconds: 26.9,
        originalText: "Prepare the landing module. Humanity's second chapter begins today.",
        translatedText: "ലാൻഡിംഗ് മൊഡ്യൂൾ തയ്യാറാക്കുക. മനുഷ്യരാശിയുടെ രണ്ടാം അധ്യായം ഇന്ന് ആരംഭിക്കുന്നു.",
        status: "completed",
      },
    ],
  },
  {
    id: "tech-keynote-hi",
    title: "Quantum Computing — Tech Keynote",
    description: "Next-generation multimodal neural architecture launch presentation with latency benchmarks.",
    filename: "tech_keynote_presentation.vtt",
    format: "vtt",
    sourceLang: "en",
    targetLang: "hi",
    visibility: "public",
    authorName: "Nexus Labs",
    authorEmail: "dev@nexus.tech",
    cuesCount: 5,
    translatedCuesCount: 5,
    durationFormatted: "05m 12s",
    durationSeconds: 312,
    category: "Tech",
    tags: ["Tech", "Keynote", "AI", "Quantum"],
    createdAt: "2026-10-23T14:15:00.000Z",
    downloadsCount: 98,
    viewsCount: 412,
    cues: [
      {
        id: 1,
        startTime: "00:00:02.000",
        endTime: "00:00:05.500",
        startSeconds: 2.0,
        endSeconds: 5.5,
        originalText: "Welcome everyone to the Future of Computing summit.",
        translatedText: "कंप्यूटिंग के भविष्य के शिखर सम्मेलन में आप सभी का स्वागत है।",
        status: "completed",
      },
      {
        id: 2,
        startTime: "00:00:06.200",
        endTime: "00:00:10.800",
        startSeconds: 6.2,
        endSeconds: 10.8,
        originalText: "Today, we are thrilled to demonstrate our breakthrough neural architecture.",
        translatedText: "आज, हम अपनी अभूतपूर्व न्यूरल आर्किटेक्चर प्रदर्शित करने के लिए बेहद उत्साहित हैं।",
        status: "completed",
      },
      {
        id: 3,
        startTime: "00:00:11.500",
        endTime: "00:00:16.200",
        startSeconds: 11.5,
        endSeconds: 16.2,
        originalText: "By reducing inference latency by 90%, real-time multimodal intelligence is now possible.",
        translatedText: "अनुमान विलंबता में 90% की कमी करके, रीयल-टाइम मल्टीमॉडल इंटेलिजेंस अब संभव है।",
        status: "completed",
      },
      {
        id: 4,
        startTime: "00:00:17.000",
        endTime: "00:00:21.400",
        startSeconds: 17.0,
        endSeconds: 21.4,
        originalText: "Developers around the world can now build context-aware applications instantly.",
        translatedText: "दुनिया भर के डेवलपर्स अब तुरंत संदर्भ-जागरूक एप्लिकेशन बना सकते हैं।",
        status: "completed",
      },
      {
        id: 5,
        startTime: "00:00:22.100",
        endTime: "00:00:25.900",
        startSeconds: 22.1,
        endSeconds: 25.9,
        originalText: "Let's dive into the live developer demo right now.",
        translatedText: "आइए अब सीधे लाइव डेवलपर डेमो को देखते हैं।",
        status: "completed",
      },
    ],
  },
  {
    id: "pacific-abyss-es",
    title: "Wonders of the Pacific — Nature Doc",
    description: "Atmospheric nature documentary narration exploring deep ocean bioluminescence in the Mariana Trench.",
    filename: "wonders_pacific_abyss.srt",
    format: "srt",
    sourceLang: "en",
    targetLang: "es",
    visibility: "public",
    authorName: "Oceanic Media",
    authorEmail: "wildlife@oceanic.org",
    cuesCount: 4,
    translatedCuesCount: 4,
    durationFormatted: "03m 50s",
    durationSeconds: 230,
    category: "Documentary",
    tags: ["Nature", "Documentary", "Ocean", "Wildlife"],
    createdAt: "2026-10-22T10:00:00.000Z",
    downloadsCount: 84,
    viewsCount: 345,
    cues: [
      {
        id: 1,
        startTime: "00:00:00,800",
        endTime: "00:00:04,600",
        startSeconds: 0.8,
        endSeconds: 4.6,
        originalText: "Beneath the sunlit waves lies an abyss shrouded in perpetual twilight.",
        translatedText: "Bajo las olas iluminadas por el sol se encuentra un abismo envuelto en un crepúsculo perpetuo.",
        status: "completed",
      },
      {
        id: 2,
        startTime: "00:00:05,400",
        endTime: "00:00:09,800",
        startSeconds: 5.4,
        endSeconds: 9.8,
        originalText: "Here, creatures generate their own living light through cold bioluminescent chemistry.",
        translatedText: "Aquí, las criaturas generan su propia luz viva mediante química bioluminiscente fría.",
        status: "completed",
      },
      {
        id: 3,
        startTime: "00:00:10,500",
        endTime: "00:00:15,300",
        startSeconds: 10.5,
        endSeconds: 15.3,
        originalText: "A solitary comb jelly pulses with iridescent waves along its delicate cilia.",
        translatedText: "Un ctenóforo solitario pulsa con ondas iridiscentes a lo largo de sus delicados cilios.",
        status: "completed",
      },
      {
        id: 4,
        startTime: "00:00:16,100",
        endTime: "00:00:20,500",
        startSeconds: 16.1,
        endSeconds: 20.5,
        originalText: "In this alien expanse, survival is a dance of illumination and complete stealth.",
        translatedText: "En esta extensión alienígena, la supervivencia es una danza de iluminación y sigilo absoluto.",
        status: "completed",
      },
    ],
  },
  {
    id: "neo-tokyo-ja-en",
    title: "Neo Tokyo 2099 — Cyberpunk Teaser",
    description: "Cyberpunk anime dialogue between a rogue cyber-detective and an underground netrunner in Shinjuku.",
    filename: "neo_tokyo_teaser.srt",
    format: "srt",
    sourceLang: "ja",
    targetLang: "en",
    visibility: "public",
    authorName: "AniSub Collective",
    authorEmail: "subs@anisub.io",
    cuesCount: 5,
    translatedCuesCount: 5,
    durationFormatted: "02m 40s",
    durationSeconds: 160,
    category: "Anime",
    tags: ["Anime", "Cyberpunk", "Tokyo", "Action"],
    createdAt: "2026-10-21T09:20:00.000Z",
    downloadsCount: 215,
    viewsCount: 890,
    cues: [
      {
        id: 1,
        startTime: "00:00:01,000",
        endTime: "00:00:03,800",
        startSeconds: 1.0,
        endSeconds: 3.8,
        originalText: "雨が止むことはない、この街ではな。",
        translatedText: "The rain never stops in this city, does it?",
        status: "completed",
      },
      {
        id: 2,
        startTime: "00:00:04,500",
        endTime: "00:00:08,200",
        startSeconds: 4.5,
        endSeconds: 8.2,
        originalText: "メインフレームの暗号鍵を見つけた。だが、追っ手が迫っている。",
        translatedText: "I found the encryption key to the mainframe. But their operatives are closing in.",
        status: "completed",
      },
      {
        id: 3,
        startTime: "00:00:09,000",
        endTime: "00:00:12,600",
        startSeconds: 9.0,
        endSeconds: 12.6,
        originalText: "屋上へ急げ！エアカーが30秒で到着する。",
        translatedText: "Hurry to the rooftop! The aerocar arrives in thirty seconds.",
        status: "completed",
      },
      {
        id: 4,
        startTime: "00:00:13,200",
        endTime: "00:00:16,900",
        startSeconds: 13.2,
        endSeconds: 16.9,
        originalText: "このデータを失えば、明日の夜明けは来ないぞ。",
        translatedText: "If we lose this data, tomorrow's dawn will never come.",
        status: "completed",
      },
      {
        id: 5,
        startTime: "00:00:17,500",
        endTime: "00:00:21,000",
        startSeconds: 17.5,
        endSeconds: 21.0,
        originalText: "了解した。ジャックアウトする！",
        translatedText: "Understood. Jacking out now!",
        status: "completed",
      },
    ],
  },
  {
    id: "parisian-bistro-fr-en",
    title: "The Parisian Bistro Dialogue",
    description: "An intimate conversational scene set in Montmartre, localized with French colloquial nuance.",
    filename: "parisian_bistro_scene.vtt",
    format: "vtt",
    sourceLang: "fr",
    targetLang: "en",
    visibility: "public",
    authorName: "Cinéphile Subs",
    authorEmail: "cinema@cinephile.fr",
    cuesCount: 4,
    translatedCuesCount: 4,
    durationFormatted: "02m 15s",
    durationSeconds: 135,
    category: "Cinema",
    tags: ["French", "Cinema", "Drama", "Conversation"],
    createdAt: "2026-10-20T16:45:00.000Z",
    downloadsCount: 76,
    viewsCount: 290,
    cues: [
      {
        id: 1,
        startTime: "00:00:01.500",
        endTime: "00:00:05.000",
        startSeconds: 1.5,
        endSeconds: 5.0,
        originalText: "Tu te souviens de ce café sous la pluie d'automne ?",
        translatedText: "Do you remember this cafe in the autumn rain?",
        status: "completed",
      },
      {
        id: 2,
        startTime: "00:00:05.800",
        endTime: "00:00:09.500",
        startSeconds: 5.8,
        endSeconds: 9.5,
        originalText: "Comment pourrais-je oublier ? Nous y avons écrit notre premier scénario.",
        translatedText: "How could I forget? We wrote our first screenplay right here.",
        status: "completed",
      },
      {
        id: 3,
        startTime: "00:00:10.200",
        endTime: "00:00:14.000",
        startSeconds: 10.2,
        endSeconds: 14.0,
        originalText: "Le temps passe si vite quand on poursuit un rêve impossible.",
        translatedText: "Time moves so fast when you are chasing an impossible dream.",
        status: "completed",
      },
      {
        id: 4,
        startTime: "00:00:14.800",
        endTime: "00:00:18.500",
        startSeconds: 14.8,
        endSeconds: 18.5,
        originalText: "Mais ce rêve n'était pas si impossible après tout.",
        translatedText: "Yet that dream wasn't so impossible after all.",
        status: "completed",
      },
    ],
  },
  {
    id: "solar-dynamics-de",
    title: "Solar Flare Dynamics — Astrophysics Lecture",
    description: "Academic lecture on coronal mass ejections and magnetohydrodynamics localized to German.",
    filename: "solar_dynamics_lecture.srt",
    format: "srt",
    sourceLang: "en",
    targetLang: "de",
    visibility: "public",
    authorName: "AstroSci Foundation",
    authorEmail: "contact@astrosci.org",
    cuesCount: 4,
    translatedCuesCount: 4,
    durationFormatted: "03m 30s",
    durationSeconds: 210,
    category: "Educational",
    tags: ["Science", "Astrophysics", "Lecture", "Physics"],
    createdAt: "2026-10-19T11:00:00.000Z",
    downloadsCount: 63,
    viewsCount: 220,
    cues: [
      {
        id: 1,
        startTime: "00:00:01,000",
        endTime: "00:00:04,500",
        startSeconds: 1.0,
        endSeconds: 4.5,
        originalText: "Coronal mass ejections unleash billions of tons of magnetized plasma into space.",
        translatedText: "Koronale Massenauswürfe schleudern Milliarden Tonnen magnetisiertes Plasma ins All.",
        status: "completed",
      },
      {
        id: 2,
        startTime: "00:00:05,200",
        endTime: "00:00:09,000",
        startSeconds: 5.2,
        endSeconds: 9.0,
        originalText: "When interacting with Earth's magnetosphere, they trigger spectacular geomagnetic storms.",
        translatedText: "Bei der Wechselwirkung mit der Erdmagnetosphäre lösen sie spektakuläre geomagnetische Stürme aus.",
        status: "completed",
      },
      {
        id: 3,
        startTime: "00:00:09,800",
        endTime: "00:00:14,200",
        startSeconds: 9.8,
        endSeconds: 14.2,
        originalText: "Our heliophysics observatories monitor these energetic particle flux streams continuously.",
        translatedText: "Unsere heliophysikalischen Observatorien überwachen diese Ströme energetischer Partikel kontinuierlich.",
        status: "completed",
      },
      {
        id: 4,
        startTime: "00:00:15,000",
        endTime: "00:00:19,200",
        startSeconds: 15.0,
        endSeconds: 19.2,
        originalText: "Understanding reconnection geometry allows us to protect satellites in geosynchronous orbit.",
        translatedText: "Das Verständnis der Rekonnexionsgeometrie ermöglicht es uns, Satelliten im geostationären Orbit zu schützen.",
        status: "completed",
      },
    ],
  },
];

// Load from file or seed memory
function initStore() {
  // First load seed data into memory
  for (const item of SEED_SUBTITLES) {
    memoryPublished.set(item.id, item);
  }

  // Next overlay persistent file if present
  try {
    if (fs.existsSync(STORE_FILE_PATH)) {
      const raw = fs.readFileSync(STORE_FILE_PATH, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item && item.id) {
            memoryPublished.set(item.id, item);
          }
        }
      }
    }
  } catch (err) {
    console.warn("[PUBLISHED_STORE] Could not read disk store:", err);
  }
}

function persistStoreToFile() {
  try {
    const list = Array.from(memoryPublished.values());
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.warn("[PUBLISHED_STORE] Could not write disk store:", err);
  }
}

initStore();

/**
 * Fetch all published subtitles with optional search and filters
 */
export async function getPublishedSubtitles(filters?: {
  search?: string;
  targetLang?: string;
  sourceLang?: string;
  format?: string;
  category?: string;
  visibility?: string;
}): Promise<PublishedSubtitle[]> {
  // Attempt to read from MongoDB first
  try {
    const db = await getDb();
    if (db) {
      const query: Record<string, unknown> = {};
      if (filters?.visibility) {
        query.visibility = filters.visibility;
      } else {
        query.visibility = { $in: ["public", "unlisted"] };
      }

      if (filters?.targetLang && filters.targetLang !== "all") {
        query.targetLang = filters.targetLang;
      }
      if (filters?.format && filters.format !== "all") {
        query.format = filters.format;
      }
      if (filters?.category && filters.category !== "all") {
        query.category = filters.category;
      }

      const docs = await db
        .collection<PublishedSubtitle>("published_subtitles")
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

      if (docs.length > 0) {
        // Merge with memory map to keep up to date
        for (const doc of docs) {
          memoryPublished.set(doc.id, doc);
        }
      } else {
        // If MongoDB collection is empty, seed it with our initial set
        await db.collection("published_subtitles").insertMany(SEED_SUBTITLES as any).catch(() => {});
      }
    }
  } catch (err) {
    console.warn("[PUBLISHED_STORE] MongoDB fetch error, falling back to local store:", err);
  }

  // In-memory / file query filter
  let results = Array.from(memoryPublished.values());

  // Filter visibility (default to public & unlisted)
  if (filters?.visibility) {
    results = results.filter((item) => item.visibility === filters.visibility);
  } else {
    results = results.filter((item) => item.visibility === "public");
  }

  // Filter Target Language
  if (filters?.targetLang && filters.targetLang !== "all") {
    results = results.filter((item) => item.targetLang.toLowerCase() === filters.targetLang!.toLowerCase());
  }

  // Filter Format
  if (filters?.format && filters.format !== "all") {
    results = results.filter((item) => item.format.toLowerCase() === filters.format!.toLowerCase());
  }

  // Filter Category
  if (filters?.category && filters.category !== "all") {
    results = results.filter((item) => item.category.toLowerCase() === filters.category!.toLowerCase());
  }

  // Search keyword across title, description, tags, and cues
  if (filters?.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    results = results.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      const tagMatch = item.tags?.some((t) => t.toLowerCase().includes(q));
      const filenameMatch = item.filename?.toLowerCase().includes(q);
      return titleMatch || descMatch || tagMatch || filenameMatch;
    });
  }

  // Sort newest first
  return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Fetch a single published subtitle by ID
 */
export async function getPublishedSubtitleById(id: string): Promise<PublishedSubtitle | null> {
  // Check memory first
  if (memoryPublished.has(id)) {
    return memoryPublished.get(id)!;
  }

  // Check MongoDB
  try {
    const db = await getDb();
    if (db) {
      const doc = await db.collection<PublishedSubtitle>("published_subtitles").findOne({ id });
      if (doc) {
        memoryPublished.set(doc.id, doc);
        return doc;
      }
    }
  } catch (err) {
    console.warn("[PUBLISHED_STORE] MongoDB find error:", err);
  }

  return null;
}

/**
 * Save new published subtitle release
 */
export async function savePublishedSubtitle(
  payload: Omit<PublishedSubtitle, "id" | "createdAt" | "downloadsCount" | "viewsCount"> & {
    id?: string;
  }
): Promise<PublishedSubtitle> {
  const id = payload.id || `sub_${Math.random().toString(36).substring(2, 9)}`;
  const item: PublishedSubtitle = {
    ...payload,
    id,
    createdAt: new Date().toISOString(),
    downloadsCount: 0,
    viewsCount: 1,
    tags: payload.tags || [payload.category || "General", payload.targetLang],
  };

  memoryPublished.set(id, item);
  persistStoreToFile();

  // Also persist to MongoDB
  try {
    const db = await getDb();
    if (db) {
      await db.collection("published_subtitles").updateOne(
        { id },
        { $set: item },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn("[PUBLISHED_STORE] MongoDB save error:", err);
  }

  return item;
}

/**
 * Increment download metric
 */
export async function incrementSubtitleDownload(id: string): Promise<void> {
  const item = memoryPublished.get(id);
  if (item) {
    item.downloadsCount = (item.downloadsCount || 0) + 1;
    persistStoreToFile();
  }

  try {
    const db = await getDb();
    if (db) {
      await db.collection("published_subtitles").updateOne({ id }, { $inc: { downloadsCount: 1 } });
    }
  } catch {
    // Ignore error
  }
}

/**
 * Increment view metric
 */
export async function incrementSubtitleView(id: string): Promise<void> {
  const item = memoryPublished.get(id);
  if (item) {
    item.viewsCount = (item.viewsCount || 0) + 1;
    persistStoreToFile();
  }

  try {
    const db = await getDb();
    if (db) {
      await db.collection("published_subtitles").updateOne({ id }, { $inc: { viewsCount: 1 } });
    }
  } catch {
    // Ignore error
  }
}
