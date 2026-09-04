import { describe, it, expect } from "vitest"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

import { CONSULTATION_QUESTION_BANK, findConsultationQuestion } from "@/lib/consultation/question-bank"
import { deriveFoodGuidanceConstraints } from "@/lib/consultation/food-guidance"
import type { ConsultationAnswers } from "@/lib/consultation/types"
import {
  AGGREGATION_EVIDENCE_RULE,
  POSTBIOTICS_INFERENCE_BOUNDARY,
  QUESTION_SCIENCE_CONTRACTS,
  REGENERATE_BOUNDARY,
  REMOVED_BY_SCIENCE_CONTRACT,
  REPORT_COMPOSITION_BOUNDARY,
  REVIEWED_QUESTION_IDS,
  SPECIALIST_GATES,
  UNRESOLVED_AVOIDANCE_SEMANTICS,
  aggregateEvidenceStatus,
  allBundledValues,
  constraintClass,
  declaresNoConstraints,
  isBundledValue,
  isInferenceProhibited,
  prohibitedReportTargets,
  scienceContractFor,
  type ProhibitedInference,
  type ScienceEvidenceStatus,
} from "@/lib/consultation/science-contract"

/**
 * Phase 3A-S4 — the CURRENT bank against the frozen Science Contract.
 *
 * ── How this differs from the two snapshot guards ────────────────────────────
 *
 * `consultation-science-evidence-pack.test.ts` guards the historical S1 pack.
 * `science-contract-v1.test.ts` guards the frozen S3 adjudication document.
 * Both pin documents, deliberately, and neither may be edited to match a bank
 * that has moved.
 *
 * This file is the opposite direction: it asserts the LIVE source now complies
 * with what was adjudicated. If S4 is ever partially reverted, this is what
 * fails — not the historical record.
 *
 * ── What it does not do ──────────────────────────────────────────────────────
 *
 * It does not re-open any scientific question. Every expectation here traces to
 * a decision in `docs/phase-3a-science-contract-v1.md`; none is a judgement
 * made in this file.
 */

const you = { foundation: "you" } as const

function completeYouAnswers(): ConsultationAnswers {
  return {
    core_signals_post_meal_pattern_v1: "bloating",
    core_signals_energy_shape_v1: "afternoon-dip",
    core_signals_context_v1: ["rushed", "stress-sleep"],
    core_signals_settled_days_v1: "regular-meals",
    core_rhythm_first_meal_v1: "one-to-three",
    core_rhythm_longest_gap_v1: "6-to-8",
    core_rhythm_week_shape_v1: "looser",
    core_rhythm_recent_change_v1: ["schedule"],
    core_environment_cooking_frequency_v1: "most",
    core_environment_who_prepares_v1: "me",
    core_environment_planning_v1: "planned",
    core_environment_constraints_v1: ["time"],
    core_intentions_primary_focus_v1: "energy",
    core_intentions_barrier_v1: "time",
  }
}

/* ══ A — the removal ═══════════════════════════════════════════════════════ */

