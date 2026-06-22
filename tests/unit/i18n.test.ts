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
    expect(resolveLocale(null, "de-DE,de;q=0.9")).toBe("de")
  })

  it("falls back to the default when nothing matches", () => {
    expect(resolveLocale(null, "it-IT,it;q=0.9")).toBe(DEFAULT_LOCALE)
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
  it("includes German among the supported locales", () => {
    expect(LOCALES).toContain("de")
    expect(getDictionary("de").waitlist.intro.cta.length).toBeGreaterThan(0)
  })

  it("returns a dictionary for every supported locale with identical shape", () => {
    const enFamilyKeys = JSON.stringify(Object.keys(getDictionary("en").family).sort())
    const enWaitlistKeys = JSON.stringify(Object.keys(getDictionary("en").waitlist).sort())
    const enQuestionKeys = JSON.stringify(Object.keys(getDictionary("en").waitlist.questions).sort())
    for (const locale of LOCALES) {
      const d = getDictionary(locale)
      expect(d.common.appName).toBe("EatoBiotics")
      expect(d.pillars.prebiotics.length).toBeGreaterThan(0)
      // every locale defines the same keys (no missing translations)
      expect(JSON.stringify(Object.keys(d.family).sort())).toBe(enFamilyKeys)
      expect(JSON.stringify(Object.keys(d.waitlist).sort())).toBe(enWaitlistKeys)
      expect(JSON.stringify(Object.keys(d.waitlist.questions).sort())).toBe(enQuestionKeys)
      // each scored question keeps its four answer options
      for (const q of Object.values(d.waitlist.questions)) {
        expect(q.options).toHaveLength(4)
      }
      // each pillar keeps its four answer reactions
      expect(d.waitlist.reactions.prebiotics).toHaveLength(4)
      expect(d.waitlist.reactions.probiotics).toHaveLength(4)
      expect(d.waitlist.reactions.postbiotics).toHaveLength(4)
    }
  })
})
