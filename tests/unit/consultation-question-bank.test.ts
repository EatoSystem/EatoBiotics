import { describe, it, expect } from "vitest"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

import {
  CONSULTATION_BANK_VERSION,
  CONSULTATION_FOUNDATIONS,
  CONSULTATION_REPORT_TARGETS,
  CONSULTATION_SECTIONS,
  type ConsultationFoundation,
  type ConsultationLens,
  type ConsultationQuestion,
  type ConsultationReportTarget,
} from "@/lib/consultation/types"
import {
  CONSULTATION_QUESTION_BANK,
  adaptiveQuestionsForFoundation,
  baselineQuestionsForFoundation,
  findConsultationQuestion,
  questionTextFor,
  questionsForFoundation,
  sectionQuestions,
} from "@/lib/consultation/question-bank"
import {
  BANK_COUNT_BOUNDS,
  applicabilityDepth,
  bankSummary,
  validateConsultationBank,
} from "@/lib/consultation/validation"

/* The real modules this contract must stay compatible with, imported HERE and
 * not in lib/consultation, so the bank itself keeps zero runtime coupling. */
import type { FoundationKey } from "@/lib/assessment/registry"
import type { AddonType } from "@/lib/addon-types"
import { ADDON_KEYS } from "@/lib/addon-types"
import type { FoodSystemReport } from "@/lib/report/food-system-report-types"
import { QUESTIONS as FREE_ASSESSMENT_QUESTIONS } from "@/lib/assessment-data"
import { FALLBACK_DEEP_QUESTIONS } from "@/lib/deep-assessment"
import { addonQuestionsFor } from "@/lib/assessment/addon-questions"

/**
 * The deterministic Consultation bank — Phase 3A.
 *
 * The bank is static source, so almost everything worth checking is checkable
 * here rather than at runtime. That is the point of moving the questions out of
 * a model and into a file: a malformed question becomes a failing build instead
 * of a paid customer's confusing afternoon.
 */

const repoRoot = process.cwd()

/* ══ The contract still agrees with the modules it restates ═══════════════════
 *
 * lib/consultation/types.ts imports only `AddonType`, so two of its unions —
 * the foundation and the report targets — are hand-copies of definitions that
 * live elsewhere. Hand-copies drift. These are compile-time assertions: `tsc`
 * runs in the gate, so a divergence is a build failure, and the cost is paid
 * in a test file rather than by pulling registry.ts's dependency graph (glucose
 * scoring, stability types, pregnancy types) into a module that is inert. */

type Assert<T extends true> = T
type Mutual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false

type _FoundationsAgree = Assert<Mutual<ConsultationFoundation, FoundationKey>>
// The lens type IS AddonType now — imported, not restated, because
// addon-contract.test.ts forbids a second copy of that union. Pinned anyway:
// if someone "decouples" it back into a hand-written union that drifts, this
// stops compiling.
type _LensesAgree = Assert<Mutual<ConsultationLens, AddonType>>
// Every report target names a REAL field of the frozen report — this is what
// stops `reportTargets` inventing future deliverables.
type _TargetsAreRealReportFields = Assert<
  ConsultationReportTarget extends keyof FoodSystemReport ? true : false
>

