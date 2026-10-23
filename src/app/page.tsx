"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Subtitles,
  Clock,
  Globe,
  Film,
  Download,
  ArrowRight,
  ShieldCheck,
  Sliders,
  Check,
  X,
  Languages,
  Layers,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#090b0e] text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-200">
      <Header />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 border-b border-white/[0.06]">
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="container mx-auto px-4 sm:px-6 text-center relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs font-medium text-slate-300 mb-6">
              <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span>Built for video editors, subtitlers, and content teams</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white mb-6 leading-[1.15]">
              Translate subtitles without <br className="hidden sm:inline" />
              breaking your timeline.
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
              Keep millisecond timecodes locked, reading speeds comfortable, and formatting tags intact.
              Translate <span className="text-slate-200 font-medium">.srt</span> and{" "}
              <span className="text-slate-200 font-medium">.vtt</span> files into 50+ languages with zero sync drift.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
              <Link href="/translate" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-sm font-medium gap-2 h-11 px-6">
                  <Languages className="h-4 w-4" />
                  <span>Open Translation Studio</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/editor" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-sm font-medium h-11 px-5"
                >
                  <Layers className="h-4 w-4 mr-2 text-slate-400" />
                  <span>Subtitle Editor</span>
                </Button>
              </Link>
            </div>

            {/* Realistic In-Studio Preview Box */}
            <div className="relative mx-auto max-w-4xl rounded-xl border border-white/[0.1] bg-[#12151b] shadow-2xl text-left overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-[#0e1116]">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                  <span className="ml-2 text-xs font-mono text-slate-400">interview_segment_01.srt</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[11px] font-mono text-slate-400 py-0">
                    424 Cues
                  </Badge>
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Synchronized
                  </span>
                </div>
              </div>

              {/* Side-by-Side Cue Comparison */}
              <div className="p-4 space-y-3 font-mono text-xs bg-[#101318]">
                {/* Cue 1 */}
                <div className="rounded-lg border border-white/[0.08] bg-[#141820] p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between font-sans">
                      <span className="text-slate-300 font-semibold font-mono">#1 &nbsp;00:01:24,200 ➔ 00:01:27,500</span>
                      <span className="text-slate-500 text-[10px]">EN</span>
                    </div>
                    <p className="text-slate-200 font-sans text-sm font-normal">
                      Our audio engineers noticed a slight sync offset during the dialogue transitions.
                    </p>
                  </div>
                  <div className="border-t md:border-t-0 md:border-l border-white/[0.08] pt-3 md:pt-0 md:pl-4">
                    <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between font-sans">
                      <span className="text-blue-400 font-medium">Spanish (ES)</span>
                      <span className="text-emerald-400 text-[10px] font-mono font-medium">13.8 CPS • Optimal</span>
                    </div>
                    <p className="text-slate-100 font-sans text-sm font-normal">
                      Nuestros ingenieros de sonido notaron un ligero desajuste durante las transiciones del diálogo.
                    </p>
                  </div>
                </div>

                {/* Cue 2 */}
                <div className="rounded-lg border border-white/[0.05] bg-[#12151c]/60 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between font-sans">
                      <span className="text-slate-400 font-medium font-mono">#2 &nbsp;00:01:28,100 ➔ 00:01:31,400</span>
                      <span className="text-slate-500 text-[10px]">EN</span>
                    </div>
                    <p className="text-slate-300 font-sans text-sm font-normal">
                      <i>Let's check the second take.</i> The background ambient noise was cleaner there.
                    </p>
                  </div>
                  <div className="border-t md:border-t-0 md:border-l border-white/[0.08] pt-3 md:pt-0 md:pl-4">
                    <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between font-sans">
                      <span className="text-blue-400 font-medium">Spanish (ES)</span>
                      <span className="text-emerald-400 text-[10px] font-mono font-medium">14.9 CPS • Optimal</span>
                    </div>
                    <p className="text-slate-200 font-sans text-sm font-normal">
                      <i>Revisemos la segunda toma.</i> El ruido ambiente de fondo era más limpio allí.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARISON TABLE: The Problem with Generic Translators */}
        <section className="py-16 border-b border-white/[0.06] bg-[#0c0e12]">
          <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
              <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                Why copy-pasting subtitles fails
              </h2>
              <p className="text-slate-400 text-sm">
                General-purpose tools treat subtitles as raw text. SubLingo treats them as timed media.
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#12151b] overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
                {/* Generic Translator Column */}
                <div className="p-6 space-y-4 bg-red-950/[0.04]">
                  <div className="flex items-center gap-2 text-red-400 font-medium text-sm">
                    <X className="h-4 w-4" />
                    <span>Generic Web Translators & Raw LLMs</span>
                  </div>
                  <ul className="space-y-3 text-xs text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">✕</span>
                      <span>Merges or skips cues, causing permanent audio desynchronization.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">✕</span>
                      <span>No reading speed checks; outputs lines that disappear too quickly.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">✕</span>
                      <span>Strips or breaks HTML tags (`&lt;i&gt;`, `&lt;b&gt;`) and WebVTT alignments.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">✕</span>
                      <span>Requires manual re-timing and re-formatting in your NLE.</span>
                    </li>
                  </ul>
                </div>

                {/* SubLingo Column */}
                <div className="p-6 space-y-4 bg-blue-950/[0.05]">
                  <div className="flex items-center gap-2 text-blue-400 font-medium text-sm">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>SubLingo Localization Studio</span>
                  </div>
                  <ul className="space-y-3 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Preserves start and end timestamps down to the millisecond.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Live Characters-Per-Second (CPS) monitoring adhering to BBC/Netflix standards.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Maintains formatting tags and WebVTT cue placement headers.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Exports ready-to-import SRT, WebVTT, and stacked bilingual tracks.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CORE FEATURES SECTION */}
        <section className="py-20 border-b border-white/[0.06]">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
              <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                Designed for reliable subtitle post-production
              </h2>
              <p className="text-slate-400 text-sm">
                Every tool in SubLingo focuses on precision, readability, and speed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Feature 1 */}
              <Card className="p-1">
                <CardContent className="p-5 space-y-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 mb-2 border border-blue-500/20">
                    <Clock className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Frame-Accurate Timecodes</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Timecodes are locked during translation. Every millisecond timestamp is preserved exactly as authored.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="p-1">
                <CardContent className="p-5 space-y-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 mb-2 border border-emerald-500/20">
                    <Sliders className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Reading Speed (CPS) Guard</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Live character-per-second metrics flag cues that flash too fast, helping you keep captions readable.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="p-1">
                <CardContent className="p-5 space-y-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 mb-2 border border-indigo-500/20">
                    <Film className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Synchronized Video Player</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Drop your video file to verify dialogue cadence directly in the browser. Zero video files are sent to servers.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card className="p-1">
                <CardContent className="p-5 space-y-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-500/10 text-slate-300 mb-2 border border-white/10">
                    <Globe className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Multi-Engine Translation</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Use our free built-in translation engine with zero setup, or connect your Google Gemini, OpenAI, or DeepL keys.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 5 */}
              <Card className="p-1">
                <CardContent className="p-5 space-y-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 mb-2 border border-amber-500/20">
                    <Layers className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Cue Retiming & Editing</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Split overlong captions, merge adjacent cues, apply global millisecond offsets, and search-and-replace terms.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 6 */}
              <Card className="p-1">
                <CardContent className="p-5 space-y-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 mb-2 border border-blue-500/20">
                    <Download className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Bilingual & Clean Export</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Export localized SRT or VTT files, or generate stacked dual-language tracks designed for students and reviewers.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* WORKFLOW PIPELINE SECTION */}
        <section className="py-20 border-b border-white/[0.06] bg-[#0c0e12]">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
              <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                Simple, straightforward workflow
              </h2>
              <p className="text-slate-400 text-sm">
                From authoring to export in four steps.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                {
                  step: "1",
                  title: "Upload Subtitle",
                  desc: "Drop an .srt or .vtt file. Cues and timestamps are parsed and validated immediately.",
                },
                {
                  step: "2",
                  title: "Choose Target",
                  desc: "Select your target language and preferred translation engine with optional tone settings.",
                },
                {
                  step: "3",
                  title: "Review & Adjust",
                  desc: "Inspect live CPS reading speed badges and preview with synchronized video playback.",
                },
                {
                  step: "4",
                  title: "Export File",
                  desc: "Download formatted SRT or WebVTT files, or stacked dual-language subtitle tracks.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-xl border border-white/[0.08] bg-[#12151b] p-5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      Step {item.step}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-2">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="py-20 bg-[#090b0e]">
          <div className="container mx-auto px-4 sm:px-6 text-center max-w-2xl space-y-5">
            <h2 className="text-2xl sm:text-4xl font-semibold text-white tracking-tight">
              Ready to localize your subtitles?
            </h2>
            <p className="text-sm text-slate-400">
              Free to use in your browser. No account or credit card required.
            </p>
            <div className="pt-2">
              <Link href="/translate">
                <Button size="lg" className="h-11 px-6 text-sm font-medium gap-2">
                  <Languages className="h-4 w-4" />
                  <span>Launch Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] bg-[#0c0e12] py-6 text-xs text-slate-500">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Subtitles className="h-4 w-4 text-slate-400" />
            <span className="font-semibold text-slate-300">SubLingo Studio</span>
            <span>— Subtitle localization & synchronization</span>
          </div>
          <div className="text-slate-500">
            Client-side video playback • Privacy by design
          </div>
        </div>
      </footer>
    </div>
  );
}
