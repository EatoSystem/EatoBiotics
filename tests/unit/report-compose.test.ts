import { describe, it, expect } from "vitest"
import { createHash } from "node:crypto"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { CONSULTATION_QUESTION_BANK } from "@/lib/consultation/question-bank"
import { resolveApplicableQuestions } from "@/lib/consultation/applicability"
import { prepareConsultationFinalisation, type ConsultationFinalisation } from "@/lib/consultation/finalisation"
import {
  createDeterministicConsultationSnapshot,
  DETERMINISTIC_STATE_KIND,
  DETERMINISTIC_STATE_SCHEMA_VERSION,
  type DeterministicConsultationState,
} from "@/lib/consultation/session-envelope"
import type { ConsultationAnswers, ConsultationFoundation } from "@/lib/consultation/types"
import { composePersonalFoodSystemReport } from "@/lib/report/deterministic/compose"
import { REPORT_V1_SUPPORTED_BANKS } from "@/lib/report/deterministic/report-bank"
import type { ReportProposition } from "@/lib/report/deterministic/proposition"
import { reportCapabilityEnabled } from "@/lib/report/deterministic/capabilities"
import { hasUnrepresentedHouseholdAllergy, mayNameSpecificFoods } from "@/lib/report/deterministic/report-safety"
import { PRIORITY_PRECEDENCE } from "@/lib/report/deterministic/priority"
import { customerFacingText, serialiseReport } from "@/lib/report/deterministic/serialise"
import type { PersonalFoodSystemReportV1 } from "@/lib/report/deterministic/report-types"

/**
 * The canonical document — Phase 4A-S2.
 *
 * ══ WHAT IS BEING PROVEN ════════════════════════════════════════════════════
 *
 * That a Report composed from a sealed Consultation contains no score, names
 * no food, makes no health claim, keeps personal and household content apart,
 * refuses a lens it cannot evidence, fails closed on the Q17 contradiction,
 * and produces byte-identical output for identical input.
 *
 * Fixtures are built by the REAL C1 builder from real answers, so what is
 * composed here is the same shape a sealed row would hold. A hand-written
 * finalisation literal would prove the composer works on a shape that may not
 * occur.
 */

const AT = new Date("2026-09-10T09:00:00.000Z")
const HANDOFF = "11111111-1111-4111-8111-111111111111"

/** Every applicable question answered validly, honouring branching. */
function completeAnswers(
  foundation: ConsultationFoundation,
  overrides: ConsultationAnswers = {},
): ConsultationAnswers {
  const answers: ConsultationAnswers = { ...overrides }
  for (let pass = 0; pass < 4; pass += 1) {
    for (const q of resolveApplicableQuestions({
      questions: CONSULTATION_QUESTION_BANK,
      context: { foundation },
      answers,
    })) {
      if (q.id in answers) continue
      if (q.type === "single") answers[q.id] = q.options![0].value
      else if (q.type === "multi") answers[q.id] = [q.options![0].value]
      else if (q.type === "textarea") answers[q.id] = "Fewer rushed mornings."
      else answers[q.id] = q.min ?? 0
    }
  }
  return answers
}

function finalise(
  foundation: ConsultationFoundation,
  overrides: ConsultationAnswers = {},
  lens: null | "glucose" = null,
): ConsultationFinalisation {
  const snapshot = createDeterministicConsultationSnapshot({
    foundation,
    entitledLens: lens,
    now: AT,
  })
  const state: DeterministicConsultationState = {
    kind: DETERMINISTIC_STATE_KIND,
    schemaVersion: DETERMINISTIC_STATE_SCHEMA_VERSION,
    candidateAnswers: completeAnswers(foundation, overrides),
    touchedQuestionIds: [],
    skippedOptionalQuestionIds: [],
    currentQuestionId: null,
    phase: "review",
  }
  const result = prepareConsultationFinalisation({ snapshot, state, finalisedAt: AT })
  if (!result.ok) throw new Error(`fixture did not finalise: ${result.reason}`)
  return result.finalisation
}

function mustCompose(finalisation: ConsultationFinalisation): PersonalFoodSystemReportV1 {
  const result = composePersonalFoodSystemReport({ finalisation, handoffId: HANDOFF })
  expect(result.ok, result.ok ? "" : `refused: ${result.reason} — ${result.detail}`).toBe(true)
  if (!result.ok) throw new Error(result.reason)
  return result.report
}

const textOf = (report: PersonalFoodSystemReportV1) => customerFacingText(report).join("\n")

/* ══ No scores, anywhere ═══════════════════════════════════════════════════ */

