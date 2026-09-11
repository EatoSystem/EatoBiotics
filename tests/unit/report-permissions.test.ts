import { describe, it, expect } from "vitest"

import { CONSULTATION_QUESTION_BANK } from "@/lib/consultation/question-bank"
import {
  REVIEWED_QUESTION_IDS,
  scienceContractFor,
  type AllowedReportUse,
  type ProhibitedInference,
} from "@/lib/consultation/science-contract"
import {
  PRODUCT_OPERATIONAL_USES,
  REPORT_USE_PERMISSIONS,
  bankQuestionIds,
  mirrorsItsContract,
  permissionFor,
  productOperationalCanInfer,
  permitsUse,
  requiredCapabilitiesFor,
  valueIsSilenced,
  valueRuleFor,
} from "@/lib/report/deterministic/permissions"
import { templateFor } from "@/lib/report/deterministic/content-pack"
import type { ReportCapability } from "@/lib/report/deterministic/capabilities"

/**
 * The permission registry — Phase 4A-S2.
 *
 * ══ WHAT WENT WRONG BEFORE, AND WHAT THIS PROVES ════════════════════════════
 *
 * The first architecture draft proposed that the fifteen questions without a
 * Science Contract "default to recap and operational filtering". No contract
 * granted that. It was a permission invented by the module whose whole purpose
 * is to stop permissions being invented, and it would have shipped as a
 * sentence in a paying customer's Report.
 *
 * So the property under test is not "the registry is complete". It is that
 * **nothing is permitted by default** — that a question with no record grants
 * nothing, that a product decision cannot borrow a science adjudication's
 * authority, and that the weaker basis is structurally incapable of the
 * inferences the stronger one spent a review withholding.
 */

const ALL_PROHIBITED_INFERENCES: readonly ProhibitedInference[] = [
  "diagnosis", "causation", "efficacy-prediction", "proven-trigger", "glucose-state",
  "insulin-state", "metabolic-state", "endocrine-state", "circadian-diagnosis",
  "sleep-diagnosis", "nutrient-deficiency", "food-intolerance", "food-allergy",
  "allergy-severity", "clinical-risk-level", "inflammatory-state", "immune-state",
  "microbiome-composition", "microbial-function", "microbial-metabolite",
  "postbiotics-state", "clinical-state", "biomarker", "dietary-adequacy",
  "medical-necessity-verification", "treatment-selection",
  "therapeutic-food-prescription", "physiology-driven-food-selection",
  "guaranteed-recurrence",
]

/* ══ Coverage ══════════════════════════════════════════════════════════════ */

