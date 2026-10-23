"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Subtitles,
  Sparkles,
  Clock,
  Globe,
  Film,
  Download,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Sliders,
  Play,
  Code2,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Header />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-20 pb-28 md:pt-28 md:pb-36">
          {/* Ambient background glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-24 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="container mx-auto px-4 sm:px-8 text-center relative z-10 max-w-5xl">
            <Badge
              variant="gradient"
              className="py-1.5 px-4 text-xs tracking-wider uppercase font-semibold mb-6 shadow-lg shadow-indigo-500/10"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-indigo-300" />
              SubLingo Subtitle Studio • Next.js AI Engine
            </Badge>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
              Translate Subtitles with{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                Zero Timing Drift
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              Translate <span className="text-white font-semibold">.srt</span> and{" "}
              <span className="text-white font-semibold">.vtt</span> files into 50+ languages.
              Keep timestamps, formatting tags, and dialogue cadence 100% synchronized.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/translate">
                <Button variant="gradient" size="lg" className="w-full sm:w-auto text-base font-bold gap-2.5 h-13 px-8 shadow-indigo-500/30">
                  <Subtitles className="h-5 w-5" />
                  <span>Launch Studio Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/editor">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-base font-medium border-white/10 text-slate-300 hover:text-white h-13 px-6"
                >
                  <Subtitles className="h-4 w-4 mr-2 text-indigo-400" />
                  Edit Subtitles
                </Button>
              </Link>
            </div>

            {/* Interactive Preview Mockup Box */}
            <div className="relative mx-auto max-w-4xl rounded-3xl border border-white/15 bg-slate-900/80 p-2 sm:p-4 shadow-2xl backdrop-blur-2xl text-left">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-slate-400">cosmos_scene_01.srt — Synchronized Studio</span>
                </div>
                <Badge variant="success" className="text-[10px]">
                  Frame-Accurate
                </Badge>
              </div>

              {/* Side-by-Side Mockup Cues */}
              <div className="space-y-3 font-mono text-xs">
                <div className="rounded-2xl border border-indigo-500/40 bg-indigo-950/20 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                      <span className="text-indigo-400 font-bold">#1 [00:00:01,200 ➔ 00:00:04,500]</span>
                      <span>EN-US</span>
                    </div>
                    <p className="text-slate-200 font-sans text-sm">
                      Commander, telemetry indicates an unexpected gravitational distortion ahead.
                    </p>
                  </div>
                  <div className="border-t md:border-t-0 md:border-l border-white/10 pt-2 md:pt-0 md:pl-4">
                    <div className="text-[10px] text-indigo-300 mb-1 flex items-center justify-between">
                      <span className="font-bold">Translated to Spanish (ES)</span>
                      <span className="text-emerald-400">14.2 CPS</span>
                    </div>
                    <p className="text-amber-300 font-sans text-sm font-medium">
                      Comandante, la telemetría indica una distorsión gravitacional inesperada adelante.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                      <span className="text-indigo-400 font-bold">#2 [00:00:05,100 ➔ 00:00:08,400]</span>
                      <span>EN-US</span>
                    </div>
                    <p className="text-slate-200 font-sans text-sm">
                      <i>Diverting secondary coils now.</i> Structural integrity is holding at 84 percent.
                    </p>
                  </div>
                  <div className="border-t md:border-t-0 md:border-l border-white/10 pt-2 md:pt-0 md:pl-4">
                    <div className="text-[10px] text-indigo-300 mb-1 flex items-center justify-between">
                      <span className="font-bold">Translated to Spanish (ES)</span>
                      <span className="text-emerald-400">15.8 CPS</span>
                    </div>
                    <p className="text-amber-300 font-sans text-sm font-medium">
                      <i>Desviando las bobinas secundarias ahora.</i> La integridad estructural se mantiene al 84 por ciento.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CORE FEATURES SECTION */}
        <section className="py-20 border-t border-white/10 bg-slate-950/50">
          <div className="container mx-auto px-4 sm:px-8 max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <Badge variant="outline" className="text-xs uppercase font-mono tracking-wider">
                Built for Creators & Translators
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Everything You Need for Subtitle Localization
              </h2>
              <p className="text-slate-400 text-sm sm:text-base">
                SubLingo preserves subtitle integrity where conventional translators fail.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <Card className="border-white/10 bg-slate-900/40 hover:border-indigo-500/40 transition-all p-2">
                <CardContent className="p-6 space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-2">
                    <Clock className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Frame-Accurate Timestamps</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Zero timing drift. Every start time and end time is preserved down to the millisecond across SRT and WebVTT formats.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="border-white/10 bg-slate-900/40 hover:border-purple-500/40 transition-all p-2">
                <CardContent className="p-6 space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 mb-2">
                    <Globe className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">50+ Global Languages</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Automatic source language detection with support for major world languages, character sets, and right-to-left scripts.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="border-white/10 bg-slate-900/40 hover:border-pink-500/40 transition-all p-2">
                <CardContent className="p-6 space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-400 mb-2">
                    <Film className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Synchronized Video Player</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Preview your translated subtitles in real-time overlaid on video or interactive timeline playback before exporting.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card className="border-white/10 bg-slate-900/40 hover:border-cyan-500/40 transition-all p-2">
                <CardContent className="p-6 space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 mb-2">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Multi-Engine Intelligence</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Free built-in engine with zero configuration, or connect your personal Google Gemini or OpenAI API keys for contextual dialogue.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 5 */}
              <Card className="border-white/10 bg-slate-900/40 hover:border-amber-500/40 transition-all p-2">
                <CardContent className="p-6 space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 mb-2">
                    <Sliders className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Reading Speed (CPS) Check</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Real-time calculation of Characters Per Second so your viewers never struggle with subtitles flashing by too fast.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 6 */}
              <Card className="border-white/10 bg-slate-900/40 hover:border-emerald-500/40 transition-all p-2">
                <CardContent className="p-6 space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 mb-2">
                    <Download className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Bilingual & Timing Shifts</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Export translated only, or bilingual stacked tracks for language students, with millisecond timeline offset controls.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* WORKFLOW PIPELINE SECTION */}
        <section className="py-20 border-t border-white/10">
          <div className="container mx-auto px-4 sm:px-8 max-w-5xl">
            <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
              <Badge variant="gradient" className="text-xs uppercase font-mono">
                Streamlined Pipeline
              </Badge>
              <h2 className="text-3xl font-extrabold text-white">
                How SubLingo Works
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative">
              {[
                {
                  step: "01",
                  title: "Upload & Parse",
                  desc: "Drag & drop your .srt or .vtt file. Extracted cues and timing blocks are validated immediately.",
                },
                {
                  step: "02",
                  title: "Target & Engine",
                  desc: "Select from 50+ languages and choose Free Engine, Gemini AI, or OpenAI with custom tone.",
                },
                {
                  step: "03",
                  title: "Side-by-Side Review",
                  desc: "Edit translations inline, monitor CPS speed warnings, and sync with live video playback.",
                },
                {
                  step: "04",
                  title: "Export & Download",
                  desc: "Download pristine SRT or VTT files, or bilingual stacked tracks ready for video editors.",
                },
              ].map((item, index) => (
                <div
                  key={item.step}
                  className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 space-y-2 relative"
                >
                  <span className="text-3xl font-extrabold font-mono text-indigo-500/40">
                    {item.step}
                  </span>
                  <h4 className="text-base font-bold text-white">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="py-20 border-t border-white/10 relative overflow-hidden bg-gradient-to-b from-slate-950 to-indigo-950/30">
          <div className="container mx-auto px-4 sm:px-8 text-center max-w-3xl space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Ready to Translate Your Subtitles?
            </h2>
            <p className="text-base text-slate-400">
              No registration or credit card needed. Start translating your files in seconds.
            </p>
            <div>
              <Link href="/translate">
                <Button variant="gradient" size="lg" className="h-14 px-8 text-base font-bold gap-2">
                  <Subtitles className="h-5 w-5" />
                  <span>Open Studio Workspace Now</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="container mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Subtitles className="h-4 w-4 text-indigo-400" />
            <span className="font-bold text-slate-300">SubLingo Studio</span>
            <span>— Next.js Subtitle Localization Studio</span>
          </div>
          <div>Preserving timing & formatting across languages.</div>
        </div>
      </footer>
    </div>
  );
}
