"use client";

import * as React from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { SubtitleCue, SubtitleFile } from "@/lib/subtitles/types";
import { getLanguageName } from "@/lib/translation/languages";
import { getTransliterationConfig } from "@/lib/transliteration/languages";
import {
  Globe,
  UploadCloud,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  Sparkles,
  Clock,
  FileText,
  CheckCheck,
  AlertCircle,
  ExternalLink,
  Layers,
  Send,
  Lock,
  Eye,
  RefreshCw,
  Hash,
  Download,
} from "lucide-react";
import confetti from "canvas-confetti";

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitleFile: SubtitleFile | null;
  cues: SubtitleCue[];
  sourceLang: string;
  targetLang: string;
}

export function PublishModal({
  isOpen,
  onClose,
  subtitleFile,
  cues,
  sourceLang,
  targetLang,
}: PublishModalProps) {
  const [releaseTitle, setReleaseTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [visibility, setVisibility] = React.useState<"public" | "unlisted" | "private">("public");
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [isPublished, setIsPublished] = React.useState(false);
  const [publishedUrl, setPublishedUrl] = React.useState("");
  const [publishedId, setPublishedId] = React.useState("");
  const [publishError, setPublishError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [b2Stored, setB2Stored] = React.useState<boolean>(false);

  // Initialize release title when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setIsPublished(false);
      setIsPublishing(false);
      setPublishError(null);
      const defaultName = subtitleFile?.filename
        ? subtitleFile.filename.replace(/\.(srt|vtt)$/i, "")
        : "Untitled Subtitles";
      setReleaseTitle(defaultName);
      setDescription(`Localized to ${getLanguageName(targetLang)} with Subtivio Studio`);
    }
  }, [isOpen, subtitleFile, targetLang]);

  // Subtitle statistics
  const stats = React.useMemo(() => {
    const totalCues = cues.length;
    const translatedCues = cues.filter(
      (c) => c.translatedText && c.translatedText.trim().length > 0
    ).length;
    const completionPct = totalCues > 0 ? Math.round((translatedCues / totalCues) * 100) : 0;
    const lastCue = cues[cues.length - 1];
    const totalSeconds = lastCue ? lastCue.endSeconds : 0;
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    const durationFormatted = `${mins}m ${secs.toString().padStart(2, "0")}s`;

    const totalWords = cues.reduce(
      (acc, c) => acc + (c.translatedText || c.originalText).split(/\s+/).filter(Boolean).length,
      0
    );
    const totalChars = cues.reduce(
      (acc, c) => acc + (c.translatedText || c.originalText).length,
      0
    );

    const targetConfig = getTransliterationConfig(targetLang);

    return {
      totalCues,
      translatedCues,
      completionPct,
      durationFormatted,
      totalWords,
      totalChars,
      targetConfig,
    };
  }, [cues, targetLang]);

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishError(null);

    try {
      const response = await fetch("/api/subtitles/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: releaseTitle.trim(),
          description: description.trim(),
          filename: subtitleFile?.filename || "subtitles.srt",
          format: subtitleFile?.format || "srt",
          sourceLang,
          targetLang,
          visibility,
          cues,
          cuesCount: stats.totalCues,
          translatedCuesCount: stats.translatedCues,
          durationFormatted: stats.durationFormatted,
          durationSeconds: cues[cues.length - 1]?.endSeconds || 0,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Failed to publish subtitles");
      }

      const id = resData.id;
      setPublishedId(id);
      setB2Stored(Boolean(resData.b2?.stored));
      const origin = typeof window !== "undefined" ? window.location.origin : "https://subtivio.studio";
      setPublishedUrl(`${origin}/subtitles/${id}`);
      setIsPublished(true);

      // Confetti celebration
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"],
        });
      } catch {
        // Ignore in environments without canvas
      }
    } catch (err: unknown) {
      console.error("Publish error:", err);
      setPublishError(err instanceof Error ? err.message : "Failed to publish subtitles");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!publishedUrl) return;
    try {
      await navigator.clipboard.writeText(publishedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isPublished ? "Subtitles Published!" : "Publish Subtitle Release"}
      description={
        isPublished
          ? "Your localized subtitles are published and ready for sharing or streaming."
          : "Review subtitle details and broadcast parameters before publishing."
      }
      className="max-w-2xl"
    >
      {isPublished ? (
        /* Success Screen */
        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-transparent border border-emerald-500/30 text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/10">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-white">Release is Live</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              "{releaseTitle}" has been packaged with {stats.translatedCues} synchronized cues in{" "}
              {stats.targetConfig.name}.
            </p>
            {b2Stored && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[11px] font-medium text-cyan-400">
                <UploadCloud className="h-3 w-3" />
                <span>Archived to Backblaze B2 Cloud Storage</span>
              </div>
            )}
          </div>

          {/* Shareable Link Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Share2 className="h-3.5 w-3.5 text-blue-400" />
              <span>Public Share Link</span>
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={publishedUrl}
                className="bg-[#12151b] border-white/10 text-xs font-mono text-blue-400 select-all"
              />
              <Button
                type="button"
                onClick={handleCopyLink}
                className="gap-1.5 h-9 px-3.5 shrink-0 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Published Release Summary */}
          <div className="p-3.5 rounded-lg border border-white/[0.08] bg-[#12151b] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-[10px] text-slate-500">Language</div>
              <div className="text-xs font-semibold text-white mt-0.5">
                {stats.targetConfig.flag} {stats.targetConfig.name}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Cues</div>
              <div className="text-xs font-semibold text-white mt-0.5">{stats.totalCues} total</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Duration</div>
              <div className="text-xs font-semibold text-white mt-0.5">{stats.durationFormatted}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Visibility</div>
              <div className="text-xs font-semibold text-emerald-400 capitalize mt-0.5">
                {visibility}
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
            <Link
              href="/subtitles"
              onClick={onClose}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1.5 transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Browse Subtitles Library</span>
            </Link>

            <div className="flex items-center gap-2">
              {publishedId && (
                <Link href={`/subtitles/${publishedId}`} onClick={onClose}>
                  <Button size="sm" className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-500">
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>View Release</span>
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs border-white/10">
                Done
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Publishing Configuration Form */
        <div className="space-y-4">
          {/* Subtitle Details Card */}
          <div className="p-4 rounded-xl border border-white/[0.08] bg-[#12151b] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-400" />
                <span>Subtitle Specifications</span>
              </span>
              <Badge variant="outline" className="text-blue-400 border-blue-500/30 text-[10px]">
                {subtitleFile?.format.toUpperCase() || "SRT"} Format
              </Badge>
            </div>

            {/* Language Pair Banner */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#161a22] border border-white/[0.06] text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Translation Pair:</span>
                <span className="font-medium text-white">{getLanguageName(sourceLang)}</span>
                <span className="text-blue-400 font-bold">➔</span>
                <span className="font-semibold text-blue-300">
                  {stats.targetConfig.flag} {stats.targetConfig.name}
                  {stats.targetConfig.isPhonetic && ` (${stats.targetConfig.inputMode})`}
                </span>
              </div>
              <Badge
                variant={stats.completionPct === 100 ? "success" : "default"}
                className="text-[10px]"
              >
                {stats.completionPct}% Completed
              </Badge>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2 rounded-md bg-[#161a22] border border-white/[0.04] text-center">
                <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                  <Hash className="h-2.5 w-2.5" />
                  <span>Total Cues</span>
                </div>
                <div className="text-sm font-semibold text-white mt-0.5">{stats.totalCues}</div>
              </div>

              <div className="p-2 rounded-md bg-[#161a22] border border-white/[0.04] text-center">
                <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                  <CheckCheck className="h-2.5 w-2.5 text-emerald-400" />
                  <span>Translated</span>
                </div>
                <div className="text-sm font-semibold text-emerald-400 mt-0.5">
                  {stats.translatedCues}
                </div>
              </div>

              <div className="p-2 rounded-md bg-[#161a22] border border-white/[0.04] text-center">
                <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  <span>Duration</span>
                </div>
                <div className="text-sm font-semibold text-white mt-0.5">{stats.durationFormatted}</div>
              </div>

              <div className="p-2 rounded-md bg-[#161a22] border border-white/[0.04] text-center">
                <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                  <Layers className="h-2.5 w-2.5" />
                  <span>Words</span>
                </div>
                <div className="text-sm font-semibold text-white mt-0.5">{stats.totalWords}</div>
              </div>
            </div>
          </div>

          {/* Release Metadata Form */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Release Title / Project Name
              </label>
              <Input
                value={releaseTitle}
                onChange={(e) => setReleaseTitle(e.target.value)}
                placeholder="e.g. Inception Trailer (Malayalam Dub)"
                className="bg-[#12151b] border-white/10 text-xs h-9 text-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Description / Release Notes (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Add notes about translation accuracy, dialect, or timing..."
                className="w-full rounded-md border border-white/10 bg-[#12151b] p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none leading-relaxed"
              />
            </div>

            {/* Visibility Options */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Publish Visibility
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility("public")}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    visibility === "public"
                      ? "border-blue-500/60 bg-blue-500/10 text-white"
                      : "border-white/[0.08] bg-[#12151b] text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium text-xs">
                    <Globe className="h-3.5 w-3.5 text-blue-400" />
                    <span>Public</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                    Searchable & indexed in public subtitle library
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility("unlisted")}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    visibility === "unlisted"
                      ? "border-blue-500/60 bg-blue-500/10 text-white"
                      : "border-white/[0.08] bg-[#12151b] text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium text-xs">
                    <Eye className="h-3.5 w-3.5 text-amber-400" />
                    <span>Unlisted</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                    Accessible only via direct share link
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility("private")}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    visibility === "private"
                      ? "border-blue-500/60 bg-blue-500/10 text-white"
                      : "border-white/[0.08] bg-[#12151b] text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium text-xs">
                    <Lock className="h-3.5 w-3.5 text-slate-300" />
                    <span>Private</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                    Saved to your account & workspace only
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Pre-Publish Quality Check Notice */}
          {stats.completionPct < 100 && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>
                {stats.totalCues - stats.translatedCues} cues are still pending translation. You can still publish, or complete them in the editor.
              </span>
            </div>
          )}

          {/* Error notice if publish failed */}
          {publishError && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{publishError}</span>
            </div>
          )}

          {/* Modal Action Buttons: Publish and Cancel */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isPublishing}
              className="h-8 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handlePublish}
              disabled={isPublishing || !releaseTitle.trim()}
              className="gap-1.5 h-8 text-xs font-medium min-w-[110px]"
            >
              {isPublishing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Publish Now</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
