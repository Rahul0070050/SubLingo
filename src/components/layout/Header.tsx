"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Languages,
  Settings,
  Subtitles,
  Layers,
  KeyRound,
  Copy,
  Check,
  LogOut,
  Clock,
  User,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/AuthContext";

interface HeaderProps {
  onOpenSettings?: () => void;
  activeProvider?: string;
}

export function Header({ onOpenSettings, activeProvider = "Free Engine" }: HeaderProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopyPasskey = async () => {
    if (!user?.passkey) return;
    try {
      await navigator.clipboard.writeText(user.passkey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

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
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${pathname === "/"
              ? "bg-white/[0.08] text-white"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
          >
            Overview
          </Link>
          <Link
            href="/translate"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${pathname === "/translate"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
          >
            <Languages className="h-3.5 w-3.5" />
            <span>Translate</span>
          </Link>
          <Link
            href="/editor"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${pathname === "/editor"
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

          {pathname === "/" && (
            <Link href="/translate">
              <Button size="sm" className="gap-1.5 text-xs h-8">
                <Languages className="h-3.5 w-3.5" />
                <span>Open Studio</span>
              </Button>
            </Link>
          )}

          {/* User Auth Status / Master Passkey Menu */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 h-8 px-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-xs text-white transition-colors"
                title="Account & 24h Master Passkey"
              >
                <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline-block max-w-[120px] truncate font-medium text-slate-200">
                  {user.email}
                </span>
                <span className="text-[10px] text-blue-400 font-mono hidden md:inline-block">
                  ({user.hoursRemaining}h left)
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-72 rounded-xl border border-white/10 bg-[#141923] p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Verified Gmail
                      </div>
                      <div className="text-xs font-medium text-white truncate mt-0.5">
                        {user.email}
                      </div>
                    </div>

                    {/* Active Passkey Box with Copy Button */}
                    <div className="p-2.5 rounded-lg bg-[#0c0f13] border border-white/[0.08] space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <KeyRound className="h-3 w-3 text-blue-400" />
                          <span>24h Master Passkey</span>
                        </span>
                        <span className="text-emerald-400 font-mono">
                          {user.hoursRemaining}h {user.minutesRemaining}m left
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          readOnly
                          value={user.passkey}
                          className="w-full bg-transparent font-mono text-xs text-blue-300 font-semibold select-all focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleCopyPasskey}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                          title="Copy Master Passkey"
                        >
                          {copied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-1 border-t border-white/[0.08] flex items-center justify-between text-xs">
                      <Link
                        href="/login"
                        onClick={() => setShowUserMenu(false)}
                        className="text-slate-400 hover:text-blue-400 transition-colors text-[11px]"
                      >
                        New Passkey
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="flex items-center gap-1 text-red-400 hover:text-red-300 text-[11px] font-medium"
                      >
                        <LogOut className="h-3 w-3" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            pathname !== "/login" && (
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-8 border-white/[0.08] text-slate-300 hover:text-white"
                >
                  <KeyRound className="h-3.5 w-3.5 text-blue-400" />
                  <span>Sign In</span>
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}

