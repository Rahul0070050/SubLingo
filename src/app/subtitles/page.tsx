"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PublishedSubtitle } from "@/lib/subtitles/publishedStore";
import { saveActiveSubtitle } from "@/lib/subtitles/storage";
import { serializeSubtitles } from "@/lib/subtitles/serializer";
import { getLanguageName } from "@/lib/translation/languages";
import { getTransliterationConfig } from "@/lib/transliteration/languages";
import {
  Film,
  Search,
  Filter,
  Download,
  Share2,
  Check,
  Copy,
  ExternalLink,
  Layers,
  Languages,
  Clock,
  Hash,
  Eye,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  Globe,
  FileText,
  Play,
  RotateCcw,
  UploadCloud,
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Sci-Fi",
  "Tech",
  "Documentary",
  "Anime",
  "Cinema",
  "Educational",
];

const TARGET_LANGUAGES = [
  { code: "all", label: "All Languages", flag: "🌐" },
  { code: "ml", label: "Malayalam (മലയാളം)", flag: "🇮🇳" },
  { code: "hi", label: "Hindi (हिन्दी)", flag: "🇮🇳" },
  { code: "es", label: "Spanish (Español)", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "fr", label: "French (Français)", flag: "🇫🇷" },
  { code: "de", label: "German (Deutsch)", flag: "🇩🇪" },
  { code: "ja", label: "Japanese (日本語)", flag: "🇯🇵" },
];

