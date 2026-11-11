"use client";

import * as React from "react";
import {
  Bold,
  Italic,
  Underline,
  Palette,
  SlidersHorizontal,
  RemoveFormatting,
  Check,
} from "lucide-react";

interface CueStyleToolbarProps {
  text: string;
  settings?: string;
  onUpdate: (updatedText: string, updatedSettings?: string) => void;
  className?: string;
}

const COLOR_PRESETS = [
  { name: "Default (White)", color: "#ffffff", hex: "" },
  { name: "Cinema Yellow", color: "#facc15", hex: "#facc15" },
  { name: "Sky Cyan", color: "#38bdf8", hex: "#38bdf8" },
  { name: "Mint Green", color: "#4ade80", hex: "#4ade80" },
  { name: "Soft Pink", color: "#f472b6", hex: "#f472b6" },
  { name: "Amber Orange", color: "#fb923c", hex: "#fb923c" },
  { name: "Coral Red", color: "#f87171", hex: "#f87171" },
];

const POSITION_PRESETS = [
  { label: "Bottom (Standard)", value: "" },
  { label: "Top Position", value: "line:0% align:center" },
  { label: "Middle Position", value: "line:50% align:center" },
  { label: "Left Aligned", value: "align:left" },
  { label: "Center Aligned", value: "align:center" },
  { label: "Right Aligned", value: "align:right" },
];

function toggleTag(text: string, tag: "b" | "i" | "u"): string {
  const openTag = `<${tag}>`;
  const closeTag = `</${tag}>`;
  const hasTag = new RegExp(`<${tag}>`, "i").test(text);

  if (hasTag) {
    return text
      .replace(new RegExp(`<${tag}>`, "gi"), "")
      .replace(new RegExp(`</${tag}>`, "gi"), "");
  } else {
    if (!text.trim()) return `${openTag}${closeTag}`;
    return `${openTag}${text}${closeTag}`;
  }
}

function applyColor(text: string, hex: string): string {
  const clean = text.replace(/<font[^>]*>/gi, "").replace(/<\/font>/gi, "");
  if (!hex || hex === "#ffffff") {
    return clean;
  }
  return `<font color="${hex}">${clean}</font>`;
}

function stripAllTags(text: string): string {
  return text.replace(/<\/?[^>]+(>|$)/g, "");
}

function extractActiveColor(text: string): string | null {
  const match = text.match(/<font\s+color=["']?([^"'>]+)["']?>/i);
  return match ? match[1] : null;
}

