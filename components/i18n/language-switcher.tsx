"use client"

import { useI18n } from "./locale-provider"
import { LOCALES, LOCALE_LABELS, isLocale } from "@/lib/i18n/config"

/** Language picker — sets the locale cookie and updates the app live (no reload). */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n()
  return (
    <label className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <span className="sr-only">{t.language.label}</span>
      <select
        value={locale}
        onChange={(e) => {
          if (isLocale(e.target.value)) setLocale(e.target.value)
        }}
        aria-label={t.language.label}
        className="rounded-lg border px-2.5 py-1.5 text-sm"
        style={{ borderColor: "#ebebeb" }}
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  )
}