export default function PublishedSubtitlesPage() {
  const router = useRouter();

  const [subtitles, setSubtitles] = React.useState<PublishedSubtitle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedLang, setSelectedLang] = React.useState("all");
  const [selectedFormat, setSelectedFormat] = React.useState<"all" | "srt" | "vtt">("all");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [sortBy, setSortBy] = React.useState<"newest" | "downloads" | "cues" | "duration">("newest");

  // Preview Modal
  const [previewSubtitle, setPreviewSubtitle] = React.useState<PublishedSubtitle | null>(null);
  const [previewSearch, setPreviewSearch] = React.useState("");
  const [downloadMode, setDownloadMode] = React.useState<"translated" | "original" | "bilingual-stacked">("translated");

  // Feedback states
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  // Fetch published subtitles
  const fetchSubtitles = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (selectedLang !== "all") params.set("targetLang", selectedLang);
      if (selectedFormat !== "all") params.set("format", selectedFormat);
      if (selectedCategory !== "All") params.set("category", selectedCategory);

      const res = await fetch(`/api/subtitles/published?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load published subtitles");
      }
      setSubtitles(data.subtitles || []);
    } catch (err: unknown) {
      console.error("Error fetching subtitles:", err);
      setError(err instanceof Error ? err.message : "Error loading published subtitles");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedLang, selectedFormat, selectedCategory]);

  React.useEffect(() => {
    fetchSubtitles();
  }, [fetchSubtitles]);

  // Sort filtered subtitles client-side for instant responsive responsiveness
  const sortedSubtitles = React.useMemo(() => {
    const list = [...subtitles];
    if (sortBy === "downloads") {
      return list.sort((a, b) => (b.downloadsCount || 0) - (a.downloadsCount || 0));
    }
    if (sortBy === "cues") {
      return list.sort((a, b) => b.cuesCount - a.cuesCount);
    }
    if (sortBy === "duration") {
      return list.sort((a, b) => b.durationSeconds - a.durationSeconds);
    }
    // Default newest
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [subtitles, sortBy]);

  // Copy share link
  const handleCopyLink = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "https://sublingo.studio";
      await navigator.clipboard.writeText(`${origin}/subtitles/${id}`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  // Open directly in Editor
  const handleOpenInEditor = (sub: PublishedSubtitle, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    saveActiveSubtitle({
      filename: sub.filename,
      format: sub.format,
      sizeBytes: sub.cues.length * 128,
      cues: sub.cues,
      detectedLanguage: sub.sourceLang,
    });
    router.push("/editor");
  };

  // Open in Translate Studio
  const handleOpenInStudio = (sub: PublishedSubtitle, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    saveActiveSubtitle({
      filename: sub.filename,
      format: sub.format,
      sizeBytes: sub.cues.length * 128,
      cues: sub.cues,
      detectedLanguage: sub.sourceLang,
    });
    router.push("/translate");
  };

  // Instant Client File Download
  const handleDownloadSubtitle = (
    sub: PublishedSubtitle,
    mode: "translated" | "original" | "bilingual-stacked" = "translated",
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    setDownloadingId(sub.id);
    try {
      const { content, mimeType, extension } = serializeSubtitles(sub.cues, {
        format: sub.format,
        mode,
        normalizeLineBreaks: true,
      });

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const baseName = sub.title.replace(/[^a-zA-Z0-9_-]/g, "_");
      link.href = url;
      link.download = `${baseName}_${sub.targetLang}_${mode}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Notify backend to increment counter
      fetch(`/api/subtitles/published/${sub.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, format: sub.format }),
      }).catch(() => {});
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setTimeout(() => setDownloadingId(null), 600);
    }
  };

  // Filter cues inside preview modal
  const filteredPreviewCues = React.useMemo(() => {
    if (!previewSubtitle) return [];
    if (!previewSearch.trim()) return previewSubtitle.cues;
    const q = previewSearch.toLowerCase().trim();
    return previewSubtitle.cues.filter(
      (c) =>
        c.originalText.toLowerCase().includes(q) ||
        (c.translatedText && c.translatedText.toLowerCase().includes(q)) ||
        c.startTime.includes(q)
    );
  }, [previewSubtitle, previewSearch]);

  const targetLangConfig = previewSubtitle ? getTransliterationConfig(previewSubtitle.targetLang) : null;

  return (
    <div className="min-h-screen bg-[#0c0f13] text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-200">
      <Header />

      <main className="flex-1 pb-20">
        {/* HERO BANNER SECTION */}
        <section className="relative overflow-hidden border-b border-white/[0.08] bg-gradient-to-b from-[#141923] via-[#0e1218] to-[#0c0f13] pt-12 pb-14 px-4 sm:px-6">
          {/* Ambient Glows */}
          <div className="absolute top-0 left-1/3 w-[500px] h-[250px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-10 right-1/4 w-[350px] h-[200px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
                  <Film className="h-3.5 w-3.5" />
                  <span>SubLingo Subtitle Releases</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  Published Subtitle Library
                </h1>
                <p className="text-sm sm:text-base text-slate-300 max-w-2xl mt-2 leading-relaxed">
                  Browse, preview, and download community & studio-verified frame-accurate subtitles.
                  Preserve millisecond timestamps across 50+ languages.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link href="/translate">
                  <Button className="gap-2 h-10 px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25">
                    <UploadCloud className="h-4 w-4" />
                    <span>Publish Your Subtitles</span>
                  </Button>
                </Link>
                <Link href="/editor">
                  <Button
                    variant="outline"
                    className="gap-2 h-10 px-4 text-xs font-medium border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.04]"
                  >
                    <Layers className="h-4 w-4 text-slate-400" />
                    <span>Open Editor</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/[0.08]">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <Film className="h-3.5 w-3.5 text-blue-400" />
                  <span>Releases</span>
                </div>
                <div className="text-xl font-bold text-white mt-1">
                  {subtitles.length} Available
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <Globe className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Target Languages</span>
                </div>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  50+ Global
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />
                  <span>Sync Accuracy</span>
                </div>
                <div className="text-xl font-bold text-white mt-1">
                  Frame-Accurate
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <Download className="h-3.5 w-3.5 text-amber-400" />
                  <span>Supported Formats</span>
                </div>
                <div className="text-xl font-bold text-amber-400 mt-1">
                  SRT & WebVTT
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTROLS & FILTER SECTION */}
        <section className="container mx-auto max-w-6xl px-4 sm:px-6 pt-8">
          <div className="space-y-4">
            {/* Search and Format/Sort bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search subtitles by movie, topic, dialog snippet, or tags..."
                  className="pl-10 h-10 bg-[#141923] border-white/10 text-xs text-white placeholder:text-slate-500 rounded-xl"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Format Filter */}
              <div className="flex items-center gap-1 bg-[#141923] p-1 rounded-xl border border-white/10 shrink-0">
                {(["all", "srt", "vtt"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setSelectedFormat(fmt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase transition-colors ${
                      selectedFormat === fmt
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400 hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#141923] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer h-10"
                >
                  <option value="newest">Newest First</option>
                  <option value="downloads">Most Downloaded</option>
                  <option value="cues">Most Cues</option>
                  <option value="duration">Longest Duration</option>
                </select>
              </div>
            </div>

            {/* Target Language Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {TARGET_LANGUAGES.map((lang) => {
                const isActive = selectedLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setSelectedLang(lang.code)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                      isActive
                        ? "bg-blue-500/15 border-blue-500/40 text-blue-300 font-semibold"
                        : "bg-[#141923]/80 border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/10"
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
                Categories:
              </span>
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      isActive
                        ? "bg-white/[0.12] text-white font-semibold"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Summary Counter */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-4 pb-2">
            <div>
              Showing <span className="font-semibold text-white">{sortedSubtitles.length}</span>{" "}
              {sortedSubtitles.length === 1 ? "subtitle" : "subtitles"}
              {selectedLang !== "all" && ` localized in ${getLanguageName(selectedLang)}`}
            </div>

            {(searchQuery || selectedLang !== "all" || selectedFormat !== "all" || selectedCategory !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedLang("all");
                  setSelectedFormat("all");
                  setSelectedCategory("All");
                }}
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </section>

        {/* SUBTITLE CARDS GRID */}
        <section className="container mx-auto max-w-6xl px-4 sm:px-6 pt-2">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/[0.06] bg-[#141923]/60 p-5 space-y-4 animate-pulse"
                >
                  <div className="h-4 bg-white/[0.05] rounded w-3/4" />
                  <div className="h-3 bg-white/[0.03] rounded w-full" />
                  <div className="h-16 bg-white/[0.02] rounded-xl" />
                  <div className="flex justify-between pt-2">
                    <div className="h-8 bg-white/[0.05] rounded w-24" />
                    <div className="h-8 bg-white/[0.05] rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center rounded-2xl border border-red-500/20 bg-red-500/5 max-w-md mx-auto my-12">
              <p className="text-sm text-red-400 mb-3">{error}</p>
              <Button size="sm" onClick={() => fetchSubtitles()} className="text-xs">
                Retry Fetching
              </Button>
            </div>
          ) : sortedSubtitles.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-white/[0.08] bg-[#141923]/40 max-w-xl mx-auto my-12 space-y-4">
              <div className="h-14 w-14 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                <Film className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">No Subtitles Found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  No published subtitles match the selected filter criteria. Try adjusting your
                  search or filter tags.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedLang("all");
                    setSelectedFormat("all");
                    setSelectedCategory("All");
                  }}
                  className="text-xs"
                >
                  Clear All Filters
                </Button>
                <Link href="/translate">
                  <Button size="sm" className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-500">
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>Publish First Release</span>
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
              {sortedSubtitles.map((sub) => {
                const targetConfig = getTransliterationConfig(sub.targetLang);
                const sampleCue = sub.cues[0];

                return (
                  <Card
                    key={sub.id}
                    className="flex flex-col justify-between rounded-2xl border-white/[0.08] bg-[#141923] hover:border-blue-500/40 hover:bg-[#161c28] transition-all duration-200 overflow-hidden group shadow-lg shadow-black/20"
                  >
                    <CardContent className="p-5 space-y-4 flex-1">
                      {/* Top Badges & Category */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-bold tracking-wider text-blue-400 border-blue-500/30 bg-blue-500/5 px-2 py-0.5"
                          >
                            {sub.format}
                          </Badge>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 font-medium border border-white/[0.04]">
                            {sub.category}
                          </span>
                        </div>

                        {/* Views & Downloads Counters */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                          <span className="flex items-center gap-1" title="Downloads">
                            <Download className="h-3 w-3 text-slate-500" />
                            <span>{sub.downloadsCount || 0}</span>
                          </span>
                          <span className="flex items-center gap-1" title="Views">
                            <Eye className="h-3 w-3 text-slate-500" />
                            <span>{sub.viewsCount || 0}</span>
                          </span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                          {sub.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {sub.description || `Subtitles translated to ${targetConfig.name}.`}
                        </p>
                      </div>

                      {/* Language Pair Banner */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0c0f13] border border-white/[0.06] text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wide">
                            {getLanguageName(sub.sourceLang)}
                          </span>
                          <span className="text-blue-400 font-bold text-xs">➔</span>
                          <span className="font-semibold text-blue-200 flex items-center gap-1">
                            <span>{targetConfig.flag}</span>
                            <span className="truncate">{targetConfig.name}</span>
                          </span>
                        </div>

                        <Badge variant="success" className="text-[10px] shrink-0 font-mono">
                          {sub.cuesCount} Cues
                        </Badge>
                      </div>

                      {/* Sample Cue Snippet */}
                      {sampleCue && (
                        <div className="p-3 rounded-xl bg-[#0c0f13]/60 border border-white/[0.04] text-xs space-y-1.5 font-sans">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>Cue #1 Preview</span>
                            <span>{sampleCue.startTime}</span>
                          </div>
                          <p className="text-slate-300 text-[11px] italic line-clamp-1">
                            "{sampleCue.originalText}"
                          </p>
                          {sampleCue.translatedText && (
                            <p className="text-blue-300 text-xs font-medium line-clamp-1">
                              {sampleCue.translatedText}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Metrics bar */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span>Duration:</span>
                          <span className="text-slate-200 font-medium font-mono">
                            {sub.durationFormatted}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">100% Synced</span>
                        </div>
                      </div>
                    </CardContent>

                    {/* Bottom Action Footer */}
                    <div className="p-3 bg-[#11151e] border-t border-white/[0.06] flex items-center justify-between gap-1.5">
                      {/* Quick Preview Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewSubtitle(sub)}
                        className="text-xs h-8 px-2.5 text-slate-300 hover:text-white hover:bg-white/[0.06] gap-1.5"
                      >
                        <Play className="h-3 w-3 text-blue-400 fill-current" />
                        <span>Preview</span>
                      </Button>

                      <div className="flex items-center gap-1.5">
                        {/* Copy Link */}
                        <button
                          type="button"
                          onClick={(e) => handleCopyLink(sub.id, e)}
                          className="p-1.5 rounded-lg border border-white/[0.08] bg-[#161a22] text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Copy Share Link"
                        >
                          {copiedId === sub.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Share2 className="h-3.5 w-3.5" />
                          )}
                        </button>

                        {/* Open in Editor */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleOpenInEditor(sub, e)}
                          className="text-xs h-8 px-2.5 gap-1 border-white/10 text-slate-300 hover:text-white"
                          title="Open in Subtitle Editor Workspace"
                        >
                          <Layers className="h-3 w-3 text-blue-400" />
                          <span>Edit</span>
                        </Button>

                        {/* Download translated file */}
                        <Button
                          size="sm"
                          onClick={(e) => handleDownloadSubtitle(sub, "translated", e)}
                          disabled={downloadingId === sub.id}
                          className="text-xs h-8 px-2.5 gap-1.5 bg-blue-600 hover:bg-blue-500 font-medium shadow-sm"
                          title="Download Localized Subtitle File"
                        >
                          <Download className="h-3 w-3" />
                          <span>Download</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* QUICK PREVIEW & DOWNLOAD MODAL */}
      {previewSubtitle && (
        <Modal
          isOpen={Boolean(previewSubtitle)}
          onClose={() => setPreviewSubtitle(null)}
          title={previewSubtitle.title}
          description={`Localized to ${targetLangConfig?.name || previewSubtitle.targetLang} • ${previewSubtitle.cuesCount} synchronized cues`}
          className="max-w-3xl"
        >
          <div className="space-y-4 max-h-[75vh] flex flex-col">
            {/* Metadata Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[#12151b] border border-white/[0.08] text-center shrink-0">
              <div>
                <div className="text-[10px] text-slate-500">Language Pair</div>
                <div className="text-xs font-semibold text-white mt-0.5 truncate">
                  {getLanguageName(previewSubtitle.sourceLang)} ➔ {targetLangConfig?.name}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Duration</div>
                <div className="text-xs font-semibold text-white mt-0.5 font-mono">
                  {previewSubtitle.durationFormatted}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Total Cues</div>
                <div className="text-xs font-semibold text-white mt-0.5">
                  {previewSubtitle.cuesCount}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Format</div>
                <div className="text-xs font-semibold text-blue-400 uppercase mt-0.5">
                  {previewSubtitle.format}
                </div>
              </div>
            </div>

            {/* Filter Search inside Modal */}
            <div className="flex items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={previewSearch}
                  onChange={(e) => setPreviewSearch(e.target.value)}
                  placeholder="Filter dialogue cues..."
                  className="pl-9 h-8 bg-[#12151b] border-white/10 text-xs text-white"
                />
              </div>

              {/* Mode selector for download */}
              <div className="flex items-center gap-1 bg-[#12151b] p-0.5 rounded-lg border border-white/10 text-xs shrink-0">
                <span className="text-[10px] text-slate-400 px-2 font-medium">Export:</span>
                {(["translated", "bilingual-stacked", "original"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDownloadMode(mode)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                      downloadMode === mode
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {mode === "translated"
                      ? "Localized"
                      : mode === "bilingual-stacked"
                      ? "Bilingual"
                      : "Original"}
                  </button>
                ))}
              </div>
            </div>

            {/* Synchronized Cues List */}
            <div className="overflow-y-auto max-h-[380px] space-y-2 pr-1 rounded-xl border border-white/[0.06] p-2 bg-[#0c0f13]/80 divide-y divide-white/[0.04]">
              {filteredPreviewCues.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No cues match your filter query.
                </div>
              ) : (
                filteredPreviewCues.map((cue) => (
                  <div key={cue.id} className="pt-2 first:pt-0 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span className="text-blue-400 font-semibold">#{cue.id}</span>
                      <span>
                        {cue.startTime} ➔ {cue.endTime}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.03] text-slate-300">
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 block mb-0.5 font-semibold">
                          Original ({previewSubtitle.sourceLang.toUpperCase()})
                        </span>
                        {cue.originalText}
                      </div>

                      <div className="p-2 rounded-lg bg-blue-500/[0.04] border border-blue-500/10 text-blue-100">
                        <span className="text-[9px] uppercase tracking-wider text-blue-400 block mb-0.5 font-semibold">
                          {targetLangConfig?.name || previewSubtitle.targetLang.toUpperCase()}
                        </span>
                        {cue.translatedText || (
                          <span className="text-slate-500 italic">No translation</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer with Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(previewSubtitle.id)}
                  className="h-8 text-xs gap-1.5 border-white/10 text-slate-300 hover:text-white"
                >
                  {copiedId === previewSubtitle.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Share Link</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenInEditor(previewSubtitle)}
                  className="h-8 text-xs gap-1.5 border-white/10 text-slate-300 hover:text-white"
                >
                  <Layers className="h-3.5 w-3.5 text-blue-400" />
                  <span>Open in Editor</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewSubtitle(null)}
                  className="h-8 text-xs text-slate-400 hover:text-white"
                >
                  Close
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleDownloadSubtitle(previewSubtitle, downloadMode)}
                  className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-500"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download ({downloadMode === "translated" ? "Localized" : downloadMode === "bilingual-stacked" ? "Bilingual" : "Original"})</span>
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
