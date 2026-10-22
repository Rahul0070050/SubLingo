import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SubLingo — Subtitle Translation Studio",
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
  authors: [{ name: "SubLingo" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}