describe("A. the antibiotic question is gone", () => {
  it("is absent from the current bank", () => {
    expect(findConsultationQuestion("core_rhythm_antibiotics_v1")).toBeUndefined()
    expect(CONSULTATION_QUESTION_BANK.some((q) => q.id === "core_rhythm_antibiotics_v1")).toBe(false)
  })

  it("leaves no antibiotic wording anywhere in the bank", () => {
    const blob = CONSULTATION_QUESTION_BANK.flatMap((q) => [
      q.text,
      q.familyText,
      q.supportText,
      q.intent,
      q.whyNeeded,
      ...(q.options ?? []).map((o) => o.label),
    ])
      .filter(Boolean)
      .join("\n")
      .toLowerCase()
    expect(blob).not.toContain("antibiotic")
  })

  it("is recorded as removed, so it cannot be re-added by accident", () => {
    const record = REMOVED_BY_SCIENCE_CONTRACT.find((r) => r.questionId === "core_rhythm_antibiotics_v1")
    expect(record).toBeDefined()
    expect(record?.evidenceStatus).toBe("PROHIBITED")
    expect(record?.collectionDecision).toBe("REMOVE")
    // Neither threshold survived. Recorded so one does not return as a
    // "compromise" nobody adjudicated.
    expect(record?.rejectedThresholds).toContain("six months")
    expect(record?.rejectedThresholds).toContain("two years")
  })

  it("prohibits every antibiotic-driven personalisation", () => {
    const record = REMOVED_BY_SCIENCE_CONTRACT[0]
    for (const action of [
      "Feed",
      "Seed",
      "Regenerate",
      "probiotics",
      "fermented foods",
      "fibre prescriptions",
      "restoration",
      "repair",
      "rebuilding",
      "reseeding",
      "microbiome recovery",
    ]) {
      expect(record.prohibitedPersonalisation, `${action} not prohibited`).toContain(action)
    }
  })

  it("no tombstoned question is in the live bank", () => {
    const live = new Set(CONSULTATION_QUESTION_BANK.map((q) => q.id))
    for (const r of REMOVED_BY_SCIENCE_CONTRACT) expect(live.has(r.questionId)).toBe(false)
  })
})

/* ══ B, C, D — report targets ══════════════════════════════════════════════ */

describe("B–D. bodySignalMap is withdrawn from the three signal questions", () => {
  it.each([
    "core_signals_post_meal_pattern_v1",
    "core_signals_energy_shape_v1",
    "core_signals_context_v1",
  ])("%s does not target bodySignalMap", (id) => {
    expect(findConsultationQuestion(id)?.reportTargets).not.toContain("bodySignalMap")
    expect(prohibitedReportTargets(id)).toContain("bodySignalMap")
  })

  it("no question in the bank targets it any more", () => {
    for (const q of CONSULTATION_QUESTION_BANK) {
      expect(q.reportTargets, `${q.id}`).not.toContain("bodySignalMap")
    }
  })

  it("bodySignalMap still exists in the global Report schema", () => {
    // Adjudication withdrew it from three QUESTIONS, not from the Report type.
    // Deleting it globally would be a Phase 4A decision nobody has taken.
    const src = readFileSync(join(process.cwd(), "lib/report/food-system-report-types.ts"), "utf8")
    expect(src).toContain("bodySignalMap")
  })
})

/* ══ E — Q3 intent ═════════════════════════════════════════════════════════ */

describe("E. Q3 intent claims fit, not efficacy", () => {
  const q3 = () => findConsultationQuestion("core_signals_context_v1")

  it("states practical fit and disclaims causation", () => {
    const intent = q3()?.intent ?? ""
    expect(intent).toMatch(/practical place to start/i)
    expect(intent).toMatch(/without implying that the context caused/i)
    expect(intent).toMatch(/or that changing it will improve the signal/i)
  })

  it("no longer claims a first change is most likely to land there", () => {
    // The old wording predicted where a change would work. That is an efficacy
    // claim, and it is exactly what adjudication struck out.
    expect(q3()?.intent ?? "").not.toMatch(/most likely to land/i)
  })

  it("the contract prohibits efficacy and trigger inferences", () => {
    expect(isInferenceProhibited("core_signals_context_v1", "efficacy-prediction")).toBe(true)
    expect(isInferenceProhibited("core_signals_context_v1", "proven-trigger")).toBe(true)
    expect(isInferenceProhibited("core_signals_context_v1", "causation")).toBe(true)
  })

  it("priorityLever means fit, never a causal target", () => {
    const meaning = QUESTION_SCIENCE_CONTRACTS.core_signals_context_v1.reportTargets.meaning?.priorityLever ?? ""
    expect(meaning).toMatch(/FIT|RELEVANCE/i)
    expect(meaning).toMatch(/never efficacy|never.*causal target/i)
  })
})

/* ══ F — bundled values ════════════════════════════════════════════════════ */

