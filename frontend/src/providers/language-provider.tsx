"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Language, TranslationDict } from "@/lib/i18n";
import { languages, languageNames } from "@/lib/i18n";

const LanguageContext = createContext<{
  lang: Language;
  t: TranslationDict;
  setLang: (l: Language) => void;
  languageNames: Record<Language, string>;
}>({
  lang: "en",
  t: languages.en,
  setLang: () => {},
  languageNames,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("saarthi-lang") as Language | null;
    if (stored && languages[stored]) {
      setLangState(stored);
    }
  }, []);

  function setLang(l: Language) {
    setLangState(l);
    localStorage.setItem("saarthi-lang", l);
    document.documentElement.lang = l === "te" ? "te" : l === "hi" ? "hi" : "en";
  }

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ lang, t: languages[lang], setLang, languageNames }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useTranslation = () => useContext(LanguageContext);