describe("the contract stays decoupled from live runtime", () => {
  /**
   * The one permitted import, and why.
   *
   * `lib/addon-types.ts` is a documented dependency-free leaf, and
   * `tests/unit/addon-contract.test.ts` REQUIRES importing it rather than
   * restating the add-on union — that guard predates this phase and found this
   * file on its first full run. Everything else must stay inside the module.
   */
  const ALLOWED_EXTERNAL_IMPORTS = new Set(["@/lib/addon-types"])

  it("lib/consultation imports nothing from the live app", () => {
    // The strongest available proof that this bank is inert: if it never
    // imports the app, it cannot be reached through the app either.
    const dir = join(repoRoot, "lib/consultation")
    const files = readdirSync(dir).filter((f) => f.endsWith(".ts"))
    expect(files.length).toBeGreaterThanOrEqual(5)

    for (const file of files) {
      const src = readFileSync(join(dir, file), "utf8")
      const imports = [...src.matchAll(/^\s*import\s[^"']*["']([^"']+)["']/gm)].map((m) => m[1])
      for (const spec of imports) {
        expect(
          spec.startsWith("./") || ALLOWED_EXTERNAL_IMPORTS.has(spec),
          `${file} imports "${spec}" — lib/consultation may only import itself and ${[...ALLOWED_EXTERNAL_IMPORTS].join(", ")}`,
        ).toBe(true)
      }
    }
  })

  it("the one external import really is a dependency-free leaf", () => {
    // If addon-types ever grows an import, taking it stops being free and this
    // decision has to be revisited rather than silently inherited.
    const src = readFileSync(join(repoRoot, "lib/addon-types.ts"), "utf8")
    expect([...src.matchAll(/^\s*import\s/gm)]).toEqual([])
    expect([...ADDON_KEYS].sort()).toEqual(["glucose", "mind", "performance", "stability"])
  })
})

/* ══ Non-activation ═══════════════════════════════════════════════════════════
 *
 * Phase 3A must not change what a paying customer receives, and Phase 3B must
 * not either — it builds the deterministic experience behind an explicit
 * preview rather than replacing the paid flow.
 *
 * ── Why this guard changed shape at Phase 3B ─────────────────────────────────
 *
 * It used to assert the bank had NO importers at all. That was the right rule
 * while nothing consumed it, and its own failure message named the phase that
 * would end it: "activation is Phase 3B". Phase 3B is here, and the deterministic
 * Consultation components legitimately import the bank.
 *
 * So the rule is re-pointed rather than deleted. Deleting it would remove the
 * only mechanical proof that the bank has not reached the paid flow; loosening
 * it to "some importers are allowed" would permit exactly the thing it exists to
 * prevent. Instead it now pins the importer set EXACTLY, and separately asserts
 * that no server route and no legacy paid surface is among them. A fifth
 * importer — a route, an API handler, the legacy client — still fails. */

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

describe("the deterministic bank has not reached the paid flow", () => {
  const consumers = ["app", "components", "lib", "scripts"]
    .flatMap((d) => walk(join(repoRoot, d)))
    .filter((f) => !f.includes(join("lib", "consultation")))

  const importers = () =>
    consumers
      .filter((f) => /["']@\/lib\/consultation\//.test(readFileSync(f, "utf8")))
      .map((f) => f.replace(`${repoRoot}/`, ""))

  it("scanned a real tree", () => {
    // A guard that silently examined nothing would pass every assertion below.
    expect(consumers.length).toBeGreaterThan(300)
  })

  it("exactly the Phase 3B preview experience imports it, and nothing else", () => {
    expect(
      importers().sort(),
      "a new importer of the deterministic bank has appeared",
    ).toEqual([
      "components/assessment/consultation/consultation-orientation.tsx",
      "components/assessment/consultation/consultation-progress.tsx",
      "components/assessment/consultation/consultation-question.tsx",
      "components/assessment/consultation/deterministic-consultation-client.tsx",
    ])
  })

  it("no server route consumes it — server completeness is Phase 3C", () => {
    expect(importers().filter((f) => f.startsWith("app/api/"))).toEqual([])
  })

  it("no legacy paid surface consumes it", () => {
    for (const paid of [
      "components/assessment/deep/deep-assessment-client.tsx",
      "components/assessment/deep/deep-question.tsx",
      "lib/deep-assessment.ts",
      "lib/assessment/answer-autosave.ts",
    ]) {
      expect(importers(), paid).not.toContain(paid)
    }
  })

  it("the deep-assessment page reaches it only through the preview component", () => {
    // The page itself must not import the bank: it hands a context to the
    // preview client and nothing more, so the paid branch below it cannot
    // accidentally start resolving deterministic questions.
    expect(importers()).not.toContain("app/assessment/deep/page.tsx")
  })

  it("the legacy generated-question path is untouched", () => {
    // Still eleven positional dq* questions, still no lens section. If this
    // moves, Phase 3A stopped being additive.
    expect(FALLBACK_DEEP_QUESTIONS.length).toBeGreaterThan(5)
    expect(FALLBACK_DEEP_QUESTIONS.every((q) => /^dq\d+$/.test(q.id))).toBe(true)
  })

  it("the four deterministic lens banks are untouched", () => {
    for (const addon of ADDON_KEYS) {
      const qs = addonQuestionsFor(addon)
      expect(qs.length).toBeGreaterThanOrEqual(4)
      expect(qs.every((q) => q.section === "lens")).toBe(true)
    }
  })
})

/* ══ Structural validity ═════════════════════════════════════════════════════ */

describe("the v1 bank is structurally valid", () => {
  it("passes its own validator with no errors", () => {
    const errors = validateConsultationBank(CONSULTATION_QUESTION_BANK)
    expect(errors, errors.join("\n")).toEqual([])
  })

  it("the validator is not vacuous", () => {
    // Proves the validator would actually fire. A validator that returns [] for
    // everything passes the test above just as happily.
    const broken = [{ ...CONSULTATION_QUESTION_BANK[0], id: "dq1" } as ConsultationQuestion]
    expect(validateConsultationBank(broken).length).toBeGreaterThan(0)
    expect(validateConsultationBank([])).toEqual(["bank: is empty"])
  })

  it("ids are unique, semantic, versioned and never positional", () => {
    const ids = CONSULTATION_QUESTION_BANK.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(id, `${id} must be core_<section>_<concept>_v<n>`).toMatch(
        /^core_[a-z0-9]+(?:_[a-z0-9]+)+_v\d+$/,
      )
      expect(id.endsWith(`_${CONSULTATION_BANK_VERSION}`)).toBe(true)
      // dq1/dq2 encode display order into the identity of a persisted answer.
      expect(/^dq\d/.test(id)).toBe(false)
      expect(/^(?:[a-z]+_)?lens\d+$/i.test(id)).toBe(false)
    }
  })

  it("no new id collides with a legacy core or lens id", () => {
    const taken = new Set<string>([
      ...FALLBACK_DEEP_QUESTIONS.map((q) => q.id),
      ...ADDON_KEYS.flatMap((a) => addonQuestionsFor(a).map((q) => q.id)),
    ])
    for (const q of CONSULTATION_QUESTION_BANK) expect(taken.has(q.id)).toBe(false)
  })

  it("answer fields are stable, semantic, unique and section-scoped", () => {
    const fields = CONSULTATION_QUESTION_BANK.map((q) => q.answerField)
    expect(new Set(fields).size).toBe(fields.length)
    for (const q of CONSULTATION_QUESTION_BANK) {
      expect(q.answerField).toMatch(/^[a-z][a-z0-9]*\.[a-z][a-zA-Z0-9]*$/)
      expect(q.answerField.startsWith(`${q.section}.`)).toBe(true)
      // The question's identity and its answer's meaning are different things.
      expect(q.answerField).not.toBe(q.id)
    }
  })

  it("every question uses a declared section and a declared type", () => {
    for (const q of CONSULTATION_QUESTION_BANK) {
      expect(CONSULTATION_SECTIONS).toContain(q.section)
      expect(["single", "multi", "slider", "textarea"]).toContain(q.type)
      // yes/no is deliberately not in the contract — a two-option single says
      // the same thing with one fewer branch everywhere downstream.
      expect(q.type as string).not.toBe("yesno")
    }
  })

  it("every question documents intent, necessity, sensitivity and report use", () => {
    for (const q of CONSULTATION_QUESTION_BANK) {
      expect(q.intent.trim().length, `${q.id} intent`).toBeGreaterThan(20)
      expect(q.whyNeeded.trim().length, `${q.id} whyNeeded`).toBeGreaterThan(40)
      expect(q.reportTargets.length, `${q.id} reportTargets`).toBeGreaterThan(0)
      for (const t of q.reportTargets) expect(CONSULTATION_REPORT_TARGETS).toContain(t)
      expect(["low", "medium", "high"]).toContain(q.sensitivity)
      expect(q.foundations.length).toBeGreaterThan(0)
    }
  })

  it("choice questions carry real, unique, slug-shaped option values", () => {
    for (const q of CONSULTATION_QUESTION_BANK) {
      if (q.type !== "single" && q.type !== "multi") continue
      const options = q.options ?? []
      expect(options.length, `${q.id}`).toBeGreaterThanOrEqual(2)
      const values = options.map((o) => o.value)
      expect(new Set(values).size, `${q.id} duplicate option values`).toBe(values.length)
      for (const o of options) {
        expect(o.value, `${q.id}/${o.value}`).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        expect(o.label.trim().length).toBeGreaterThan(1)
      }
    }
  })
})

/* ══ Exclusivity ═════════════════════════════════════════════════════════════ */

describe("multi-select exclusivity is declared, not inferred", () => {
  it("every REQUIRED multi question offers a way to say 'none of these'", () => {
    // Required is the case that matters: a question someone must answer, on
    // which every option is a disclosure, is not a question — it is a demand.
    // The one optional multi (the allergen detail) needs no escape, because
    // skipping it entirely already is one.
    for (const q of CONSULTATION_QUESTION_BANK) {
      if (q.type !== "multi" || !q.required) continue
      const exclusives = (q.options ?? []).filter((o) => o.exclusive)
      expect(exclusives.length, `${q.id} has no exclusive escape option`).toBeGreaterThan(0)
    }
  })

  it("exclusivity never depends on the wording of a label", () => {
    // The failure this prevents: a rule that infers exclusivity from the words
    // "none" or "not sure" silently stops working when someone rephrases the
    // label to "Nothing much has changed". Scoped to `multi`, because on a
    // single-choice question the options already exclude each other and the
    // flag would be meaningless — the bank validator rejects it there.
    const looksLikeNone = CONSULTATION_QUESTION_BANK.filter((q) => q.type === "multi").flatMap((q) =>
      (q.options ?? []).filter((o) => /^(none|nothing|no —|prefer not)/i.test(o.label)),
    )
    expect(looksLikeNone.length).toBeGreaterThan(2)
    for (const o of looksLikeNone) expect(o.exclusive, `"${o.label}"`).toBe(true)
  })

  it("no multi question is entirely exclusive options", () => {
    for (const q of CONSULTATION_QUESTION_BANK) {
      if (q.type !== "multi") continue
      const options = q.options ?? []
      expect(options.some((o) => !o.exclusive), `${q.id}`).toBe(true)
    }
  })
})

/* ══ Honest answers ══════════════════════════════════════════════════════════
 *
 * "Required" must never mean "pick one of our categories even if none is
 * true". A closed set that cannot be exhaustive needs an escape, or the stable
 * semantic answer it produces is a stable semantic lie. */

describe("every required question has an honest answer available", () => {
  /** A value that lets someone answer truthfully when no category fits. */
  const ESCAPE = /^(something else|prefer not to say|nothing|none|not sure|i'?m not sure|it varies|hard to (say|predict)|i can'?t tell|no clear|i don'?t|no —)/i

  it("the primary-focus list does not force a false priority", () => {
    const q = findConsultationQuestion("core_intentions_primary_focus_v1")
    expect(q?.required).toBe(true)
    const escapes = (q?.options ?? []).filter((o) => ESCAPE.test(o.label))
    expect(escapes.length, "primary focus has no escape value").toBeGreaterThan(0)
    // Chosen so the Report can tell "steadier energy" from "I don't know yet"
    // and decline to over-personalise on the second.
    expect((q?.options ?? []).map((o) => o.value)).toContain("unsure")
    // And it must not demand free text as the price of not knowing.
    expect(q?.type).toBe("single")
  })

  it("the barrier list separates 'not in your list' from 'nothing got in the way'", () => {
    const q = findConsultationQuestion("core_intentions_barrier_v1")
    const values = (q?.options ?? []).map((o) => o.value)
    expect(values).toContain("other")
    expect(values).toContain("none")
    // These are different claims. Collapsing them records "nothing stopped me"
    // for someone whose barrier simply was not offered.
    expect(values.indexOf("other")).not.toBe(values.indexOf("none"))
    expect(q?.type).toBe("single")
  })

  /**
   * The only required questions allowed to have no escape option, and why.
   *
   * Both are ordinal frequency scales whose ends genuinely bound the space —
   * "most days" through "never", and "almost all" through "hardly any". There
   * is no state of the world they fail to describe, so an added "not sure"
   * would be noise, and mechanically adding one to every question would train
   * a reviewer to stop reading option lists.
   *
   * A named list rather than a cleverer matcher: "is this scale exhaustive?"
   * is a judgement, and it should be one somebody made and a reviewer can
   * argue with. Adding an entry here is the visible cost of deciding a
   * question does not need an escape.
   */
  const EXHAUSTIVE_BY_CONSTRUCTION = new Set([
    "core_rhythm_household_shared_meals_v1", // most days → never
    "core_environment_cooking_frequency_v1", // almost all → hardly any
  ])

  it("no required question leaves the customer without a truthful option", () => {
    const offenders: string[] = []
    for (const q of CONSULTATION_QUESTION_BANK) {
      if (!q.required) continue
      if (q.type === "textarea" || q.type === "slider") continue
      if (EXHAUSTIVE_BY_CONSTRUCTION.has(q.id)) continue
      const hasEscape = (q.options ?? []).some((o) => ESCAPE.test(o.label) || o.exclusive)
      if (!hasEscape) offenders.push(`${q.id} — ${(q.options ?? []).map((o) => o.label).join(" | ")}`)
    }
    expect(offenders, offenders.join("\n")).toEqual([])
  })

  it("the exhaustive-scale exemption cannot rot", () => {
    // If one of these stops being required, or stops existing, the exemption
    // is stale and should be removed rather than left sitting there excusing
    // a question nobody is looking at any more.
    for (const id of EXHAUSTIVE_BY_CONSTRUCTION) {
      const q = findConsultationQuestion(id)
      expect(q, `${id} is exempted but not in the bank`).toBeDefined()
      expect(q?.required, `${id} is exempted but no longer required`).toBe(true)
      expect((q?.options ?? []).length).toBeGreaterThanOrEqual(4)
    }
  })

  it("the escape matcher is not vacuous", () => {
    expect(ESCAPE.test("Steadier energy")).toBe(false)
    expect(ESCAPE.test("Something else, or I'm not sure yet")).toBe(true)
    expect(ESCAPE.test("It varies too much to say")).toBe(true)
  })
})

describe("the food-avoidance question is honest about what it does not know", () => {
  const q = () => findConsultationQuestion("core_environment_food_avoidances_v1")

  it("is named for avoidance, not for allergens", () => {
    // A food avoided for medical reasons is frequently not an allergen, and
    // the semantic answer has to describe both. Renamed while the bank has
    // never been active and there is no compatibility cost.
    expect(q()).toBeDefined()
    expect(q()?.answerField).toBe("environment.foodAvoidances")
    expect(findConsultationQuestion("core_environment_allergen_detail_v1")).toBeUndefined()
    expect(CONSULTATION_QUESTION_BANK.some((x) => x.answerField.includes("allergen"))).toBe(false)
  })

  it("stays optional and stays structured", () => {
    expect(q()?.required).toBe(false)
    expect(q()?.sensitivity).toBe("high")
    expect(q()?.type).toBe("multi")
    // Not free text: a Report generator cannot reliably parse a sentence, and
    // a mis-parsed avoidance is the worst failure this product could have.
    expect(q()?.maxLength).toBeUndefined()
  })

  it("offers a way to record an avoidance it cannot itself capture", () => {
    const values = (q()?.options ?? []).map((o) => o.value)
    expect(values).toContain("other")
    expect(values).toContain("prefer-not-to-say")
  })

  it("does not claim its categories are exhaustive", () => {
    expect(q()?.supportText ?? "").toMatch(/not exhaustive/i)
    expect(q()?.supportText ?? "").toMatch(/check labels/i)
  })
})

/* ══ Burden ══════════════════════════════════════════════════════════════════ */

describe("question burden stays inside the frozen target", () => {
  it.each(CONSULTATION_FOUNDATIONS)("%s baseline is 12–16 questions", (foundation) => {
    const baseline = baselineQuestionsForFoundation(foundation).length
    expect(baseline).toBeGreaterThanOrEqual(BANK_COUNT_BOUNDS.baselineMin)
    expect(baseline).toBeLessThanOrEqual(BANK_COUNT_BOUNDS.baselineMax)
  })

  it.each(CONSULTATION_FOUNDATIONS)("%s core total leaves room for a lens", (foundation) => {
    const total = questionsForFoundation(foundation).length
    expect(total).toBeLessThanOrEqual(BANK_COUNT_BOUNDS.totalMax)
    // The exceptional hard ceiling is 26 including the four lens questions.
    expect(total + 4).toBeLessThanOrEqual(26)
  })

  it("there is at most one free-text question in the whole bank", () => {
    const freeText = CONSULTATION_QUESTION_BANK.filter((q) => q.type === "textarea")
    expect(freeText.length).toBeLessThanOrEqual(BANK_COUNT_BOUNDS.maxFreeText)
    // Long-form typing is not the personalisation mechanism, so the bank keeps
    // well inside the ceiling rather than sitting on it.
    expect(freeText.length).toBe(1)
    expect(freeText[0].required).toBe(false)
  })

  it("adaptive branching is one level deep", () => {
    expect(applicabilityDepth(CONSULTATION_QUESTION_BANK)).toBeLessThanOrEqual(
      BANK_COUNT_BOUNDS.maxAdaptiveDepth,
    )
    for (const q of CONSULTATION_QUESTION_BANK) {
      if (!q.applicableWhen) continue
      const parent = findConsultationQuestion(q.applicableWhen.questionId)
      expect(parent, `${q.id} trigger`).toBeDefined()
      expect(parent?.applicableWhen, `${q.id} branches off a branch`).toBeUndefined()
    }
  })

  it("the adaptive count per foundation is bounded", () => {
    for (const foundation of CONSULTATION_FOUNDATIONS) {
      const adaptive = adaptiveQuestionsForFoundation(foundation).length
      expect(adaptive).toBeGreaterThan(0)
      expect(adaptive).toBeLessThanOrEqual(6)
    }
  })

  it("no section is empty for either foundation", () => {
    for (const foundation of CONSULTATION_FOUNDATIONS) {
      for (const section of CONSULTATION_SECTIONS) {
        expect(sectionQuestions(section, foundation).length, `${foundation}/${section}`).toBeGreaterThan(0)
      }
    }
  })

  it("bankSummary reports what the review pack claims", () => {
    expect(bankSummary(CONSULTATION_QUESTION_BANK, "you")).toEqual({
      baseline: 13,
      adaptive: 3,
      total: 16,
      freeText: 1,
    })
    expect(bankSummary(CONSULTATION_QUESTION_BANK, "family")).toEqual({
      baseline: 13,
      adaptive: 2,
      total: 15,
      freeText: 1,
    })
  })
})

/* ══ Family ══════════════════════════════════════════════════════════════════ */

describe("Family is a household Food System, not a pluralised personal one", () => {
  const family = questionsForFoundation("family")
  const you = questionsForFoundation("you")

  it("individual health signals are You-only", () => {
    const youOnly = you.filter((q) => !q.foundations.includes("family")).map((q) => q.id)
    for (const id of [
      "core_signals_post_meal_pattern_v1",
      "core_signals_energy_shape_v1",
      "core_signals_context_v1",
      "core_signals_settled_days_v1",
    ]) {
      expect(youOnly, `${id} must not be asked of a household`).toContain(id)
    }
  })

  it("the Family bank contains no antibiotic-history question", () => {
    const blob = family.map((q) => `${q.text} ${q.familyText ?? ""}`).join("\n").toLowerCase()
    expect(blob).not.toMatch(/antibiotic/)
  })

  it("the Family bank contains no aggregate symptom or diagnosis screen", () => {
    const blob = family
      .flatMap((q) => [q.text, q.familyText, q.supportText, ...(q.options ?? []).map((o) => o.label)])
      .filter(Boolean)
      .join("\n")
      .toLowerCase()
    for (const pattern of [
      /bloat/,
      /digestive (discomfort|symptom)/,
      /diagnos/,
      /\bsymptoms?\b/,
      /how does your household feel after eating/,
    ]) {
      expect(blob, `Family asks something matching ${pattern}`).not.toMatch(pattern)
    }
  })

  it("shared questions read as a household on the Family side", () => {
    const shared = CONSULTATION_QUESTION_BANK.filter(
      (q) => q.foundations.includes("you") && q.foundations.includes("family"),
    )
    expect(shared.length).toBeGreaterThanOrEqual(8)
    for (const q of shared) {
      expect(q.familyText, `${q.id} has no household wording`).toBeTruthy()
      expect(questionTextFor(q, "family")).not.toBe(questionTextFor(q, "you"))
      expect(questionTextFor(q, "family")).toMatch(/household|we |us\b|our\b/i)
    }
  })

  it("Family gets its own household-shaped environment and rhythm content", () => {
    const familyOnly = family.filter((q) => !q.foundations.includes("you")).map((q) => q.id)
    expect(familyOnly).toContain("core_rhythm_household_shared_meals_v1")
    expect(familyOnly).toContain("core_environment_household_differing_needs_v1")
    expect(familyOnly).toContain("core_signals_household_mealtime_v1")
    // Not merely present — the household questions are a real share of the bank.
    expect(familyOnly.length).toBeGreaterThanOrEqual(4)
  })

  it("every required Family question has a usable answer contract", () => {
    for (const q of family) {
      if (!q.required) continue
      if (q.type === "single" || q.type === "multi") expect((q.options ?? []).length).toBeGreaterThanOrEqual(2)
      if (q.type === "textarea") expect(q.maxLength).toBeGreaterThan(0)
    }
  })
})

/* ══ Sensitivity and science review ══════════════════════════════════════════ */

describe("sensitive collection is deliberate and reviewable", () => {
  it("every high-sensitivity question is optional", () => {
    for (const q of CONSULTATION_QUESTION_BANK) {
      if (q.sensitivity !== "high") continue
      expect(q.required, `${q.id} is high-sensitivity and required`).toBe(false)
    }
  })

  it("every high-sensitivity question is adaptive, not asked of everyone", () => {
    for (const q of CONSULTATION_QUESTION_BANK) {
      if (q.sensitivity !== "high") continue
      expect(q.applicableWhen, `${q.id} is high-sensitivity and asked unconditionally`).toBeDefined()
    }
  })

  it("nothing is marked as science-reviewed, because nothing has been", () => {
    // The flag exists to record a human sign-off. An agent marking its own
    // wording `reviewed` would make the flag worse than not having it.
    const reviewed = CONSULTATION_QUESTION_BANK.filter((q) => q.scienceReview === "reviewed")
    expect(reviewed.map((q) => q.id)).toEqual([])
  })

  it("everything health-adjacent is flagged for human science review", () => {
    const flagged = CONSULTATION_QUESTION_BANK.filter((q) => q.scienceReview === "required").map((q) => q.id)
    for (const id of [
      "core_signals_post_meal_pattern_v1",
      "core_environment_food_avoidances_v1",
      "core_environment_constraints_v1",
    ]) {
      expect(flagged, `${id} must be flagged for science review`).toContain(id)
    }
  })

  it("the bank asks for no medication name, diagnosis, measurement or family medical history", () => {
    const blob = CONSULTATION_QUESTION_BANK.flatMap((q) => [
      q.text,
      q.familyText,
      q.supportText,
      q.familySupportText,
      ...(q.options ?? []).flatMap((o) => [o.label, o.familyLabel]),
    ])
      .filter(Boolean)
      .join("\n")

    const banned: Array<[string, RegExp]> = [
      ["medication name", /\bmedication\b|\bprescrib|\bwhich drug\b/i],
      ["diagnosis", /\bdiagnos(is|ed|e)\b/i],
      ["lab value", /\bhba1c\b|\ba1c\b|\bfasting glucose\b|\bmmol\/l\b|\bmg\/dl\b|\bcholesterol\b/i],
      ["blood pressure", /\bblood pressure\b|\bsystolic\b|\bdiastolic\b/i],
      ["weight target", /\bbmi\b|\bgoal weight\b|\btarget weight\b|\bhow much do you weigh\b/i],
      ["family medical history", /\bfamily history\b|\bruns in (the|your) family\b/i],
      ["stool screening", /\bstool\b|\bbristol\b/i],
      ["clinical mental-health screen", /\bdepress|\bdiagnosed anxiety\b|\beating disorder\b/i],
    ]

    for (const [label, pattern] of banned) {
      expect(blob.match(pattern)?.[0], `bank asks about ${label}`).toBeUndefined()
    }

    // Non-vacuous: the matchers fire on real violations.
    expect(banned[1][1].test("Have you been diagnosed with IBS?")).toBe(true)
    expect(banned[2][1].test("What was your last HbA1c?")).toBe(true)
  })
})

/* ══ Free Assessment duplication ═════════════════════════════════════════════ */

describe("the paid bank does not re-ask the free Assessment", () => {
  /**
   * A curated manifest rather than a similarity heuristic.
   *
   * Every question that touches a construct q1–q15 already covers is listed
   * here BY ID. Adding another one means editing this list, which means someone
   * had to think about whether the new question earns its place — which is the
   * whole point. A clever text-similarity check would have caught none of the
   * three cases below and would have flagged several innocent ones.
   */
  const EXPECTED_OVERLAP: Record<string, string[]> = {
    core_signals_post_meal_pattern_v1: ["q13"],
    core_signals_energy_shape_v1: ["q15"],
    core_rhythm_longest_gap_v1: ["q12"],
    core_rhythm_week_shape_v1: ["q11"],
  }

  it("only the reviewed questions claim to overlap the free Assessment", () => {
    const declared = CONSULTATION_QUESTION_BANK.filter((q) => q.freeAssessmentOverlap === "deeper").map(
      (q) => q.id,
    )
    expect([...declared].sort()).toEqual(Object.keys(EXPECTED_OVERLAP).sort())
  })

  it("each overlap names real free questions and says what it adds", () => {
    const freeIds = new Set(FREE_ASSESSMENT_QUESTIONS.map((q) => q.id))
    expect(freeIds.size).toBe(15)

    for (const [id, expected] of Object.entries(EXPECTED_OVERLAP)) {
      const q = findConsultationQuestion(id)
      expect(q, id).toBeDefined()
      expect([...(q?.freeAssessmentQuestionIds ?? [])].sort()).toEqual([...expected].sort())
      for (const freeId of q?.freeAssessmentQuestionIds ?? []) expect(freeIds.has(freeId)).toBe(true)
      // "Same construct, new wording" is not depth. The explanation has to be
      // substantial enough that a reviewer can disagree with it.
      expect((q?.deeperBecause ?? "").length, `${id} deeperBecause`).toBeGreaterThan(80)
    }
  })

  it("questions claiming no overlap carry no overlap metadata", () => {
    for (const q of CONSULTATION_QUESTION_BANK) {
      if (q.freeAssessmentOverlap !== "none") continue
      expect(q.deeperBecause, `${q.id}`).toBeUndefined()
      expect(q.freeAssessmentQuestionIds ?? [], `${q.id}`).toEqual([])
    }
  })

  it("the constructs the free Assessment owns outright are not re-asked", () => {
    // Plant variety, fibre, processed food and fermented foods are q1–q9's
    // entire job. The paid Consultation adds nothing by asking again.
    const blob = CONSULTATION_QUESTION_BANK.map((q) => `${q.text} ${q.familyText ?? ""}`)
      .join("\n")
      .toLowerCase()
    for (const pattern of [
      /how many different plant/,
      /fermented/,
      /ultra-processed/,
      /prebiotic-rich/,
      /how many plants/,
    ]) {
      expect(blob, `re-asks the free Assessment: ${pattern}`).not.toMatch(pattern)
    }
  })
})

/* ══ Review pack ═════════════════════════════════════════════════════════════ */

describe("the review pack describes the bank that exists", () => {
  const docPath = join(repoRoot, "docs/phase-3a-consultation-question-bank-review.md")

  it("exists", () => {
    expect(existsSync(docPath)).toBe(true)
  })

  it("documents every question by id", () => {
    const doc = readFileSync(docPath, "utf8")
    for (const q of CONSULTATION_QUESTION_BANK) {
      expect(doc, `${q.id} is missing from the review pack`).toContain(q.id)
    }
  })

  it("carries the mandatory review sections", () => {
    const doc = readFileSync(docPath, "utf8")
    for (const heading of [
      "Question-to-Report Traceability Matrix",
      "Free Assessment Duplication",
      "Sensitive Data Review",
      "Postbiotics Boundary Review",
      "Requires Human Science Review",
      "Questions Considered But Rejected",
    ]) {
      expect(doc, `review pack is missing "${heading}"`).toContain(heading)
    }
  })

  it("names every question that still needs human science review", () => {
    const doc = readFileSync(docPath, "utf8")
    const section = doc.split("Requires Human Science Review")[1] ?? ""
    for (const q of CONSULTATION_QUESTION_BANK) {
      if (q.scienceReview !== "required") continue
      expect(section, `${q.id} is flagged but not listed for review`).toContain(q.id)
    }
  })
})
