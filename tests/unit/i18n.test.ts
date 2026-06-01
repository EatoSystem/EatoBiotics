import { describe, it, expect } from "vitest"
import {
  LOCALES,
  DEFAULT_LOCALE,
  isLocale,
  isRtl,
  dirFor,
  resolveLocale,
  interpolate,
} from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"

describe("locale helpers", () => {
  it("recognises supported locales only", () => {
    expect(isLocale("es")).toBe(true)
    expect(isLocale("xx")).toBe(false)
    expect(isLocale(null)).toBe(false)
  })

  it("marks Arabic as RTL and others as LTR", () => {
    expect(isRtl("ar")).toBe(true)
    expect(dirFor("ar")).toBe("rtl")
    expect(dirFor("en")).toBe("ltr")
  })
})

describe("resolveLocale", () => {
  it("prefers a valid cookie value", () => {
    expect(resolveLocale("fr", "es-ES,es;q=0.9")).toBe("fr")
  })

  it("falls back to the best Accept-Language match", () => {
    expect(resolveLocale(null, "es-ES,es;q=0.9,en;q=0.8")).toBe("es")
    expect(resolveLocale(undefined, "ar")).toBe("ar")
  })

  it("falls back to the default when nothing matches", () => {
    expect(resolveLocale(null, "de-DE,de;q=0.9")).toBe(DEFAULT_LOCALE)
    expect(resolveLocale("xx", null)).toBe(DEFAULT_LOCALE)
  })
})

describe("interpolate", () => {
  it("fills named placeholders", () => {
    expect(interpolate("Average across {c} of {t}", { c: 2, t: 4 })).toBe("Average across 2 of 4")
  })

  it("leaves unknown placeholders intact", () => {
    expect(interpolate("Hi {name}")).toBe("Hi {name}")
  })
})

describe("getDictionary", () => {
  it("returns a dictionary for every supported locale with identical shape", () => {
    const enKeys = JSON.stringify(Object.keys(getDictionary("en").family).sort())
    for (const locale of LOCALES) {
      const d = getDictionary(locale)
      expect(d.common.appName).toBe("EatoBiotics")
      expect(d.pillars.prebiotics.length).toBeGreaterThan(0)
      // every locale defines the same family keys (no missing translations)
      expect(JSON.stringify(Object.keys(d.family).sort())).toBe(enKeys)
    }
  })
})
