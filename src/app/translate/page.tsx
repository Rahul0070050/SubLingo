"use client";

import * as React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { SubtitleUploader } from "@/components/studio/SubtitleUploader";
import { SubtitleEditor } from "@/components/studio/SubtitleEditor";
import { SynchronizedPreview } from "@/components/studio/SynchronizedPreview";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { ExportModal } from "@/components/modals/ExportModal";
import { PublishModal } from "@/components/modals/PublishModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/Toast";
import { SubtitleFile, SubtitleCue, TranslationSettings } from "@/lib/subtitles/types";
import { SUPPORTED_LANGUAGES } from "@/lib/translation/languages";
import { TRANSLITERATION_MAP } from "@/lib/transliteration/languages";
import { saveActiveSubtitle, loadActiveSubtitle } from "@/lib/subtitles/storage";
import { shiftCueTimings } from "@/lib/subtitles/parser";
import {
  ArrowRight,
  Download,
  RefreshCw,
  Film,
  FileText,
  FolderOpen,
  Subtitles,
  Languages,
  Globe,
  UploadCloud,
} from "lucide-react";

export default function TranslateWorkspace() {
  const [subtitleFile, setSubtitleFile] = React.useState<SubtitleFile | null>(null);
  const [cues, setCues] = React.useState<SubtitleCue[]>([]);
  const [activeCueId, setActiveCueId] = React.useState<number | undefined>(undefined);
  const [seekTimeSeconds, setSeekTimeSeconds] = React.useState<number | undefined>(undefined);
  const [isPublishOpen, setIsPublishOpen] = React.useState(false);

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
      const saved = localStorage.getItem("subtivio_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }

    const existingSubtitle = loadActiveSubtitle();
    console.log("existingSubtitle", existingSubtitle);
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
      localStorage.setItem("subtivio_settings", JSON.stringify(newSettings));
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

  const handleUpdateCue = (cueId: number, translatedText: string, cueSettings?: string) => {
    setCues((prev) =>
      prev.map((c) =>
        c.id === cueId
          ? {
              ...c,
              translatedText,
              settings: cueSettings !== undefined ? cueSettings : c.settings,
              status: "completed",
            }
          : c
      )
    );
  };

  const handleSeekToCue = (seconds: number, cueId: number) => {
    setSeekTimeSeconds(seconds);
    setActiveCueId(cueId);
  };

  // Batch translation loop
  const handleStartBatchTranslation = async (onlyUntranslated = false) => {
    if (isTranslating) {
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
        toast.error((err as Error).message, "Translation Notice");
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

  // Delete cue
  const handleDeleteCue = (id: number) => {
    if (cues.length <= 1) {
      toast.warning("At least one subtitle cue must remain.", "Subtitle Notice");
      return;
    }
    const updated = cues.filter((c) => c.id !== id).map((c, i) => ({ ...c, id: i + 1 }));
    setCues(updated);
    if (activeCueId === id) {
      setActiveCueId(updated[0]?.id);
    }
  };

  // Quick Shift timing for all cues (+/- 50ms)
  const handleTimeShift = (offsetMs: number) => {
    if (!offsetMs || cues.length === 0) return;
    const format = subtitleFile?.format || "srt";
    const shifted = shiftCueTimings(cues, offsetMs, format);
    setCues(shifted);
  };

  const completedCount = cues.filter((c) => c.translatedText && c.status === "completed").length;

  return (
    <div className="min-h-screen bg-[#090b0e] text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-200">
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

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* If no file is loaded yet, show the Uploader */}
        {!subtitleFile ? (
          <div className="max-w-3xl mx-auto space-y-6 pt-6">
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-white/[0.08] bg-white/[0.03] text-xs font-medium text-slate-300">
                <span>Studio Workspace</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                Upload & Translate Subtitles
              </h1>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                Timecodes, line breaks, and formatting tags are preserved across all translation engines.
              </p>
            </div>

            <SubtitleUploader onFileParsed={handleFileParsed} />
          </div>
        ) : (
          /* Active Workspace Studio */
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Top Workspace Bar */}
            <div className="rounded-xl border border-white/[0.08] bg-[#12151b] p-3.5 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* File Info */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
                      {subtitleFile.filename.slice(0, 20)}
                    </h2>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono py-0 px-1.5">
                      .{subtitleFile.format}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>{cues.length} Cues</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">
                      {completedCount} Translated ({Math.round((completedCount / cues.length) * 100 || 0)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Language Selection & Translation Controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Source Language */}
                <div className="flex items-center gap-1.5 bg-[#161a22] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs">
                  <span className="text-slate-400 font-medium">From:</span>
                  <select
                    value={settings.sourceLang}
                    onChange={(e) => setSettings((p) => ({ ...p, sourceLang: e.target.value }))}
                    className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code} className="bg-[#12151b] text-white">
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <ArrowRight className="h-3.5 w-3.5 text-slate-500 hidden sm:inline" />

                {/* Target Language */}
                <div className="flex items-center gap-1.5 bg-[#161a22] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs">
                  <span className="text-slate-400 font-medium">To:</span>
                  <select
                    value={settings.targetLang}
                    onChange={(e) => setSettings((p) => ({ ...p, targetLang: e.target.value }))}
                    className="bg-transparent text-blue-400 font-medium focus:outline-none cursor-pointer"
                  >
                    {SUPPORTED_LANGUAGES.filter((l) => l.code !== "auto").map((lang) => {
                      const trans = TRANSLITERATION_MAP[lang.code];
                      return (
                        <option key={lang.code} value={lang.code} className="bg-[#12151b] text-white">
                          {lang.flag} {lang.name} {trans ? `(${trans.inputMode})` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Translate Button */}
                <Button
                  onClick={() => handleStartBatchTranslation(false)}
                  className="gap-1.5 h-8 text-xs font-medium"
                >
                  {isTranslating ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Stop Translation</span>
                    </>
                  ) : (
                    <>
                      <Languages className="h-3.5 w-3.5" />
                      <span>{completedCount === 0 ? "Translate All" : "Translate File"}</span>
                    </>
                  )}
                </Button>

                {/* Video Preview Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVideoPreview(!showVideoPreview)}
                  className={`gap-1.5 h-8 text-xs ${showVideoPreview ? "bg-white/[0.08] text-white border-white/[0.2]" : "text-slate-300"
                    }`}
                  title="Toggle Synchronized Video Preview"
                >
                  <Film className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Preview</span>
                </Button>

                {/* Publish Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPublishOpen(true)}
                  className="gap-1.5 h-8 text-xs text-blue-400 hover:text-white border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/60 transition-colors"
                  title="Publish subtitle release and view details"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Publish</span>
                </Button>

                {/* Export Button */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsExportOpen(true)}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Download className="h-3.5 w-3.5 text-slate-300" />
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
                  className="h-8 w-8 text-slate-400 hover:text-white"
                  title="Upload another file"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Translation Progress Indicator (when active) */}
            {isTranslating && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/[0.05] p-3 space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium text-blue-300">
                    <RefreshCw className="h-3 w-3 animate-spin text-blue-400" />
                    <span>Processing: {currentBatchText}</span>
                  </div>
                  <span className="font-mono font-semibold text-blue-300">{translationProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-200 rounded-full"
                    style={{ width: `${translationProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Two-Column Workspace: Video Preview & Subtitle Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Synchronized Video Preview (sticky or collapsible) */}
              {showVideoPreview && (
                <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-20">
                  <SynchronizedPreview
                    cues={cues}
                    currentCueId={activeCueId}
                    onSelectCue={(id) => setActiveCueId(id)}
                    seekTimeSeconds={seekTimeSeconds}
                  />

                  {/* Quick Summary Card */}
                  <div className="p-3.5 rounded-lg border border-white/[0.08] bg-[#12151b] space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Reading Speed Standard:</span>
                      <span className="text-slate-200 font-mono font-medium">Max 17–20 CPS</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Timing Preservation:</span>
                      <span className="text-emerald-400 font-medium">Frame-accurate</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Formatting Tags (&lt;i&gt;, &lt;b&gt;):</span>
                      <span className="text-blue-400 font-medium">Preserved</span>
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
                  onDeleteCue={handleDeleteCue}
                  onTimeShift={handleTimeShift}
                  targetLang={settings.targetLang}
                  sourceLang={settings.sourceLang}
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
        <>
          <ExportModal
            isOpen={isExportOpen}
            onClose={() => setIsExportOpen(false)}
            cues={cues}
            originalFilename={subtitleFile.filename}
            defaultFormat={subtitleFile.format}
          />
          <PublishModal
            isOpen={isPublishOpen}
            onClose={() => setIsPublishOpen(false)}
            subtitleFile={subtitleFile}
            cues={cues}
            sourceLang={settings.sourceLang}
            targetLang={settings.targetLang}
          />
        </>
      )}
    </div>
  );
}