describe("F. Q3 bundled values stay atomic", () => {
  it("every OR-bundled value is recorded with its components", () => {
    const bundles = allBundledValues()
    expect(bundles.map((b) => b.value).sort()).toEqual(["large-late", "rushed", "stress-sleep"])
    for (const b of bundles) {
      expect(b.integrity).toBe("atomic")
      expect(b.components.length).toBeGreaterThanOrEqual(2)
    }
  })

  it("each recorded bundle is a real option of the question", () => {
    for (const b of allBundledValues()) {
      const values = (findConsultationQuestion(b.questionId)?.options ?? []).map((o) => o.value)
      expect(values, `${b.value} is not an option of ${b.questionId}`).toContain(b.value)
    }
  })

  it("the module exposes no way to decompose a bundle", () => {
    // The guarantee is structural: `components` is recorded for review, and
    // there is deliberately no exported function that turns a bundle into
    // separately-selected facts. A customer who chose "Stress was high or sleep
    // was short" never told us which.
    const src = readFileSync(join(process.cwd(), "lib/consultation/science-contract.ts"), "utf8")
    const exportedFns = [...src.matchAll(/^export function (\w+)/gm)].map((m) => m[1])
    for (const banned of ["decompose", "splitBundle", "componentsOf", "expandBundle"]) {
      expect(exportedFns, `${banned} must not exist`).not.toContain(banned)
    }
    // And nothing exported names a component as a derived boolean.
    for (const banned of [/\bhasStress\b/, /\bhasPoorSleep\b/, /\blateMeals\b/, /\bskippedMeals\b/]) {
      expect(src, `derived component flag ${banned}`).not.toMatch(banned)
    }
  })

  it.each([
    ["stress-sleep", "sleep"],
    ["stress-sleep", "stress"],
    ["large-late", "late"],
    ["rushed", "skipped"],
  ])("SABOTAGE: %s cannot yield a separate '%s' selection", (bundle, component) => {
    expect(isBundledValue("core_signals_context_v1", bundle)).toBe(true)
    // The component is not itself a selectable option, so no downstream reader
    // can honestly claim the customer selected it.
    const options = (findConsultationQuestion("core_signals_context_v1")?.options ?? []).map((o) => o.value)
    expect(options).not.toContain(component)
  })
})

/* ══ G, H — Q4 ═════════════════════════════════════════════════════════════ */

describe("G. Q4 no longer presupposes a difference exists", () => {
  const label = () =>
    (findConsultationQuestion("core_signals_settled_days_v1")?.options ?? []).find(
      (o) => o.value === "cannot-tell",
    )?.label ?? ""

  it("reads 'I can't tell a difference'", () => {
    expect(label()).toBe("I can't tell a difference")
  })

  it("does not read 'yet'", () => {
    expect(label()).not.toMatch(/\byet\b/)
  })

  it("keeps the id, answer field and semantic value", () => {
    const q = findConsultationQuestion("core_signals_settled_days_v1")
    expect(q?.answerField).toBe("signals.settledDays")
    expect((q?.options ?? []).map((o) => o.value)).toContain("cannot-tell")
    expect(q?.applicableWhen?.questionId).toBe("core_signals_post_meal_pattern_v1")
  })
})

describe("H. the lighter-meals guard forbids restriction", () => {
  const boundary = () =>
    QUESTION_SCIENCE_CONTRACTS.core_signals_settled_days_v1.actionBoundaries?.find(
      (b) => b.answerValue === "lighter-meals",
    )

  it("exists for the real option value", () => {
    expect(boundary()).toBeDefined()
    const values = (findConsultationQuestion("core_signals_settled_days_v1")?.options ?? []).map((o) => o.value)
    expect(values).toContain("lighter-meals")
  })

  it.each([
    "eat-less",
    "smaller-portions",
    "fewer-meals",
    "reduced-calories",
    "calorie-restriction",
    "restriction",
    "meal-skipping",
    "progressive-restriction",
  ] as const)("SABOTAGE: %s is prohibited", (op) => {
    expect(boundary()?.prohibitedOperationalisations).toContain(op)
  })

  it("permits only the reading the customer actually gave", () => {
    expect(boundary()?.allowedInterpretation).toMatch(/tend to occur on days they describe as more settled/i)
    expect(boundary()?.allowedInterpretation).not.toMatch(/\bless\b|\breduce|\bportion/i)
  })
})

