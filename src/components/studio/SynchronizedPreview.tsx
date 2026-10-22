"use client";

import * as React from "react";
import { SubtitleCue } from "@/lib/subtitles/types";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Video, Film, Eye } from "lucide-react";
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
  const [mediaType, setMediaType] = React.useState<"video" | "audio" | "simulated">("simulated");
  const [previewMode, setPreviewMode] = React.useState<"translated" | "original" | "bilingual">("translated");
  const [playbackRate, setPlaybackRate] = React.useState(1);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);

  // Maximum duration from subtitle cues
  const maxCueDuration = React.useMemo(() => {
    if (!cues.length) return 30;
    return Math.max(...cues.map((c) => c.endSeconds), 10);
  }, [cues]);

  React.useEffect(() => {
    if (mediaType === "simulated") {
      setDuration(maxCueDuration);
    }
  }, [maxCueDuration, mediaType]);

  // Handle external seek requests
  React.useEffect(() => {
    if (seekTimeSeconds !== undefined && seekTimeSeconds !== null) {
      setCurrentTime(seekTimeSeconds);
      if (videoRef.current) videoRef.current.currentTime = seekTimeSeconds;
      if (audioRef.current) audioRef.current.currentTime = seekTimeSeconds;
    }
  }, [seekTimeSeconds]);

  // Simulated playback timer
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

  // Sync active cue with parent if changed
  React.useEffect(() => {
    if (activeCue && onSelectCue && activeCue.id !== currentCueId) {
      onSelectCue(activeCue.id);
    }
  }, [activeCue, currentCueId, onSelectCue]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setMediaSrc(url);
    if (file.type.startsWith("video/")) {
      setMediaType("video");
    } else if (file.type.startsWith("audio/")) {
      setMediaType("audio");
    }
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (mediaType === "video" && videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
    } else if (mediaType === "audio" && audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) videoRef.current.currentTime = newTime;
    if (audioRef.current) audioRef.current.currentTime = newTime;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds - Math.floor(seconds)) * 10);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${ms}`;
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/90 overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">
            Synchronized Video Preview
          </span>
          <Badge variant="outline" className="text-[10px] uppercase font-mono">
            {mediaType}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Overlay Language Mode */}
          <div className="flex rounded-lg bg-black/40 p-0.5 border border-white/10 text-[10px]">
            <button
              onClick={() => setPreviewMode("translated")}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                previewMode === "translated" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Translated
            </button>
            <button
              onClick={() => setPreviewMode("bilingual")}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                previewMode === "bilingual" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Bilingual
            </button>
            <button
              onClick={() => setPreviewMode("original")}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                previewMode === "original" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Original
            </button>
          </div>

          {/* Upload media button */}
          <label className="cursor-pointer text-slate-400 hover:text-white text-xs font-medium px-2 py-1 rounded-lg border border-white/10 hover:border-white/20 transition-all flex items-center gap-1">
            <Video className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Load Video/Audio</span>
            <input
              type="file"
              accept="video/*,audio/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {/* Screen Display Area */}
      <div className="relative aspect-video w-full bg-slate-900/90 flex items-center justify-center overflow-hidden group select-none">
        {mediaType === "video" && mediaSrc ? (
          <video
            ref={videoRef}
            src={mediaSrc}
            className="w-full h-full object-contain"
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onEnded={() => setIsPlaying(false)}
          />
        ) : (
          /* Simulated Cinema Canvas */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3 text-indigo-400 shadow-inner">
              <Film className="h-8 w-8 opacity-75" />
            </div>
            <p className="text-xs text-slate-400 max-w-sm">
              Interactive timeline simulation active. Load a video or hit Play to preview live synchronized subtitle rendering!
            </p>
          </div>
        )}

        {/* Live Subtitle Overlay */}
        {activeCue && (
          <div className="absolute bottom-6 left-4 right-4 z-20 flex flex-col items-center justify-center text-center pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95">
            <div className="max-w-2xl px-4 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 shadow-2xl">
              {previewMode === "bilingual" ? (
                <div className="space-y-1">
                  <p className="text-amber-300 font-semibold text-sm sm:text-base drop-shadow-md">
                    {activeCue.translatedText || activeCue.originalText}
                  </p>
                  <p className="text-white/80 text-xs sm:text-sm drop-shadow">
                    {activeCue.originalText}
                  </p>
                </div>
              ) : previewMode === "translated" ? (
                <p className="text-amber-300 font-semibold text-sm sm:text-base drop-shadow-md">
                  {activeCue.translatedText || activeCue.originalText}
                </p>
              ) : (
                <p className="text-white font-medium text-sm sm:text-base drop-shadow-md">
                  {activeCue.originalText}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Media Timeline & Controls */}
      <div className="p-3 bg-slate-950 border-t border-white/10 space-y-2">
        {/* Progress Bar / Scrubber */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-indigo-400 w-12 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 1}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-[11px] font-mono text-slate-500 w-12">
            {formatTime(duration)}
          </span>
        </div>

        {/* Playback Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlay}
              className="h-8 w-8 rounded-lg bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
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

            <span className="text-[11px] text-slate-400">
              {activeCue ? `Cue #${activeCue.id}` : "Idle"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Playback speed */}
            <select
              value={playbackRate}
              onChange={(e) => {
                const rate = parseFloat(e.target.value);
                setPlaybackRate(rate);
                if (videoRef.current) videoRef.current.playbackRate = rate;
              }}
              className="bg-slate-900 border border-white/10 text-slate-300 text-[11px] rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value="0.75">0.75x</option>
              <option value="1">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
