"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { SubtitleCue, SubtitleFormat, ExportOptions } from "@/lib/subtitles/types";
import { serializeSubtitles } from "@/lib/subtitles/serializer";
import { Download, Copy, Check, FileText, Clock, Layers } from "lucide-react";
import confetti from "canvas-confetti";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cues: SubtitleCue[];
  originalFilename: string;
  defaultFormat?: SubtitleFormat;
}

export function ExportModal({
  isOpen,
  onClose,
  cues,
  originalFilename,
  defaultFormat = "srt",
}: ExportModalProps) {
  const [format, setFormat] = React.useState<SubtitleFormat>(defaultFormat);
  const [mode, setMode] = React.useState<ExportOptions["mode"]>("translated");
  const [timeOffsetMs, setTimeOffsetMs] = React.useState<number>(0);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    setFormat(defaultFormat);
  }, [defaultFormat, isOpen]);

  const exportResult = React.useMemo(() => {
    if (!cues || cues.length === 0) return { content: "", mimeType: "text/plain", extension: format };
    return serializeSubtitles(cues, {
      format,
      mode,
      timeOffsetMs,
      normalizeLineBreaks: true,
    });
  }, [cues, format, mode, timeOffsetMs]);

  const generatedFilename = React.useMemo(() => {
    const base = originalFilename.replace(/\.(srt|vtt)$/i, "") || "subtitles";
    const modeTag = mode === "bilingual-stacked" ? "bilingual" : mode;
    return `${base}_${modeTag}.${exportResult.extension}`;
  }, [originalFilename, mode, exportResult.extension]);

  const handleDownload = () => {
    try {
      const blob = new Blob([exportResult.content], { type: exportResult.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = generatedFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#a855f7", "#ec4899", "#38bdf8"],
      });
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportResult.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Subtitles"
      description="Download your synchronized subtitles or copy the file content."
      className="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Format & Mode Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Format Selection */}
          <div>
            <label className="text-xs font-semibold text-white block mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              Target File Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat("srt")}
                className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                  format === "srt"
                    ? "bg-indigo-600/25 border-indigo-500 text-white shadow-sm"
                    : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                SubRip (.srt)
              </button>
              <button
                type="button"
                onClick={() => setFormat("vtt")}
                className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                  format === "vtt"
                    ? "bg-indigo-600/25 border-indigo-500 text-white shadow-sm"
                    : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                WebVTT (.vtt)
              </button>
            </div>
          </div>

          {/* Time Offset Adjustment */}
          <div>
            <label className="text-xs font-semibold text-white block mb-1.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              Timing Offset (Milliseconds)
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="50"
                value={timeOffsetMs}
                onChange={(e) => setTimeOffsetMs(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="text-xs font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTimeOffsetMs(0)}
                className="text-xs whitespace-nowrap"
              >
                Reset
              </Button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Shift cue timestamps forward (+) or backward (-).
            </p>
          </div>
        </div>

        {/* Content Mode */}
        <div>
          <label className="text-xs font-semibold text-white block mb-1.5 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            Track Content Mode
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "translated", label: "Translated Only", badge: "Standard" },
              { id: "bilingual-stacked", label: "Bilingual Stacked", badge: "Learner" },
              { id: "bilingual-inline", label: "Bilingual Inline", badge: "Compact" },
              { id: "original", label: "Original Only", badge: "Source" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id as ExportOptions["mode"])}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  mode === item.id
                    ? "bg-indigo-600/25 border-indigo-500 text-white shadow-sm"
                    : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{item.label}</span>
                </div>
                <Badge variant={mode === item.id ? "gradient" : "outline"} className="text-[9px] px-1 py-0">
                  {item.badge}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Live File Preview */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-300">
              Live Preview: <span className="font-mono text-indigo-300">{generatedFilename}</span>
            </span>
            <span className="text-[11px] text-slate-500">{cues.length} Cues</span>
          </div>
          <div className="relative rounded-xl border border-white/10 bg-black/60 p-3 max-h-40 overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed">
            <pre className="whitespace-pre-wrap">{exportResult.content.slice(0, 1500)}</pre>
            {exportResult.content.length > 1500 && (
              <p className="text-[10px] text-slate-500 pt-2 italic">
                ... (+ {exportResult.content.length - 1500} more characters)
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2 text-xs border-white/10 text-slate-300 hover:text-white"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Copied Subtitles!" : "Copy Full Text"}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="gradient" size="sm" onClick={handleDownload} className="gap-2 font-bold">
              <Download className="h-4 w-4" />
              Download .{exportResult.extension.toUpperCase()}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
