"use client";

import * as React from "react";
import { Clock, Plus, Minus } from "lucide-react";

interface QuickTimeShiftProps {
  onShift?: (offsetMs: number) => void;
  disabled?: boolean;
  className?: string;
}

export function QuickTimeShift({ onShift, disabled = false, className = "" }: QuickTimeShiftProps) {
  const [stepMs, setStepMs] = React.useState<number>(50);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const feedbackTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  const handleApply = (multiplier: 1 | -1) => {
    if (!onShift || disabled) return;
    const delta = multiplier * (stepMs || 50);
    onShift(delta);

    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setFeedback(delta > 0 ? `+${delta}ms` : `${delta}ms`);
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
    }, 1200);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setStepMs(0);
      return;
    }
    const val = parseInt(raw, 10);
    if (!isNaN(val)) {
      setStepMs(Math.max(1, Math.min(60000, val)));
    }
  };

  const handleInputBlur = () => {
    if (!stepMs || stepMs <= 0) {
      setStepMs(50);
    }
  };

  const currentStep = stepMs || 50;

  return (
    <div
      className={`relative inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-[#161a22] px-1.5 py-0.5 text-xs transition-colors hover:border-white/[0.16] ${className}`}
      title="Quick timing shift for all cues"
    >
      <Clock className="h-3 w-3 text-slate-400 shrink-0" />

      {/* Add button (+50ms) */}
      <button
        type="button"
        disabled={disabled || !onShift}
        onClick={() => handleApply(1)}
        className="flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        title={`Shift all cues forward by +${currentStep}ms (delay)`}
      >
        <Plus className="h-2.5 w-2.5" />
        <span>{currentStep}ms</span>
      </button>

      {/* Step Input */}
      <div className="relative flex items-center">
        <input
          type="number"
          min="1"
          max="60000"
          step="10"
          value={stepMs === 0 ? "" : stepMs}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={disabled || !onShift}
          className="w-9 rounded border border-white/[0.08] bg-black/40 px-0.5 py-0.5 text-center font-mono text-[11px] text-blue-400 focus:border-blue-500/50 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-40"
          title="Custom millisecond step"
        />
      </div>

      {/* Subtract button (-50ms) */}
      <button
        type="button"
        disabled={disabled || !onShift}
        onClick={() => handleApply(-1)}
        className="flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[11px] font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        title={`Shift all cues backward by -${currentStep}ms (advance)`}
      >
        <Minus className="h-2.5 w-2.5" />
        <span>{currentStep}ms</span>
      </button>

      {/* Visual feedback popup */}
      {feedback && (
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-blue-600 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white shadow-lg pointer-events-none whitespace-nowrap z-30 animate-in fade-in zoom-in-95">
          {feedback} applied to all
        </span>
      )}
    </div>
  );
}