/* ══ I, J — Q6 constraints ═════════════════════════════════════════════════ */

describe("I. prefer-not-to-say is never 'no constraint'", () => {
  it("classifies as undisclosed", () => {
    expect(constraintClass("prefer-not-to-say")).toBe("undisclosed")
    expect(constraintClass("none")).toBe("none-declared")
  })

  it("SABOTAGE: a declined disclosure does not declare an absence", () => {
    expect(declaresNoConstraints(["prefer-not-to-say"])).toBe(false)
    expect(declaresNoConstraints(["none"])).toBe(true)
    // Nor does an empty answer, which is a question not yet reached.
    expect(declaresNoConstraints([])).toBe(false)
  })

  it("an unknown constraint value reads as undisclosed, not absent", () => {
    // Failing closed: an unrecognised constraint is information we do not have.
    expect(constraintClass("something-new")).toBe("undisclosed")
    expect(declaresNoConstraints(["something-new"])).toBe(false)
  })

  it("the derived state separates the two", () => {
    const declined = deriveFoodGuidanceConstraints({
      context: you,
      answers: { ...completeYouAnswers(), core_environment_constraints_v1: ["prefer-not-to-say"] },
    })
    expect(declined.constraintsUndisclosed).toBe(true)
    expect(declined.declaresNoConstraints).toBe(false)

    const nothing = deriveFoodGuidanceConstraints({
      context: you,
      answers: { ...completeYouAnswers(), core_environment_constraints_v1: ["none"] },
    })
    expect(nothing.declaresNoConstraints).toBe(true)
    expect(nothing.constraintsUndisclosed).toBe(false)
  })
})

describe("J. safety and practical constraints are distinguishable", () => {
  it.each(["allergy", "medical-avoid"])("%s is a safety constraint", (v) => {
    expect(constraintClass(v)).toBe("safety")
  })

  it.each(["vegetarian-vegan", "religious-cultural", "budget", "time", "dislikes"])(
    "%s is a practical constraint",
    (v) => {
      expect(constraintClass(v)).toBe("practical")
    },
  )

  it("the derived state splits them", () => {
    const r = deriveFoodGuidanceConstraints({
      context: you,
      answers: {
        ...completeYouAnswers(),
        core_environment_constraints_v1: ["allergy", "budget", "time"],
        core_environment_food_avoidances_v1: ["nuts"],
      },
    })
    expect(r.safetyConstraints).toEqual(["allergy"])
    expect(r.practicalConstraints).toEqual(["budget", "time"])
  })

  it("SABOTAGE: a practical constraint never triggers the safety path", () => {
    const r = deriveFoodGuidanceConstraints({
      context: you,
      answers: { ...completeYouAnswers(), core_environment_constraints_v1: ["vegetarian-vegan", "budget"] },
    })
    expect(r.requiresSpecificAvoidance).toBe(false)
    expect(r.unresolvedSpecificAvoidance).toBe(false)
  })
})

/* ══ K, L — Q7 ═════════════════════════════════════════════════════════════ */

