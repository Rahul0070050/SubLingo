import { describe, it, expect } from "vitest";
import {
  getTransliterationConfig,
  TRANSLITERATION_MAP,
} from "../languages";

describe("Transliteration System", () => {
  it("provides Manglish configuration for Malayalam ('ml')", () => {
    const config = getTransliterationConfig("ml");
    expect(config.isPhonetic).toBe(true);
    expect(config.inputMode).toBe("Manglish");
    expect(config.itc).toBe("ml-t-i0-und");
    expect(config.name).toBe("Malayalam");
    expect(config.flag).toBe("🇮🇳");
  });

  it("provides Hinglish configuration for Hindi ('hi')", () => {
    const config = getTransliterationConfig("hi");
    expect(config.isPhonetic).toBe(true);
    expect(config.inputMode).toBe("Hinglish");
    expect(config.itc).toBe("hi-t-i0-und");
  });

  it("provides Tanglish configuration for Tamil ('ta')", () => {
    const config = getTransliterationConfig("ta");
    expect(config.isPhonetic).toBe(true);
    expect(config.inputMode).toBe("Tanglish");
    expect(config.itc).toBe("ta-t-i0-und");
  });

  it("provides direct typing for Latin/European languages ('en', 'es', 'fr', 'de')", () => {
    const enConfig = getTransliterationConfig("en");
    expect(enConfig.isPhonetic).toBe(false);
    expect(enConfig.inputMode).toBe("Direct");

    const esConfig = getTransliterationConfig("es");
    expect(esConfig.isPhonetic).toBe(false);

    const frConfig = getTransliterationConfig("fr");
    expect(frConfig.isPhonetic).toBe(false);
  });

  it("correctly identifies all supported phonetic transliteration languages", () => {
    const expectedLangs = ["ml", "hi", "ta", "te", "bn", "ar", "fa", "ru", "el", "he", "zh", "ja"];
    for (const code of expectedLangs) {
      expect(TRANSLITERATION_MAP[code]).toBeDefined();
      expect(TRANSLITERATION_MAP[code].isPhonetic).toBe(true);
      expect(TRANSLITERATION_MAP[code].itc.length).toBeGreaterThan(0);
    }
  });
});
