"use client";

import * as React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { SubtitleUploader } from "@/components/studio/SubtitleUploader";
import { SubtitleEditor } from "@/components/studio/SubtitleEditor";
import { SynchronizedPreview } from "@/components/studio/SynchronizedPreview";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { ExportModal } from "@/components/modals/ExportModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SubtitleFile, SubtitleCue, TranslationSettings } from "@/lib/subtitles/types";
import { SUPPORTED_LANGUAGES, getLanguageName } from "@/lib/translation/languages";
import { saveActiveSubtitle, loadActiveSubtitle } from "@/lib/subtitles/storage";
import {
  Sparkles,
  ArrowRight,
  Download,
  Settings as SettingsIcon,
  RefreshCw,
  Play,
  Pause,
  Film,
  FileText,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Subtitles,
} from "lucide-react";

export default function TranslateWorkspace() {
  const [subtitleFile, setSubtitleFile] = React.useState<SubtitleFile | null>(null);
  const [cues, setCues] = React.useState<SubtitleCue[]>([]);
  const [activeCueId, setActiveCueId] = React.useState<number | undefined>(undefined);
  const [seekTimeSeconds, setSeekTimeSeconds] = React.useState<number | undefined>(undefined);

  // Settings
  const [settings, setSettings] = React.useState<TranslationSettings>({
    sourceLang: "auto",
    targetLang: "es", // Spanish default
    provider: "free-engine",
    batchSize: 20,
    tone: "natural",
    glossary: {},
  });

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isExportOpen, setIsExportOpen] = React.useState(false);
  const [showVideoPreview, setShowVideoPreview] = React.useState(true);

  // Batch Translation Status
  const [isTranslating, setIsTranslating] = React.useState(false);
  const [translationProgress, setTranslationProgress] = React.useState(0);
  const [currentBatchText, setCurrentBatchText] = React.useState("");
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Load saved settings and existing active subtitle from storage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("sublingo_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }

    const existingSubtitle = loadActiveSubtitle();
    if (existingSubtitle && existingSubtitle.cues && existingSubtitle.cues.length > 0) {
      setSubtitleFile(existingSubtitle);
      setCues(existingSubtitle.cues);
      setActiveCueId(existingSubtitle.cues[0]?.id);
    }
  }, []);

  // Sync cue updates to session storage
  React.useEffect(() => {
    if (subtitleFile && cues.length > 0) {
      saveActiveSubtitle({
        ...subtitleFile,
        cues,
      });
    }
  }, [cues, subtitleFile]);

  const handleSaveSettings = (newSettings: TranslationSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem("sublingo_settings", JSON.stringify(newSettings));
    } catch {
      // ignore
    }
  };

  const handleFileParsed = (file: SubtitleFile) => {
    setSubtitleFile(file);
    setCues(file.cues);
    setActiveCueId(file.cues[0]?.id);
    setTranslationProgress(0);
  };

  const handleUpdateCue = (cueId: number, translatedText: string) => {
    setCues((prev) =>
      prev.map((c) => (c.id === cueId ? { ...c, translatedText, status: "completed" } : c))
    );
  };

  const handleSeekToCue = (seconds: number, cueId: number) => {
    setSeekTimeSeconds(seconds);
    setActiveCueId(cueId);
  };

  // Batch translation loop
  const handleStartBatchTranslation = async (onlyUntranslated = false) => {
    if (isTranslating) {
      // Abort if currently running
      abortControllerRef.current?.abort();
      setIsTranslating(false);
      return;
    }

    const cuesToTranslate = cues.filter((c) => (onlyUntranslated ? !c.translatedText : true));
    if (cuesToTranslate.length === 0) return;

    setIsTranslating(true);
    abortControllerRef.current = new AbortController();

    const batchSize = settings.batchSize || 20;
    const totalBatches = Math.ceil(cuesToTranslate.length / batchSize);

    try {
      for (let b = 0; b < totalBatches; b++) {
        if (abortControllerRef.current.signal.aborted) break;

        const batchCues = cuesToTranslate.slice(b * batchSize, (b + 1) * batchSize);
        const batchIds = new Set(batchCues.map((c) => c.id));

        // Mark current batch as translating
        setCues((prev) =>
          prev.map((c) => (batchIds.has(c.id) ? { ...c, status: "translating" } : c))
        );

        setCurrentBatchText(`Batch ${b + 1} of ${totalBatches} (${batchCues.length} cues)...`);

        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cues: batchCues,
            settings: {
              sourceLang: settings.sourceLang,
              targetLang: settings.targetLang,
              provider: settings.provider,
              apiKey: settings.apiKey,
              model: settings.model,
              tone: settings.tone,
              glossary: settings.glossary,
            },
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Translation error (${res.status})`);
        }

        const data = await res.json();
        if (data.cues && Array.isArray(data.cues)) {
          const translatedMap = new Map<number, SubtitleCue>(data.cues.map((c: SubtitleCue) => [c.id, c]));

          setCues((prev) =>
            prev.map((c) => {
              if (translatedMap.has(c.id)) {
                return translatedMap.get(c.id)!;
              }
              return c;
            })
          );
        }

        const progressPercent = Math.round(((b + 1) / totalBatches) * 100);
        setTranslationProgress(progressPercent);
      }
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        console.error("Batch translation error:", err);
        alert(`Translation notice: ${(err as Error).message}`);
      }
    } finally {
      setIsTranslating(false);
      setCurrentBatchText("");
    }
  };

  // Re-translate single cue
  const handleRetranslateSingleCue = async (cueId: number) => {
    const cue = cues.find((c) => c.id === cueId);
    if (!cue) return;

    setCues((prev) => prev.map((c) => (c.id === cueId ? { ...c, status: "translating" } : c)));

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cues: [cue],
          settings: {
            sourceLang: settings.sourceLang,
            targetLang: settings.targetLang,
            provider: settings.provider,
            apiKey: settings.apiKey,
            model: settings.model,
            tone: settings.tone,
            glossary: settings.glossary,
          },
        }),
      });

      if (!res.ok) throw new Error("Single cue translation failed");

      const data = await res.json();
      if (data.cues && data.cues[0]) {
        const updated = data.cues[0];
        setCues((prev) => prev.map((c) => (c.id === cueId ? updated : c)));
      }
    } catch (err: unknown) {
      setCues((prev) =>
        prev.map((c) => (c.id === cueId ? { ...c, status: "error", error: (err as Error).message } : c))
      );
    }
  };

  const completedCount = cues.filter((c) => c.translatedText && c.status === "completed").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeProvider={
          settings.provider === "gemini"
            ? "Gemini AI"
            : settings.provider === "openai"
              ? "OpenAI"
              : "Free Engine"
        }
      />

      <main className="flex-1 container mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* If no file is loaded yet, show the Uploader */}
        {!subtitleFile ? (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2 mb-8">
              <Badge variant="gradient" className="py-1 px-3 text-xs uppercase tracking-wider font-semibold">
                Subtitle Translation Studio
              </Badge>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                Upload & Localize Subtitles
              </h1>
              <p className="text-base text-slate-400 max-w-xl mx-auto">
                Preserve frame-accurate timestamps, formatting tags, and reading pace while translating across 50+ languages.
              </p>
            </div>

            <SubtitleUploader onFileParsed={handleFileParsed} />
          </div>
        ) : (
          /* Active Workspace Studio */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Workspace Bar */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 backdrop-blur-xl shadow-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* File Info */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white truncate max-w-xs sm:max-w-md">
                      {subtitleFile.filename.slice(0, 20)}
                      {/* cut the string to length */}
                    </h2>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono py-0 px-2">
                      .{subtitleFile.format}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span>{cues.length} Cues</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">
                      {completedCount} Translated ({Math.round((completedCount / cues.length) * 100 || 0)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Language Selection & Translation Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Source Language */}
                <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs">
                  <span className="text-slate-400 font-medium">From:</span>
                  <select
                    value={settings.sourceLang}
                    onChange={(e) => setSettings((p) => ({ ...p, sourceLang: e.target.value }))}
                    className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <ArrowRight className="h-4 w-4 text-slate-500 hidden sm:inline" />

                {/* Target Language */}
                <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs">
                  <span className="text-slate-400 font-medium">To:</span>
                  <select
                    value={settings.targetLang}
                    onChange={(e) => setSettings((p) => ({ ...p, targetLang: e.target.value }))}
                    className="bg-transparent text-indigo-300 font-semibold focus:outline-none cursor-pointer"
                  >
                    {SUPPORTED_LANGUAGES.filter((l) => l.code !== "auto").map((lang) => (
                      <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Translate Button */}
                <Button
                  variant="gradient"
                  onClick={() => handleStartBatchTranslation(false)}
                  className="gap-2 font-bold shadow-indigo-500/30"
                >
                  {isTranslating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Stop Translation</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>{completedCount === 0 ? "Translate All" : "Translate File"}</span>
                    </>
                  )}
                </Button>

                {/* Edit Subtitles in Editor */}
                <Link href="/editor">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-white/10 text-xs text-slate-300 hover:text-white"
                    title="Open in Subtitle Editor to adjust text or timestamps"
                  >
                    <Subtitles className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Edit Subtitles</span>
                  </Button>
                </Link>

                {/* Video Preview Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVideoPreview(!showVideoPreview)}
                  className={`gap-1.5 border-white/10 text-xs ${showVideoPreview ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40" : "text-slate-300"
                    }`}
                  title="Toggle Synchronized Video Preview"
                >
                  <Film className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Preview</span>
                </Button>

                {/* Export Button */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsExportOpen(true)}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <Download className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Export</span>
                </Button>

                {/* Load Another File */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm("Load a different subtitle file? Any unsaved edits will be cleared.")) {
                      setSubtitleFile(null);
                      setCues([]);
                    }
                  }}
                  className="text-slate-400 hover:text-white"
                  title="Upload another file"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Translation Progress Indicator (when active) */}
            {isTranslating && (
              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/40 p-4 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium text-indigo-200">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                    <span>Processing: {currentBatchText}</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-300">{translationProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 rounded-full"
                    style={{ width: `${translationProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Two-Column Workspace: Video Preview & Subtitle Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Synchronized Video Preview (sticky or collapsible) */}
              {showVideoPreview && (
                <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
                  <SynchronizedPreview
                    cues={cues}
                    currentCueId={activeCueId}
                    onSelectCue={(id) => setActiveCueId(id)}
                    seekTimeSeconds={seekTimeSeconds}
                  />

                  {/* Quick Summary Card */}
                  <div className="p-4 rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-md space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Reading Speed Standard:</span>
                      <span className="text-indigo-400 font-mono font-semibold">Max 20-22 CPS</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Timing Preservation:</span>
                      <span className="text-emerald-400 font-semibold">100% Guaranteed</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Formatting Tags (&lt;i&gt;, &lt;b&gt;):</span>
                      <span className="text-indigo-400 font-semibold">Retained in sync</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Side-by-Side Subtitle Editor */}
              <div className={showVideoPreview ? "lg:col-span-7" : "lg:col-span-12"}>
                <SubtitleEditor
                  cues={cues}
                  activeCueId={activeCueId}
                  onUpdateCue={handleUpdateCue}
                  onRetranslateCue={handleRetranslateSingleCue}
                  onSeekToCue={handleSeekToCue}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      {subtitleFile && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          cues={cues}
          originalFilename={subtitleFile.filename}
          defaultFormat={subtitleFile.format}
        />
      )}
    </div>
  );
}
