import { describe, it, expect } from "vitest";
import { EN } from "@/i18n/en";
import { DICTIONARIES } from "@/i18n/dictionaries";
import { LANGUAGES } from "@/i18n/LanguageProvider";

/**
 * The language picker must never show a language it cannot serve, and no
 * dictionary may contain a key that no longer exists in English (which would
 * silently never render).
 */
describe("i18n", () => {
  it("has a dictionary for every offered language", () => {
    for (const lang of LANGUAGES) {
      if (lang.code === "en") continue;
      expect(DICTIONARIES[lang.code], `missing dictionary for ${lang.code}`).toBeDefined();
    }
  });

  it("only uses keys that exist in English", () => {
    const englishKeys = new Set(Object.keys(EN));
    for (const [code, dict] of Object.entries(DICTIONARIES)) {
      for (const key of Object.keys(dict)) {
        expect(englishKeys.has(key), `${code} has unknown key ${key}`).toBe(true);
      }
    }
  });

  it("covers the primary journey in each translated language", () => {
    const required = [
      "nav.tryFree",
      "nav.liveDemo",
      "try.title1",
      "try.dropTitle",
      "try.choose",
      "demo.title",
      "demo.approve",
    ] as const;
    for (const [code, dict] of Object.entries(DICTIONARIES)) {
      for (const key of required) {
        expect(dict[key], `${code} is missing ${key}`).toBeTruthy();
      }
    }
  });

  it("does not leak English placeholder values into a translation", () => {
    for (const [code, dict] of Object.entries(DICTIONARIES)) {
      const identical = Object.entries(dict).filter(
        ([key, value]) => value === EN[key as keyof typeof EN] && key.startsWith("try."),
      );
      // A few short strings are legitimately the same (e.g. "EMI ratio"), so we
      // only fail when most of the surface is untranslated.
      expect(identical.length, `${code} looks untranslated`).toBeLessThan(3);
    }
  });
});
