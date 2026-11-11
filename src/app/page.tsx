"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Subtitles,
  Sparkles,
  Clock,
  Globe,
  Film,
  Download,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Sliders,
  Check,
  ChevronRight,
  FileCode,
  Gauge,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#090b0e] text-slate-100 flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-200">
      <Header />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
          {/* Subtle ambient lighting */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-blue-600/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-10 right-1/4 w-[300px] h-[200px] bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="container mx-auto px-4 sm:px-6 text-center relative z-10 max-w-5xl">
            {/* Status Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-300 text-xs font-medium mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Professional Subtitle Localization Studio</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
              Frame-Accurate Subtitle Translation{" "}
              <span className="block mt-1 pb-3 bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300 bg-clip-text text-transparent">
                With Zero Timing Drift
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              Translate, synchronize, and format <span className="text-white font-medium">.srt</span> and{" "}
              <span className="text-white font-medium">.vtt</span> subtitles across 50+ languages.
              Preserve millisecond accuracy, formatting tags, and dialogue cadence for broadcast-ready video.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
              <Link href="/translate">
                <Button variant="gradient" size="lg" className="w-full sm:w-auto h-12 px-7 text-sm font-semibold gap-2 shadow-lg shadow-blue-600/20">
                  <Subtitles className="h-4 w-4" />
                  <span>Open Studio Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/editor">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-12 px-6 text-sm font-medium border-white/10 text-slate-200 hover:text-white hover:bg-white/[0.04]"
                >
                  <Layers className="h-4 w-4 mr-2 text-blue-400" />
                  <span>Timeline Cue Editor</span>
                </Button>
              </Link>
            </div>

            {/* Trust & Spec Badges */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-slate-400 mb-16">
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-blue-400" />
                <span>SubRip (.srt) & WebVTT (.vtt)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-blue-400" />
                <span>Frame-Accurate Millisecond Sync</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-blue-400" />
                <span>Characters Per Second (CPS) Guard</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-blue-400" />
                <span>100% Client-Side Privacy</span>
              </div>
            </div>

            {/* Interactive Studio Preview Mockup */}
            <div className="relative mx-auto max-w-4xl rounded-2xl border border-white/[0.1] bg-[#12151b] p-3 sm:p-5 shadow-2xl backdrop-blur-xl text-left">
              {/* Studio Window Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08] mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-slate-400">
                    cosmos_odyssey_ep01.srt
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] text-slate-400 font-mono">
                    EN ➔ ES
                  </Badge>
                  <Badge variant="success" className="text-[10px] font-mono">
                    0.00ms Drift
                  </Badge>
                </div>
              </div>

              {/* Studio Micro Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 mb-3 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="text-slate-300 font-medium">Timing Controls:</span>
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/10 text-slate-300">-50ms</span>
                    <span className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/10 text-slate-300">+50ms</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Gauge className="h-3 w-3 text-emerald-400" />
                  <span>Target CPS: <strong className="text-white font-mono">13-17 CPS</strong> (Standard)</span>
                </div>
              </div>

              {/* Side-by-Side Subtitle Cues */}
              <div className="space-y-2.5 font-mono text-xs">
                {/* Cue #1 */}
                <div className="rounded-xl border border-blue-500/25 bg-blue-950/15 p-3.5 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                      <span className="text-blue-400 font-bold">#1 [00:01:14.200 ➔ 00:01:17.650]</span>
                      <span className="text-slate-500">Duration: 3.45s</span>
                    </div>
                    <p className="text-slate-200 font-sans text-sm">
                      We used to look up at the sky and wonder at our place in the stars.
                    </p>
                  </div>
                  <div className="border-t md:border-t-0 md:border-l border-white/[0.08] pt-2 md:pt-0 md:pl-3.5">
                    <div className="text-[10px] text-blue-300 mb-1 flex items-center justify-between">
                      <span className="font-medium text-slate-300">Spanish (Castilian)</span>
                      <span className="text-emerald-400 font-semibold">14.8 CPS (Optimal)</span>
                    </div>
                    <p className="text-sky-200 font-sans text-sm font-medium">
                      Antes mirábamos al cielo y nos preguntábamos por nuestro lugar en las estrellas.
                    </p>
                  </div>
                </div>

                {/* Cue #2 */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0c0f14]/60 p-3.5 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                      <span className="text-blue-400 font-bold">#2 [00:01:18.100 ➔ 00:01:21.400]</span>
                      <span className="text-slate-500">Duration: 3.30s</span>
                    </div>
                    <p className="text-slate-200 font-sans text-sm">
                      <i>Telemetry confirmed.</i> The gravitational gradient is stabilizing across all sectors.
                    </p>
                  </div>
                  <div className="border-t md:border-t-0 md:border-l border-white/[0.08] pt-2 md:pt-0 md:pl-3.5">
                    <div className="text-[10px] text-blue-300 mb-1 flex items-center justify-between">
                      <span className="font-medium text-slate-300">Spanish (Castilian)</span>
                      <span className="text-emerald-400 font-semibold">15.2 CPS (Optimal)</span>
                    </div>
                    <p className="text-sky-200 font-sans text-sm font-medium">
                      <i>Telemetría confirmada.</i> El gradiente gravitacional se está estabilizando en todos los sectores.
                    </p>
                  </div>
                </div>
              </div>

              {/* Studio Bottom Status Bar */}
              <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-1">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Format: SubRip (.srt)</span>
                  </span>
                  <span>•</span>
                  <span>2 Cues Synchronized</span>
                </div>
                <div className="text-slate-500 font-mono text-[10px]">
                  Ready for export: SRT • VTT • Bilingual
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CORE CAPABILITIES (4 PILLARS) */}
        <section className="py-20 border-t border-white/[0.08] bg-[#0c0f14]/40">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-14 space-y-2.5">
              <Badge variant="outline" className="text-xs uppercase font-mono tracking-wider text-blue-400 border-blue-500/20 bg-blue-500/5">
                Built for Precision
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                Engineered for Professional Subtitle Workflows
              </h2>
              <p className="text-slate-400 text-sm sm:text-base">
                Eliminate manual timing corrections, broken formatting tags, and out-of-sync audio tracks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Pillar 1 */}
              <div className="rounded-xl border border-white/[0.08] bg-[#12151b] p-5 space-y-3 hover:border-blue-500/30 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white">Frame-Accurate Sync</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Start and end timestamps are locked to the millisecond. Shift whole tracks with ±50ms quick nudges to match scene cuts perfectly.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="rounded-xl border border-white/[0.08] bg-[#12151b] p-5 space-y-3 hover:border-blue-500/30 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                  <Globe className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white">50+ Global Languages</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Contextual localization supporting Latin, Cyrillic, CJK, and RTL scripts. Choose between Free Engine, Gemini AI, or OpenAI.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="rounded-xl border border-white/[0.08] bg-[#12151b] p-5 space-y-3 hover:border-blue-500/30 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/10 text-purple-400 border border-purple-500/20">
                  <Film className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white">Video & CPS Guard</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Preview subtitles against local video playback in real time. Continuous Characters Per Second (CPS) metrics warn of rapid text.
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="rounded-xl border border-white/[0.08] bg-[#12151b] p-5 space-y-3 hover:border-blue-500/30 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">
                  <Download className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white">Flexible Studio Export</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Download clean SRT or styled WebVTT files with preserved italics, bold tags, and colors, or stacked bilingual tracks for learners.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW PIPELINE (3 SIMPLE STEPS) */}
        <section className="py-20 border-t border-white/[0.08]">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
              <Badge variant="outline" className="text-xs uppercase font-mono tracking-wider text-slate-400 border-white/10">
                Simple 3-Step Workflow
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                How Subtivio Works
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Go from raw subtitle file to production-ready localized track in three steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="rounded-xl border border-white/[0.08] bg-[#12151b] p-6 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold font-mono text-blue-400">01</span>
                  <FileCode className="h-5 w-5 text-slate-500" />
                </div>
                <h4 className="text-base font-semibold text-white">Import & Parse</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Drag and drop any <code className="text-slate-300">.srt</code> or <code className="text-slate-300">.vtt</code> file. Timestamps, cue indices, and dialogue tags are parsed and validated instantly.
                </p>
              </div>

              {/* Step 2 */}
              <div className="rounded-xl border border-white/[0.08] bg-[#12151b] p-6 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold font-mono text-indigo-400">02</span>
                  <Sliders className="h-5 w-5 text-slate-500" />
                </div>
                <h4 className="text-base font-semibold text-white">Translate & Sync</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select your target language and engine. Fine-tune translations side-by-side, verify CPS pace warnings, and adjust timing offsets by ±50ms.
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded-xl border border-white/[0.08] bg-[#12151b] p-6 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold font-mono text-emerald-400">03</span>
                  <CheckCircle2 className="h-5 w-5 text-slate-500" />
                </div>
                <h4 className="text-base font-semibold text-white">Export & Publish</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Export broadcast-ready SubRip (.srt), WebVTT (.vtt), or bilingual stacked subtitles directly into your video editing software or YouTube.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="py-20 border-t border-white/[0.08] bg-gradient-to-b from-[#090b0e] to-[#0c1017]">
          <div className="container mx-auto px-4 sm:px-6 text-center max-w-3xl space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Ready to Localize Your Subtitles?
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
              No registration or credit card required. Import your subtitle file and experience frame-accurate translation in seconds.
            </p>
            <div className="pt-2">
              <Link href="/translate">
                <Button variant="gradient" size="lg" className="h-12 px-8 text-sm font-semibold gap-2 shadow-lg shadow-blue-600/20">
                  <Subtitles className="h-4 w-4" />
                  <span>Open Studio Workspace Now</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.08] bg-[#090b0e] pt-14 pb-8 text-xs text-slate-400">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand & Mission */}
            <div className="space-y-3.5 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/90 text-white shadow-sm border border-blue-400/20">
                  <Subtitles className="h-3.5 w-3.5" />
                </div>
                <span className="text-base font-semibold tracking-tight text-white">
                  Subtivio <span className="text-slate-400 font-normal text-xs">Studio</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Professional frame-accurate subtitle translation and timing synchronization for global creators and localization teams.
              </p>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>All Systems Operational</span>
              </div>
            </div>

            {/* Col 2: Studio Workspaces */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                Workspaces
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/translate" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
                    <Globe className="h-3 w-3 text-blue-400" />
                    <span>Translate Workspace</span>
                  </Link>
                </li>
                <li>
                  <Link href="/editor" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
                    <Layers className="h-3 w-3 text-indigo-400" />
                    <span>Cue Timeline Editor</span>
                  </Link>
                </li>
                <li>
                  <Link href="/subtitles" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
                    <Film className="h-3 w-3 text-purple-400" />
                    <span>Subtitle Library</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Core Capabilities */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                Capabilities
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-cyan-400" />
                  <span>Frame-Accurate Millisecond Sync</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-amber-400" />
                  <span>Reading Speed (CPS) Protection</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Download className="h-3 w-3 text-emerald-400" />
                  <span>Bilingual Stacked & Inline Export</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-blue-400" />
                  <span>100% Client-Side Video Privacy</span>
                </li>
              </ul>
            </div>

            {/* Col 4: Supported Formats & Engines */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                Standards & Engines
              </h4>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[10px] text-slate-300 border-white/10">.SRT (SubRip)</Badge>
                <Badge variant="outline" className="text-[10px] text-slate-300 border-white/10">.VTT (WebVTT)</Badge>
                <Badge variant="outline" className="text-[10px] text-slate-300 border-white/10">Gemini AI</Badge>
                <Badge variant="outline" className="text-[10px] text-slate-300 border-white/10">OpenAI GPT-4o</Badge>
                <Badge variant="outline" className="text-[10px] text-slate-300 border-white/10">DeepL</Badge>
                <Badge variant="outline" className="text-[10px] text-slate-300 border-white/10">Free Engine</Badge>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Formatted dialogue tags (&lt;i&gt;, &lt;b&gt;, &lt;u&gt;) and cue positioning headers are preserved natively.
              </p>
            </div>
          </div>

          {/* Bottom Copyright Row */}
          <div className="pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
            <div>
              © {new Date().getFullYear()} Subtivio Studio. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>Zero Timing Drift Guarantee</span>
              <span>•</span>
              <span>50+ Languages Supported</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
