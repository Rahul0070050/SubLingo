"use client";

import * as React from "react";
import { SubtitleCue } from "@/lib/subtitles/types";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  UploadCloud,
  Film,
  Video,
  X,
  FastForward,
  Rewind,
  Type,
  Sliders,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface SynchronizedPreviewProps {
  cues: SubtitleCue[];
  currentCueId?: number;
  onSelectCue?: (cueId: number) => void;
  seekTimeSeconds?: number;
}

export function SynchronizedPreview({
  cues,
  currentCueId,
  onSelectCue,
  seekTimeSeconds,
}: SynchronizedPreviewProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [mediaSrc, setMediaSrc] = React.useState<string | null>(null);
  const [videoFileName, setVideoFileName] = React.useState<string | null>(null);
  const [videoFileSize, setVideoFileSize] = React.useState<string | null>(null);
  const [mediaType, setMediaType] = React.useState<"video" | "audio" | "simulated">("simulated");
  const [previewMode, setPreviewMode] = React.useState<"translated" | "original" | "bilingual">("translated");
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [volume, setVolume] = React.useState(1);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = React.useState(false);
  const [subtitleSize, setSubtitleSize] = React.useState<"sm" | "md" | "lg">("md");
  const [subtitlePosition, setSubtitlePosition] = React.useState<"bottom" | "top">("bottom");

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);

  // Maximum duration from subtitle cues for simulated timeline
  const maxCueDuration = React.useMemo(() => {
    if (!cues.length) return 30;
    return Math.max(...cues.map((c) => c.endSeconds), 10);
  }, [cues]);

  React.useEffect(() => {
    if (mediaType === "simulated") {
      setDuration(maxCueDuration);
    }
  }, [maxCueDuration, mediaType]);

  // Handle external seek requests from editor clicks
  React.useEffect(() => {
    if (seekTimeSeconds !== undefined && seekTimeSeconds !== null) {
      setCurrentTime(seekTimeSeconds);
      if (videoRef.current) {
        videoRef.current.currentTime = seekTimeSeconds;
      }
    }
  }, [seekTimeSeconds]);

  // Simulated playback timer (when no local video is loaded)
  React.useEffect(() => {
    if (mediaType !== "simulated") return;

    let lastTime = performance.now();
    const updateSimulated = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + delta * playbackRate;
          if (next >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }
      animationFrameRef.current = requestAnimationFrame(updateSimulated);
    };

    if (isPlaying) {
      lastTime = performance.now();
      animationFrameRef.current = requestAnimationFrame(updateSimulated);
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, playbackRate, duration, mediaType]);

  // Find active cue at current time
  const activeCue = React.useMemo(() => {
    return cues.find((c) => currentTime >= c.startSeconds && currentTime <= c.endSeconds);
  }, [cues, currentTime]);

  // Sync active cue with parent editor if changed
  React.useEffect(() => {
    if (activeCue && onSelectCue && activeCue.id !== currentCueId) {
      onSelectCue(activeCue.id);
    }
  }, [activeCue, currentCueId, onSelectCue]);

  // Load video directly into browser memory with URL.createObjectURL (zero server upload)
  const loadLocalMediaFile = (file: File) => {
    if (!file) return;

    // Release old object URL if any
    if (mediaSrc) {
      URL.revokeObjectURL(mediaSrc);
    }

    const objectUrl = URL.createObjectURL(file);
    setMediaSrc(objectUrl);
    setVideoFileName(file.name);
    setVideoFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);

    if (file.type.startsWith("audio/")) {
      setMediaType("audio");
    } else {
      setMediaType("video");
    }

    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadLocalMediaFile(file);
    }
  };

  const handleDropVideo = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingVideo(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
        loadLocalMediaFile(file);
      }
    }
  };

  const clearLoadedVideo = () => {
    if (mediaSrc) {
      URL.revokeObjectURL(mediaSrc);
    }
    setMediaSrc(null);
    setVideoFileName(null);
    setVideoFileSize(null);
    setMediaType("simulated");
    setCurrentTime(0);
    setIsPlaying(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const togglePlay = () => {
    if (mediaType === "video" && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch((err) => console.log("Play error:", err));
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const skipSeconds = (seconds: number) => {
    const next = Math.max(0, Math.min(duration, currentTime + seconds));
    setCurrentTime(next);
    if (videoRef.current) {
      videoRef.current.currentTime = next;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = volume || 1;
      }
    } else {
      setIsMuted(true);
      if (videoRef.current) {
        videoRef.current.muted = true;
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.log(err));
    } else {
      document.exitFullscreen().catch((err) => console.log(err));
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds - Math.floor(seconds)) * 10);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${ms}`;
  };

  const subtitleSizeClasses = {
    sm: "text-xs sm:text-sm px-3 py-1",
    md: "text-sm sm:text-base px-4 py-2",
    lg: "text-base sm:text-xl px-5 py-2.5 font-bold",
  };

  return (
    <div
      ref={containerRef}
      className="rounded-3xl border border-white/10 bg-slate-950/95 overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col"
    >
      {/* Hidden File Input for Video Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*,.mp4,.webm,.mkv,.mov,.avi,.mp3,.wav"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/70 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            <Film className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                Synchronized Video Preview
              </span>
              <Badge
                variant={mediaType === "video" ? "success" : "outline"}
                className="text-[9px] uppercase font-mono py-0 px-1.5 h-4"
              >
                {mediaType === "video" ? "Video Active" : "Timeline Sync"}
              </Badge>
            </div>
            {videoFileName && (
              <p className="text-[10px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                {videoFileName} ({videoFileSize})
              </p>
            )}
          </div>
        </div>

        {/* Top Controls: Mode & Actions */}
        <div className="flex items-center gap-2">
          {/* Subtitle Track Selector */}
          <div className="flex rounded-lg bg-black/50 p-0.5 border border-white/10 text-[10px]">
            <button
              type="button"
              onClick={() => setPreviewMode("translated")}
              className={`px-2 py-1 rounded-md font-semibold transition-all ${
                previewMode === "translated"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Translated
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode("bilingual")}
              className={`px-2 py-1 rounded-md font-semibold transition-all ${
                previewMode === "bilingual"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Bilingual
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode("original")}
              className={`px-2 py-1 rounded-md font-semibold transition-all ${
                previewMode === "original"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Original
            </button>
          </div>

          {/* Load / Change Video Button */}
          {mediaSrc ? (
            <button
              type="button"
              onClick={clearLoadedVideo}
              className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20 transition-colors"
              title="Eject video and reset"
            >
              <X className="h-3 w-3" />
              <span className="hidden sm:inline">Eject</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Upload Video</span>
            </button>
          )}
        </div>
      </div>

      {/* Screen Display Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingVideo(true);
        }}
        onDragLeave={() => setIsDraggingVideo(false)}
        onDrop={handleDropVideo}
        className={`relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden group select-none transition-colors ${
          isDraggingVideo ? "ring-2 ring-indigo-500 bg-indigo-950/40" : ""
        }`}
      >
        {/* Active Local Video Player */}
        {mediaType === "video" && mediaSrc ? (
          <video
            ref={videoRef}
            src={mediaSrc}
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onEnded={() => setIsPlaying(false)}
            playsInline
          />
        ) : (
          /* Empty / Upload Dropzone State */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center cursor-pointer bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950 hover:bg-slate-900/60 transition-all"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center mb-3 text-indigo-400 group-hover:scale-105 group-hover:bg-indigo-600/25 transition-all shadow-xl shadow-indigo-500/10">
              <UploadCloud className="h-8 w-8 animate-pulse" />
            </div>

            <h4 className="text-sm sm:text-base font-bold text-white mb-1">
              Drop local video here, or <span className="text-indigo-400 underline underline-offset-4">browse</span>
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mb-3 leading-relaxed">
              Plays 100% locally in your browser with synchronized subtitles. Nothing is uploaded to any server.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
              <span>MP4</span>
              <span>•</span>
              <span>WebM</span>
              <span>•</span>
              <span>MKV</span>
              <span>•</span>
              <span>MOV</span>
            </div>
          </div>
        )}

        {/* Drag Overlay Notice */}
        {isDraggingVideo && (
          <div className="absolute inset-0 z-30 bg-indigo-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
            <UploadCloud className="h-12 w-12 text-indigo-300 animate-bounce mb-2" />
            <p className="text-base font-bold text-white">Drop video to load instantly!</p>
          </div>
        )}

        {/* Live Cinema Subtitle Overlay (Netflix/Theater grade) */}
        {activeCue && (
          <div
            className={`absolute ${
              subtitlePosition === "top" ? "top-6" : "bottom-6"
            } left-4 right-4 z-20 flex flex-col items-center justify-center text-center pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95`}
          >
            <div
              className={`max-w-3xl rounded-xl bg-black/85 backdrop-blur-md border border-white/20 shadow-2xl text-shadow ${subtitleSizeClasses[subtitleSize]}`}
              style={{
                textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)",
              }}
            >
              {previewMode === "bilingual" ? (
                <div className="space-y-1">
                  <p className="text-amber-300 font-semibold tracking-wide drop-shadow-md">
                    {activeCue.translatedText || activeCue.originalText}
                  </p>
                  <p className="text-white/90 font-medium text-xs sm:text-sm drop-shadow">
                    {activeCue.originalText}
                  </p>
                </div>
              ) : previewMode === "translated" ? (
                <p className="text-amber-300 font-semibold tracking-wide drop-shadow-md">
                  {activeCue.translatedText || activeCue.originalText}
                </p>
              ) : (
                <p className="text-white font-medium tracking-wide drop-shadow-md">
                  {activeCue.originalText}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Media Timeline & Controls */}
      <div className="p-3.5 bg-slate-950 border-t border-white/10 space-y-2.5">
        {/* Scrubber Timeline */}
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono font-medium text-indigo-400 w-12 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 1}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-2 transition-all"
            title="Seek playback position"
          />
          <span className="text-[11px] font-mono text-slate-500 w-12">
            {formatTime(duration)}
          </span>
        </div>

        {/* Playback Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left Group: Play/Pause, Rewind, Fast Forward, Volume */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="default"
              size="icon"
              onClick={togglePlay}
              className="h-9 w-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 active:scale-95 transition-all"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => skipSeconds(-3)}
              className="h-8 w-8 text-slate-400 hover:text-white"
              title="Skip back 3s"
            >
              <Rewind className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => skipSeconds(3)}
              className="h-8 w-8 text-slate-400 hover:text-white"
              title="Skip forward 3s"
            >
              <FastForward className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setCurrentTime(0);
                if (videoRef.current) videoRef.current.currentTime = 0;
              }}
              className="h-8 w-8 text-slate-400 hover:text-white"
              title="Restart from beginning"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>

            {/* Volume Control */}
            {mediaType === "video" && (
              <div className="flex items-center gap-1 ml-1 pl-2 border-l border-white/10">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="text-slate-400 hover:text-white p-1 rounded-md"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-4 w-4 text-red-400" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-14 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                />
              </div>
            )}
          </div>

          {/* Right Group: Cue indicator, Speed, Subtitle Size, Fullscreen */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-md hidden sm:inline">
              {activeCue ? `Cue #${activeCue.id}` : "No Active Cue"}
            </span>

            {/* Subtitle Size Selector */}
            <select
              value={subtitleSize}
              onChange={(e) => setSubtitleSize(e.target.value as "sm" | "md" | "lg")}
              className="bg-slate-900 border border-white/10 text-slate-300 text-[11px] rounded-lg px-2 py-1 focus:outline-none"
              title="Subtitle Size"
            >
              <option value="sm">Text: S</option>
              <option value="md">Text: M</option>
              <option value="lg">Text: L</option>
            </select>

            {/* Playback Speed */}
            <select
              value={playbackRate}
              onChange={(e) => {
                const rate = parseFloat(e.target.value);
                setPlaybackRate(rate);
                if (videoRef.current) videoRef.current.playbackRate = rate;
              }}
              className="bg-slate-900 border border-white/10 text-slate-300 text-[11px] rounded-lg px-2 py-1 focus:outline-none"
              title="Playback Speed"
            >
              <option value="0.75">0.75x</option>
              <option value="1">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>

            {/* Fullscreen Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-8 w-8 text-slate-400 hover:text-white"
              title="Fullscreen"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
