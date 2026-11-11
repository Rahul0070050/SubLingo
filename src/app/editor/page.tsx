"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { SubtitleUploader } from "@/components/studio/SubtitleUploader";
import { SynchronizedPreview } from "@/components/studio/SynchronizedPreview";
import { ExportModal } from "@/components/modals/ExportModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { SubtitleFile, SubtitleCue } from "@/lib/subtitles/types";
import {
  timestampToSeconds,
  secondsToTimestamp,
  calculateCPS,
  parseSubtitleFile,
  shiftCueTimings,
} from "@/lib/subtitles/parser";
import { saveActiveSubtitle, loadActiveSubtitle } from "@/lib/subtitles/storage";
import { TransliteratedTextarea } from "@/components/studio/TransliteratedTextarea";
import { QuickTimeShift } from "@/components/studio/QuickTimeShift";
import { CueStyleToolbar } from "@/components/studio/CueStyleToolbar";
import { SUPPORTED_LANGUAGES } from "@/lib/translation/languages";
import { TRANSLITERATION_MAP } from "@/lib/transliteration/languages";
import {
  Subtitles,
  Plus,
  Trash2,
  Split,
  Merge,
  Clock,
  Search,
  Replace,
  Download,
  ArrowRight,
  FolderOpen,
  Sparkles,
  Play,
  RotateCcw,
  Check,
  AlertTriangle,
  Sliders,
  FilePlus,
  FileText,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function SubtitleEditorPage() {
  const router = useRouter();
  const [subtitleFile, setSubtitleFile] = React.useState<SubtitleFile | null>(null);
  const [cues, setCues] = React.useState<SubtitleCue[]>([]);
  const [activeCueId, setActiveCueId] = React.useState<number | undefined>(undefined);
  const [seekTimeSeconds, setSeekTimeSeconds] = React.useState<number | undefined>(undefined);
  const [isExportOpen, setIsExportOpen] = React.useState(false);
  const [typingLang, setTypingLang] = React.useState<string>("en");

  // Search & Replace
  const [searchQuery, setSearchQuery] = React.useState("");
  const [replaceQuery, setReplaceQuery] = React.useState("");
  const [showReplaceBar, setShowReplaceBar] = React.useState(false);

  // Global Time Shift Modal State
  const [showTimeShiftModal, setShowTimeShiftModal] = React.useState(false);
  const [globalShiftMs, setGlobalShiftMs] = React.useState(0);

  // Check for existing session subtitle on mount
  React.useEffect(() => {
    const existing = loadActiveSubtitle();
    if (existing && existing.cues && existing.cues.length > 0) {
      setSubtitleFile(existing);
      setCues(existing.cues);
      setActiveCueId(existing.cues[0]?.id);
    }
  }, []);

  // Save changes to session storage whenever cues change
  React.useEffect(() => {
    if (subtitleFile && cues.length > 0) {
      saveActiveSubtitle({
        ...subtitleFile,
        cues,
      });
    }
  }, [cues, subtitleFile]);

  const handleFileParsed = (file: SubtitleFile) => {
    setSubtitleFile(file);
    setCues(file.cues);
    setActiveCueId(file.cues[0]?.id);
    saveActiveSubtitle(file);
  };

  // Start from scratch / New blank subtitle
  const handleCreateNewBlank = () => {
    const defaultCue: SubtitleCue = {
      id: 1,
      startTime: "00:00:01,000",
      endTime: "00:00:04,000",
      startSeconds: 1,
      endSeconds: 4,
      originalText: "First subtitle line",
      translatedText: "",
      status: "pending",
      charCount: 19,
      readingSpeedCps: calculateCPS("First subtitle line", 3),
    };

    const newFile: SubtitleFile = {
      filename: "untitled_subtitles.srt",
      format: "srt",
      sizeBytes: 120,
      cues: [defaultCue],
    };

    setSubtitleFile(newFile);
    setCues([defaultCue]);
    setActiveCueId(1);
    saveActiveSubtitle(newFile);
  };

  // Update cue text
  const handleUpdateText = (id: number, newText: string) => {
    setCues((prev) =>
      prev.map((cue) => {
        if (cue.id !== id) return cue;
        const duration = Math.max(0.1, cue.endSeconds - cue.startSeconds);
        return {
          ...cue,
          originalText: newText,
          charCount: newText.length,
          readingSpeedCps: calculateCPS(newText, duration),
        };
      })
    );
  };

  // Update cue start or end timestamp string
  const handleUpdateTiming = (id: number, field: "start" | "end", value: string) => {
    setCues((prev) =>
      prev.map((cue) => {
        if (cue.id !== id) return cue;
        const format = subtitleFile?.format || "srt";

        let newStartSec = cue.startSeconds;
        let newEndSec = cue.endSeconds;
        let newStartTime = cue.startTime;
        let newEndTime = cue.endTime;

        if (field === "start") {
          newStartTime = value;
          const parsed = timestampToSeconds(value);
          if (!isNaN(parsed)) newStartSec = parsed;
        } else {
          newEndTime = value;
          const parsed = timestampToSeconds(value);
          if (!isNaN(parsed)) newEndSec = parsed;
        }

        const duration = Math.max(0.1, newEndSec - newStartSec);
        return {
          ...cue,
          startTime: newStartTime,
          endTime: newEndTime,
          startSeconds: newStartSec,
          endSeconds: newEndSec,
          readingSpeedCps: calculateCPS(cue.originalText, duration),
        };
      })
    );
  };

  // Nudge timing by delta seconds
  const handleNudgeTiming = (id: number, field: "start" | "end", deltaSeconds: number) => {
    setCues((prev) =>
      prev.map((cue) => {
        if (cue.id !== id) return cue;
        const format = subtitleFile?.format || "srt";
        let newStart = cue.startSeconds;
        let newEnd = cue.endSeconds;

        if (field === "start") {
          newStart = Math.max(0, cue.startSeconds + deltaSeconds);
        } else {
          newEnd = Math.max(newStart + 0.1, cue.endSeconds + deltaSeconds);
        }

        const duration = Math.max(0.1, newEnd - newStart);
        return {
          ...cue,
          startSeconds: newStart,
          endSeconds: newEnd,
          startTime: secondsToTimestamp(newStart, format),
          endTime: secondsToTimestamp(newEnd, format),
          readingSpeedCps: calculateCPS(cue.originalText, duration),
        };
      })
    );
  };

  // Insert new cue after specific cue
  const handleAddCueAfter = (afterId: number) => {
    const index = cues.findIndex((c) => c.id === afterId);
    if (index === -1) return;

    const currentCue = cues[index];
    const newStart = currentCue.endSeconds + 0.2;
    const newEnd = newStart + 2.5;
    const format = subtitleFile?.format || "srt";

    const newCue: SubtitleCue = {
      id: Date.now(), // temporary unique id
      startTime: secondsToTimestamp(newStart, format),
      endTime: secondsToTimestamp(newEnd, format),
      startSeconds: newStart,
      endSeconds: newEnd,
      originalText: "New subtitle segment",
      translatedText: "",
      status: "pending",
      charCount: 20,
      readingSpeedCps: calculateCPS("New subtitle segment", 2.5),
    };

    const updated = [...cues.slice(0, index + 1), newCue, ...cues.slice(index + 1)];
    // Re-index all sequentially
    const reindexed = updated.map((c, i) => ({ ...c, id: i + 1 }));
    setCues(reindexed);
    setActiveCueId(index + 2);
  };

  // Delete cue
  const handleDeleteCue = (id: number) => {
    if (cues.length <= 1) {
      alert("At least one subtitle cue must remain.");
      return;
    }
    const updated = cues.filter((c) => c.id !== id).map((c, i) => ({ ...c, id: i + 1 }));
    setCues(updated);
    if (activeCueId === id) {
      setActiveCueId(updated[0]?.id);
    }
  };

  // Split cue into two halves
  const handleSplitCue = (id: number) => {
    const index = cues.findIndex((c) => c.id === id);
    if (index === -1) return;

    const cue = cues[index];
    const words = cue.originalText.split(" ");
    const midWord = Math.ceil(words.length / 2);
    const text1 = words.slice(0, midWord).join(" ");
    const text2 = words.slice(midWord).join(" ");

    const midTime = cue.startSeconds + (cue.endSeconds - cue.startSeconds) / 2;
    const format = subtitleFile?.format || "srt";

    const cue1: SubtitleCue = {
      ...cue,
      endSeconds: midTime,
      endTime: secondsToTimestamp(midTime, format),
      originalText: text1,
      charCount: text1.length,
      readingSpeedCps: calculateCPS(text1, midTime - cue.startSeconds),
    };

    const cue2: SubtitleCue = {
      id: Date.now(),
      startSeconds: midTime + 0.05,
      endSeconds: cue.endSeconds,
      startTime: secondsToTimestamp(midTime + 0.05, format),
      endTime: cue.endTime,
      originalText: text2 || "Second part",
      translatedText: "",
      status: "pending",
      charCount: (text2 || "Second part").length,
      readingSpeedCps: calculateCPS(text2 || "Second part", cue.endSeconds - midTime),
    };

    const updated = [...cues.slice(0, index), cue1, cue2, ...cues.slice(index + 1)].map(
      (c, i) => ({ ...c, id: i + 1 })
    );
    setCues(updated);
  };

  // Merge cue with next adjacent cue
  const handleMergeWithNext = (id: number) => {
    const index = cues.findIndex((c) => c.id === id);
    if (index === -1 || index >= cues.length - 1) return;

    const current = cues[index];
    const next = cues[index + 1];

    const mergedText = `${current.originalText} ${next.originalText}`.trim();
    const duration = Math.max(0.1, next.endSeconds - current.startSeconds);

    const mergedCue: SubtitleCue = {
      ...current,
      endSeconds: next.endSeconds,
      endTime: next.endTime,
      originalText: mergedText,
      charCount: mergedText.length,
      readingSpeedCps: calculateCPS(mergedText, duration),
    };

    const updated = [...cues.slice(0, index), mergedCue, ...cues.slice(index + 2)].map(
      (c, i) => ({ ...c, id: i + 1 })
    );
    setCues(updated);
  };

  // Global Time Shift
  const handleApplyGlobalShift = () => {
    if (globalShiftMs === 0) return;
    const format = subtitleFile?.format || "srt";
    const shifted = shiftCueTimings(cues, globalShiftMs, format);
    setCues(shifted);
    setShowTimeShiftModal(false);
    setGlobalShiftMs(0);
  };

  // Quick Shift (+/- 50ms)
  const handleQuickShift = (offsetMs: number) => {
    if (!offsetMs || cues.length === 0) return;
    const format = subtitleFile?.format || "srt";
    const shifted = shiftCueTimings(cues, offsetMs, format);
    setCues(shifted);
  };

  // Search & Replace All
  const handleReplaceAll = () => {
    if (!searchQuery.trim()) return;
    let count = 0;

    const updated = cues.map((cue) => {
      if (cue.originalText.includes(searchQuery)) {
        count++;
        const newText = cue.originalText.replaceAll(searchQuery, replaceQuery);
        const duration = Math.max(0.1, cue.endSeconds - cue.startSeconds);
        return {
          ...cue,
          originalText: newText,
          charCount: newText.length,
          readingSpeedCps: calculateCPS(newText, duration),
        };
      }
      return cue;
    });

    setCues(updated);
    alert(`Replaced ${count} occurrence(s) across subtitles.`);
  };

  // Transfer to Translate Workspace
  const handleProceedToTranslate = () => {
    if (!subtitleFile) return;
    saveActiveSubtitle({
      ...subtitleFile,
      cues,
    });
    router.push("/translate");
  };

  // Filtered cues based on search query
  const filteredCues = React.useMemo(() => {
    if (!searchQuery.trim()) return cues;
    const q = searchQuery.toLowerCase();
    return cues.filter(
      (c) =>
        c.originalText.toLowerCase().includes(q) ||
        c.startTime.includes(q) ||
        c.endTime.includes(q)
    );
  }, [cues, searchQuery]);

  return (
    <div className="min-h-screen bg-[#090b0e] text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-200">
      <Header />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 space-y-5">
        {!subtitleFile ? (
          /* Empty / Upload State */
          <div className="max-w-3xl mx-auto space-y-6 pt-6">
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-white/[0.08] bg-white/[0.03] text-xs font-medium text-slate-300">
                <span>Subtitle Editor</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                Edit & Fine-Tune Subtitles
              </h1>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                Adjust timestamps, add or split dialogue cues, repair drift, and synchronize lines before translation.
              </p>
            </div>

            {/* Create Blank Card or Upload */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={handleCreateNewBlank}
                className="flex items-center gap-3 p-4 rounded-lg border border-white/[0.08] bg-[#12151b] hover:bg-[#151922] hover:border-white/[0.15] transition-colors text-left group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
                  <FilePlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                    Create New Subtitle
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Start authoring a clean subtitle file from scratch with cue #1.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const demo = parseSubtitleFile(
                    `1\n00:00:01,200 --> 00:00:04,500\nOur audio engineers noticed a slight sync offset during the dialogue transitions.\n\n2\n00:00:05,100 --> 00:00:08,400\nLet's review the ambient background track.`,
                    "interview_take_01.srt"
                  );
                  if (demo.success && demo.file) handleFileParsed(demo.file);
                }}
                className="flex items-center gap-3 p-4 rounded-lg border border-white/[0.08] bg-[#12151b] hover:bg-[#151922] hover:border-white/[0.15] transition-colors text-left group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.1] text-slate-300">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                    Load Sample Dialogue
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Test cue splitting, merging, and millisecond time shifting.
                  </p>
                </div>
              </button>
            </div>

            <SubtitleUploader onFileParsed={handleFileParsed} />
          </div>
        ) : (
          /* Active Subtitle Editor Workspace */
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
                      {subtitleFile.filename}
                    </h2>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono py-0 px-1.5">
                      .{subtitleFile.format}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span>{cues.length} Cues</span>
                    <span>•</span>
                    <span>
                      Duration: {secondsToTimestamp(cues[cues.length - 1]?.endSeconds || 0, subtitleFile.format)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Global Time Shift */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTimeShiftModal(true)}
                  className="gap-1.5 h-8 text-xs text-slate-300 hover:text-white"
                  title="Shift all subtitle timings forward or backward"
                >
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Time Shift</span>
                </Button>

                {/* Quick Time Shift (+/- 50ms) */}
                <QuickTimeShift onShift={handleQuickShift} disabled={cues.length === 0} />

                {/* Find & Replace Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReplaceBar(!showReplaceBar)}
                  className={`gap-1.5 h-8 text-xs ${
                    showReplaceBar ? "bg-white/[0.08] text-white border-white/[0.2]" : "text-slate-300 hover:text-white"
                  }`}
                  title="Search and Replace across all cues"
                >
                  <Replace className="h-3.5 w-3.5" />
                  <span>Find & Replace</span>
                </Button>

                {/* Typing Language / Transliteration Selector */}
                <div className="flex items-center gap-1.5 bg-[#161a22] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs">
                  <span className="text-slate-400 font-medium">Input:</span>
                  <select
                    value={typingLang}
                    onChange={(e) => setTypingLang(e.target.value)}
                    className="bg-transparent text-blue-400 font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="en" className="bg-[#12151b] text-white">
                      🇺🇸 English (Direct)
                    </option>
                    <option value="ml" className="bg-[#12151b] text-white">
                      🇮🇳 Malayalam (Manglish)
                    </option>
                    <option value="hi" className="bg-[#12151b] text-white">
                      🇮🇳 Hindi (Hinglish)
                    </option>
                    <option value="ta" className="bg-[#12151b] text-white">
                      🇮🇳 Tamil (Tanglish)
                    </option>
                    <option value="te" className="bg-[#12151b] text-white">
                      🇮🇳 Telugu (Phonetic)
                    </option>
                    <option value="bn" className="bg-[#12151b] text-white">
                      🇧🇩 Bengali (Phonetic)
                    </option>
                    <option value="ar" className="bg-[#12151b] text-white">
                      🇸🇦 Arabic (Phonetic)
                    </option>
                  </select>
                </div>

                {/* Export / Download */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsExportOpen(true)}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Download className="h-3.5 w-3.5 text-slate-300" />
                  <span>Export</span>
                </Button>

                {/* Proceed to Translate Button */}
                <Button
                  size="sm"
                  onClick={handleProceedToTranslate}
                  className="gap-1.5 h-8 text-xs font-medium"
                  title="Transfer edited subtitles into Translation Workspace"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Translate Subtitles</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>

                {/* Load Another File */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm("Load a different subtitle file? Unsaved edits will be replaced.")) {
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

            {/* Find & Replace Bar (when active) */}
            {showReplaceBar && (
              <div className="rounded-lg border border-white/[0.08] bg-[#12151b] p-3 flex flex-wrap items-center gap-2.5 animate-in fade-in">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Find text..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-8 text-xs bg-[#161a22] border-white/[0.08]"
                  />
                </div>
                <div className="relative flex-1 min-w-[200px]">
                  <Replace className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Replace with..."
                    value={replaceQuery}
                    onChange={(e) => setReplaceQuery(e.target.value)}
                    className="pl-9 h-8 text-xs bg-[#161a22] border-white/[0.08]"
                  />
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReplaceAll}
                  disabled={!searchQuery.trim()}
                  className="h-8 text-xs whitespace-nowrap"
                >
                  Replace All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setReplaceQuery("");
                  }}
                  className="h-8 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </Button>
              </div>
            )}

            {/* Two-Column Editor Layout: Video Preview + Cue Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Synchronized Video Preview */}
              <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-20">
                <SynchronizedPreview
                  cues={cues}
                  currentCueId={activeCueId}
                  onSelectCue={(id) => setActiveCueId(id)}
                  seekTimeSeconds={seekTimeSeconds}
                />

                {/* Quick Add Cue at Current Video Time */}
                <div className="p-3.5 rounded-lg border border-white/[0.08] bg-[#12151b] space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-white flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5 text-blue-400" />
                      Add Dialogue Cue
                    </span>
                    <span className="text-slate-400 text-[11px]">{cues.length} total</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const lastCue = cues[cues.length - 1];
                      const start = lastCue ? lastCue.endSeconds + 0.2 : 0;
                      const end = start + 2.5;
                      const format = subtitleFile.format;

                      const newCue: SubtitleCue = {
                        id: cues.length + 1,
                        startTime: secondsToTimestamp(start, format),
                        endTime: secondsToTimestamp(end, format),
                        startSeconds: start,
                        endSeconds: end,
                        originalText: "New subtitle segment",
                        translatedText: "",
                        status: "pending",
                        charCount: 20,
                        readingSpeedCps: calculateCPS("New subtitle segment", 2.5),
                      };

                      setCues([...cues, newCue]);
                      setActiveCueId(newCue.id);
                      setSeekTimeSeconds(start);
                    }}
                    className="w-full h-8 text-xs font-medium border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.04]"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Append Cue to End
                  </Button>
                </div>
              </div>

              {/* Right Column: Editable Cue Cards List */}
              <div className="lg:col-span-7 space-y-3 max-h-[850px] overflow-y-auto pr-1">
                {filteredCues.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-white/10 bg-slate-900/30">
                    <Search className="h-8 w-8 text-slate-500 mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-slate-400">No subtitle cues match your search filter.</p>
                  </div>
                ) : (
                  filteredCues.map((cue) => {
                    const isActive = cue.id === activeCueId;
                    const duration = Math.max(0.1, cue.endSeconds - cue.startSeconds);
                    const isTimingInvalid = cue.endSeconds <= cue.startSeconds;

                    return (
                      <div
                        key={cue.id}
                        className={`rounded-lg border transition-colors p-3.5 space-y-2.5 ${
                          isActive
                            ? "border-blue-500/60 bg-blue-500/[0.03] ring-1 ring-blue-500/20"
                            : "border-white/[0.08] bg-[#12151b] hover:border-white/[0.14]"
                        }`}
                      >
                        {/* Cue Header with Timings & Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.06] text-xs">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-white/[0.05] font-mono text-[11px] font-medium text-slate-300">
                              #{cue.id}
                            </span>

                            {/* Playhead Seek Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSeekTimeSeconds(cue.startSeconds);
                                setActiveCueId(cue.id);
                              }}
                              className="flex items-center gap-1 font-mono text-[11px] text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded transition-colors"
                              title="Seek preview video to this cue"
                            >
                              <Play className="h-2.5 w-2.5 fill-current" />
                              <span>Play</span>
                            </button>

                            <span className="text-[11px] text-slate-400 font-mono">
                              ({duration.toFixed(2)}s)
                            </span>
                          </div>

                          {/* Cue Toolbar Actions (Style, Split, Merge, Add After, Delete) */}
                          <div className="flex items-center gap-1">
                            <CueStyleToolbar
                              text={cue.originalText}
                              settings={cue.settings}
                              onUpdate={(newText, newSettings) => {
                                setCues((prev) =>
                                  prev.map((c) =>
                                    c.id === cue.id
                                      ? {
                                          ...c,
                                          originalText: newText,
                                          settings: newSettings !== undefined ? newSettings : c.settings,
                                          charCount: newText.length,
                                        }
                                      : c
                                  )
                                );
                              }}
                            />
                            <div className="h-3.5 w-px bg-white/[0.08] mx-0.5" />

                            <button
                              type="button"
                              onClick={() => handleSplitCue(cue.id)}
                              className="p-1 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded transition-colors"
                              title="Split this cue into two parts"
                            >
                              <Split className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMergeWithNext(cue.id)}
                              className="p-1 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded transition-colors"
                              title="Merge with next cue"
                            >
                              <Merge className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddCueAfter(cue.id)}
                              className="p-1 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                              title="Insert cue after this"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCue(cue.id)}
                              className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="Delete cue"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Timing Inputs Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {/* Start Timestamp */}
                          <div className="flex items-center gap-1.5 bg-[#161a22] border border-white/[0.08] rounded-md px-2 py-1">
                            <span className="text-slate-400 font-mono text-[11px] w-10">Start:</span>
                            <input
                              type="text"
                              value={cue.startTime}
                              onChange={(e) => handleUpdateTiming(cue.id, "start", e.target.value)}
                              className="bg-transparent font-mono text-white text-xs flex-1 focus:outline-none"
                            />
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleNudgeTiming(cue.id, "start", -0.2)}
                                className="px-1.5 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-[10px] text-slate-300"
                                title="-0.2s"
                              >
                                -0.2s
                              </button>
                              <button
                                type="button"
                                onClick={() => handleNudgeTiming(cue.id, "start", 0.2)}
                                className="px-1.5 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-[10px] text-slate-300"
                                title="+0.2s"
                              >
                                +0.2s
                              </button>
                            </div>
                          </div>

                          {/* End Timestamp */}
                          <div
                            className={`flex items-center gap-1.5 bg-[#161a22] border rounded-md px-2 py-1 ${
                              isTimingInvalid ? "border-red-500 text-red-400" : "border-white/[0.08]"
                            }`}
                          >
                            <span className="text-slate-400 font-mono text-[11px] w-10">End:</span>
                            <input
                              type="text"
                              value={cue.endTime}
                              onChange={(e) => handleUpdateTiming(cue.id, "end", e.target.value)}
                              className="bg-transparent font-mono text-white text-xs flex-1 focus:outline-none"
                            />
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleNudgeTiming(cue.id, "end", -0.2)}
                                className="px-1.5 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-[10px] text-slate-300"
                                title="-0.2s"
                              >
                                -0.2s
                              </button>
                              <button
                                type="button"
                                onClick={() => handleNudgeTiming(cue.id, "end", 0.2)}
                                className="px-1.5 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-[10px] text-slate-300"
                                title="+0.2s"
                              >
                                +0.2s
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Timing error notice if any */}
                        {isTimingInvalid && (
                          <div className="text-[11px] text-red-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>End timestamp must be greater than start timestamp.</span>
                          </div>
                        )}

                        {/* Subtitle Dialogue Textarea */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Subtitle Text</span>
                            <div className="flex items-center gap-2">
                              <span>{cue.originalText.length} chars</span>
                              <span>•</span>
                              <span
                                className={
                                  (cue.readingSpeedCps || 0) > 22
                                    ? "text-red-400 font-bold"
                                    : (cue.readingSpeedCps || 0) > 17
                                    ? "text-amber-400 font-medium"
                                    : "text-slate-400"
                                }
                              >
                                {cue.readingSpeedCps || 0} CPS
                              </span>
                            </div>
                          </div>

                          <TransliteratedTextarea
                            value={cue.originalText}
                            onChange={(val) => handleUpdateText(cue.id, val)}
                            targetLang={typingLang}
                            placeholder="Enter subtitle dialogue line..."
                            cueId={cue.id}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Time Shift Modal */}
      {showTimeShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
            onClick={() => setShowTimeShiftModal(false)}
          />
          <div className="relative z-50 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Global Subtitle Time Shift</h3>
            <p className="text-xs text-slate-400 mb-4">
              Shift every subtitle cue in this file forward or backward by milliseconds.
            </p>

            <div className="space-y-3 mb-6">
              <label className="text-xs font-semibold text-white block">Offset (Milliseconds)</label>
              <Input
                type="number"
                step="100"
                value={globalShiftMs}
                onChange={(e) => setGlobalShiftMs(parseInt(e.target.value) || 0)}
                placeholder="+500 or -500"
                className="font-mono text-sm"
              />
              <div className="flex gap-2">
                {[-1000, -500, +500, +1000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setGlobalShiftMs(preset)}
                    className="flex-1 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-mono text-slate-300"
                  >
                    {preset > 0 ? `+${preset}` : preset}ms
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowTimeShiftModal(false)}>
                Cancel
              </Button>
              <Button variant="gradient" size="sm" onClick={handleApplyGlobalShift}>
                Apply Shift to All Cues
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
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