describe("the Report has no score of any kind", () => {
  const report = mustCompose(finalise("you"))
  const serialised = serialiseReport(report)

  it("carries no score field", () => {
    for (const field of [
      "overallScore", "bioticScores", "subScores", "score", "band",
      "strongestPathway", "priorityPathway", "weakestPathway", "rating", "percentile",
    ]) {
      expect(serialised, `${field} appeared in the Report`).not.toContain(`"${field}"`)
    }
  })

  it("shows no number that could read as a score in customer-facing text", () => {
    // Week numbers are legitimate; a bare 0–100 is not.
    const numbers = textOf(report).match(/\b\d{1,3}\b/g) ?? []
    for (const n of numbers) {
      expect(Number(n), `"${n}" reads as a score`).toBeLessThanOrEqual(4)
    }
  })

  it("names no biotic pathway", () => {
    expect(textOf(report)).not.toMatch(/pre-?biotic|pro-?biotic|post-?biotic|microbiom/i)
  })

  it("never reads free_scores, because the composer has no access to it", () => {
    const source = readFileSync(join(process.cwd(), "lib/report/deterministic/compose.ts"), "utf8")
    expect(source).not.toContain("free_scores")
    expect(source).not.toContain("report_json")
  })
})

/* ══ Structure ═════════════════════════════════════════════════════════════ */

describe("the document contains only sections something authorises", () => {
  const report = mustCompose(finalise("you"))

  it("has the five core parts and a provenance block", () => {
    expect(report.kind).toBe("personal-food-system-report-v1")
    expect(report.systemSnapshot.propositions.length).toBeGreaterThan(0)
    expect(report.priorityLever.propositions).toHaveLength(1)
    expect(report.thirtyDayLoop.length).toBeGreaterThan(0)
    expect(report.safety).toBeDefined()
    expect(report.provenance.handoffId).toBe(HANDOFF)
  })

  it("has no bodySignalMap, foodSystemMap, educationModules or closingMissionPage", () => {
    const serialised = serialiseReport(report)
    for (const absent of ["bodySignalMap", "foodSystemMap", "educationModules", "closingMissionPage"]) {
      expect(serialised, `${absent} is present`).not.toContain(absent)
    }
  })

  it("has no empty placeholder section for a suppressed capability", () => {
    const serialised = serialiseReport(report)
    expect(serialised).not.toContain('"foods"')
    expect(serialised).not.toContain("bioticsAnalysis")
  })

  it("every proposition names a source, a use and a target", () => {
    const all = [
      ...report.systemSnapshot.propositions,
      ...report.priorityLever.propositions,
      ...report.thirtyDayLoop.map((s) => s.proposition),
      ...report.constraints.propositions,
    ]
    expect(all.length).toBeGreaterThan(5)
    for (const p of all) {
      expect(p.sourceQuestionIds.length, p.id).toBeGreaterThan(0)
      expect(p.sourceFields.length, p.id).toBeGreaterThan(0)
      expect(p.allowedUse, p.id).toBeTruthy()
      expect(p.target, p.id).toBeTruthy()
      expect(p.templateId, p.id).toBeTruthy()
      expect(p.basis.kind, p.id).toMatch(/science-adjudicated|product-operational/)
    }
  })

  it("quotes the customer's own words without reading them", () => {
    expect(report.quotation).toBeDefined()
    expect(report.quotation!.kind).toBe("quotation")
    expect(report.quotation!.text).toContain("Fewer rushed mornings.")
    // Attributed, and not summarised into anything else.
    expect(report.quotation!.text).toContain("In your own words")
  })
})

/* ══ Capability suppression ════════════════════════════════════════════════ */

describe("all three gates being OPEN is visible in the output", () => {
  const report = mustCompose(finalise("you", { core_environment_constraints_v1: ["allergy"] }))

  it("records the capability state in provenance", () => {
    expect(report.provenance.capabilitiesAtCompose).toEqual({
      specificFoods: false,
      bioticsLanguage: false,
      safetyNetting: false,
    })
  })

  it("drops every constraint proposition, because they answer to the dietetic gate", () => {
    expect(report.constraints.propositions).toEqual([])
  })

  it("still tells the customer the Report is keeping to general guidance", () => {
    // Suppression must not be silence: a Report that says nothing about
    // constraints is one the reader assumes has none.
    expect(report.safety.specificFoodsSuppressed).toBe(true)
    expect(report.safety.suppressionReasons).toContain("capability:specificFoods-disabled")
  })

  it("shows no safety-netting sentence, because that wording is unapproved", () => {
    expect(textOf(report)).not.toMatch(/speak to (your|a) (gp|doctor)|seek medical/i)
  })
})

/* ══ The one admission boundary ════════════════════════════════════════════ */

/**
 * Every proposition in the finished document, wherever it lives.
 *
 * Written to walk the document GENERICALLY rather than to list the sections
 * that exist today. The defect this replaces was a per-section check: the
 * constraints path checked capabilities and nothing else did, so any other
 * section was an unguarded way in. A test that enumerated sections by hand
 * would have the same hole as the code it is guarding.
 */
function everyProposition(report: PersonalFoodSystemReportV1) {
  const found: Array<ReportProposition & { where: string }> = []
  const walk = (where: string, node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach((child) => walk(where, child))
      return
    }
    if (!node || typeof node !== "object") return
    const record = node as Record<string, unknown>
    if (typeof record.id === "string" && Array.isArray(record.requiredCapabilities)) {
      // The WHOLE proposition, so a test can assert anything about it — the
      // walker exists to find every one, not to decide what matters.
      found.push({ ...(node as ReportProposition), where })
      return
    }
    for (const [key, child] of Object.entries(record)) walk(where === "" ? key : where, child)
  }
  for (const [key, value] of Object.entries(report)) {
    if (key === "provenance" || key === "safety") continue
    walk(key, value)
  }
  return found
}

