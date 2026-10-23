import { SubtitleFile } from "./types";

const STORAGE_KEY = "sublingo_current_subtitles";

/**
 * Save active subtitle file to session storage for seamless cross-workspace transfer
 */
export function saveActiveSubtitle(file: SubtitleFile): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(file));
  } catch (err) {
    console.error("Failed to save subtitle session:", err);
  }
}

/**
 * Retrieve active subtitle file from session storage
 */
export function loadActiveSubtitle(): SubtitleFile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SubtitleFile;
  } catch (err) {
    console.error("Failed to load subtitle session:", err);
    return null;
  }
}

/**
 * Clear saved active subtitle session
 */
export function clearActiveSubtitle(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
