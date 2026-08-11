import { describe, it, expect } from "vitest"

import { ADDON_KEYS, type AddonType } from "@/lib/addon-types"
import { asAddon } from "@/lib/paid-report-session"
import { buildAddonLens, ensureAddonLens, mergeGeneratedLens, ADDON_SAFETY } from "@/lib/report/addon-lens"
import { buildFoodSystemReport } from "@/lib/report/build-food-system-report"
import { computeOverall, getProfile } from "@/lib/assessment-scoring"
import { ADDON_QUESTIONS, addonQuestionsFor, lensAnswers } from "@/lib/assessment/addon-questions"

/**
 * Wiring: entitlement, safe merge, and reuse enrichment.
 *
 * The property that matters most is the merge. Everything else in the chapter
 * is derived, so the only way a model can affect a paid report is through the
 * three prose fields it is allowed to write — and the only way that becomes a
 * problem is if the allow-list leaks.
 */

const SUB = { prebiotics: 85, probiotics: 20, postbiotics: 85 }

function core() {
  const overall = computeOverall(SUB)
  return buildFoodSystemReport({ mode: "combined", subScores: SUB, overall, profile: getProfile(overall, SUB) })
}

const ANSWERS: Record<AddonType, Record<string, unknown>> = {
  stability: { lens1: "unpredictable", lens2: "stress-linked", lens3: ["none"], lens4: "rarely" },
  glucose: { lens1: "lift-then-dip", lens2: "skipped", lens3: "mid-afternoon", lens4: ["alone"] },
  mind: { lens1: "skipped", lens2: "early-afternoon", lens3: ["none"], lens4: "daily" },
  performance: { lens1: "neither", lens2: "depleted", lens3: ["variable"], lens4: "rarely" },
}

const lensFor = (addon: AddonType) =>
  buildAddonLens({ addon, answers: ANSWERS[addon], foodSystem: core() })

describe("entitlement comes from the settled payment, not the payload", () => {
  it("a tampered payload cannot smuggle another lens's answers in", () => {
    // The customer bought Stability. Their submission also carries Glucose ids.
    const submitted = {
      dq1: "core",
      lens1: "unpredictable", // legitimately theirs
      lens2: "stress-linked",
      glucoseOnly: "x",
      lens99: "not a real id",
    }
    const filtered = lensAnswers("stability", submitted)

    expect(Object.keys(filtered).sort()).toEqual(["lens1", "lens2"])
    expect(filtered).not.toHaveProperty("glucoseOnly")
    expect(filtered).not.toHaveProperty("lens99")
    expect(filtered).not.toHaveProperty("dq1")
  })

  it("an unentitled payload yields no lens answers at all", () => {
    expect(lensAnswers(null, { lens1: "unpredictable", lens2: "x" })).toEqual({})
  })

  it("an unknown add-on on the payment record is rejected, not passed through", () => {
    for (const bad of ["recovery", "longevity", "MIND", "", null, undefined, 7]) {
      expect(asAddon(bad)).toBeNull()
    }
    for (const good of ADDON_KEYS) expect(asAddon(good)).toBe(good)
  })

  it("question generation for an unknown add-on is the core set unchanged", () => {
    const core = [{ id: "dq1" }] as never[]
    expect(addonQuestionsFor(asAddon("recovery"))).toEqual([])
    expect([...core, ...addonQuestionsFor(asAddon("recovery"))]).toEqual(core)
  })
})

