import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Subtivio — Subtitle Translation Studio",
  description:
    "Translate SRT and WebVTT subtitle files into 50+ languages with zero timestamp drift, side-by-side editing, CPS reading speed checks, and synchronized video preview.",
  keywords: [
    "subtitle translation",
    "srt translator",
    "vtt translator",
    "subtitle editor",
    "bilingual subtitles",
    "video localization",
  ],
  authors: [{ name: "Subtivio Studio" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

import { AuthProvider } from "@/lib/auth/AuthContext";
import { ToastContainer } from "@/components/ui/Toast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans">
        <AuthProvider>
          {children}
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}
