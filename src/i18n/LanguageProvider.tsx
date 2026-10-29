import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { EN, DICTIONARIES, type TranslationKey } from "./dictionaries";

export interface Language {
  code: string;
  /** Native name, so people find their language without reading English. */
  label: string;
  english: string;
  /** False when the dictionary is still partial. */
  complete: boolean;
}

/**
 * Indian languages, ordered by speaker base. Each entry needs a dictionary in
 * `dictionaries.ts`; anything missing falls back to English per key, so a
 * partial translation degrades to English rather than to a blank label.
 */
export const LANGUAGES: Language[] = [
  { code: "en", label: "English", english: "English", complete: true },
  { code: "hi", label: "हिन्दी", english: "Hindi", complete: true },
  { code: "bn", label: "বাংলা", english: "Bengali", complete: true },
  { code: "mr", label: "मराठी", english: "Marathi", complete: true },
  { code: "ta", label: "தமிழ்", english: "Tamil", complete: false },
];

const STORAGE_KEY = "gavel.lang";

interface LanguageContextValue {
  language: Language;
  setLanguage: (code: string) => void;
  /** Translate a key. Falls back to English, then to the key itself. */
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: LANGUAGES[0],
  setLanguage: () => {},
  t: (key) => EN[key] ?? key,
});

function detectInitial(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.some((l) => l.code === stored)) return stored;
  } catch {
    /* storage can be blocked; fall through to the browser preference */
  }
  const nav = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "en";
  const match = LANGUAGES.find((l) => nav.startsWith(l.code));
  return match ? match.code : "en";
}

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [code, setCode] = useState<string>(detectInitial);

  const language = LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];

  useEffect(() => {
    document.documentElement.lang = language.code;
    try {
      localStorage.setItem(STORAGE_KEY, language.code);
    } catch {
      /* ignore */
    }
  }, [language.code]);

  const setLanguage = useCallback((next: string) => {
    if (LANGUAGES.some((l) => l.code === next)) setCode(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      const dict = DICTIONARIES[language.code];
      return dict?.[key] ?? EN[key] ?? key;
    },
    [language.code],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
export const useT = () => useContext(LanguageContext).t;