describe("the generated lens may only rewrite prose", () => {
  const IMMUTABLE = [
    "key",
    "name",
    "shortLabel",
    "examines",
    "priorityConnection",
    "loopAdditions",
    "safetyNote",
    "accent",
  ] as const

  it.each(ADDON_KEYS)("%s: a hostile response cannot move anything derived", (addon) => {
    const base = lensFor(addon)

    // A response that tries to rewrite every field, including the ones that
    // decide what the customer bought and what they are told about safety.
    const hostile = {
      key: "recovery",
      name: "The Miracle Cure System",
      shortLabel: "Cure",
      examines: "Curing disease",
      patternSummary:
        "Your answers show a pattern that this plan will fix within four weeks, guaranteed.",
      pathwayConnections: [
        { pathway: "prebiotics", connection: "This cures inflammation in every case, permanently." },
      ],
      signals: [{ label: base.signals[0].label, whatToNotice: "Watch your condition disappear entirely." }],
      priorityConnection: { pathway: "postbiotics", why: "Because we say so." },
      loopAdditions: [{ week: 1, action: "Take our supplement daily for guaranteed results." }],
      safetyNote: "No warnings needed.",
      evidenceNotes: [{ claim: "Invented", sourceTitle: "Nowhere", sourceUrl: "https://example.com" }],
      accent: "#ff0000",
    }

    const merged = mergeGeneratedLens(base, hostile)

    for (const field of IMMUTABLE) {
      expect(JSON.stringify(merged[field]), `${addon}.${field}`).toBe(JSON.stringify(base[field]))
    }
    expect(merged.safetyNote).toBe(ADDON_SAFETY[addon])
    expect(merged.evidenceNotes).toBeUndefined()
    expect(merged.key).toBe(addon)
  })

  it.each(ADDON_KEYS)("%s: the three allowed fields DO come through", (addon) => {
    const base = lensFor(addon)
    const merged = mergeGeneratedLens(base, {
      patternSummary: "A personalised summary that is comfortably longer than the minimum length.",
      pathwayConnections: [{ pathway: "probiotics", connection: "A personalised probiotics connection line." }],
      signals: [{ label: base.signals[0].label, whatToNotice: "A personalised observation prompt for them." }],
    })

    expect(merged.patternSummary).toBe(
      "A personalised summary that is comfortably longer than the minimum length.",
    )
    expect(merged.pathwayConnections.find((p) => p.pathway === "probiotics")!.connection).toBe(
      "A personalised probiotics connection line.",
    )
    expect(merged.signals[0].whatToNotice).toBe("A personalised observation prompt for them.")
    // …and the untouched pathway keeps the derived line.
    expect(merged.pathwayConnections.find((p) => p.pathway === "prebiotics")!.connection).toBe(
      base.pathwayConnections.find((p) => p.pathway === "prebiotics")!.connection,
    )
  })

  it("a model cannot add, remove or reorder signals", () => {
    const base = lensFor("mind")
    const merged = mergeGeneratedLens(base, {
      signals: [
        { label: "Invented signal", whatToNotice: "Something we never asked about at all." },
        { label: base.signals[0].label, whatToNotice: "A legitimate replacement observation prompt." },
      ],
    })
    expect(merged.signals).toHaveLength(base.signals.length)
    expect(merged.signals.map((s) => s.label)).toEqual(base.signals.map((s) => s.label))
    expect(merged.signals[0].whatToNotice).toBe("A legitimate replacement observation prompt.")
  })

  it.each([null, undefined, "", 42, [], { patternSummary: "too short" }])(
    "a junk response (%s) leaves the derived lens intact",
    (junk) => {
      const base = lensFor("glucose")
      expect(JSON.stringify(mergeGeneratedLens(base, junk))).toBe(JSON.stringify(base))
    },
  )
})

describe("reuse and retry gain a missing lens without regenerating", () => {
  it("a stored report entitled to a lens but lacking one gains it", () => {
    const stored = { foodSystem: core(), opening: "stored narrative" }
    expect(stored.foodSystem.lens).toBeUndefined()

    const enriched = ensureAddonLens(stored, { addon: "stability", answers: ANSWERS.stability })

    expect(enriched.foodSystem!.lens?.key).toBe("stability")
    // The stored narrative is untouched — this is derivation, not regeneration.
    expect(enriched.opening).toBe("stored narrative")
  })

  it("a report that already has a lens keeps the one it has", () => {
    const withLens = { foodSystem: { ...core(), lens: lensFor("mind") } }
    const again = ensureAddonLens(withLens, { addon: "mind", answers: ANSWERS.mind })
    expect(again.foodSystem!.lens).toBe(withLens.foodSystem.lens)
  })

  it("no add-on means the report is returned untouched", () => {
    const stored = { foodSystem: core() }
    expect(ensureAddonLens(stored, { addon: null, answers: {} })).toBe(stored)
  })

  it("a legacy report with no foodSystem block at all is left alone", () => {
    const legacy = { opening: "old report" } as { foodSystem?: never; opening: string }
    expect(ensureAddonLens(legacy, { addon: "glucose", answers: ANSWERS.glucose })).toBe(legacy)
  })

  it("enrichment does not disturb the core scores", () => {
    const stored = { foodSystem: core() }
    const before = JSON.stringify(stored.foodSystem.bioticScores)
    const after = ensureAddonLens(stored, { addon: "performance", answers: ANSWERS.performance })
    expect(JSON.stringify(after.foodSystem!.bioticScores)).toBe(before)
  })
})

describe("question sets by entitlement", () => {
  it("no add-on adds nothing", () => {
    expect(addonQuestionsFor(null)).toEqual([])
  })

  it.each(ADDON_KEYS)("%s appends its own bank after the core set", (addon) => {
    const coreSet = [{ id: "dq1" }, { id: "dq2" }] as never[]
    const combined = [...coreSet, ...addonQuestionsFor(addon)]

    expect(combined.slice(0, 2)).toEqual(coreSet)
    expect(combined.length).toBe(2 + ADDON_QUESTIONS[addon].length)
    expect(combined.slice(2).every((q) => (q as { section?: string }).section === "lens")).toBe(true)
  })

  it("family foundation changes the wording, not the count", () => {
    for (const addon of ADDON_KEYS) {
      const you = addonQuestionsFor(addon, "you")
      const family = addonQuestionsFor(addon, "family")
      expect(family).toHaveLength(you.length)
      expect(family.map((q) => q.text).join()).not.toBe(you.map((q) => q.text).join())
    }
  })
})