describe("K–L. unresolvedSpecificAvoidance means missing information only", () => {
  it("says what it means, and lists what it does not", () => {
    expect(UNRESOLVED_AVOIDANCE_SEMANTICS.means).toMatch(/does not have enough specific information/i)
    for (const notThis of [
      "clinical risk level",
      "allergy severity",
      "anaphylaxis likelihood",
      "diagnostic confidence",
      "medical-risk score",
    ]) {
      expect(UNRESOLVED_AVOIDANCE_SEMANTICS.doesNotMean).toContain(notThis)
    }
  })

  it("SABOTAGE: no risk level is derivable from it", () => {
    // Structural: the contract exposes no severity, risk or confidence field to
    // read, so "unresolved → high risk" has nothing to attach to.
    const src = readFileSync(join(process.cwd(), "lib/consultation/science-contract.ts"), "utf8")
    for (const banned of [/highAllergyRisk/, /riskLevel/, /severityScore/, /anaphylaxis(Risk|Score)/]) {
      expect(src, `risk field ${banned}`).not.toMatch(banned)
    }
    const keys = Object.keys(UNRESOLVED_AVOIDANCE_SEMANTICS)
    expect(keys).toEqual(["means", "doesNotMean", "requiredBehaviourWhenTrue"])
  })

  it("records the conservative behaviour without activating it", () => {
    const b = UNRESOLVED_AVOIDANCE_SEMANTICS.requiredBehaviourWhenTrue.join(" | ")
    expect(b).toMatch(/suppress specific food recommendations/i)
    expect(b).toMatch(/generic food and routine guidance/i)
    expect(b).toMatch(/never infer a safe substitute/i)
    expect(b).toMatch(/never coerce disclosure/i)
    expect(b).toMatch(/never describe an unselected food as safe/i)
  })

  it("SABOTAGE: declining detail leaves it unresolved, not safe", () => {
    const r = deriveFoodGuidanceConstraints({
      context: you,
      answers: {
        ...completeYouAnswers(),
        core_environment_constraints_v1: ["allergy"],
        core_environment_food_avoidances_v1: ["prefer-not-to-say"],
      },
    })
    expect(r.unresolvedSpecificAvoidance).toBe(true)
    expect(r.knownAvoidances).toEqual([])
  })

  it("SABOTAGE: a known category alongside 'other' is still unresolved", () => {
    const r = deriveFoodGuidanceConstraints({
      context: you,
      answers: {
        ...completeYouAnswers(),
        core_environment_constraints_v1: ["allergy"],
        core_environment_food_avoidances_v1: ["nuts", "other"],
      },
    })
    expect(r.knownAvoidances).toEqual(["nuts"])
    expect(r.unresolvedSpecificAvoidance).toBe(true)
  })

  it("the Q7 taxonomy is left to its specialist gate", () => {
    expect(QUESTION_SCIENCE_CONTRACTS.core_environment_food_avoidances_v1.specialistGate).toBe(
      "food-allergy-dietetic-eu-taxonomy",
    )
    // Unchanged by S4: resolving the ontology is the gate's job.
    const values = (findConsultationQuestion("core_environment_food_avoidances_v1")?.options ?? []).map(
      (o) => o.value,
    )
    expect(values).toEqual([
      "dairy",
      "eggs",
      "fish-shellfish",
      "nuts",
      "wheat-gluten",
      "soya",
      "sesame",
      "other",
      "prefer-not-to-say",
    ])
  })
})

/* ══ M, N — coverage and prohibitions ══════════════════════════════════════ */

describe("M. every surviving adjudicated question has a typed contract", () => {
  it("covers exactly the six", () => {
    expect([...REVIEWED_QUESTION_IDS].sort()).toEqual([
      "core_environment_constraints_v1",
      "core_environment_food_avoidances_v1",
      "core_signals_context_v1",
      "core_signals_energy_shape_v1",
      "core_signals_post_meal_pattern_v1",
      "core_signals_settled_days_v1",
    ])
  })

  it("matches the bank's own science-review set", () => {
    const flagged = CONSULTATION_QUESTION_BANK.filter((q) => q.scienceReview === "required").map((q) => q.id)
    expect([...flagged].sort()).toEqual([...REVIEWED_QUESTION_IDS].sort())
  })

  it("every contract points at a real question, and states its status", () => {
    for (const id of REVIEWED_QUESTION_IDS) {
      const contract = QUESTION_SCIENCE_CONTRACTS[id]
      expect(findConsultationQuestion(id), `${id} not in bank`).toBeDefined()
      expect(contract.questionId).toBe(id)
      expect(contract.collectionDecision).toBe("KEEP")
      expect(["SUPPORTED", "CONTEXT_ONLY"]).toContain(contract.evidenceStatus)
      expect(contract.allowedInterpretation.length).toBeGreaterThan(40)
      expect(contract.allowedReportUses.length).toBeGreaterThan(0)
    }
  })

  it("an unknown question refuses rather than permits", () => {
    expect(scienceContractFor("core_made_up_v1")).toBeUndefined()
    expect(isInferenceProhibited("core_made_up_v1", "diagnosis")).toBe(true)
  })
})

