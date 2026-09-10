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

/* ══ Priority ══════════════════════════════════════════════════════════════ */

describe("priority means a practical starting point, chosen by visible precedence", () => {
  it("the precedence list is ordered, complete and stated", () => {
    expect(PRIORITY_PRECEDENCE.map((c) => c.rank)).toEqual([1, 2, 3, 4, 5, 6, 7])
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

describe("the Q17 safety contradiction fails closed", () => {
  /*
   * A household declares an allergy in Q17 and nothing in Q16. The frozen
   * foodGuidance reads clear, because deriveFoodGuidanceConstraints does not
   * look at Q17 — so the trusted answers and the frozen safety state disagree.
   */
  const contradictory = finalise("family", {
    core_environment_household_differing_needs_v1: ["allergies"],
    core_environment_constraints_v1: ["none"],
  })
  const report = mustCompose(contradictory)

  it("the contradiction really is present in the fixture", () => {
    expect(contradictory.trustedAnswers["core_environment_household_differing_needs_v1"]).toContain(
      "allergies",
    )
    expect(contradictory.foodGuidance.requiresSpecificAvoidance).toBe(false)
    expect(contradictory.foodGuidance.unresolvedSpecificAvoidance).toBe(false)
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
    expect(p.composerVersion).toBe("composer-v1")
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
