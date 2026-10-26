"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { PublishedSubtitle } from "@/lib/subtitles/publishedStore";
import { saveActiveSubtitle } from "@/lib/subtitles/storage";
import { serializeSubtitles } from "@/lib/subtitles/serializer";
import { getLanguageName } from "@/lib/translation/languages";
import { getTransliterationConfig } from "@/lib/transliteration/languages";
import {
  Film,
  Download,
  Share2,
  Check,
  Layers,
  Languages,
  Clock,
  Eye,
  CheckCircle2,
  ChevronLeft,
  ArrowRight,
  Search,
  Globe,
  UploadCloud,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export default function SubtitleReleasePage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [subtitle, setSubtitle] = React.useState<PublishedSubtitle | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [downloadMode, setDownloadMode] = React.useState<"translated" | "bilingual-stacked" | "original">("translated");
  const [copied, setCopied] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/subtitles/published/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Subtitle release not found");
        }
        setSubtitle(data.subtitle);
      })
      .catch((err) => {
        console.error("Failed to load subtitle:", err);
        setError(err.message || "Could not load subtitle release");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleOpenInEditor = () => {
    if (!subtitle) return;
    saveActiveSubtitle({
      filename: subtitle.filename,
      format: subtitle.format,
      sizeBytes: subtitle.cues.length * 128,
      cues: subtitle.cues,
      detectedLanguage: subtitle.sourceLang,
    });
    router.push("/editor");
  };

  const handleDownload = () => {
    if (!subtitle) return;
    setDownloading(true);
    try {
      const { content, mimeType, extension } = serializeSubtitles(subtitle.cues, {
        format: subtitle.format,
        mode: downloadMode,
        normalizeLineBreaks: true,
      });

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const baseName = subtitle.title.replace(/[^a-zA-Z0-9_-]/g, "_");
      link.href = url;
      link.download = `${baseName}_${subtitle.targetLang}_${downloadMode}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setTimeout(() => setDownloading(false), 600);
    }
  };

  const filteredCues = React.useMemo(() => {
    if (!subtitle) return [];
    if (!searchQuery.trim()) return subtitle.cues;
    const q = searchQuery.toLowerCase().trim();
    return subtitle.cues.filter(
      (c) =>
        c.originalText.toLowerCase().includes(q) ||
        (c.translatedText && c.translatedText.toLowerCase().includes(q)) ||
        c.startTime.includes(q)
    );
  }, [subtitle, searchQuery]);

  const targetConfig = subtitle ? getTransliterationConfig(subtitle.targetLang) : null;

  return (
    <div className="min-h-screen bg-[#0c0f13] text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-200">
      <Header />

      <main className="flex-1 pb-20">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 pt-8">
          {/* Back to Listing Link */}
          <Link
            href="/subtitles"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-6 group"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to All Subtitles</span>
          </Link>

          {loading ? (
            <div className="p-12 text-center space-y-4">
              <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading subtitle release...</p>
            </div>
          ) : error || !subtitle ? (
            <div className="p-12 text-center rounded-3xl border border-white/[0.08] bg-[#141923] max-w-lg mx-auto space-y-4">
              <h3 className="text-base font-semibold text-white">Subtitle Release Not Found</h3>
              <p className="text-xs text-slate-400">{error || "The requested subtitle release does not exist or has been unlisted."}</p>
              <Link href="/subtitles">
                <Button size="sm" className="text-xs mt-2">
                  Browse Available Subtitles
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* RELEASE HEADER CARD */}
              <div className="p-6 sm:p-8 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#141923] to-[#0e1218] relative overflow-hidden shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-bold text-blue-400 border-blue-500/30 bg-blue-500/5 px-2.5 py-0.5"
                      >
                        {subtitle.format}
                      </Badge>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/[0.05] text-slate-300 font-medium">
                        {subtitle.category}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Published by <span className="text-slate-200 font-medium">{subtitle.authorName}</span>
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {subtitle.title}
                    </h1>

                    <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                      {subtitle.description}
                    </p>

                    {/* Language Pair Banner */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0c0f13] border border-white/[0.08] text-xs">
                      <span className="text-slate-400 font-medium">
                        {getLanguageName(subtitle.sourceLang)}
                      </span>
                      <span className="text-blue-400 font-bold">➔</span>
                      <span className="font-semibold text-blue-300 flex items-center gap-1.5">
                        <span>{targetConfig?.flag}</span>
                        <span>{targetConfig?.name || subtitle.targetLang}</span>
                      </span>
                      <span className="text-slate-500 ml-1">•</span>
                      <span className="text-emerald-400 font-mono text-[11px]">
                        {subtitle.cuesCount} Synchronized Cues
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap md:flex-col items-stretch gap-2.5 shrink-0">
                    <Button
                      size="sm"
                      onClick={handleDownload}
                      disabled={downloading}
                      className="gap-2 h-9 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download {subtitle.format.toUpperCase()}</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenInEditor}
                      className="gap-2 h-9 px-4 text-xs border-white/10 text-slate-200 hover:text-white"
                    >
                      <Layers className="h-4 w-4 text-blue-400" />
                      <span>Open in Editor</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyLink}
                      className="gap-2 h-9 px-4 text-xs text-slate-300 hover:text-white hover:bg-white/[0.06]"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" />
                          <span>Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="h-4 w-4" />
                          <span>Share Release</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/[0.08] text-center">
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                      Total Duration
                    </div>
                    <div className="text-sm font-semibold text-white mt-0.5 font-mono">
                      {subtitle.durationFormatted}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                      Translated Cues
                    </div>
                    <div className="text-sm font-semibold text-emerald-400 mt-0.5">
                      {subtitle.translatedCuesCount} / {subtitle.cuesCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                      Downloads
                    </div>
                    <div className="text-sm font-semibold text-white mt-0.5 font-mono">
                      {subtitle.downloadsCount || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                      Views
                    </div>
                    <div className="text-sm font-semibold text-white mt-0.5 font-mono">
                      {subtitle.viewsCount || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* CUES EXPLORER SECTION */}
              <div className="p-6 rounded-3xl border border-white/[0.08] bg-[#141923] space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Film className="h-4 w-4 text-blue-400" />
                      <span>Synchronized Dialogue Cues</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Inspect timestamps and localized lines frame-by-frame
                    </p>
                  </div>

                  {/* Search cues & export selector */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search dialogue text..."
                        className="pl-8 h-8 bg-[#0c0f13] border-white/10 text-xs w-52 text-white"
                      />
                    </div>

                    <div className="flex items-center gap-1 bg-[#0c0f13] p-0.5 rounded-lg border border-white/10 text-xs shrink-0">
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
                </div>

                {/* Cues List */}
                <div className="space-y-2.5 pt-2">
                  {filteredCues.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-500">
                      No cues match "{searchQuery}"
                    </div>
                  ) : (
                    filteredCues.map((cue) => (
                      <div
                        key={cue.id}
                        className="p-3.5 rounded-2xl bg-[#0c0f13]/80 border border-white/[0.04] space-y-2 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span className="text-blue-400 font-bold">#{cue.id}</span>
                          <span className="bg-white/[0.04] px-2 py-0.5 rounded text-[10px]">
                            {cue.startTime} ➔ {cue.endTime}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.03] text-slate-300">
                            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                              Source ({subtitle.sourceLang.toUpperCase()})
                            </span>
                            <p className="leading-relaxed">{cue.originalText}</p>
                          </div>

                          <div className="p-2.5 rounded-xl bg-blue-500/[0.04] border border-blue-500/10 text-blue-100">
                            <span className="text-[10px] uppercase font-semibold text-blue-400 block mb-1">
                              Localized ({targetConfig?.name || subtitle.targetLang})
                            </span>
                            <p className="leading-relaxed font-medium">
                              {cue.translatedText || (
                                <span className="text-slate-500 italic">No translation</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
