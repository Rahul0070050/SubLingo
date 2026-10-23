"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages, Settings, Subtitles, Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
  onOpenSettings?: () => void;
  activeProvider?: string;
}

export function Header({ onOpenSettings, activeProvider = "Free Engine" }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#0c0f13]/90 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/90 text-white shadow-sm border border-blue-400/20 group-hover:bg-blue-500 transition-colors">
            <Subtitles className="h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold tracking-tight text-white">
              SubLingo
            </span>
            <span className="hidden sm:inline-block text-[11px] font-medium text-slate-400 tracking-wide">
              Studio
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/[0.06]">
          <Link
            href="/"
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              pathname === "/"
                ? "bg-white/[0.08] text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            Overview
          </Link>
          <Link
            href="/translate"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              pathname === "/translate"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <Languages className="h-3.5 w-3.5" />
            <span>Translate</span>
          </Link>
          <Link
            href="/editor"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              pathname === "/editor"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Editor</span>
          </Link>
        </nav>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {onOpenSettings && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSettings}
              className="gap-2 text-xs h-8 border-white/[0.08] text-slate-300 hover:text-white"
              title="Translation Engine Settings"
            >
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="hidden sm:inline text-slate-400">Engine:</span>
              <span className="text-slate-200 font-medium">{activeProvider}</span>
              <Settings className="h-3 w-3 text-slate-400 ml-0.5" />
            </Button>
          )}

          <Link href="/translate">
            <Button size="sm" className="gap-1.5 text-xs h-8">
              <Languages className="h-3.5 w-3.5" />
              <span>Open Studio</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
