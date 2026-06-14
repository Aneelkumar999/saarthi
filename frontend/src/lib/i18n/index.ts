import { en } from "./en";
import { te } from "./te";
import { hi } from "./hi";

export type Language = "en" | "te" | "hi";
export type TranslationDict = typeof en;

export const languages: Record<Language, TranslationDict> = { en, te, hi };

export const languageNames: Record<Language, string> = {
  en: "English",
  te: "తెలుగు",
  hi: "हिन्दी",
};
