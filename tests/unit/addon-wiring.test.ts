import { describe, it, expect } from "vitest"

import { ADDON_KEYS, type AddonType } from "@/lib/addon-types"
import { asAddon } from "@/lib/paid-report-session"
import { buildAddonLens, reconcileAddonLens, mergeGeneratedLens, ADDON_SAFETY } from "@/lib/report/addon-lens"
import { buildFoodSystemReport } from "@/lib/report/build-food-system-report"
import { computeOverall, getProfile } from "@/lib/assessment-scoring"
import { ADDON_QUESTIONS, addonQuestionsFor, sanitizeLensAnswers, withoutLensAnswers, lensQuestionId } from "@/lib/assessment/addon-questions"
import { ANSWERS_B, nsAnswers } from "./helpers/lens-fixtures"

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
  stability: ANSWERS_B["stability"],
  glucose: ANSWERS_B["glucose"],
  mind: ANSWERS_B["mind"],
  performance: ANSWERS_B["performance"],
}

const lensFor = (addon: AddonType) =>
  buildAddonLens({ addon, answers: ANSWERS[addon], foodSystem: core() })

describe("entitlement comes from the settled payment, not the payload", () => {
  it("a tampered payload cannot smuggle another lens's answers in", () => {
    // The customer bought Stability. Their submission also carries a full set
    // of Glucose answers, an unknown id, a core id, and — the case the old id
    // filter could not see — a Stability id carrying a value that belongs to a
    // different question.
    const submitted = {
      dq1: "core",
      ...nsAnswers("stability", { 1: "unpredictable", 2: "stress-linked" }),
      ...nsAnswers("glucose", { 1: "lift-then-dip", 2: "skipped", 3: "mid-afternoon" }),
      stability_lens4: "mid-afternoon", // a real id, another question's value
      lens1: "unpredictable", // the old un-namespaced id
      glucoseOnly: "x",
      lens99: "not a real id",
    }
    const filtered = sanitizeLensAnswers("stability", submitted)

    expect(Object.keys(filtered).sort()).toEqual(["stability_lens1", "stability_lens2"])
    // Nothing Glucose-shaped survives, by id or by value.
    for (const k of Object.keys(filtered)) expect(k.startsWith("stability_")).toBe(true)
    expect(Object.values(filtered)).not.toContain("mid-afternoon")
    expect(Object.values(filtered)).not.toContain("lift-then-dip")
    expect(filtered).not.toHaveProperty("glucoseOnly")
    expect(filtered).not.toHaveProperty("lens99")
    expect(filtered).not.toHaveProperty("lens1")
    expect(filtered).not.toHaveProperty("dq1")
  })

  it("an unentitled payload yields no lens answers at all", () => {
    expect(sanitizeLensAnswers(null, nsAnswers("stability", { 1: "unpredictable" }))).toEqual({})
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
    "evidenceNotes",
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
    // Evidence is derived and verified; a model-supplied list is discarded.
    expect(JSON.stringify(merged.evidenceNotes)).toBe(JSON.stringify(base.evidenceNotes))
    expect(JSON.stringify(merged.evidenceNotes)).not.toContain("Invented")
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

    const enriched = reconcileAddonLens(stored, { addon: "stability", answers: ANSWERS.stability })

    expect(enriched.foodSystem!.lens?.key).toBe("stability")
    // The stored narrative is untouched — this is derivation, not regeneration.
    expect(enriched.opening).toBe("stored narrative")
  })

  it("a report that already has a lens keeps the one it has", () => {
    const withLens = { foodSystem: { ...core(), lens: lensFor("mind") } }
    const again = reconcileAddonLens(withLens, { addon: "mind", answers: ANSWERS.mind })
    expect(again.foodSystem!.lens).toBe(withLens.foodSystem.lens)
  })

  it("no add-on means the report is returned untouched", () => {
    const stored = { foodSystem: core() }
    expect(reconcileAddonLens(stored, { addon: null, answers: {} })).toBe(stored)
  })

  it("a legacy report with no foodSystem block at all is left alone", () => {
    const legacy = { opening: "old report" } as { foodSystem?: never; opening: string }
    expect(reconcileAddonLens(legacy, { addon: "glucose", answers: ANSWERS.glucose })).toBe(legacy)
  })

  it("enrichment does not disturb the core scores", () => {
    const stored = { foodSystem: core() }
    const before = JSON.stringify(stored.foodSystem.bioticScores)
    const after = reconcileAddonLens(stored, { addon: "performance", answers: ANSWERS.performance })
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

/**
 * The MODEL's copy of the answers.
 *
 * `sanitizeLensAnswers` protects the deterministic builder, but the Claude
 * prompt is assembled separately — `buildQABlock` prints `answers[q.id]`
 * verbatim for every submitted question. Sanitizing only the builder's copy
 * therefore left a second door open: a payload could hand the model arbitrary
 * text under a real lens id, and the model might echo it into narrative that is
 * then persisted and rendered.
 *
 * The route now builds the prompt from
 * `{ ...withoutLensAnswers(answers), ...sanitizeLensAnswers(...) }`.
 */
describe("rejected lens input never reaches the model prompt", () => {
  const P = "ZZQX-REJECTED-PAYLOAD"

  const promptAnswersFor = (addon: AddonType | null, raw: Record<string, unknown>) => ({
    ...withoutLensAnswers(raw),
    ...sanitizeLensAnswers(addon, raw),
  })

  it.each(ADDON_KEYS)("%s: every hostile shape is stripped before the prompt", (addon) => {
    const other = ADDON_KEYS.find((k) => k !== addon)!
    const raw: Record<string, unknown> = {
      dq1: "a legitimate core answer",
      [lensQuestionId(addon, 1)]: P,                                     // arbitrary text
      [lensQuestionId(addon, 2)]: ADDON_QUESTIONS[addon][0].options![0].value, // wrong question's option
      [lensQuestionId(other, 1)]: ADDON_QUESTIONS[other][0].options![0].value, // another add-on
      [lensQuestionId(addon, 3)]: [ADDON_QUESTIONS[addon][2].options![0].value, P], // mixed array
      [`${addon}_lens99`]: P,                                            // unknown id
      lens1: P,                                                          // retired generic id
      [lensQuestionId(addon, 4)]: { evil: P },                           // non-string
    }

    const prompt = promptAnswersFor(addon, raw)

    expect(JSON.stringify(prompt)).not.toContain(P)
    // The one legitimate core answer is untouched — core copy is free text by
    // design and the model is meant to read it.
    expect(prompt.dq1).toBe("a legitimate core answer")
    // No lens-shaped key survives except validated ones.
    for (const key of Object.keys(prompt)) {
      if (/lens/i.test(key)) {
        expect(key.startsWith(`${addon}_lens`)).toBe(true)
        expect(sanitizeLensAnswers(addon, raw)).toHaveProperty(key)
      }
    }
  })

  it.each(ADDON_KEYS)("%s: the mixed array keeps only its valid member", (addon) => {
    const valid = ADDON_QUESTIONS[addon][2].options![0].value
    const prompt = promptAnswersFor(addon, { [lensQuestionId(addon, 3)]: [valid, P] })
    const kept = prompt[lensQuestionId(addon, 3)]
    if (kept !== undefined) {
      expect(kept).toEqual([valid])
      expect(JSON.stringify(kept)).not.toContain(P)
    }
  })

  it("omitted answers produce an empty lens set, not empty strings", () => {
    for (const addon of ADDON_KEYS) {
      expect(sanitizeLensAnswers(addon, {})).toEqual({})
      expect(promptAnswersFor(addon, {})).toEqual({})
    }
  })

  it("lens-shaped ids are stripped by SHAPE, not only by exact match", () => {
    // `mind_lens99` and the retired bare `lens1` are not real ids, so an
    // exact-match filter left them in the prompt object. Both must go.
    const out = withoutLensAnswers({
      dq1: "keep me",
      mind_lens99: P,
      lens1: P,
      LENS2: P,
      glucose_lens3: P,
    })
    expect(out).toEqual({ dq1: "keep me" })
  })
})