describe("N. no CONTEXT_ONLY signal question permits a biological inference", () => {
  const contextOnlySignals = REVIEWED_QUESTION_IDS.filter(
    (id) => QUESTION_SCIENCE_CONTRACTS[id].evidenceStatus === "CONTEXT_ONLY",
  )

  it("there are four of them", () => {
    expect(contextOnlySignals).toHaveLength(4)
  })

  it.each([
    "diagnosis",
    "causation",
    "microbiome-composition",
    "microbial-function",
    "microbial-metabolite",
    "postbiotics-state",
    "glucose-state",
    "insulin-state",
    "metabolic-state",
    "clinical-state",
    "biomarker",
  ] as const)("%s is prohibited for all four", (inference: ProhibitedInference) => {
    for (const id of contextOnlySignals) {
      expect(isInferenceProhibited(id, inference), `${id} permits ${inference}`).toBe(true)
    }
  })

  it("Q2's allowed use is timing, not physiology", () => {
    const c = QUESTION_SCIENCE_CONTRACTS.core_signals_energy_shape_v1
    expect(c.allowedReportUses).toContain("practical-timing")
    expect(c.allowedReportUses).not.toContain("operational-filtering")
    expect(isInferenceProhibited(c.questionId, "physiology-driven-food-selection")).toBe(true)
    expect(c.reportTargets.meaning?.priorityLever).toMatch(/PRACTICAL TIMING/i)
    expect(c.reportTargets.meaning?.thirtyDayLoop).toMatch(/timing only/i)
  })
})

/* ══ O — aggregation ═══════════════════════════════════════════════════════ */

describe("O. aggregation does not upgrade evidence", () => {
  it("the rule exists and names what composition cannot produce", () => {
    expect(AGGREGATION_EVIDENCE_RULE.id).toBe("aggregation-does-not-upgrade-evidence")
    expect(AGGREGATION_EVIDENCE_RULE.statement).toMatch(/Multiple self-reports remain multiple self-reports/i)
    for (const s of [
      "diagnosis",
      "biomarker",
      "clinical-state",
      "microbiome-composition",
      "postbiotics-state",
    ] as const) {
      expect(AGGREGATION_EVIDENCE_RULE.cannotProduce).toContain(s)
    }
    expect(AGGREGATION_EVIDENCE_RULE.cannotProduceValidatedSystemModel).toBe(true)
  })

  it("SABOTAGE: four CONTEXT_ONLY answers combine to CONTEXT_ONLY, never SUPPORTED", () => {
    // The four signal answers a real customer would give together.
    const statuses: ScienceEvidenceStatus[] = [
      QUESTION_SCIENCE_CONTRACTS.core_signals_post_meal_pattern_v1.evidenceStatus,
      QUESTION_SCIENCE_CONTRACTS.core_signals_energy_shape_v1.evidenceStatus,
      QUESTION_SCIENCE_CONTRACTS.core_signals_context_v1.evidenceStatus,
      QUESTION_SCIENCE_CONTRACTS.core_signals_settled_days_v1.evidenceStatus,
    ]
    expect(statuses.every((s) => s === "CONTEXT_ONLY")).toBe(true)
    expect(aggregateEvidenceStatus(statuses)).toBe("CONTEXT_ONLY")
    expect(aggregateEvidenceStatus(statuses)).not.toBe("SUPPORTED")
  })

  it("SABOTAGE: mixing a SUPPORTED answer in does not lift the rest", () => {
    expect(aggregateEvidenceStatus(["SUPPORTED", "CONTEXT_ONLY"])).toBe("CONTEXT_ONLY")
    expect(aggregateEvidenceStatus(["SUPPORTED", "SUPPORTED", "PROHIBITED"])).toBe("PROHIBITED")
    expect(aggregateEvidenceStatus(["SUPPORTED", "SPECIALIST_REVIEW"])).toBe("SPECIALIST_REVIEW")
  })

  it("an empty combination is not evidence of anything", () => {
    expect(aggregateEvidenceStatus([])).toBe("PROHIBITED")
  })

  it("SABOTAGE: no combination of the four yields a microbiome claim", () => {
    // bloating + afternoon dip + stress-sleep + lighter meals is the archetypal
    // "obviously an imbalance" pattern. It is four self-reports.
    const combined = aggregateEvidenceStatus([
      "CONTEXT_ONLY",
      "CONTEXT_ONLY",
      "CONTEXT_ONLY",
      "CONTEXT_ONLY",
    ])
    expect(combined).toBe("CONTEXT_ONLY")
    expect(AGGREGATION_EVIDENCE_RULE.cannotProduce).toContain("microbiome-composition")
    for (const id of REVIEWED_QUESTION_IDS) {
      if (QUESTION_SCIENCE_CONTRACTS[id].evidenceStatus !== "CONTEXT_ONLY") continue
      expect(isInferenceProhibited(id, "microbiome-composition")).toBe(true)
    }
  })
})

