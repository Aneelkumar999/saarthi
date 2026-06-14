"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, X, Sparkles, Sun, Moon, ChevronDown } from "lucide-react";
import { navItems, adminNavItem } from "@/lib/data";
import { cn } from "@/lib/utils";
import { getStoredUser, getToken, logout, isAdmin, getLoginMode } from "@/lib/auth";
import { useIsClient } from "@/lib/use-is-client";
import { useTheme } from "@/providers/theme-provider";
import { useTranslation } from "@/providers/language-provider";
import type { Language } from "@/lib/i18n";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isClient = useIsClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { t, lang, setLang, languageNames } = useTranslation();

  useEffect(() => {
    if (isClient && !getToken()) {
      router.replace("/login");
    }
  }, [isClient, router]);

  if (!isClient || !getToken()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist px-4 text-center dark:bg-dark-surface">
        <div>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-navy text-white"><Sparkles /></div>
          <p className="mt-4 font-bold text-slate-600 dark:text-dark-muted">{isClient ? "Redirecting to login..." : "Checking secure session..."}</p>
        </div>
      </div>
    );
  }

  const user = getStoredUser();
  const userName = user?.name ?? user?.email ?? null;

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const languages: { code: Language; label: string }[] = [
    { code: "en", label: "English" },
    { code: "te", label: "తెలుగు" },
    { code: "hi", label: "हिन्दी" },
  ];

  const currentLang = languages.find((l) => l.code === lang)!;

  return (
    <div className="min-h-screen bg-mist dark:bg-dark-surface">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-dark-border dark:bg-dark-card/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 font-black text-navy dark:text-dark-text">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy text-white">
              <Sparkles size={20} />
            </span>
            <span>Saarthi AI</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {(getLoginMode() === "admin" ? [adminNavItem] : [...navItems]).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-semibold transition",
                  pathname === item.href
                    ? "bg-navy text-white dark:bg-saffron dark:text-dark-surface"
                    : "text-slate-600 hover:bg-slate-100 dark:text-dark-muted dark:hover:bg-dark-border"
                )}
              >
                {(t.nav as Record<string, string>)[item.label.toLowerCase()] || item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
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

            {/* Theme Toggle */}
            <button
              onClick={toggle}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-dark-border dark:text-dark-muted dark:hover:bg-dark-border"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {userName && (
              <span className="hidden rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 dark:bg-dark-border dark:text-dark-muted sm:inline-flex items-center gap-1.5">
                {isAdmin() && <span className="h-1.5 w-1.5 rounded-full bg-saffron" />}
                {userName}
              </span>
            )}
            <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-dark-border dark:text-dark-muted dark:hover:bg-dark-border">
              <LogOut size={16} /> {t.common.logout}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-xl border border-slate-200 p-2 lg:hidden dark:border-dark-border" aria-label="Open navigation">
              <Menu size={22} />
            </button>
          </div>
        </div>

        {/* Mobile language selector */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-2 lg:hidden dark:border-dark-border">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-bold transition",
                lang === l.code
                  ? "bg-saffron text-white"
                  : "text-slate-500 hover:bg-slate-100 dark:text-dark-muted dark:hover:bg-dark-border"
              )}
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={toggle}
            className="ml-auto rounded-lg border border-slate-200 p-1.5 text-slate-500 dark:border-dark-border dark:text-dark-muted"
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl dark:bg-dark-card">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-dark-border">
              <span className="font-black text-navy dark:text-dark-text">{t.common.menu}</span>
              <button onClick={() => setMobileOpen(false)} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-dark-border">
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
              {(getLoginMode() === "admin" ? [adminNavItem] : [...navItems]).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                    pathname === item.href
                      ? "bg-navy text-white dark:bg-saffron dark:text-dark-surface"
                      : "text-slate-600 hover:bg-slate-100 dark:text-dark-muted dark:hover:bg-dark-border"
                  )}
                >
                  {(t.nav as Record<string, string>)[item.label.toLowerCase()] || item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-slate-200 px-3 py-4 dark:border-dark-border">
              <button onClick={() => { setMobileOpen(false); handleLogout(); }} className="flex w-full items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-dark-border dark:text-dark-muted dark:hover:bg-dark-border">
                <LogOut size={16} /> {t.common.logout}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
