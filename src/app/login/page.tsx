"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Subtitles,
  Mail,
  KeyRound,
  ShieldCheck,
  Copy,
  Check,
  Clock,
  ArrowRight,
  RefreshCw,
  Sparkles,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, sendOtp, verifyOtp, loginWithPasskey } = useAuth();

  // Mode: "otp" | "passkey"
  const [activeTab, setActiveTab] = React.useState<"otp" | "passkey">("otp");

  // OTP flow state
  const [email, setEmail] = React.useState("");
  const [otpStep, setOtpStep] = React.useState<"email" | "code" | "passkey-issued">("email");
  const [otpCode, setOtpCode] = React.useState("");
  const [generatedPasskey, setGeneratedPasskey] = React.useState("");
  const [previewOtp, setPreviewOtp] = React.useState<string | null>(null);

  // Passkey login flow state
  const [passkeyInput, setPasskeyInput] = React.useState("");

  // UI status
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Resend cooldown timer
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // If already authenticated and not on passkey-issued screen, can redirect or show status
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid Gmail address.");
      return;
    }

    setIsLoading(true);
    const res = await sendOtp(cleanEmail);
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage(res.message);
      setPreviewOtp(res.previewOtp || null);
      setOtpStep("code");
      setCooldown(25);
    } else {
      setErrorMessage(res.message || "Failed to send verification code.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    const res = await verifyOtp(email, cleanCode);
    setIsLoading(false);

    if (res.success && res.passkey) {
      setGeneratedPasskey(res.passkey);
      setOtpStep("passkey-issued");
      setSuccessMessage("Gmail verified! Your 24-hour master passkey is ready.");

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"],
        });
      } catch {
        // Ignore
      }
    } else {
      setErrorMessage(res.message || "Incorrect verification code. Please try again.");
    }
  };

  const handlePasskeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPasskey = passkeyInput.trim().toUpperCase();
    if (!cleanPasskey) {
      setErrorMessage("Please enter your 24-hour master passkey.");
      return;
    }

    setIsLoading(true);
    const res = await loginWithPasskey(cleanPasskey);
    setIsLoading(false);

    if (res.success && res.user) {
      router.push("/translate");
    } else {
      if (res.expired) {
        setErrorMessage(
          "This master passkey expired after 24 hours. Please verify with a new Gmail OTP."
        );
      } else {
        setErrorMessage(
          res.message || "Invalid master passkey. Please check and try again."
        );
      }
    }
  };

  const handleCopyPasskey = async () => {
    if (!generatedPasskey) return;
    try {
      await navigator.clipboard.writeText(generatedPasskey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080a0f] text-slate-100">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
          {/* Card Container */}
          <div className="rounded-2xl border border-white/10 bg-[#0f131a]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
            {/* Header / Brand */}
            <div className="text-center space-y-1.5 mb-6">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 mb-1">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Passwordless Access
              </h1>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                No passwords or signups. Verify your Gmail to receive a 24-hour master passkey.
              </p>
            </div>

            {/* Mode Switch Tabs (hidden on passkey-issued step) */}
            {otpStep !== "passkey-issued" && (
              <div className="grid grid-cols-2 p-1 rounded-lg bg-[#141923] border border-white/[0.06] mb-6 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("otp");
                    setErrorMessage(null);
                  }}
                  className={`py-1.5 rounded-md font-medium transition-all ${
                    activeTab === "otp"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Gmail OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("passkey");
                    setErrorMessage(null);
                  }}
                  className={`py-1.5 rounded-md font-medium transition-all ${
                    activeTab === "passkey"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Master Passkey
                </button>
              </div>
            )}

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{errorMessage}</span>
                  {errorMessage.includes("expired") && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("otp");
                        setOtpStep("email");
                        setErrorMessage(null);
                      }}
                      className="block mt-1.5 font-medium text-blue-400 hover:underline"
                    >
                      Verify Gmail for a new passkey ➔
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 1: GMAIL OTP FLOW */}
            {activeTab === "otp" && (
              <div>
                {/* Step 1: Email Input */}
                {otpStep === "email" && (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                        <span>Your Gmail Address</span>
                        <span className="text-[10px] text-slate-500">Requires verification</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. yourname@gmail.com"
                          className="pl-9 h-10 text-xs bg-[#161a22] border-white/10 text-white"
                          autoFocus
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading || !email.trim()}
                      className="w-full h-10 gap-2 text-xs font-medium shadow-md shadow-blue-500/15"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Sending Verification Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send 6-Digit OTP</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <div className="text-[11px] text-slate-400 text-center pt-1">
                      A unique 6-digit OTP will be issued to your Gmail. Valid for 10 minutes.
                    </div>
                  </form>
                )}

                {/* Step 2: 6-Digit OTP Code Input */}
                {otpStep === "code" && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="text-center space-y-1 pb-1">
                      <span className="text-xs text-slate-400">
                        Code sent to <span className="text-white font-medium">{email}</span>
                      </span>
                    </div>

                    {/* Developer / Demo Preview Helper */}
                    {previewOtp && (
                      <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-center">
                        <div className="text-[10px] text-blue-400 font-medium">
                          Demo Preview OTP:
                        </div>
                        <button
                          type="button"
                          onClick={() => setOtpCode(previewOtp)}
                          className="font-mono text-base font-bold text-white tracking-widest hover:text-blue-300 transition-colors cursor-pointer mt-0.5"
                          title="Click to auto-fill OTP"
                        >
                          {previewOtp} (Click to fill)
                        </button>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300 block text-center">
                        Enter 6-Digit Code
                      </label>
                      <Input
                        type="text"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="••••••"
                        className="h-12 text-center text-lg font-mono tracking-widest bg-[#161a22] border-white/10 text-white font-bold"
                        autoFocus
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading || otpCode.length < 6}
                      className="w-full h-10 gap-2 text-xs font-medium"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Verifying Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Generate Passkey</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>

                    {/* Resend & Back actions */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep("email");
                          setOtpCode("");
                          setErrorMessage(null);
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        ← Change email
                      </button>

                      <button
                        type="button"
                        disabled={cooldown > 0 || isLoading}
                        onClick={handleSendOtp}
                        className={`font-medium ${
                          cooldown > 0
                            ? "text-slate-500 cursor-not-allowed"
                            : "text-blue-400 hover:underline"
                        }`}
                      >
                        {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 3: Master Passkey Issued */}
                {otpStep === "passkey-issued" && (
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-center space-y-1">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-1">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <h2 className="text-sm font-semibold text-white">
                        Your 24-Hour Master Passkey
                      </h2>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        Copy and save this passkey to log in instantly without email verification for the next 24 hours.
                      </p>
                    </div>

                    {/* Passkey Input Field with Copy Button */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-slate-300 flex items-center justify-between">
                        <span>Master Passkey</span>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3" />
                          <span>24h active</span>
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={generatedPasskey}
                          className="h-11 bg-[#141923] border-blue-500/40 text-blue-400 font-mono font-bold text-sm tracking-wide select-all"
                        />
                        <Button
                          type="button"
                          onClick={handleCopyPasskey}
                          className="h-11 px-3.5 shrink-0 gap-1.5 text-xs font-medium"
                        >
                          {copied ? (
                            <>
                              <Check className="h-4 w-4 text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              <span>Copy</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expiration Note */}
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-slate-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-medium text-blue-300">
                        <KeyRound className="h-3.5 w-3.5" />
                        <span>Passkey Validity: 24 Hours</span>
                      </div>
                      <p className="text-slate-400 leading-relaxed text-[11px]">
                        After 24 hours, this passkey expires and a new OTP will be required. Keep it saved in your notes or browser.
                      </p>
                    </div>

                    {/* Continue Button */}
                    <Button
                      type="button"
                      onClick={() => router.push("/translate")}
                      className="w-full h-10 gap-2 text-xs font-medium"
                    >
                      <span>Continue to Translation Studio</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MASTER PASSKEY DIRECT LOGIN */}
            {activeTab === "passkey" && (
              <form onSubmit={handlePasskeyLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span>Your 24-Hour Master Passkey</span>
                    <span className="text-[10px] text-slate-500">Issued via OTP</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      required
                      value={passkeyInput}
                      onChange={(e) => setPasskeyInput(e.target.value.toUpperCase())}
                      placeholder="SL-XXXX-XXXX-XXXX-XXXX"
                      className="pl-9 h-10 text-xs bg-[#161a22] border-white/10 text-white font-mono tracking-wider"
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !passkeyInput.trim()}
                  className="w-full h-10 gap-2 text-xs font-medium"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Validating Passkey...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In with Passkey</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="text-[11px] text-slate-400 text-center pt-2 space-y-1">
                  <p>Don't have an active passkey or expired?</p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("otp");
                      setOtpStep("email");
                      setErrorMessage(null);
                    }}
                    className="text-blue-400 hover:underline font-medium"
                  >
                    Verify Gmail to get a new 24h passkey ➔
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Minimalist Footer */}
          <div className="text-center mt-6 text-xs text-slate-500 space-x-3">
            <Link href="/" className="hover:text-slate-300 transition-colors">
              Studio Overview
            </Link>
            <span>•</span>
            <Link href="/translate" className="hover:text-slate-300 transition-colors">
              Translate Workspace
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
