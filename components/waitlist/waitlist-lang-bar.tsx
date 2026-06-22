"use client"

/**
 * Language control for the pre-launch waitlist surface: a compact switcher plus
 * a draft-translation notice shown for any non-English (machine-drafted) locale.
 * The locale is auto-seeded from the visitor's market in proxy.ts; this lets
 * them override it and makes the draft status explicit (per REVIEWED_LOCALES).
 */

import { Languages, Info } from "lucide-react"
import { useI18n } from "@/components/i18n/locale-provider"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { REVIEWED_LOCALES } from "@/lib/i18n/dictionaries"
import { LOCALE_LABELS, interpolate } from "@/lib/i18n/config"

export function WaitlistLangBar() {
  const { locale, t } = useI18n()
  const isDraft = !REVIEWED_LOCALES.includes(locale)

  return (
    <div className="mx-auto mb-5 w-full max-w-xl">
      <div className="flex items-center justify-end gap-2">
        <Languages size={15} className="text-muted-foreground" />
        <LanguageSwitcher />
      </div>
      {isDraft && (
        <div className="mt-2 flex items-start gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <Info size={14} className="mt-0.5 shrink-0 text-[var(--icon-orange)]" />
          <span>{interpolate(t.waitlist.draftNotice, { language: LOCALE_LABELS[locale] })}</span>
        </div>
      )}
    </div>
  )
}
