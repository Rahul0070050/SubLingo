"use client";

import * as React from "react";
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Sparkles, FileCode } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { parseSubtitleFile } from "@/lib/subtitles/parser";
import { SubtitleFile } from "@/lib/subtitles/types";
import { SAMPLE_SUBTITLES, SubtitleSample } from "@/lib/subtitles/samples";

interface SubtitleUploaderProps {
  onFileParsed: (file: SubtitleFile) => void;
}

export function SubtitleUploader({ onFileParsed }: SubtitleUploaderProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [warnings, setWarnings] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const processFile = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    setWarnings([]);

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File exceeds the maximum limit of 10MB.");
      setIsLoading(false);
      return;
    }

    try {
      const text = await file.text();
      const result = parseSubtitleFile(text, file.name);

      if (!result.success || !result.file) {
        setErrorMessage(result.error || "Failed to parse subtitle file.");
        setIsLoading(false);
        return;
      }

      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings);
      }

      onFileParsed(result.file);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error reading subtitle file";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleSelectSample = (sample: SubtitleSample) => {
    const filename = `${sample.id}.${sample.format}`;
    const result = parseSubtitleFile(sample.content, filename);
    if (result.success && result.file) {
      onFileParsed(result.file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Drag & Drop Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
          isDragging
            ? "border-indigo-400 bg-indigo-950/30 scale-[1.01] shadow-2xl shadow-indigo-500/20"
            : "border-white/15 bg-slate-900/40 hover:border-indigo-500/50 hover:bg-slate-900/60"
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".srt,.vtt,text/plain"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processFile(e.target.files[0]);
            }
          }}
        />

        {/* Ambient background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/30">
          <UploadCloud className="h-10 w-10 animate-pulse" />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
          Drop your subtitle file here, or{" "}
          <span className="text-indigo-400 underline decoration-indigo-400/30 underline-offset-4">
            browse
          </span>
        </h3>

        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          Supports SubRip (<span className="text-slate-200 font-mono">.srt</span>) and WebVTT (
          <span className="text-slate-200 font-mono">.vtt</span>). Timestamps and formatting are strictly preserved.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="outline" className="text-xs py-1 px-3 border-white/10 bg-black/30">
            <FileCode className="h-3.5 w-3.5 text-indigo-400 mr-1.5" />
            UTF-8 & ANSI Encoding
          </Badge>
          <Badge variant="outline" className="text-xs py-1 px-3 border-white/10 bg-black/30">
            <FileText className="h-3.5 w-3.5 text-cyan-400 mr-1.5" />
            Max file size: 10MB
          </Badge>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-left animate-in fade-in">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-left max-w-lg space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-amber-200">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Parsed with notes:</span>
            </div>
            {warnings.slice(0, 2).map((w, i) => (
              <p key={i} className="text-[11px] text-amber-300/80">• {w}</p>
            ))}
          </div>
        )}
      </div>

      {/* 1-Click Sample Demos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Or start with an instant demo sample:
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_SUBTITLES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className="p-4 rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-800/80 hover:border-indigo-500/40 text-left transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {sample.title}
                  </span>
                  <Badge variant="outline" className="text-[9px] uppercase font-mono py-0 px-1.5">
                    .{sample.format}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {sample.description}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                <span>Load Sample</span>
                <span>→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