/* ══ P, Q — boundaries ═════════════════════════════════════════════════════ */

describe("P. the postbiotics boundary closes the softer verbs too", () => {
  it("prohibits the subjects", () => {
    for (const s of [
      "personal Postbiotics state",
      "Postbiotics inadequacy",
      "Postbiotics production",
      "low Postbiotics",
      "high Postbiotics",
      "Postbiotics recovery",
      "microbial-metabolite state",
      "microbial activity",
      "microbiome composition",
    ]) {
      expect(POSTBIOTICS_INFERENCE_BOUNDARY.prohibitedSubjects).toContain(s)
    }
  })

  it.each(["quantify", "indicate", "reflect", "correspond-to", "result-from", "reveal", "be-produced-by"])(
    "SABOTAGE: '%s' is a prohibited relationship",
    (verb) => {
      // The pre-review proposal covered only "quantify". These are the verbs
      // through which the same claim returns wearing a hedge.
      expect(POSTBIOTICS_INFERENCE_BOUNDARY.prohibitedRelationships).toContain(verb)
    },
  )

  it("SABOTAGE: reported bloating cannot imply low Postbiotics", () => {
    expect(isInferenceProhibited("core_signals_post_meal_pattern_v1", "postbiotics-state")).toBe(true)
    expect(POSTBIOTICS_INFERENCE_BOUNDARY.prohibitedSubjects).toContain("low Postbiotics")
    expect(POSTBIOTICS_INFERENCE_BOUNDARY.statement).toMatch(/do not quantify, indicate, reflect/i)
  })
})

describe("Q. the Regenerate boundary bounds without redefining", () => {
  it("preserves the action language", () => {
    expect(REGENERATE_BOUNDARY.term).toBe("Regenerate")
    expect(REGENERATE_BOUNDARY.preservedAsActionLanguage).toBe(true)
  })

  it.each([
    "increase Postbiotics",
    "produce Postbiotics",
    "restore Postbiotics",
    "increase butyrate",
    "increase acetate",
    "increase propionate",
    "restore microbial metabolites",
    "rebuild the microbiome",
    "repair the microbiome",
  ])("SABOTAGE: Regenerate must not mean '%s'", (claim) => {
    expect(REGENERATE_BOUNDARY.mustNotMean).toContain(claim)
  })
})

