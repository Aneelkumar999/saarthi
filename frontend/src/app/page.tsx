"use client";

import { ArrowRight, Mic, Search, Sparkles, Sun, Moon, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { features } from "@/lib/data";
import { useTheme } from "@/providers/theme-provider";
import { useTranslation } from "@/providers/language-provider";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/i18n";

export default function LandingPage() {
  const { theme, toggle } = useTheme();
  const { t, lang, setLang } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);

  const languages: { code: Language; label: string }[] = [
    { code: "en", label: "English" },
    { code: "te", label: "తెలుగు" },
    { code: "hi", label: "हिन्दी" },
  ];

  const currentLang = languages.find((l) => l.code === lang)!;

  return (
    <main className="min-h-screen bg-mist dark:bg-dark-surface">
      <section className="hero-grid relative overflow-hidden">
        <div className="absolute right-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-orange-200/50 blur-3xl dark:bg-orange-900/20" />
        <div className="absolute bottom-[-10rem] left-[-8rem] h-96 w-96 rounded-full bg-teal-200/60 blur-3xl dark:bg-teal-900/20" />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3 font-black text-navy dark:text-dark-text">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-white"><Sparkles size={21} /></span>
              <span>Saarthi AI</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-dark-border dark:text-dark-muted dark:hover:bg-dark-border"
                >
                  {currentLang.label} <ChevronDown size={14} />
                </button>
                {langOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-1 w-28 rounded-xl border border-slate-200 bg-white py-1 shadow-civic dark:border-dark-border dark:bg-dark-card">
                      {languages.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => { setLang(l.code); setLangOpen(false); }}
                          className={cn(
                            "flex w-full px-3 py-2 text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-dark-border",
                            lang === l.code ? "text-saffron" : "text-slate-600 dark:text-dark-muted"
                          )}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={toggle}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-dark-border dark:text-dark-muted dark:hover:bg-dark-border"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <LinkButton href="/login" variant="ghost" className="hidden sm:inline-flex">{t.common.login}</LinkButton>
              <LinkButton href="/dashboard" variant="secondary">{t.common.openApp}</LinkButton>
            </div>
          </nav>

          <div className="py-16 lg:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-telangana shadow-sm dark:bg-dark-card dark:text-teal-400">Telangana-first. India-scale. Citizen-centered.</p>
              <h1 className="mt-6 text-5xl font-black tracking-tight text-navy md:text-7xl dark:text-dark-text">Your AI guide through government services.</h1>
              <p className="mt-6 text-xl leading-9 text-slate-600 dark:text-dark-muted">Do not search portals, departments, forms, or rules. Tell Saarthi your goal and get a personalized government journey in English and Telugu.</p>
              <div className="glass-panel mt-8 rounded-[2rem] p-3 shadow-civic dark:shadow-civic-dark">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href="/signup" className="flex flex-1 items-center gap-3 rounded-2xl bg-white px-4 py-4 dark:bg-dark-card">
                    <Search className="text-slate-400 dark:text-dark-muted" />
                    <span className="text-slate-500 dark:text-dark-muted">What government service do you need help with?</span>
                  </Link>
                  <LinkButton href="/signup" className="gap-2">{t.common.askSaarthi} <ArrowRight size={18} /></LinkButton>
                  <button className="rounded-2xl border border-slate-200 bg-white px-4 text-slate-600 dark:border-dark-border dark:bg-dark-card dark:text-dark-muted" aria-label="Use voice" onClick={() => alert(t.common.voice)}><Mic /></button>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-semibold text-slate-600 dark:text-dark-muted">
                <Link href="/signup" className="rounded-full bg-white px-4 py-2 transition hover:bg-slate-100 dark:bg-dark-card dark:hover:bg-dark-border">Trade License</Link>
                <Link href="/signup" className="rounded-full bg-white px-4 py-2 transition hover:bg-slate-100 dark:bg-dark-card dark:hover:bg-dark-border">Birth Certificate</Link>
                <Link href="/signup" className="rounded-full bg-white px-4 py-2 transition hover:bg-slate-100 dark:bg-dark-card dark:hover:bg-dark-border">Farm Schemes</Link>
                <Link href="/signup" className="rounded-full bg-white px-4 py-2 transition hover:bg-slate-100 dark:bg-dark-card dark:hover:bg-dark-border">Land Registration</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <feature.icon className="text-saffron" />
              <h3 className="mt-4 text-xl font-black text-navy dark:text-dark-text">{feature.title}</h3>
              <p className="mt-3 leading-7 text-slate-600 dark:text-dark-muted">{feature.text}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
