"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { type Locale, DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, dirFor } from "@/lib/i18n/config"
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries"

interface LocaleContextValue {
  locale: Locale
  t: Dictionary
  setLocale: (l: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function readCookieLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE
  const m = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`))
  return isLocale(m?.[1]) ? (m![1] as Locale) : DEFAULT_LOCALE
}

/**
 * Holds the active locale + its dictionary. The server renders English HTML
 * (so pages stay statically generated); this provider adopts the persisted
 * locale on mount and reflects it on <html lang/dir> — including RTL.
 */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    const stored = readCookieLocale()
    if (stored !== locale) setLocaleState(stored)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale
      document.documentElement.dir = dirFor(locale)
    }
  }, [locale])

  const setLocale = useCallback((l: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`
    setLocaleState(l)
  }, [])

  return (
    <LocaleContext.Provider value={{ locale, t: getDictionary(locale), setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useI18n(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  // Safe fallback if a consumer renders outside the provider.
  if (!ctx) return { locale: DEFAULT_LOCALE, t: getDictionary(DEFAULT_LOCALE), setLocale: () => {} }
  return ctx
}

export function useTranslations(): Dictionary {
  return useI18n().t
}