describe("the Report composition boundary is recorded", () => {
  it("separates reporting from asserting", () => {
    for (const allowed of ["You told us", "You reported", "You notice"]) {
      expect(REPORT_COMPOSITION_BOUNDARY.allowedFramings).toContain(allowed)
    }
    for (const prohibited of ["We found", "This shows", "Your microbiome is", "Your metabolism is"]) {
      expect(REPORT_COMPOSITION_BOUNDARY.prohibitedFramings).toContain(prohibited)
    }
  })
})

/* ══ R — specialist gates ══════════════════════════════════════════════════ */

describe("R. all three specialist gates remain open", () => {
  it("names the three, all OPEN", () => {
    expect(SPECIALIST_GATES).toHaveLength(3)
    expect(SPECIALIST_GATES.map((g) => g.gate).sort()).toEqual([
      "eu-legal-health-claims",
      "food-allergy-dietetic-eu-taxonomy",
      "safety-netting-wording",
    ])
    for (const g of SPECIALIST_GATES) {
      expect(g.status, `${g.gate} was closed`).toBe("OPEN")
      expect(g.scope.length).toBeGreaterThan(0)
      expect(g.requiredBefore.length).toBeGreaterThan(0)
    }
  })

  it("SABOTAGE: no gate can be marked closed by this module's type", () => {
    // `status` is the literal "OPEN". Closing a gate is a governance act with a
    // named human behind it, not a field edit.
    const src = readFileSync(join(process.cwd(), "lib/consultation/science-contract.ts"), "utf8")
    expect(src).toMatch(/status:\s*"OPEN"/)
    expect(src).not.toMatch(/status:\s*"(CLOSED|COMPLETE|PASSED|APPROVED)"/)
  })
})

/* ══ S, T — the two historical artifacts ═══════════════════════════════════ */

describe("S–T. the historical records are intact", () => {
  it("the S1 evidence pack still exists and still records seven questions", () => {
    const pack = readFileSync(
      join(process.cwd(), "docs/phase-3a-multi-model-science-evidence-pack.md"),
      "utf8",
    )
    expect(pack).toContain("core_rhythm_antibiotics_v1")
    expect(pack).toContain("097cc6df961929742098e869066460fd49e08bef")
  })

  it("the frozen S3 contract still exists and still says REMOVE", () => {
    const contract = readFileSync(join(process.cwd(), "docs/phase-3a-science-contract-v1.md"), "utf8")
    expect(contract).toContain("# FROZEN ADJUDICATED SCIENCE CONTRACT")
    expect(contract).toMatch(/\*\*REMOVE\*\*/)
    expect(contract).toContain("1fd3f7ca99733e16dac698ea081b65786cb4a314")
  })
})

/* ══ Non-activation still holds ════════════════════════════════════════════ */

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(ts|tsx|mjs)$/.test(entry)) out.push(full)
  }
  return out
}

describe("S4 is still non-activating", () => {
  it("no live route, page, component or script imports the science contract", () => {
    const consumers = ["app", "components", "lib", "scripts"]
      .flatMap((d) => walk(join(process.cwd(), d)))
      .filter((f) => !f.includes(join("lib", "consultation")))
    expect(consumers.length).toBeGreaterThan(300)

    const importers = consumers.filter((f) =>
      /["']@\/lib\/consultation\/science-contract["']/.test(readFileSync(f, "utf8")),
    )
    expect(importers.map((f) => f.replace(`${process.cwd()}/`, ""))).toEqual([])
  })

  it("the approved future copy is recorded but not implemented", () => {
    const src = readFileSync(join(process.cwd(), "lib/consultation/science-contract.ts"), "utf8")
    expect(src).toContain("APPROVED_SCIENCE_CONTRACT_COPY_NOT_IMPLEMENTED")
    // It exists only in the dormant module — nowhere a customer could read it.
    const live = ["app", "components"]
      .flatMap((d) => walk(join(process.cwd(), d)))
      .filter((f) => readFileSync(f, "utf8").includes("does not verify ingredients"))
    expect(live).toEqual([])
  })
})