describe("no section may carry a proposition whose capability is unavailable", () => {
  /*
   * Built INSIDE each test, deliberately.
   *
   * A refusal is how the boundary reports a slip, and `mustCompose` turns a
   * refusal into a failure. Composed at describe scope that failure would
   * surface as a collection error naming no test, which is a much worse
   * signal for whoever caused it than a named assertion.
   */
  const fixtures = (): ReadonlyArray<{ name: string; report: PersonalFoodSystemReportV1 }> => [
    { name: "you, default", report: mustCompose(finalise("you")) },
    {
      name: "you, with a declared allergy and named avoidances",
      report: mustCompose(
        finalise("you", {
          core_environment_constraints_v1: ["allergy"],
          core_environment_food_avoidances_v1: ["dairy", "nuts"],
        }),
      ),
    },
    { name: "family, default", report: mustCompose(finalise("family")) },
    {
      name: "family, with an unrepresented household allergy",
      report: mustCompose(
        finalise("family", {
          core_environment_household_differing_needs_v1: ["allergies"],
          core_environment_constraints_v1: ["none"],
        }),
      ),
    },
  ]

  it("every fixture composes — a slipped proposition makes the boundary refuse", () => {
    /*
     * The belt's own test. `unsatisfiedIn` re-reads the finished document and
     * turns anything that got past `admit` into a refusal, so a section that
     * stopped filtering itself stops the Report entirely rather than shipping
     * a gated sentence.
     */
    for (const { name } of fixtures()) {
      expect(name.length).toBeGreaterThan(0)
    }
  })

  it("the walker really does find propositions, or the assertions below prove nothing", () => {
    const built = fixtures()
    for (const { name, report } of built) {
      expect(everyProposition(report).length, name).toBeGreaterThan(0)
    }
    // And it reaches past the two obvious sections.
    const sections = new Set(everyProposition(built[2].report).map((p) => p.where))
    expect(sections.size).toBeGreaterThan(1)
  })

  it("every proposition in every section satisfies every capability it needs", () => {
    for (const { name, report } of fixtures()) {
      const safety = report.safety
      for (const proposition of everyProposition(report)) {
        for (const capability of proposition.requiredCapabilities) {
          expect(reportCapabilityEnabled(capability), `${name}: ${proposition.where}/${proposition.id}`).toBe(
            true,
          )
          if (capability === "specificFoods") {
            expect(mayNameSpecificFoods(safety), `${name}: ${proposition.id}`).toBe(true)
          }
        }
      }
    }
  })

  it("with all three gates OPEN that means nothing gated got in anywhere", () => {
    // The stronger statement, true while every capability is disabled: no
    // proposition in the document requires anything at all.
    for (const { name, report } of fixtures()) {
      for (const proposition of everyProposition(report)) {
        expect(proposition.requiredCapabilities, `${name}: ${proposition.where}/${proposition.id}`).toEqual(
          [],
        )
      }
    }
  })

  it("an ungated sentence from a food-capable question still renders", () => {
    /*
     * The precision half. `householdDifferingNeeds` is one of the questions
     * that would feed named-food guidance once the dietetic gate closes, and
     * its foodTools operations are suppressed today — but its plain household
     * recap is not food guidance and must survive. A boundary that silenced
     * the whole question would be over-broad, and over-broad suppression is
     * how a paid Report quietly becomes empty.
     */
    const report = mustCompose(
      finalise("family", { core_environment_household_differing_needs_v1: ["schedules"] }),
    )
    const household = report.familyContext?.propositions ?? []
    expect(household.length).toBeGreaterThan(0)
    expect(household.flatMap((p) => p.sourceQuestionIds)).toContain(
      "core_environment_household_differing_needs_v1",
    )
    expect(report.constraints.propositions).toEqual([])
  })

  it("the composer routes admission through one function, not one per section", () => {
    const source = readFileSync(join(process.cwd(), "lib/report/deterministic/compose.ts"), "utf8")
    // The belt as well as the braces: the finished document is re-read.
    expect(source).toContain("unsatisfiedIn(report, safety)")
    expect(source).toMatch(/function admit\(/)
    // Exactly one place decides, and it is not inlined into a section.
    expect(source.match(/reportCapabilityEnabled\(/g) ?? []).toHaveLength(1)
  })
})

/* ══ Priority ══════════════════════════════════════════════════════════════ */

describe("priority means a practical starting point, chosen by visible precedence", () => {
  it("the precedence list is ordered, complete and stated", () => {
    // The reachability audit — a real winning state for each rule, and proof
    // the deleted ones could never have been reached — is in
    // tests/unit/report-priority.test.ts.
    expect(PRIORITY_PRECEDENCE.map((c) => c.rank)).toEqual([1, 2, 3, 4, 5])
    for (const candidate of PRIORITY_PRECEDENCE) {
      expect(candidate.reason.length, candidate.questionId).toBeGreaterThan(30)
    }
  })

  it("the customer's own stated focus outranks everything", () => {
    const report = mustCompose(finalise("you", { core_intentions_primary_focus_v1: "digestion" }))
    expect(report.priorityLever.propositions[0].sourceQuestionIds).toEqual([
      "core_intentions_primary_focus_v1",
    ])
    expect(report.priorityLever.propositions[0].text).toMatch(/digestion/i)
  })

  it("falls through when they said they are unsure, rather than inventing a focus", () => {
    const report = mustCompose(
      finalise("you", { core_intentions_primary_focus_v1: "unsure", core_intentions_barrier_v1: "time" }),
    )
    expect(report.priorityLever.propositions[0].sourceQuestionIds).toEqual([
      "core_intentions_barrier_v1",
    ])
  })

  it("never claims a cause, a risk or a target", () => {
    const report = mustCompose(finalise("you"))
    const lever = report.priorityLever.propositions[0].text
    expect(lever).not.toMatch(/cause|root|risk|deficien|blocker|damag|treat|fix|correct/i)
  })

  it("uses no hidden ranking metric", () => {
    const source = readFileSync(join(process.cwd(), "lib/report/deterministic/priority.ts"), "utf8")
    expect(source).not.toMatch(/\bweight\b|\bscore\b|\.sort\(/i)
  })
})

/* ══ The 30-day loop ═══════════════════════════════════════════════════════ */

describe("the loop is practical, and rests on the one starting point", () => {
  const report = mustCompose(finalise("you"))

  it("runs Try · Notice · Adjust · Repeat over four weeks", () => {
    expect(report.thirtyDayLoop.map((s) => s.week)).toEqual([1, 2, 3, 4])
    expect(report.thirtyDayLoop.map((s) => s.beat)).toEqual(["Try", "Notice", "Adjust", "Repeat"])
  })

  it("never uses treatment or restriction language", () => {
    const loopText = report.thirtyDayLoop.map((s) => s.proposition.text).join(" ")
    expect(loopText).not.toMatch(
      /treat|dose|protocol|cure|heal|eat less|smaller portion|fewer meals|calorie|restrict|skip a meal/i,
    )
  })

  it("rests only on the priority proposition's own sources", () => {
    const leverSources = report.priorityLever.propositions[0].sourceQuestionIds
    for (const step of report.thirtyDayLoop) {
      expect(step.proposition.sourceQuestionIds).toEqual(leverSources)
    }
  })
})

/* ══ Family isolation ══════════════════════════════════════════════════════ */

describe("a household Report is a household Report", () => {
  const family = mustCompose(finalise("family"))
  const personal = mustCompose(finalise("you"))

  it("renders a household section", () => {
    expect(family.foundation).toBe("family")
    expect(family.familyContext).toBeDefined()
    expect(family.familyContext!.propositions.length).toBeGreaterThan(0)
  })

  it("a personal Report has no household section at all", () => {
    expect(personal.familyContext).toBeUndefined()
  })

  it("you-only questions never leak into a household Report", () => {
    const youOnly = CONSULTATION_QUESTION_BANK.filter(
      (q) => q.foundations.includes("you") && !q.foundations.includes("family"),
    ).map((q) => q.id)
    expect(youOnly.length).toBeGreaterThan(0)

    const used = new Set(
      [
        ...family.systemSnapshot.propositions,
        ...family.priorityLever.propositions,
        ...(family.familyContext?.propositions ?? []),
      ].flatMap((p) => p.sourceQuestionIds),
    )
    for (const id of youOnly) {
      expect(used, `${id} leaked into the Family Report`).not.toContain(id)
    }
  })

  it("aggregates no individual biology across the household", () => {
    expect(textOf(family)).not.toMatch(/average|combined score|everyone's|each member's health/i)
  })
})

/* ══ The bank this Report understands ══════════════════════════════════════ */

describe("the composer proves it understands the bank before reading anything", () => {
  const PINNED = REPORT_V1_SUPPORTED_BANKS[0]

  it("the supported fixture composes normally", () => {
    const f = finalise("you")
    expect(f.bankVersion).toBe(PINNED.version)
    expect(f.bankFingerprint).toBe(PINNED.fingerprint)
    expect(mustCompose(f).provenance.bankFingerprint).toBe(PINNED.fingerprint)
  })

  it("refuses an unknown bank version", () => {
    const result = composePersonalFoodSystemReport({
      finalisation: { ...finalise("you"), bankVersion: "consultation-v2" },
      handoffId: HANDOFF,
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("bank-unsupported")
  })

  it("refuses a known version whose fingerprint has drifted", () => {
    const result = composePersonalFoodSystemReport({
      finalisation: { ...finalise("you"), bankFingerprint: "ffffffffffffffffffffffffffffffff" },
      handoffId: HANDOFF,
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("bank-fingerprint-unsupported")
  })

  it("checks the bank BEFORE the lens, because a lens refusal is an interpretation too", () => {
    /*
     * Order matters and is pinned. A finalisation that is both lens-bearing
     * and from an unsupported bank must report the bank: if we cannot vouch
     * for the bank we cannot vouch for any field we read from the seal,
     * including the one the lens refusal rests on.
     */
    const result = composePersonalFoodSystemReport({
      finalisation: { ...finalise("you", {}, "glucose"), bankVersion: "consultation-v2" },
      handoffId: HANDOFF,
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("bank-unsupported")
  })

  it("provenance carries the finalisation's own identity, never today's", () => {
    // The seal is the authority for what it was answered against. The Report
    // records that, it does not restate the build's opinion.
    const report = mustCompose(finalise("family"))
    const f = finalise("family")
    expect(report.provenance.bankVersion).toBe(f.bankVersion)
    expect(report.provenance.bankFingerprint).toBe(f.bankFingerprint)
  })
})

/* ══ Answers this build cannot read ════════════════════════════════════════ */

describe("an unreadable trusted answer refuses the Report, it does not shorten it", () => {
  const withUnknownValue = (): ConsultationFinalisation => {
    const f = finalise("you")
    return {
      ...f,
      trustedAnswers: { ...f.trustedAnswers, core_signals_context_v1: ["rushed", "not-in-this-bank"] },
    }
  }

  it("refuses with unsupported-answer-value", () => {
    const result = composePersonalFoodSystemReport({
      finalisation: withUnknownValue(),
      handoffId: HANDOFF,
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("unsupported-answer-value")
    expect(result.detail).toContain("not-in-this-bank")
    expect(result.detail).toContain("core_signals_context_v1")
  })

  it("does not instead compose a Report missing that answer", () => {
    /*
     * The whole point. Dropping the value would produce a document that is
     * indistinguishable from one the customer simply answered less of — the
     * failure mode with no symptom.
     */
    const result = composePersonalFoodSystemReport({
      finalisation: withUnknownValue(),
      handoffId: HANDOFF,
    })
    expect(result.ok).toBe(false)
  })

  it("the sibling value that IS supported is not what saved it", () => {
    // Guards against a future "refuse only if nothing survives" softening.
    const f = withUnknownValue()
    expect(f.trustedAnswers["core_signals_context_v1"]).toContain("rushed")
  })

  it("a fully supported answer set still composes", () => {
    expect(
      composePersonalFoodSystemReport({
        finalisation: finalise("you", { core_signals_context_v1: ["rushed", "large-late"] }),
        handoffId: HANDOFF,
      }).ok,
    ).toBe(true)
  })
})

/* ══ Provenance is bound to the words ══════════════════════════════════════ */

describe("every sentence records the exact answer it came from", () => {
  it("each proposition's primary source names a question the seal actually asked", () => {
    for (const foundation of ["you", "family"] as const) {
      const f = finalise(foundation)
      const report = mustCompose(f)
      for (const p of everyProposition(report)) {
        const primary = p.sources[0]
        expect(primary, `${p.where}/${p.id} has no primary source`).toBeDefined()
        expect(f.applicableQuestionIds, `${p.id}`).toContain(primary.questionId)
      }
    }
  })

  it("a recap's primary value is one the customer actually chose", () => {
    const f = finalise("you", { core_signals_context_v1: ["rushed", "large-late"] })
    const report = mustCompose(f)
    for (const p of everyProposition(report)) {
      const { questionId, value } = p.sources[0]
      if (value === null) continue
      const stored = f.trustedAnswers[questionId]
      const chosen = Array.isArray(stored) ? stored : [stored]
      // The quotation's value is the free text itself, which is the answer.
      expect(chosen, `${p.id}: ${questionId}="${value}"`).toContain(value)
    }
  })

  it("a loop beat is attributed to the lever's answer, not re-attributed", () => {
    const report = mustCompose(finalise("you"))
    const lever = report.priorityLever.propositions[0]
    for (const step of report.thirtyDayLoop) {
      expect(step.proposition.sources).toEqual(lever.sources)
    }
  })

  it("the recorded value is the one the template was resolved from", () => {
    /*
     * energyShape grants only priorityLever and thirtyDayLoop, and precedence
     * reaches it only once the stated focus and the barrier both decline — so
     * the fixture has to construct that state for the assertion to mean
     * anything.
     */
    const report = mustCompose(
      finalise("you", {
        core_intentions_primary_focus_v1: "unsure",
        core_intentions_barrier_v1: "none",
        core_signals_energy_shape_v1: "afternoon-dip",
      }),
    )
    const lever = report.priorityLever.propositions[0]
    expect(lever.sources).toEqual([
      { questionId: "core_signals_energy_shape_v1", value: "afternoon-dip" },
    ])
    expect(lever.templateId).toBe("signals.energyShape.afternoonDip")
    expect(lever.text).toContain("afternoon dip")
  })
})

/* ══ The quotation, in the document ════════════════════════════════════════ */

describe("the customer's own words are quoted and read by nothing", () => {
  const withAnswer = (answer: string) =>
    mustCompose(finalise("you", { core_intentions_success_v1: answer }))

  it("the quotation is attributed to the success question", () => {
    const report = withAnswer("Fewer rushed mornings.")
    expect(report.quotation?.sources).toEqual([
      { questionId: "core_intentions_success_v1", value: "Fewer rushed mornings." },
    ])
    expect(report.quotation?.kind).toBe("quotation")
    expect(report.quotation?.target).toBe("systemSnapshot")
  })

  it("changing only the free text changes only the quotation", () => {
    /*
     * The strongest available statement of "free text selects no other
     * content": two documents built from the same answers apart from the
     * success text are identical once the quotation is removed. If the prose
     * influenced a template, a priority, a section or an order, this fails.
     */
    const strip = (r: PersonalFoodSystemReportV1) => {
      const { quotation: _quotation, ...rest } = r
      return serialiseReport(rest as PersonalFoodSystemReportV1)
    }
    expect(strip(withAnswer("Cooking more at home."))).toBe(
      strip(withAnswer("Sleeping through the night, and less bloating.")),
    )
  })

  it("the two quotations differ only by the customer's words", () => {
    const a = withAnswer("Cooking more at home.").quotation
    const b = withAnswer("Fewer rushed mornings.").quotation
    expect(a?.templateId).toBe(b?.templateId)
    expect(a?.text).not.toBe(b?.text)
    expect(a?.text).toContain("Cooking more at home.")
  })

  it("the free text is never paraphrased into any other sentence", () => {
    const report = withAnswer("Zanzibar pomegranate ritual.")
    const elsewhere = everyProposition(report).filter((p) => p.id !== report.quotation?.id)
    for (const p of elsewhere) {
      expect(p.id, p.id).not.toContain("Zanzibar")
    }
    expect(
      customerFacingText(report).filter((line) => line.includes("Zanzibar")),
    ).toHaveLength(1)
  })
})

/* ══ Lens refusal ══════════════════════════════════════════════════════════ */

describe("an entitled lens is refused, not labelled", () => {
  it("refuses with lens-unsupported", () => {
    const result = composePersonalFoodSystemReport({
      finalisation: finalise("you", {}, "glucose"),
      handoffId: HANDOFF,
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("lens-unsupported")
    expect(result.detail).toContain("glucose")
  })

  it("because the deterministic bank holds no lens question", () => {
    // The trace that makes the refusal necessary rather than cautious.
    const lensShaped = CONSULTATION_QUESTION_BANK.filter((q) => /lens\d/i.test(q.id))
    expect(lensShaped).toEqual([])
  })

  it("a core-only Consultation with no lens composes normally", () => {
    expect(composePersonalFoodSystemReport({ finalisation: finalise("you"), handoffId: HANDOFF }).ok).toBe(true)
  })
})

/* ══ Q17 ═══════════════════════════════════════════════════════════════════ */

describe("an unrepresented household allergy fails closed, whatever else was said", () => {
  /*
   * ══ WHAT THE PREVIOUS VERSION OF THIS BLOCK GOT WRONG ════════════════════
   *
   * It asserted that the fixture's `requiresSpecificAvoidance` and
   * `unresolvedSpecificAvoidance` were BOTH false — encoding the idea that
   * Q17 counts only while Q16/Q18 happen to be quiet. That is backwards.
   * Those flags are derived from Q16 and Q18, which are the customer's own
   * constraints; Q17 says somebody ELSE in the household has an allergy.
   * Nothing links them. A customer who avoids dairy themselves, with a child
   * allergic to peanuts, would have had the peanut declaration absorbed.
   *
   * So the property is unconditional, and it is tested as a matrix rather
   * than at the one convenient point.
   */
  const contradictory = finalise("family", {
    core_environment_household_differing_needs_v1: ["allergies"],
    core_environment_constraints_v1: ["none"],
  })
  const report = mustCompose(contradictory)

  const Q17_ALLERGIES = { core_environment_household_differing_needs_v1: ["allergies"] }

  const ALONGSIDE: ReadonlyArray<{ name: string; answers: ConsultationAnswers }> = [
    { name: "Q16 says nothing in particular", answers: { core_environment_constraints_v1: ["none"] } },
    {
      name: "Q16 declares the customer's OWN allergy",
      answers: {
        core_environment_constraints_v1: ["allergy"],
        core_environment_food_avoidances_v1: ["dairy"],
      },
    },
    {
      name: "Q16 declares a medical avoidance left unresolved",
      answers: {
        core_environment_constraints_v1: ["medical-avoid"],
        core_environment_food_avoidances_v1: ["other"],
      },
    },
    {
      name: "Q16 was declined",
      answers: { core_environment_constraints_v1: ["prefer-not-to-say"] },
    },
    {
      name: "Q16 declares a non-safety constraint",
      answers: { core_environment_constraints_v1: ["budget", "time"] },
    },
  ]

  it("the detector reads Q17 alone, and says yes in every one of those states", () => {
    for (const { name, answers } of ALONGSIDE) {
      const f = finalise("family", { ...Q17_ALLERGIES, ...answers })
      expect(hasUnrepresentedHouseholdAllergy(f.trustedAnswers), name).toBe(true)
    }
  })

  it("the Report is contradictory in every one of those states", () => {
    for (const { name, answers } of ALONGSIDE) {
      const r = mustCompose(finalise("family", { ...Q17_ALLERGIES, ...answers }))
      expect(r.safety.state, name).toBe("contradictory")
      expect(r.safety.specificFoodsSuppressed, name).toBe(true)
      expect(r.constraints.propositions, name).toEqual([])
      expect(textOf(r), name).not.toMatch(
        /nothing (in particular )?to work around|no constraints|no restrictions|nothing to avoid/i,
      )
    }
  })

  it("a caution flag from Q16 or Q18 never resolves it", () => {
    // The exact escape that was removed: a fixture whose frozen guidance IS
    // already cautious must still read as an unrepresented Q17 declaration.
    const alsoCautious = finalise("family", {
      ...Q17_ALLERGIES,
      core_environment_constraints_v1: ["allergy"],
      core_environment_food_avoidances_v1: ["other"],
    })
    expect(alsoCautious.foodGuidance.requiresSpecificAvoidance).toBe(true)
    expect(alsoCautious.foodGuidance.unresolvedSpecificAvoidance).toBe(true)
    expect(hasUnrepresentedHouseholdAllergy(alsoCautious.trustedAnswers)).toBe(true)
    expect(mustCompose(alsoCautious).safety.state).toBe("contradictory")
  })

  it("the detector is not given the frozen guidance at all", () => {
    // Structural: it cannot weigh what it cannot see, so no future edit can
    // reintroduce the escape without changing the signature in review.
    expect(hasUnrepresentedHouseholdAllergy.length).toBe(1)
  })

  it("no Q17 allergy means no contradiction — the rule is not a blanket", () => {
    const plain = finalise("family", {
      core_environment_household_differing_needs_v1: ["schedules"],
      core_environment_constraints_v1: ["none"],
    })
    expect(hasUnrepresentedHouseholdAllergy(plain.trustedAnswers)).toBe(false)
    expect(mustCompose(plain).safety.state).not.toBe("contradictory")
  })

  it("the Report marks its safety state contradictory", () => {
    expect(report.safety.state).toBe("contradictory")
    expect(report.safety.suppressionReasons).toContain(
      "q17:household-allergy-not-in-frozen-food-guidance",
    )
  })

  it("names no food", () => {
    expect(report.constraints.propositions).toEqual([])
    expect(textOf(report)).not.toMatch(/\b(nuts|dairy|eggs|soya|sesame|wheat|gluten)\b/i)
  })

  it("never says there are no constraints", () => {
    expect(textOf(report)).not.toMatch(
      /nothing (in particular )?to work around|no constraints|no restrictions|nothing to avoid/i,
    )
  })

  it("never describes an unspecified food as suitable or safe", () => {
    expect(textOf(report)).not.toMatch(/is safe|are safe|suitable for you|fine to eat/i)
  })

  it("tells the customer it is keeping to general guidance", () => {
    expect(report.safety.note).toMatch(/general guidance/i)
  })
})

/* ══ Determinism ═══════════════════════════════════════════════════════════ */

describe("identical input produces byte-identical output", () => {
  const hash = (r: PersonalFoodSystemReportV1) =>
    createHash("sha256").update(serialiseReport(r)).digest("hex")

  /**
   * The stored array is a record of somebody's clicks, not of what they meant.
   * Two Consultations that selected the same things in a different sequence
   * must produce the same document, byte for byte — a reversal is the
   * cheapest total scramble of that ordering.
   */
  describe("reversing every stored multi answer changes nothing", () => {
    const MULTI_FIXTURES: ReadonlyArray<{ name: string; foundation: ConsultationFoundation; answers: ConsultationAnswers }> = [
      {
        name: "you, with three multi answers",
        foundation: "you",
        answers: {
          core_signals_context_v1: ["rushed", "large-late", "stress-sleep"],
          core_environment_constraints_v1: ["allergy", "budget", "time"],
          core_environment_food_avoidances_v1: ["dairy", "nuts", "sesame"],
        },
      },
      {
        name: "family, with a household multi answer",
        foundation: "family",
        answers: {
          core_environment_household_differing_needs_v1: ["tastes", "schedules", "life-stage"],
          core_environment_constraints_v1: ["budget", "time", "dislikes"],
        },
      },
    ]

    const reverseArrays = (answers: ConsultationAnswers): ConsultationAnswers =>
      Object.fromEntries(
        Object.entries(answers).map(([k, v]) => [k, Array.isArray(v) ? [...v].reverse() : v]),
      )

    for (const fixture of MULTI_FIXTURES) {
      it(`${fixture.name}: identical bytes`, () => {
        const forward = mustCompose(finalise(fixture.foundation, fixture.answers))
        const backward = mustCompose(finalise(fixture.foundation, reverseArrays(fixture.answers)))
        expect(serialiseReport(backward)).toBe(serialiseReport(forward))
        expect(hash(backward)).toBe(hash(forward))
      })

      it(`${fixture.name}: identical starting point`, () => {
        const forward = mustCompose(finalise(fixture.foundation, fixture.answers))
        const backward = mustCompose(finalise(fixture.foundation, reverseArrays(fixture.answers)))
        expect(backward.priorityLever.propositions.map((p) => p.id)).toEqual(
          forward.priorityLever.propositions.map((p) => p.id),
        )
      })

      it(`${fixture.name}: the fixture really does carry reversible multi answers`, () => {
        // Guards against the reversal quietly becoming a no-op, which is how
        // this class of test stops proving anything.
        const multis = Object.values(fixture.answers).filter((v) => Array.isArray(v) && v.length > 1)
        expect(multis.length).toBeGreaterThan(0)
      })
    }
  })

  it("composing twice gives the same bytes", () => {
    const f = finalise("you")
    expect(hash(mustCompose(f))).toBe(hash(mustCompose(f)))
  })

  it("two separately built but equal finalisations agree", () => {
    expect(hash(mustCompose(finalise("you")))).toBe(hash(mustCompose(finalise("you"))))
  })

  it("survives a JSON round trip, so key order is not an accident of typing", () => {
    const report = mustCompose(finalise("you"))
    const roundTripped = JSON.parse(JSON.stringify(report)) as PersonalFoodSystemReportV1
    expect(serialiseReport(roundTripped)).toBe(serialiseReport(report))
  })

  it("answer selection order does not change the Report", () => {
    // Bank option order governs output, not the order the customer clicked.
    const a = finalise("you", { core_environment_constraints_v1: ["budget", "time"] })
    const b = finalise("you", { core_environment_constraints_v1: ["time", "budget"] })
    expect(hash(mustCompose(a))).toBe(hash(mustCompose(b)))
  })

  it("the composer uses no clock and no randomness", () => {
    const dir = join(process.cwd(), "lib/report/deterministic")
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
      const code = readFileSync(join(dir, file), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "")
      for (const forbidden of ["Date.now(", "new Date(", "Math.random(", "randomUUID", "crypto."]) {
        expect(code.includes(forbidden), `${file} uses ${forbidden}`).toBe(false)
      }
    }
  })

  it("stamps the SEALED time, not the time of composition", () => {
    const report = mustCompose(finalise("you"))
    expect(report.provenance.finalisedAt).toBe(AT.toISOString())
  })
})

/* ══ Provenance ════════════════════════════════════════════════════════════ */

describe("every Report says what produced it", () => {
  const report = mustCompose(finalise("you"))

  it("carries all eleven provenance facts", () => {
    const p = report.provenance
    expect(p.reportSchemaVersion).toBe("personal-food-system-report-v1")
    expect(p.handoffId).toBe(HANDOFF)
    expect(p.bankVersion).toBeTruthy()
    expect(p.bankFingerprint).toBeTruthy()
    expect(p.scienceContractVersion).toBe("science-contract-v1.0")
    expect(p.finalisationVersion).toBe("consultation-finalisation-v1")
    expect(p.reportUseRecordVersion).toBe("report-use-v1")
    /*
     * v2, bumped in the third review repair: every proposition now records
     * the exact {questionId, value} its words were resolved from. No
     * customer-facing text changed; the artifact's bytes did, and this
     * version is how a Report says which builder produced it.
     */
    expect(p.composerVersion).toBe("composer-v2")
    expect(p.contentPackVersion).toBe("content-pack-v1")
    expect(p.capabilitiesAtCompose).toBeDefined()
    expect(p.finalisedAt).toBe(AT.toISOString())
  })

  it("claims no free-score and no model provenance, because it has neither", () => {
    const serialised = serialiseReport(report)
    for (const absent of ["freeScores", "model", "promptVersion", "generatedBy"]) {
      expect(serialised).not.toContain(absent)
    }
  })
})

/* ══ Firewalls ═════════════════════════════════════════════════════════════ */

describe("the Report Core is pure and isolated", () => {
  const dir = join(process.cwd(), "lib/report/deterministic")
  const files = readdirSync(dir).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))

  it("imports no database, no model and no HTTP", () => {
    for (const file of files) {
      const code = readFileSync(join(dir, file), "utf8")
      for (const forbidden of [
        "@/lib/supabase", "supabase-js", "@anthropic-ai", "openai", "ai/rsc",
        "next/server", "fetch(",
      ]) {
        expect(code.includes(forbidden), `${file} imports ${forbidden}`).toBe(false)
      }
    }
  })

  it("imports nothing from the legacy Report generator", () => {
    for (const file of files) {
      const code = readFileSync(join(dir, file), "utf8")
      for (const legacy of [
        "build-food-system-report", "generate-report-prompt", "claude-report",
        "fallback-paid-report", "report/subscores", "deep-assessment",
      ]) {
        expect(code.includes(legacy), `${file} imports ${legacy}`).toBe(false)
      }
    }
  })

  it("reads only the finalisation, never mutable Consultation state", () => {
    const compose = readFileSync(join(dir, "compose.ts"), "utf8")
    expect(compose).not.toContain("candidateAnswers")
    expect(compose).toContain("trustedAnswers")
  })

  it("exposes no API route", () => {
    expect(readdirSync(join(process.cwd(), "app/api/consultation"))).not.toContain("report")
  })
})
