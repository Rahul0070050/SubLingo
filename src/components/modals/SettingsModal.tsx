"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { TranslationSettings } from "@/lib/subtitles/types";
import { Key, Sparkles, BookOpen, Sliders, ShieldCheck, Plus, Trash2 } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TranslationSettings;
  onSave: (newSettings: TranslationSettings) => void;
}

export function SettingsModal({ isOpen, onClose, settings, onSave }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = React.useState<TranslationSettings>(settings);
  const [newGlossaryTerm, setNewGlossaryTerm] = React.useState("");
  const [newGlossaryTrans, setNewGlossaryTrans] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"provider" | "glossary" | "advanced">("provider");

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  const handleAddGlossary = () => {
    if (!newGlossaryTerm.trim() || !newGlossaryTrans.trim()) return;
    setLocalSettings((prev) => ({
      ...prev,
      glossary: {
        ...(prev.glossary || {}),
        [newGlossaryTerm.trim()]: newGlossaryTrans.trim(),
      },
    }));
    setNewGlossaryTerm("");
    setNewGlossaryTrans("");
  };

  const handleRemoveGlossary = (term: string) => {
    setLocalSettings((prev) => {
      const copy = { ...(prev.glossary || {}) };
      delete copy[term];
      return { ...prev, glossary: copy };
    });
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Translation Studio Preferences"
      description="Configure translation engines, API keys, glossary, and localized tone."
      className="max-w-2xl"
    >
      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-6 gap-2">
        <button
          onClick={() => setActiveTab("provider")}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${activeTab === "provider"
            ? "border-indigo-500 text-white"
            : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
        >
          <Sparkles className="h-4 w-4" />
          Translation Engine
        </button>
        <button
          onClick={() => setActiveTab("glossary")}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${activeTab === "glossary"
            ? "border-indigo-500 text-white"
            : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
        >
          <BookOpen className="h-4 w-4" />
          Terminology Glossary
          {localSettings.glossary && Object.keys(localSettings.glossary).length > 0 && (
            <Badge variant="gradient" className="text-[10px] px-1 py-0">
              {Object.keys(localSettings.glossary).length}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab("advanced")}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${activeTab === "advanced"
            ? "border-indigo-500 text-white"
            : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
        >
          <Sliders className="h-4 w-4" />
          Tone & Batches
        </button>
      </div>

      {/* Content based on Tab */}
      {activeTab === "provider" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Free Web Engine */}
            <div
              onClick={() => setLocalSettings((p) => ({ ...p, provider: "free-engine" }))}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${localSettings.provider === "free-engine"
                ? "bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500/50"
                : "bg-white/[0.02] border-white/10 hover:border-white/20"
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">Free Engine</span>
                <Badge variant="success" className="text-[10px]">Ready</Badge>
              </div>
              <p className="text-xs text-slate-400">
                Zero configuration required. Instant server-side multi-language translation.
              </p>
            </div>

            {/* Google Gemini */}
            <div
              onClick={() => setLocalSettings((p) => ({ ...p, provider: "gemini" }))}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${localSettings.provider === "gemini"
                ? "bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500/50"
                : "bg-white/[0.02] border-white/10 hover:border-white/20"
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">Google Gemini</span>
                <Badge variant="gradient" className="text-[10px]">AI Pro</Badge>
              </div>
              <p className="text-xs text-slate-400">
                Contextual nuance, idiom translation, and strict timing preservation.
              </p>
            </div>

            {/* OpenAI */}
            <div
              onClick={() => setLocalSettings((p) => ({ ...p, provider: "openai" }))}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${localSettings.provider === "openai"
                ? "bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500/50"
                : "bg-white/[0.02] border-white/10 hover:border-white/20"
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">OpenAI</span>
                <Badge variant="outline" className="text-[10px]">GPT-4o</Badge>
              </div>
              <p className="text-xs text-slate-400">
                High-fidelity dialogue adaptation and natural multilingual flow.
              </p>
            </div>
          </div>

          {/* API Key configuration for Gemini or OpenAI */}
          {localSettings.provider !== "free-engine" && (
            <div className="mt-4 p-4 rounded-xl border border-white/10 bg-black/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Key className="h-4 w-4 text-indigo-400" />
                <span>
                  {localSettings.provider === "gemini" ? "Google Gemini API Key" : "OpenAI API Key"}
                </span>
              </div>
              <Input
                type="password"
                placeholder={
                  localSettings.provider === "gemini" ? "AIzaSy..." : "sk-..."
                }
                value={localSettings.apiKey || ""}
                onChange={(e) => setLocalSettings((p) => ({ ...p, apiKey: e.target.value }))}
                className="font-mono text-xs"
              />
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>
                  Your API key is kept securely in your browser.
                </span>
              </div>

              {localSettings.provider === "gemini" && (
                <div className="pt-2">
                  <label className="text-xs text-slate-300 block mb-1">Model Selection</label>
                  <select
                    value={localSettings.model || "gemini-2.5-flash"}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, model: e.target.value }))}
                    className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast & recommended)</option>
                    <option value="gemini-flash-lite-latest">Gemini Flash-Lite (Ultra fast)</option>
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Deep nuance & context)</option>
                  </select>
                </div>
              )}

              {localSettings.provider === "openai" && (
                <div className="pt-2">
                  <label className="text-xs text-slate-300 block mb-1">Model Selection</label>
                  <select
                    value={localSettings.model || "gpt-4o-mini"}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, model: e.target.value }))}
                    className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="gpt-4o-mini">GPT-4o-mini (Fast & efficient)</option>
                    <option value="gpt-4o">GPT-4o (High precision)</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Glossary Tab */}
      {activeTab === "glossary" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Define specific terminology, character names, or domain terms to prevent incorrect translations.
          </p>

          <div className="flex gap-2">
            <Input
              placeholder="Source term (e.g. Warp Drive)"
              value={newGlossaryTerm}
              onChange={(e) => setNewGlossaryTerm(e.target.value)}
              className="text-xs"
            />
            <Input
              placeholder="Required translation (e.g. Impulso Warp)"
              value={newGlossaryTrans}
              onChange={(e) => setNewGlossaryTrans(e.target.value)}
              className="text-xs"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddGlossary}
              className="gap-1 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 border border-white/10 rounded-xl p-2 bg-black/20">
            {localSettings.glossary && Object.keys(localSettings.glossary).length > 0 ? (
              Object.entries(localSettings.glossary).map(([term, translation]) => (
                <div
                  key={term}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{term}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-indigo-300 font-medium">{translation}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveGlossary(term)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">No glossary terms added yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Advanced Tab */}
      {activeTab === "advanced" && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white block mb-1.5">Dialogue Tone</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["natural", "formal", "casual", "literal"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setLocalSettings((p) => ({ ...p, tone: t }))}
                  className={`p-2.5 rounded-xl border text-xs font-medium capitalize transition-all ${(localSettings.tone || "natural") === t
                    ? "bg-indigo-600/25 border-indigo-500 text-white"
                    : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-white"
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Natural adapts idioms and speech rhythm; Formal adheres to polite grammar; Casual uses colloquial expressions.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-white block mb-1.5">Batch Chunk Size</label>
            <select
              value={localSettings.batchSize || 20}
              onChange={(e) => setLocalSettings((p) => ({ ...p, batchSize: parseInt(e.target.value) }))}
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value={10}>10 cues / batch (Best for strict rate-limits)</option>
              <option value={20}>20 cues / batch (Recommended balance)</option>
              <option value={40}>40 cues / batch (Faster for large files)</option>
            </select>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10 mt-6">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="gradient" size="sm" onClick={handleSave}>
          Apply Preferences
        </Button>
      </div>
    </Modal>
  );
}
