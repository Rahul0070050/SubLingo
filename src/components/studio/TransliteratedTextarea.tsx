"use client";

import * as React from "react";
import { getTransliterationConfig } from "@/lib/transliteration/languages";
import { fetchTransliterationCandidates } from "@/lib/transliteration/transliterateClient";
import { Keyboard, Sparkles, Check, Globe, HelpCircle, X } from "lucide-react";

interface TransliteratedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  targetLang: string;
  placeholder?: string;
  rows?: number;
  className?: string;
  cueId?: number;
  rightAction?: React.ReactNode;
}

interface LastConversion {
  original: string;
  converted: string;
  start: number;
  end: number;
}

export function TransliteratedTextarea({
  value,
  onChange,
  targetLang,
  placeholder,
  rows = 2,
  className,
  cueId,
  rightAction,
}: TransliteratedTextareaProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [isEnabled, setIsEnabled] = React.useState(true);
  const [isFocused, setIsFocused] = React.useState(false);
  const [candidates, setCandidates] = React.useState<string[]>([]);
  const [selectedCandidateIdx, setSelectedCandidateIdx] = React.useState(0);
  const [activeWordInfo, setActiveWordInfo] = React.useState<{
    word: string;
    start: number;
    end: number;
  } | null>(null);
  const [lastConversion, setLastConversion] = React.useState<LastConversion | null>(null);

  const config = React.useMemo(() => {
    return getTransliterationConfig(targetLang);
  }, [targetLang]);

  // Reset suggestions when target language changes or blur
  React.useEffect(() => {
    setCandidates([]);
    setActiveWordInfo(null);
    setLastConversion(null);
  }, [targetLang]);

  // Extract current word being typed before cursor
  const checkCurrentWord = React.useCallback(
    (text: string, cursorPos: number) => {
      if (!config.isPhonetic || !isEnabled) {
        setCandidates([]);
        setActiveWordInfo(null);
        return;
      }

      const textBefore = text.slice(0, cursorPos);
      // Look for english word characters up to cursor
      const match = textBefore.match(/([a-zA-Z0-9']+)$/);

      if (match && match[1] && match[1].length >= 1) {
        const word = match[1];
        const start = cursorPos - word.length;
        const end = cursorPos;

        setActiveWordInfo({ word, start, end });

        // Debounce candidate fetch
        fetchTransliterationCandidates(word, targetLang).then((results) => {
          if (results.length > 0) {
            setCandidates(results);
            setSelectedCandidateIdx(0);
          }
        });
      } else {
        setCandidates([]);
        setActiveWordInfo(null);
      }
    },
    [config.isPhonetic, isEnabled, targetLang]
  );

  // Apply a candidate replacement
  const applyCandidate = React.useCallback(
    (
      candidate: string,
      trailingChar: string = "",
      wordInfo?: { word: string; start: number; end: number }
    ) => {
      const info = wordInfo || activeWordInfo;
      const textarea = textareaRef.current;
      if (!info || !textarea) return;

      const currentValue = textarea.value;
      const before = currentValue.slice(0, info.start);
      const after = currentValue.slice(info.end);
      const replacement = candidate + trailingChar;
      const newValue = before + replacement + after;
      const newCursorPos = info.start + replacement.length;

      // Save for backspace undo
      setLastConversion({
        original: info.word,
        converted: candidate,
        start: info.start,
        end: info.start + candidate.length,
      });

      onChange(newValue);
      setCandidates([]);
      setActiveWordInfo(null);

      // Restore cursor position in next tick
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    },
    [activeWordInfo, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Universal shortcut: Ctrl+G (or Cmd+G) to toggle transliteration
    if ((e.ctrlKey || e.metaKey) && (e.key === "g" || e.key === "G")) {
      e.preventDefault();
      setIsEnabled((prev) => !prev);
      setCandidates([]);
      setActiveWordInfo(null);
      return;
    }

    if (!config.isPhonetic || !isEnabled) {
      return;
    }

    // If suggestions are visible, handle arrow navigation and numeric selection
    if (candidates.length > 0 && activeWordInfo) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedCandidateIdx((prev) => (prev + 1) % candidates.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedCandidateIdx((prev) =>
          prev === 0 ? candidates.length - 1 : prev - 1
        );
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setCandidates([]);
        setActiveWordInfo(null);
        return;
      }

      // Check for numeric candidate selection (1-5)
      if (["1", "2", "3", "4", "5"].includes(e.key)) {
        const num = parseInt(e.key, 10) - 1;
        if (num < candidates.length) {
          e.preventDefault();
          applyCandidate(candidates[num], " ");
          return;
        }
      }
    }

    // Space, Enter, or punctuation trigger transliteration
    const isTriggerKey =
      e.key === " " ||
      e.key === "Enter" ||
      [".", ",", "!", "?", ";", ":"].includes(e.key);

    if (isTriggerKey && activeWordInfo) {
      const chosen =
        candidates[selectedCandidateIdx] || candidates[0] || activeWordInfo.word;

      // If we already have candidates or word info, replace it
      if (chosen && chosen !== activeWordInfo.word) {
        e.preventDefault();
        const trailing = e.key === "Enter" ? "\n" : e.key;
        applyCandidate(chosen, trailing);
        return;
      }
    }

    // Backspace undo: if user immediately presses backspace right after a conversion,
    // revert the word back to its original typed English form
    if (e.key === "Backspace" && lastConversion && textareaRef.current) {
      const cursor = textareaRef.current.selectionStart;
      // If cursor is right at the end of the converted word or immediately after space
      if (cursor === lastConversion.end || cursor === lastConversion.end + 1) {
        e.preventDefault();
        const curVal = textareaRef.current.value;
        const before = curVal.slice(0, lastConversion.start);
        const after = curVal.slice(cursor);
        const restored = before + lastConversion.original + after;
        const newCursor = lastConversion.start + lastConversion.original.length;

        onChange(restored);
        setLastConversion(null);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(newCursor, newCursor);
            checkCurrentWord(restored, newCursor);
          }
        }, 0);
        return;
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    const cursorPos = e.target.selectionStart;
    onChange(newVal);
    checkCurrentWord(newVal, cursorPos);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (textareaRef.current && !["ArrowDown", "ArrowUp", "Escape"].includes(e.key)) {
      checkCurrentWord(
        textareaRef.current.value,
        textareaRef.current.selectionStart
      );
    }
  };

  return (
    <div className="relative group/field">
      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          rows={rows}
          placeholder={
            placeholder ||
            (config.isPhonetic && isEnabled
              ? `Type in ${config.inputMode} (e.g., "${config.example.split(" ➔ ")[0]}")...`
              : "Click to enter or edit translation...")
          }
          onFocus={() => {
            setIsFocused(true);
            if (textareaRef.current) {
              checkCurrentWord(
                textareaRef.current.value,
                textareaRef.current.selectionStart
              );
            }
          }}
          onBlur={() => {
            setIsFocused(false);
            // Delay clearing so clicks on suggestions can register
            setTimeout(() => {
              setCandidates([]);
              setActiveWordInfo(null);
            }, 250);
          }}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onChange={handleChange}
          className={
            className ||
            `w-full rounded-md border p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-all leading-relaxed resize-y ${isFocused && config.isPhonetic && isEnabled
              ? "border-blue-500/80 bg-[#161a22] ring-1 ring-blue-500/30"
              : "border-white/[0.08] bg-[#161a22] focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            }`
          }
        />

        {/* Right action button (e.g. re-translate single cue) */}
        {rightAction && (
          <div className="absolute right-2 bottom-2.5 flex items-center gap-1 z-10">
            {rightAction}
          </div>
        )}
      </div>

      {/* Floating Transliteration Candidate Suggestions Bar */}
      {candidates.length > 0 && activeWordInfo && isFocused && (
        <div className="absolute left-0 top-full mt-0 z-30 flex flex-col items-start gap-2 p-1.5 rounded-lg bg-[#1a202c] border border-blue-500/40 shadow-xl shadow-black/60 backdrop-blur-md animate-in fade-in slide-in-from-bottom-1 duration-150">

          <div className="flex items-center gap-1 pr-1 text-[10px] text-blue-400 font-medium">
            <Sparkles className="h-3 w-3" />
            <span>{config.inputMode}:</span>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setCandidates([]);
                setActiveWordInfo(null);
              }}
              className="p-1 text-slate-400 hover:text-white rounded"
              title="Dismiss suggestions (Esc)"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {candidates.map((cand, idx) => {
            const isSelected = idx === selectedCandidateIdx;
            return (
              <button
                key={`${cand}-${idx}`}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // keep textarea focused
                  applyCandidate(cand, " ");
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${isSelected
                  ? "bg-blue-600 text-white font-medium shadow-sm"
                  : "bg-white/[0.06] text-slate-200 hover:bg-white/[0.12] hover:text-white"
                  }`}
              >
                <span className="text-[10px] opacity-60 font-mono">
                  {idx + 1}.
                </span>
                <span>{cand}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
