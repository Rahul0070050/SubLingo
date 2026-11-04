"use client";

import * as React from "react";
import { SubtitleCue } from "@/lib/subtitles/types";
import { calculateCPS } from "@/lib/subtitles/parser";
import {
  Search,
  Filter,
  Play,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCheck,
  RefreshCw,
  Trash,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { TransliteratedTextarea } from "@/components/studio/TransliteratedTextarea";
import { getTransliterationConfig } from "@/lib/transliteration/languages";

interface SubtitleEditorProps {
  cues: SubtitleCue[];
  activeCueId?: number;
  onUpdateCue: (cueId: number, translatedText: string) => void;
  onRetranslateCue?: (cueId: number) => void;
  onSeekToCue?: (startSeconds: number, cueId: number) => void;
  onDeleteCue?: (cueId: number) => void;
  targetLang?: string;
  sourceLang?: string;
}

export function SubtitleEditor({
  cues,
  activeCueId,
  onUpdateCue,
  onRetranslateCue,
  onSeekToCue,
  onDeleteCue,
  targetLang = "ml",
  sourceLang,
}: SubtitleEditorProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterMode, setFilterMode] = React.useState<"all" | "completed" | "pending" | "error">("all");
  const [copiedId, setCopiedId] = React.useState<number | null>(null);

  const activeCueRef = React.useRef<HTMLDivElement | null>(null);
  const langConfig = React.useMemo(() => getTransliterationConfig(targetLang), [targetLang]);

  // Auto-scroll to active cue if selected
  React.useEffect(() => {
    if (activeCueId && activeCueRef.current) {
      activeCueRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeCueId]);

  const filteredCues = React.useMemo(() => {
    return cues.filter((cue) => {
      // Filter status
      if (filterMode === "completed" && (!cue.translatedText || cue.status !== "completed")) return false;
      if (filterMode === "pending" && cue.status === "completed") return false;
      if (filterMode === "error" && cue.status !== "error") return false;

      // Filter search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesOriginal = cue.originalText.toLowerCase().includes(query);
        const matchesTranslated = cue.translatedText?.toLowerCase().includes(query);
        const matchesTime = cue.startTime.includes(query) || cue.endTime.includes(query);
        return matchesOriginal || matchesTranslated || matchesTime;
      }

      return true;
    });
  }, [cues, filterMode, searchQuery]);

  const handleCopyText = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getCpsBadge = (cps?: number) => {
    if (!cps) return null;
    if (cps > 22) {
      return (
        <Badge variant="destructive" className="text-[10px] py-0 px-1.5" title="Reading speed exceeds standard 22 CPS">
          {cps} CPS (Fast)
        </Badge>
      );
    } else if (cps > 17) {
      return (
        <Badge variant="warning" className="text-[10px] py-0 px-1.5" title="Moderate reading speed">
          {cps} CPS
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-slate-400">
        {cps} CPS
      </Badge>
    );
  };

  return (
    <div className="space-y-3">
      {/* Editor Controls & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-lg border border-white/[0.08] bg-[#12151b]">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search text or timecodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-[#161a22] border-white/[0.08]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${filterMode === "all"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
          >
            All ({cues.length})
          </button>
          <button
            onClick={() => setFilterMode("completed")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${filterMode === "completed"
              ? "bg-emerald-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
          >
            Translated ({cues.filter((c) => c.translatedText && c.status === "completed").length})
          </button>
          <button
            onClick={() => setFilterMode("pending")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${filterMode === "pending"
              ? "bg-amber-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
          >
            Pending ({cues.filter((c) => !c.translatedText || c.status !== "completed").length})
          </button>
          {cues.some((c) => c.status === "error") && (
            <button
              onClick={() => setFilterMode("error")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${filterMode === "error"
                ? "bg-red-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
            >
              Errors ({cues.filter((c) => c.status === "error").length})
            </button>
          )}
        </div>
      </div>

      {/* Cues List */}
      <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
        {filteredCues.length === 0 ? (
          <div className="p-10 text-center rounded-lg border border-white/[0.08] bg-[#12151b]">
            <Filter className="h-6 w-6 text-slate-500 mx-auto mb-2 opacity-50" />
            <p className="text-xs text-slate-400">No subtitle segments match your search or filter.</p>
          </div>
        ) : (
          filteredCues.map((cue) => {
            const isActive = cue.id === activeCueId;
            const duration = Math.max(0.1, cue.endSeconds - cue.startSeconds);
            const currentCps = calculateCPS(cue.translatedText || cue.originalText, duration);

            return (
              <div
                key={cue.id}
                ref={isActive ? activeCueRef : null}
                className={`group rounded-lg border transition-colors p-3.5 ${isActive
                  ? "border-blue-500/60 bg-blue-500/[0.03] ring-1 ring-blue-500/20"
                  : "border-white/[0.08] bg-[#12151b] hover:border-white/[0.14]"
                  }`}
              >
                {/* Cue Metadata Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-white/[0.06] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-white/[0.05] font-mono text-[11px] font-medium text-slate-300">
                      #{cue.id}
                    </span>

                    <button
                      type="button"
                      onClick={() => onSeekToCue && onSeekToCue(cue.startSeconds, cue.id)}
                      className="flex items-center gap-1 font-mono text-[11px] text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded transition-colors"
                      title="Seek preview video to this timestamp"
                    >
                      <Clock className="h-3 w-3" />
                      <span>{cue.startTime}</span>
                      <ArrowRight className="h-2.5 w-2.5 opacity-50" />
                      <span>{cue.endTime}</span>
                    </button>

                    <span className="text-[10px] text-slate-500 font-mono">
                      ({duration.toFixed(2)}s)
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Reading speed */}
                    {getCpsBadge(currentCps)}

                    {/* Status badge */}
                    {cue.status === "completed" && (
                      <Badge variant="success" className="text-[10px] py-0 px-1.5">
                        <CheckCheck className="h-3 w-3" />
                        Translated
                      </Badge>
                    )}
                    {cue.status === "translating" && (
                      <Badge variant="default" className="text-[10px] py-0 px-1.5 animate-pulse text-blue-400">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Translating
                      </Badge>
                    )}
                    {cue.status === "error" && (
                      <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                        <AlertCircle className="h-3 w-3" />
                        Error
                      </Badge>
                    )}

                    {/* Quick Seek Play Button */}
                    {onSeekToCue && (
                      <button
                        type="button"
                        onClick={() => onSeekToCue(cue.startSeconds, cue.id)}
                        className="rounded p-1 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                        title="Play from here in preview"
                      >
                        <Play className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteCue && onDeleteCue(cue.id)}
                      className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete cue"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Side-by-Side Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Left: Original Subtitle Text */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span>Original Segment</span>
                      <div className="flex items-center gap-2">
                        <span>{cue.originalText.length} chars</span>
                        {cue.originalText && (
                          <button
                            type="button"
                            onClick={() => handleCopyText(cue.id, cue.originalText)}
                            className="text-slate-400 hover:text-white transition-colors"
                            title="Copy translation"
                          >
                            {copiedId === cue.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="rounded-md border border-white/[0.06] bg-[#161a22] p-2.5 text-xs text-slate-200 font-normal leading-relaxed min-h-[64px] select-text">
                      {cue.originalText}
                    </div>
                  </div>

                  {/* Right: Editable Translated Subtitle Text */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span className="text-blue-400 font-medium">Translated Output</span>
                      <div className="flex items-center gap-2">
                        <span>{cue.translatedText?.length || 0} chars</span>
                        {cue.translatedText && (
                          <button
                            type="button"
                            onClick={() => handleCopyText(cue.id, cue.translatedText)}
                            className="text-slate-400 hover:text-white transition-colors"
                            title="Copy translation"
                          >
                            {copiedId === cue.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <TransliteratedTextarea
                      value={cue.translatedText || ""}
                      onChange={(val) => onUpdateCue(cue.id, val)}
                      targetLang={targetLang}
                      cueId={cue.id}
                      rightAction={
                        onRetranslateCue ? (
                          <button
                            type="button"
                            onClick={() => onRetranslateCue(cue.id)}
                            className="rounded p-1 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            title="Re-translate this single cue"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </button>
                        ) : undefined
                      }
                    />
                  </div>
                </div>

                {/* Error diagnostics banner if any */}
                {cue.error && (
                  <div className="mt-2 text-[11px] text-red-400 flex items-center gap-1.5 bg-red-500/10 p-2 rounded-md border border-red-500/20">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Translation error: {cue.error}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
