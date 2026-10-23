"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages, Settings, Subtitles, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface HeaderProps {
  onOpenSettings?: () => void;
  activeProvider?: string;
}

export function Header({ onOpenSettings, activeProvider = "Free Engine" }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-all">
            <Subtitles className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                SubLingo
              </span>
              <Badge variant="gradient" className="text-[10px] py-0 px-1.5 h-4 font-mono font-semibold">
                STUDIO
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">
              Subtitle Translation & Sync
            </p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
          <Link
            href="/"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              pathname === "/"
                ? "bg-white/10 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Overview
          </Link>
          <Link
            href="/editor"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              pathname === "/editor"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Subtitles className="h-3.5 w-3.5 text-indigo-300" />
            Edit Subtitles
          </Link>
          <Link
            href="/translate"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              pathname === "/translate"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
            Translate Workspace
          </Link>
        </nav>

        {/* Action controls */}
        <div className="flex items-center gap-2.5">
          {onOpenSettings && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSettings}
              className="gap-2 text-xs border-white/10 text-slate-300 hover:text-white"
              title="Translation Engine Settings"
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Engine:</span>
              <span className="text-indigo-400 font-medium">{activeProvider}</span>
            </Button>
          )}

          <Link href="/translate">
            <Button variant="gradient" size="sm" className="gap-2 text-xs font-bold">
              <Languages className="h-3.5 w-3.5" />
              <span>Launch Studio</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
