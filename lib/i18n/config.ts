/* ── i18n config ───────────────────────────────────────────────────────────
   Lightweight internationalization foundation. Locale is stored in a cookie
   and applied client-side (keeps pages statically renderable). Per-locale URLs
   can be layered on later without changing these primitives.
──────────────────────────────────────────────────────────────────────────── */

export const LOCALES = ["en", "es", "fr", "de", "ar"] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "en"
export const LOCALE_COOKIE = "eb_locale"

/** Locales that render right-to-left. */
export const RTL_LOCALES: readonly Locale[] = ["ar"]

/** Native-name labels for the language switcher. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ar: "العربية",
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value)
}

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale)
}

export function dirFor(locale: Locale): "ltr" | "rtl" {
  return isRtl(locale) ? "rtl" : "ltr"
}

/**
 * Resolves the active locale from a cookie value first, then the best match in
 * an Accept-Language header, falling back to the default locale.
 */
export function resolveLocale(
  cookieValue?: string | null,
  acceptLanguage?: string | null,
): Locale {
  if (isLocale(cookieValue)) return cookieValue
  if (acceptLanguage) {
    for (const part of acceptLanguage.split(",")) {
      const code = part.trim().split(";")[0]?.split("-")[0]?.toLowerCase()
      if (isLocale(code)) return code
    }
  }
  return DEFAULT_LOCALE
}

/** Fills `{name}` placeholders in a message string. */
export function interpolate(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => (key in params ? String(params[key]) : `{${key}}`))
}
