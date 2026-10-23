"use client";

import * as React from "react";
import { UploadCloud, FileText, AlertTriangle, FileCode, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { parseSubtitleFile } from "@/lib/subtitles/parser";
import { SubtitleFile } from "@/lib/subtitles/types";
import { SAMPLE_SUBTITLES, SubtitleSample } from "@/lib/subtitles/samples";

interface SubtitleUploaderProps {
  onFileParsed: (file: SubtitleFile) => void;
}

export function SubtitleUploader({ onFileParsed }: SubtitleUploaderProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [, setIsLoading] = React.useState(false);
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
        className={`relative rounded-xl border border-dashed p-8 sm:p-12 text-center transition-all duration-150 flex flex-col items-center justify-center cursor-pointer ${
          isDragging
            ? "border-blue-500 bg-blue-500/[0.04]"
            : "border-white/[0.12] bg-[#12151b] hover:border-white/[0.22] hover:bg-[#141720]"
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

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
          <UploadCloud className="h-6 w-6" />
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 tracking-tight">
          Drop your subtitle file here, or{" "}
          <span className="text-blue-400 underline decoration-blue-400/30 underline-offset-4">
            browse
          </span>
        </h3>

        <p className="text-xs text-slate-400 max-w-md mb-5 leading-relaxed">
          Supports SubRip (<span className="text-slate-300 font-mono">.srt</span>) and WebVTT (
          <span className="text-slate-300 font-mono">.vtt</span>). Timestamps and formatting tags are preserved.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="outline" className="text-[11px] py-0.5 px-2.5 border-white/[0.08] bg-white/[0.02]">
            <FileCode className="h-3 w-3 text-slate-400 mr-1.5" />
            UTF-8 & ANSI
          </Badge>
          <Badge variant="outline" className="text-[11px] py-0.5 px-2.5 border-white/[0.08] bg-white/[0.02]">
            <FileText className="h-3 w-3 text-slate-400 mr-1.5" />
            Max file size: 10MB
          </Badge>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-left animate-in fade-in">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs text-left max-w-lg space-y-1">
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
        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Or load a sample dialogue file:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_SUBTITLES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className="p-3.5 rounded-lg border border-white/[0.08] bg-[#12151b] hover:bg-[#151922] hover:border-white/[0.15] text-left transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
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

              <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-blue-400 group-hover:translate-x-0.5 transition-transform">
                <span>Load Sample</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