describe("every core question has exactly one explicit record", () => {
  it("covers all 21, with no gaps", () => {
    const covered = REPORT_USE_PERMISSIONS.map((p) => p.questionId).sort()
    const bank = [...bankQuestionIds()].sort()
    expect(bank).toHaveLength(21)
    expect(covered, "a bank question with no permission record").toEqual(bank)
  })

  it("has no stale record for a question the bank no longer holds", () => {
    // The other direction, and it matters as much: a record for a deleted
    // question is a permission nobody is reviewing any more.
    const bank = new Set(bankQuestionIds())
    const orphans = REPORT_USE_PERMISSIONS.filter((p) => !bank.has(p.questionId))
    expect(orphans.map((p) => p.questionId)).toEqual([])
  })

  it("names each question exactly once", () => {
    const ids = REPORT_USE_PERMISSIONS.map((p) => p.questionId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("carries the bank's own answer field, so a Report reads semantics not ids", () => {
    for (const record of REPORT_USE_PERMISSIONS) {
      const question = CONSULTATION_QUESTION_BANK.find((q) => q.id === record.questionId)
      expect(record.answerField, record.questionId).toBe(question?.answerField)
    }
  })

  it("an unknown question has no record, and therefore no permission", () => {
    expect(permissionFor("core_made_up_v1")).toBeUndefined()
    expect(permitsUse("core_made_up_v1", "descriptive-recap", "systemSnapshot")).toBe(false)
    // The exact fallback the first draft would have granted.
    expect(permitsUse("core_made_up_v1", "operational-filtering", "thirtyDayLoop")).toBe(false)
  })
})

/* ══ Science-adjudicated cannot widen ══════════════════════════════════════ */

describe("a science-adjudicated record says exactly what its contract says", () => {
  const adjudicated = REPORT_USE_PERMISSIONS.filter((p) => p.basis.kind === "science-adjudicated")

  it("there are exactly six, and they are the reviewed six", () => {
    expect(adjudicated.map((p) => p.questionId).sort()).toEqual([...REVIEWED_QUESTION_IDS].sort())
  })

  it("mirrors uses, allowed targets and withheld targets field for field", () => {
    for (const record of adjudicated) {
      expect(mirrorsItsContract(record), `${record.questionId} diverges from its contract`).toBe(true)
      const contract = scienceContractFor(record.questionId)!
      expect(contract, record.questionId).toBeDefined()
      expect([...record.allowedUses].sort()).toEqual([...contract.allowedReportUses].sort())
      expect([...record.allowedTargets].sort()).toEqual([...contract.reportTargets.allowed].sort())
      expect([...record.withheldTargets].sort()).toEqual([...contract.reportTargets.prohibited].sort())
    }
  })

  it("never grants a target its contract withheld", () => {
    for (const record of adjudicated) {
      const contract = scienceContractFor(record.questionId)!
      for (const withheld of contract.reportTargets.prohibited) {
        expect(record.allowedTargets, `${record.questionId} grants withheld ${withheld}`).not.toContain(withheld)
        expect(permitsUse(record.questionId, record.allowedUses[0], withheld)).toBe(false)
      }
    }
  })

  it("bodySignalMap is granted by nothing at all", () => {
    for (const record of REPORT_USE_PERMISSIONS) {
      expect(record.allowedTargets, record.questionId).not.toContain("bodySignalMap")
    }
  })
})

/* ══ Product-operational is structurally weaker ════════════════════════════ */

describe("a product-operational record cannot borrow scientific authority", () => {
  const operational = REPORT_USE_PERMISSIONS.filter((p) => p.basis.kind === "product-operational")

  it("there are exactly fifteen", () => {
    expect(operational).toHaveLength(15)
  })

  it("grants only uses from the frozen non-clinical set", () => {
    for (const record of operational) {
      for (const use of record.allowedUses) {
        expect(
          PRODUCT_OPERATIONAL_USES,
          `${record.questionId} grants "${use}" from a product authority`,
        ).toContain(use)
      }
    }
  })

  it("the four inference-shaped uses are unavailable to it", () => {
    // Each treats an answer as a signal rather than a fact — a judgement only
    // adjudication can license.
    const forbidden: AllowedReportUse[] = [
      "educational-topic-selection",
      "low-risk-self-observation",
      "transparent-reflection",
      "routine-support",
    ]
    for (const use of forbidden) {
      expect(PRODUCT_OPERATIONAL_USES).not.toContain(use)
      for (const record of operational) {
        expect(record.allowedUses, `${record.questionId} grants ${use}`).not.toContain(use)
      }
    }
  })

  it("is incapable of EVERY prohibited inference, as a category", () => {
    /*
     * A category invariant rather than a per-record `neverInfers` list. A
     * partial list is worse than none because it reads as exhaustive: the one
     * inference somebody forgot to add is the one that gets made.
     */
    expect(ALL_PROHIBITED_INFERENCES.length).toBeGreaterThan(25)
    for (const inference of ALL_PROHIBITED_INFERENCES) {
      expect(productOperationalCanInfer(inference), inference).toBe(false)
    }
  })

  it("carries a real rationale, not a placeholder", () => {
    for (const record of operational) {
      if (record.basis.kind !== "product-operational") continue
      expect(record.basis.rationale.length, record.questionId).toBeGreaterThan(40)
      expect(record.basis.approvedBy).toBe("product")
    }
  })
})

/* ══ Value-level ═══════════════════════════════════════════════════════════ */

describe("value rules deny what the question-level grant is too coarse to", () => {
  it("a reported health event produces no customer-facing proposition", () => {
    // The antibiotics question was adjudicated OUT of the bank for exactly
    // this reason. Recapping a health event would reintroduce it sideways.
    expect(valueIsSilenced("core_rhythm_recent_change_v1", "health-event")).toBe(true)
  })

  it("prefer-not-to-say is never an absence, in any question that offers it", () => {
    const offering = CONSULTATION_QUESTION_BANK.filter((q) =>
      (q.options ?? []).some((o) => o.value === "prefer-not-to-say"),
    )
    expect(offering.length).toBeGreaterThan(0)
    for (const q of offering) {
      const rule = valueRuleFor(q.id, "prefer-not-to-say")
      expect(rule, `${q.id} has no prefer-not-to-say rule`).toBeDefined()
      expect(rule?.effect, q.id).toBe("never-absence")
    }
  })

  it("the three bundled context values are marked atomic", () => {
    for (const value of ["rushed", "large-late", "stress-sleep"]) {
      expect(valueRuleFor("core_signals_context_v1", value)?.effect, value).toBe("atomic")
    }
  })

  it("lighter-meals is operational only, so it cannot become a restriction", () => {
    const rule = valueRuleFor("core_signals_settled_days_v1", "lighter-meals")
    expect(rule?.effect).toBe("operational-only")
    expect(rule?.reason).toMatch(/restriction/i)
  })

  it("a household allergy is operational only, and names the Q17 boundary", () => {
    const rule = valueRuleFor("core_environment_household_differing_needs_v1", "allergies")
    expect(rule?.effect).toBe("operational-only")
    expect(rule?.reason).toMatch(/report-safety|contradiction/i)
  })
})

/* ══ The capability link ═══════════════════════════════════════════════════ */

/*
 * The review that produced this block: capability used to be a field on the
 * QUESTION, which is the wrong unit. `whoPrepares` can legitimately produce an
 * ungated practical recap while a named-food sentence from the same answer
 * must stay behind the dietetic gate. So the requirement belongs to the
 * OPERATION — this question, this target, these words — and is derived, never
 * declared and never supplied by a caller.
 */
describe("every operation that could name a food answers to the dietetic gate", () => {
  const FOOD_CAPABLE = [
    "core_environment_constraints_v1",
    "core_environment_food_avoidances_v1",
    "core_environment_cooking_frequency_v1",
    "core_environment_who_prepares_v1",
    "core_environment_planning_v1",
    "core_environment_household_differing_needs_v1",
    "core_rhythm_first_meal_v1",
  ]

  it("a foodTools operation from any of them requires specificFoods", () => {
    for (const id of FOOD_CAPABLE) {
      expect(
        requiredCapabilitiesFor({ sourceQuestionIds: [id], target: "foodTools" }),
        id,
      ).toContain("specificFoods")
    }
  })

  it("the question itself carries no capability field — it is not the unit", () => {
    for (const record of REPORT_USE_PERMISSIONS) {
      expect(Object.keys(record), record.questionId).not.toContain("capability")
    }
  })

  it("an ungated target from the same questions requires nothing", () => {
    // The precision the review asked for: the gate suppresses food guidance,
    // not every sentence a food-capable question can produce.
    for (const id of FOOD_CAPABLE) {
      for (const target of ["systemSnapshot", "thirtyDayLoop", "familyContext"] as const) {
        expect(requiredCapabilitiesFor({ sourceQuestionIds: [id], target }), `${id}/${target}`).toEqual(
          [],
        )
      }
    }
  })

  it("words that name a food carry the requirement even where the target would not", () => {
    // The foodAvoidances templates are the ones that say "dairy", "nuts", …
    const named = templateFor("core_environment_food_avoidances_v1", "dairy")
    expect(named?.requiresCapabilities).toContain("specificFoods")
    expect(
      requiredCapabilitiesFor({
        sourceQuestionIds: ["core_environment_food_avoidances_v1"],
        target: "thirtyDayLoop",
        templateCapabilities: named?.requiresCapabilities,
      }),
    ).toContain("specificFoods")
  })
})

describe("the derived requirement set cannot be weakened by its caller", () => {
  it("is deduplicated, sorted and frozen", () => {
    const required = requiredCapabilitiesFor({
      sourceQuestionIds: ["core_environment_food_avoidances_v1"],
      target: "foodTools",
      templateCapabilities: ["specificFoods", "specificFoods", "bioticsLanguage"],
    })
    expect(required).toEqual(["bioticsLanguage", "specificFoods"])
    expect(Object.isFrozen(required)).toBe(true)
    expect(() => (required as ReportCapability[]).push("safetyNetting")).toThrow()
  })

  it("an empty template list cannot erase what the target requires", () => {
    expect(
      requiredCapabilitiesFor({
        sourceQuestionIds: ["core_environment_constraints_v1"],
        target: "foodTools",
        templateCapabilities: [],
      }),
    ).toEqual(["specificFoods"])
  })

  it("two calls return independent arrays, so mutating one cannot reach the other", () => {
    const a = requiredCapabilitiesFor({ sourceQuestionIds: ["core_rhythm_first_meal_v1"], target: "foodTools" })
    const b = requiredCapabilitiesFor({ sourceQuestionIds: ["core_rhythm_first_meal_v1"], target: "foodTools" })
    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })
})