export function CueStyleToolbar({
  text,
  settings = "",
  onUpdate,
  className = "",
}: CueStyleToolbarProps) {
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showPositionPicker, setShowPositionPicker] = React.useState(false);
  const toolbarRef = React.useRef<HTMLDivElement | null>(null);

  const isBold = React.useMemo(() => /<b>/i.test(text), [text]);
  const isItalic = React.useMemo(() => /<i>/i.test(text), [text]);
  const isUnderline = React.useMemo(() => /<u>/i.test(text), [text]);
  const activeColor = React.useMemo(() => extractActiveColor(text), [text]);
  const hasFormatting = isBold || isItalic || isUnderline || !!activeColor || !!settings;

  // Close popovers on click outside
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
        setShowPositionPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleTag = (tag: "b" | "i" | "u") => {
    const updated = toggleTag(text, tag);
    onUpdate(updated, settings);
  };

  const handleSelectColor = (hex: string) => {
    const updated = applyColor(text, hex);
    onUpdate(updated, settings);
    setShowColorPicker(false);
  };

  const handleSelectPosition = (newSettings: string) => {
    onUpdate(text, newSettings);
    setShowPositionPicker(false);
  };

  const handleClearAll = () => {
    const cleanText = stripAllTags(text);
    onUpdate(cleanText, "");
  };

  return (
    <div
      ref={toolbarRef}
      className={`relative inline-flex items-center gap-0.5 rounded-md border border-white/[0.08] bg-[#161a22] p-0.5 text-xs ${className}`}
    >
      {/* Bold toggle */}
      <button
        type="button"
        onClick={() => handleToggleTag("b")}
        className={`flex h-5 w-5 items-center justify-center rounded transition-colors ${
          isBold
            ? "bg-blue-600/30 text-blue-400 font-bold"
            : "text-slate-400 hover:bg-white/[0.08] hover:text-white"
        }`}
        title={isBold ? "Remove Bold (<b>)" : "Apply Bold (<b>)"}
      >
        <Bold className="h-2.5 w-2.5" />
      </button>

      {/* Italic toggle */}
      <button
        type="button"
        onClick={() => handleToggleTag("i")}
        className={`flex h-5 w-5 items-center justify-center rounded transition-colors ${
          isItalic
            ? "bg-blue-600/30 text-blue-400 italic"
            : "text-slate-400 hover:bg-white/[0.08] hover:text-white"
        }`}
        title={isItalic ? "Remove Italic (<i>)" : "Apply Italic (<i>)"}
      >
        <Italic className="h-2.5 w-2.5" />
      </button>

      {/* Underline toggle */}
      <button
        type="button"
        onClick={() => handleToggleTag("u")}
        className={`flex h-5 w-5 items-center justify-center rounded transition-colors ${
          isUnderline
            ? "bg-blue-600/30 text-blue-400 underline"
            : "text-slate-400 hover:bg-white/[0.08] hover:text-white"
        }`}
        title={isUnderline ? "Remove Underline (<u>)" : "Apply Underline (<u>)"}
      >
        <Underline className="h-2.5 w-2.5" />
      </button>

      {/* Font Color Dropdown Toggle */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowColorPicker(!showColorPicker);
            setShowPositionPicker(false);
          }}
          className={`flex h-5 w-5 items-center justify-center rounded transition-colors ${
            activeColor
              ? "bg-white/[0.12] text-white"
              : "text-slate-400 hover:bg-white/[0.08] hover:text-white"
          }`}
          title="Change Subtitle Color"
        >
          <Palette className="h-2.5 w-2.5" />
          {activeColor && (
            <span
              className="absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full ring-1 ring-black"
              style={{ backgroundColor: activeColor }}
            />
          )}
        </button>

        {/* Color Popover */}
        {showColorPicker && (
          <div className="absolute left-0 top-full mt-1.5 z-40 w-44 rounded-lg border border-white/10 bg-[#161a22] p-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95">
            <div className="text-[10px] font-semibold text-slate-400 px-1.5 py-0.5 mb-1 border-b border-white/[0.06]">
              Subtitle Text Color
            </div>
            <div className="space-y-0.5">
              {COLOR_PRESETS.map((item) => {
                const isSelected =
                  (!activeColor && !item.hex) ||
                  (activeColor?.toLowerCase() === item.hex.toLowerCase());
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleSelectColor(item.hex)}
                    className="flex w-full items-center justify-between rounded px-1.5 py-1 text-[11px] text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </div>
                    {isSelected && <Check className="h-3 w-3 text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Position / WebVTT Settings Toggle */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowPositionPicker(!showPositionPicker);
            setShowColorPicker(false);
          }}
          className={`flex h-5 w-5 items-center justify-center rounded transition-colors ${
            settings
              ? "bg-blue-600/30 text-blue-400 font-medium"
              : "text-slate-400 hover:bg-white/[0.08] hover:text-white"
          }`}
          title="Cue Position & Alignment (WebVTT)"
        >
          <SlidersHorizontal className="h-2.5 w-2.5" />
        </button>

        {/* Position Popover */}
        {showPositionPicker && (
          <div className="absolute left-0 top-full mt-1.5 z-40 w-48 rounded-lg border border-white/10 bg-[#161a22] p-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95">
            <div className="text-[10px] font-semibold text-slate-400 px-1.5 py-0.5 mb-1 border-b border-white/[0.06]">
              Cue Position / Align
            </div>
            <div className="space-y-0.5">
              {POSITION_PRESETS.map((item) => {
                const isSelected = (settings || "") === item.value;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSelectPosition(item.value)}
                    className="flex w-full items-center justify-between rounded px-1.5 py-1 text-[11px] text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors"
                  >
                    <span>{item.label}</span>
                    {isSelected && <Check className="h-3 w-3 text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Clear Formatting button */}
      {hasFormatting && (
        <button
          type="button"
          onClick={handleClearAll}
          className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
          title="Clear all styling & formatting tags"
        >
          <RemoveFormatting className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

