import { describe, it, expect } from "vitest";
import {
  getPublishedSubtitles,
  getPublishedSubtitleById,
  savePublishedSubtitle,
  incrementSubtitleDownload,
  incrementSubtitleView,
} from "../publishedStore";

describe("Published Subtitles Data Store", () => {
  it("loads seeded published subtitles successfully", async () => {
    const list = await getPublishedSubtitles();
    expect(list.length).toBeGreaterThanOrEqual(4);

    const cosmos = list.find((s) => s.id === "scifi-cosmos-ml");
    expect(cosmos).toBeDefined();
    expect(cosmos?.title).toContain("Deep Cosmos");
    expect(cosmos?.targetLang).toBe("ml");
    expect(cosmos?.cues.length).toBe(6);
  });

  it("filters subtitles by target language and format", async () => {
    const malayalamOnly = await getPublishedSubtitles({ targetLang: "ml" });
    expect(malayalamOnly.length).toBeGreaterThanOrEqual(1);
    expect(malayalamOnly.every((s) => s.targetLang === "ml")).toBe(true);

    const vttOnly = await getPublishedSubtitles({ format: "vtt" });
    expect(vttOnly.length).toBeGreaterThanOrEqual(1);
    expect(vttOnly.every((s) => s.format === "vtt")).toBe(true);
  });

  it("filters subtitles by keyword search query", async () => {
    const searchResults = await getPublishedSubtitles({ search: "Quantum" });
    expect(searchResults.length).toBeGreaterThanOrEqual(1);
    expect(searchResults[0].title).toContain("Quantum");
  });

  it("creates, retrieves, and increments metrics for a new published subtitle", async () => {
    const newSub = await savePublishedSubtitle({
      id: "test-release-unique",
      title: "Test Unit Subtitle Release",
      description: "Unit testing published subtitle persistence",
      filename: "test_subs.srt",
      format: "srt",
      sourceLang: "en",
      targetLang: "es",
      visibility: "public",
      authorName: "Tester",
      cuesCount: 1,
      translatedCuesCount: 1,
      durationFormatted: "00m 05s",
      durationSeconds: 5,
      category: "General",
      tags: ["Test", "Unit"],
      cues: [
        {
          id: 1,
          startTime: "00:00:01,000",
          endTime: "00:00:04,000",
          startSeconds: 1,
          endSeconds: 4,
          originalText: "Hello test",
          translatedText: "Hola prueba",
          status: "completed",
        },
      ],
    });

    expect(newSub.id).toBe("test-release-unique");

    const fetched = await getPublishedSubtitleById("test-release-unique");
    expect(fetched).toBeDefined();
    expect(fetched?.title).toBe("Test Unit Subtitle Release");

    const prevDownloads = fetched?.downloadsCount || 0;
    await incrementSubtitleDownload("test-release-unique");
    const updated = await getPublishedSubtitleById("test-release-unique");
    expect(updated?.downloadsCount).toBe(prevDownloads + 1);

    const prevViews = updated?.viewsCount || 0;
    await incrementSubtitleView("test-release-unique");
    const updatedView = await getPublishedSubtitleById("test-release-unique");
    expect(updatedView?.viewsCount).toBe(prevViews + 1);
  });
});
