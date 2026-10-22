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
  Sparkles,
  ArrowRight,
  Eye,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

interface SubtitleEditorProps {
  cues: SubtitleCue[];
  activeCueId?: number;
  onUpdateCue: (cueId: number, translatedText: string) => void;
  onRetranslateCue?: (cueId: number) => void;
  onSeekToCue?: (startSeconds: number, cueId: number) => void;
}

export function SubtitleEditor({
  cues,
  activeCueId,
  onUpdateCue,
  onRetranslateCue,
  onSeekToCue,
}: SubtitleEditorProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterMode, setFilterMode] = React.useState<"all" | "completed" | "pending" | "error">("all");
  const [copiedId, setCopiedId] = React.useState<number | null>(null);

  const activeCueRef = React.useRef<HTMLDivElement | null>(null);

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
    <div className="space-y-4">
      {/* Editor Controls & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search original text, translation, or timestamps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterMode === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            All ({cues.length})
          </button>
          <button
            onClick={() => setFilterMode("completed")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterMode === "completed"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Translated ({cues.filter((c) => c.translatedText && c.status === "completed").length})
          </button>
          <button
            onClick={() => setFilterMode("pending")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterMode === "pending"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Pending ({cues.filter((c) => !c.translatedText || c.status !== "completed").length})
          </button>
          {cues.some((c) => c.status === "error") && (
            <button
              onClick={() => setFilterMode("error")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterMode === "error"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Errors ({cues.filter((c) => c.status === "error").length})
            </button>
          )}
        </div>
      </div>

      {/* Cues List */}
      <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
        {filteredCues.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-white/10 bg-slate-900/30">
            <Filter className="h-8 w-8 text-slate-500 mx-auto mb-2 opacity-50" />
            <p className="text-sm text-slate-400">No subtitle segments match your current search or filter.</p>
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
                className={`group rounded-2xl border transition-all duration-200 p-4 ${
                  isActive
                    ? "border-indigo-500/70 bg-indigo-950/25 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30"
                    : "border-white/10 bg-slate-900/50 hover:border-white/20 hover:bg-slate-900/80"
                }`}
              >
                {/* Cue Metadata Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-white/5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 font-mono text-[11px] font-bold text-slate-300">
                      #{cue.id}
                    </span>

                    <button
                      type="button"
                      onClick={() => onSeekToCue && onSeekToCue(cue.startSeconds, cue.id)}
                      className="flex items-center gap-1.5 font-mono text-[11px] text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded-md transition-colors"
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

                  <div className="flex items-center gap-2">
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
                      <Badge variant="gradient" className="text-[10px] py-0 px-1.5 animate-pulse">
                        <Sparkles className="h-3 w-3" />
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
                        className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Play from here in preview"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Side-by-Side Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Original Subtitle Text */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span>Original Segment</span>
                      <span>{cue.originalText.length} chars</span>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-black/40 p-3 text-sm text-slate-200 font-normal leading-relaxed min-h-[72px] select-text">
                      {cue.originalText}
                    </div>
                  </div>

                  {/* Right: Editable Translated Subtitle Text */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span className="text-indigo-300 font-semibold">Translated Output</span>
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

                    <div className="relative">
                      <textarea
                        value={cue.translatedText || ""}
                        placeholder="Click to enter or edit translation..."
                        onChange={(e) => onUpdateCue(cue.id, e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border border-white/10 bg-slate-950/80 p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 leading-relaxed resize-y transition-all"
                      />

                      {/* Quick single re-translate */}
                      {onRetranslateCue && (
                        <div className="absolute right-2 bottom-3 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onRetranslateCue(cue.id)}
                            className="rounded-lg p-1 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                            title="Re-translate this single cue"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error diagnostics banner if any */}
                {cue.error && (
                  <div className="mt-2 text-[11px] text-red-400 flex items-center gap-1.5 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Translation failed: {cue.error}</span>
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
