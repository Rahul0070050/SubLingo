import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isB2Configured,
  getB2Config,
  uploadSubtitleToB2,
  getSubtitleFromB2,
  getSubtitlePresignedUrl,
} from "../b2";

describe("Backblaze B2 Cloud Storage Service", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("reports unconfigured when B2 environment variables are missing", () => {
    delete process.env.B2_KEY_ID;
    delete process.env.B2_APPLICATION_KEY_ID;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.B2_APPLICATION_KEY;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.B2_BUCKET_NAME;

    expect(isB2Configured()).toBe(false);
    expect(getB2Config()).toBeNull();
  });

  it("correctly parses configuration and derives region from B2 endpoint", () => {
    process.env.B2_KEY_ID = "005testkeyid123";
    process.env.B2_APPLICATION_KEY = "K005testappsecret456";
    process.env.B2_BUCKET_NAME = "sublingo-subtitles";
    process.env.B2_ENDPOINT = "https://s3.us-east-005.backblazeb2.com";

    expect(isB2Configured()).toBe(true);
    const config = getB2Config();
    expect(config).toBeDefined();
    expect(config?.keyId).toBe("005testkeyid123");
    expect(config?.applicationKey).toBe("K005testappsecret456");
    expect(config?.bucketName).toBe("sublingo-subtitles");
    expect(config?.region).toBe("us-east-005");
    expect(config?.endpoint).toBe("https://s3.us-east-005.backblazeb2.com");
  });

  it("handles fallback gracefully when B2 is not configured", async () => {
    delete process.env.B2_KEY_ID;
    delete process.env.B2_APPLICATION_KEY;
    delete process.env.B2_BUCKET_NAME;

    const uploadRes = await uploadSubtitleToB2({
      key: "subtitles/test/demo.srt",
      content: "1\n00:00:01,000 --> 00:00:03,000\nHello world",
      contentType: "application/x-subrip",
    });

    expect(uploadRes.success).toBe(false);
    expect(uploadRes.error).toContain("Backblaze B2 is not configured");

    const getRes = await getSubtitleFromB2("subtitles/test/demo.srt");
    expect(getRes.success).toBe(false);
    expect(getRes.error).toContain("Backblaze B2 is not configured");

    const presigned = await getSubtitlePresignedUrl("subtitles/test/demo.srt");
    expect(presigned).toBeNull();
  });
});
