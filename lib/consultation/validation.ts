import {
  CONSULTATION_BANK_VERSION,
  CONSULTATION_FOUNDATIONS,
  CONSULTATION_OPERATORS,
  CONSULTATION_QUESTION_TYPES,
  CONSULTATION_REPORT_TARGETS,
  CONSULTATION_SECTIONS,
  CONSULTATION_SENSITIVITIES,
  type ConsultationAnswer,
  type ConsultationFoundation,
  type ConsultationQuestion,
} from "./types"

/**
 * Two validators that answer two different questions.
 *
 *   `validateConsultationBank` — is the BANK itself coherent? A static-source
 *   question, answered at test and build time. There is no runtime HTTP failure
 *   for a malformed bank because a malformed bank should never reach a runtime:
 *   it is source code, and the place to reject it is CI.
 *
 *   `validateAnswer` — is one CUSTOMER ANSWER usable? A runtime question, and
 *   deliberately not a throwing one. An incomplete Consultation is the normal
 *   state of a Consultation in progress, not an error.
 *
 * Neither is wired into the live paid Consultation. Phase 3B/3C adopt them.
 */

/* ══ Bank validation ═══════════════════════════════════════════════════════ */

/** `core_<section>_<concept>_v<n>` — semantic, versioned, never positional. */
const ID_SHAPE = /^core_[a-z0-9]+(?:_[a-z0-9]+)+_v(\d+)$/
/** `<section>.<camelCaseField>` — the answer's meaning, not the question's id. */
const ANSWER_FIELD_SHAPE = /^[a-z][a-z0-9]*\.[a-z][a-zA-Z0-9]*$/
const OPTION_VALUE_SHAPE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
/** Legacy positional core ids. A new-bank id must never look like one. */
const LEGACY_CORE_ID = /^dq\d+/i
/** Lens wire ids, matching lib/assessment/addon-questions.ts's own shape rule. */
const LENS_SHAPED_ID = /^(?:[a-z]+_)?lens\d+$/i

/** §7 of the phase spec, encoded so the bank cannot quietly inflate. */
export const BANK_COUNT_BOUNDS = {
  baselineMin: 12,
  baselineMax: 16,
  /** Core total per foundation, before the entitled lens's own four. */
  totalMax: 22,
  /** Long-form typing is not the personalisation mechanism. */
  maxFreeText: 2,
  /** A branch off a branch is a decision tree. One level, deliberately. */
  maxAdaptiveDepth: 1,
} as const

/**
 * Every structural problem with the bank, as readable strings.
 *
 * Returns a list rather than throwing on the first fault so a review sees all
 * of them at once. An empty array is a valid bank.
 */
export function validateConsultationBank(bank: readonly ConsultationQuestion[]): string[] {
  const errors: string[] = []
  const fail = (id: string, message: string) => errors.push(`${id}: ${message}`)

  if (bank.length === 0) {
    errors.push("bank: is empty")
    return errors
  }

  const seenIds = new Set<string>()
  const seenAnswerFields = new Set<string>()
  const byId = new Map<string, ConsultationQuestion>()
  const positionOf = new Map<string, number>()

  bank.forEach((q, index) => {
    if (seenIds.has(q.id)) fail(q.id, "duplicate question id")
    seenIds.add(q.id)
    byId.set(q.id, q)
    positionOf.set(q.id, index)
  })

  for (const q of bank) {
    /* ── Identity ── */
    const idMatch = ID_SHAPE.exec(q.id)
    if (!idMatch) {
      fail(q.id, "id must be core_<section>_<concept>_v<n> — semantic and versioned, never positional")
    } else if (`v${idMatch[1]}` !== CONSULTATION_BANK_VERSION) {
      fail(q.id, `id version v${idMatch[1]} does not match CONSULTATION_BANK_VERSION ${CONSULTATION_BANK_VERSION}`)
    }
    if (LEGACY_CORE_ID.test(q.id)) fail(q.id, "id collides with the legacy positional dq* namespace")
    if (LENS_SHAPED_ID.test(q.id)) fail(q.id, "id collides with the lens namespace")
    if (idMatch && !q.id.startsWith(`core_${q.section}_`)) {
      fail(q.id, `id does not carry its own section (expected core_${q.section}_…)`)
    }

    /* ── Answer meaning ── */
    if (!ANSWER_FIELD_SHAPE.test(q.answerField)) {
      fail(q.id, `answerField "${q.answerField}" must be <section>.<camelCaseField>`)
    } else if (!q.answerField.startsWith(`${q.section}.`)) {
      fail(q.id, `answerField "${q.answerField}" does not match section "${q.section}"`)
    }
    if (seenAnswerFields.has(q.answerField)) fail(q.id, `duplicate answerField "${q.answerField}"`)
    seenAnswerFields.add(q.answerField)

    /* ── Enums ── */
    if (!CONSULTATION_SECTIONS.includes(q.section)) fail(q.id, `unknown section "${q.section}"`)
    if (!CONSULTATION_QUESTION_TYPES.includes(q.type)) fail(q.id, `unknown type "${q.type}"`)
    if (!CONSULTATION_SENSITIVITIES.includes(q.sensitivity)) fail(q.id, `unknown sensitivity "${q.sensitivity}"`)

    /* ── Documentation is not optional ── */
    if (q.text.trim().length < 10) fail(q.id, "text is missing or too short to be a real question")
    if (q.intent.trim().length < 20) fail(q.id, "intent is missing or too thin to review")
    if (q.whyNeeded.trim().length < 40) fail(q.id, "whyNeeded is missing or too thin to review")
    if (q.reportTargets.length === 0) {
      fail(q.id, "no reportTargets — a question the Report cannot use should not exist")
    }
    for (const t of q.reportTargets) {
      if (!CONSULTATION_REPORT_TARGETS.includes(t)) fail(q.id, `unknown reportTarget "${t}"`)
    }
    if (new Set(q.reportTargets).size !== q.reportTargets.length) fail(q.id, "duplicate reportTargets")

    /* ── Free-Assessment relationship ── */
    if (q.freeAssessmentOverlap === "deeper") {
      if ((q.deeperBecause ?? "").trim().length < 60) {
        fail(q.id, "claims to build deeper on the free Assessment without explaining what new information it collects")
      }
      if (!q.freeAssessmentQuestionIds || q.freeAssessmentQuestionIds.length === 0) {
        fail(q.id, "claims free-Assessment overlap without naming which free questions")
      }
    } else if (q.deeperBecause) {
      fail(q.id, "has deeperBecause but does not declare free-Assessment overlap")
    }

    /* ── Foundations ── */
    if (q.foundations.length === 0) fail(q.id, "no foundations — the question is unreachable")
    for (const f of q.foundations) {
      if (!CONSULTATION_FOUNDATIONS.includes(f)) fail(q.id, `unknown foundation "${f}"`)
    }
    if (new Set(q.foundations).size !== q.foundations.length) fail(q.id, "duplicate foundations")
    // Shared questions must actually read as a household on the Family side.
    // A family-ONLY question is already written in household voice and needs no
    // variant, which is why this fires on the shared case only.
    if (q.foundations.includes("you") && q.foundations.includes("family") && !q.familyText) {
      fail(q.id, "asked of both foundations but has no familyText — Family would read the personal wording")
    }
    if (!q.foundations.includes("family") && (q.familyText || q.familySupportText)) {
      fail(q.id, "carries family wording but is not asked of the Family foundation")
    }

    /* ── Type-specific shape ── */
    const options = q.options ?? []
    const isChoice = q.type === "single" || q.type === "multi"

    if (isChoice) {
      if (options.length < 2) fail(q.id, "a choice question needs at least two options")
      const values = options.map((o) => o.value)
      if (new Set(values).size !== values.length) fail(q.id, "duplicate option values")
      for (const o of options) {
        if (!OPTION_VALUE_SHAPE.test(o.value)) fail(q.id, `option value "${o.value}" is not a stable slug`)
        if (o.label.trim().length < 2) fail(q.id, `option "${o.value}" has no usable label`)
      }
      const exclusives = options.filter((o) => o.exclusive)
      if (q.type === "single" && exclusives.length > 0) {
        fail(q.id, "exclusivity is meaningless on a single-choice question")
      }
      if (q.type === "multi" && exclusives.length === options.length) {
        fail(q.id, "every option is exclusive — nothing can ever be combined")
      }
    } else if (options.length > 0) {
      fail(q.id, `a ${q.type} question must not declare options`)
    }

    if (q.type === "multi") {
      const substantive = options.filter((o) => !o.exclusive).length
      const min = q.minSelections ?? 1
      if (min < 1) fail(q.id, "minSelections must be at least 1")
      if (min > substantive) fail(q.id, "minSelections cannot exceed the number of combinable options")
    } else if (q.minSelections !== undefined) {
      fail(q.id, "minSelections only applies to a multi question")
    }

    if (q.type === "slider") {
      if (typeof q.min !== "number" || typeof q.max !== "number") {
        fail(q.id, "a slider needs both min and max")
      } else if (q.min >= q.max) {
        fail(q.id, "slider min must be below max")
      }
    } else if (q.min !== undefined || q.max !== undefined) {
      fail(q.id, "min/max only apply to a slider")
    }

    if (q.type === "textarea") {
      if (typeof q.maxLength !== "number" || q.maxLength < 50 || q.maxLength > 2000) {
        fail(q.id, "a textarea needs a maxLength between 50 and 2000")
      }
    } else if (q.maxLength !== undefined) {
      fail(q.id, "maxLength only applies to a textarea")
    }

    /* ── Applicability ── */
    const rule = q.applicableWhen
    if (rule) {
      if (!CONSULTATION_OPERATORS.includes(rule.operator)) {
        fail(q.id, `unknown applicability operator "${rule.operator}"`)
      }
      if (rule.values.length === 0) fail(q.id, "applicability rule lists no values")
      if (rule.questionId === q.id) fail(q.id, "applicability rule refers to itself")

      const parent = byId.get(rule.questionId)
      if (!parent) {
        fail(q.id, `applicability refers to unknown question "${rule.questionId}"`)
      } else {
        const here = positionOf.get(q.id) ?? -1
        const there = positionOf.get(parent.id) ?? -1
        if (there >= here) {
          fail(q.id, `applicability trigger "${parent.id}" must appear earlier in the bank`)
        }
        if (parent.applicableWhen) {
          fail(q.id, "applicability trigger is itself adaptive — that is a branch off a branch")
        }
        const parentValues = new Set((parent.options ?? []).map((o) => o.value))
        for (const v of rule.values) {
          if (!parentValues.has(v)) {
            fail(q.id, `applicability value "${v}" is not an option of "${parent.id}"`)
          }
        }
        const wantsSingle = rule.operator === "equals" || rule.operator === "notEquals"
        if (wantsSingle && parent.type !== "single") {
          fail(q.id, `operator "${rule.operator}" needs a single-choice trigger, but "${parent.id}" is ${parent.type}`)
        }
        if (rule.operator === "includes" && parent.type !== "multi") {
          fail(q.id, `operator "includes" needs a multi trigger, but "${parent.id}" is ${parent.type}`)
        }
        // A rule that excludes every option the trigger can produce is a
        // question that can never be asked — which looks present in review and
        // is not.
        if (rule.operator === "notEquals" && parentValues.size > 0 && rule.values.length >= parentValues.size) {
          const covers = [...parentValues].every((v) => rule.values.includes(v))
          if (covers) fail(q.id, "applicability can never be true — it excludes every option the trigger offers")
        }
        for (const f of q.foundations) {
          if (!parent.foundations.includes(f)) {
            fail(q.id, `asked of foundation "${f}" but its trigger "${parent.id}" is not — it could never fire there`)
          }
        }
      }
    }
  }

  errors.push(...detectApplicabilityCycles(bank))
  errors.push(...validateCounts(bank))

  return errors
}

/**
 * Cycle detection over the applicability graph.
 *
 * The "trigger must appear earlier" rule already makes a cycle unreachable in
 * a bank that passes, so this can only fire alongside that error. It is here
 * anyway because ordering is an easy rule to relax later ("just let the
 * resolver iterate"), and the day someone does, this is the check that still
 * refuses a loop.
 */
function detectApplicabilityCycles(bank: readonly ConsultationQuestion[]): string[] {
  const errors: string[] = []
  const parentOf = new Map<string, string>()
  for (const q of bank) if (q.applicableWhen) parentOf.set(q.id, q.applicableWhen.questionId)

  for (const start of parentOf.keys()) {
    const path: string[] = [start]
    let current = parentOf.get(start)
    while (current) {
      if (path.includes(current)) {
        errors.push(`${start}: applicability cycle — ${[...path, current].join(" → ")}`)
        break
      }
      path.push(current)
      current = parentOf.get(current)
      if (path.length > bank.length + 1) break
    }
  }
  return errors
}

/** Burden bounds, per foundation. A bank that inflates fails here. */
function validateCounts(bank: readonly ConsultationQuestion[]): string[] {
  const errors: string[] = []

  const freeText = bank.filter((q) => q.type === "textarea").length
  if (freeText > BANK_COUNT_BOUNDS.maxFreeText) {
    errors.push(`bank: ${freeText} free-text questions exceeds the maximum of ${BANK_COUNT_BOUNDS.maxFreeText}`)
  }

  for (const foundation of CONSULTATION_FOUNDATIONS) {
    const mine = bank.filter((q) => q.foundations.includes(foundation))
    const baseline = mine.filter((q) => !q.applicableWhen).length
    if (baseline < BANK_COUNT_BOUNDS.baselineMin || baseline > BANK_COUNT_BOUNDS.baselineMax) {
      errors.push(
        `bank: ${foundation} baseline is ${baseline}, outside ${BANK_COUNT_BOUNDS.baselineMin}–${BANK_COUNT_BOUNDS.baselineMax}`,
      )
    }
    if (mine.length > BANK_COUNT_BOUNDS.totalMax) {
      errors.push(`bank: ${foundation} total is ${mine.length}, above the core ceiling of ${BANK_COUNT_BOUNDS.totalMax}`)
    }

    // Two questions that read identically to the same person are one question
    // asked twice, however different their ids are.
    const seen = new Map<string, string>()
    for (const q of mine) {
      const text = (foundation === "family" && q.familyText ? q.familyText : q.text).trim().toLowerCase()
      const prior = seen.get(text)
      if (prior) errors.push(`${q.id}: duplicate question text with ${prior} for foundation "${foundation}"`)
      seen.set(text, q.id)
    }
  }

  return errors
}

/** The maximum branch depth actually present in the bank. */
export function applicabilityDepth(bank: readonly ConsultationQuestion[]): number {
  const byId = new Map(bank.map((q) => [q.id, q]))
  let deepest = 0
  for (const q of bank) {
    let depth = 0
    let current: ConsultationQuestion | undefined = q
    const guard = new Set<string>()
    while (current?.applicableWhen && !guard.has(current.id)) {
      guard.add(current.id)
      depth += 1
      current = byId.get(current.applicableWhen.questionId)
    }
    deepest = Math.max(deepest, depth)
  }
  return deepest
}

/* ══ Answer validation ═════════════════════════════════════════════════════ */

export type AnswerValidation =
  | { status: "valid"; value: ConsultationAnswer }
  | { status: "missing" }
  | { status: "invalid"; reason: string }

/**
 * One answer against its question.
 *
 * Three outcomes, not two. `missing` and `invalid` are genuinely different
 * states — "they have not got there yet" and "this cannot be trusted" — and
 * collapsing them is how an unanswered question becomes an inferred one.
 *
 * Nothing here ever supplies a default. A slider with no answer is not the
 * midpoint, an empty textarea is not an empty opinion, and an empty multi
 * array is not "none of these" (which, where it is a real answer, is a
 * declared exclusive option the customer has to actually choose).
 */
export function validateAnswer(question: ConsultationQuestion, raw: unknown): AnswerValidation {
  if (raw === undefined || raw === null) return { status: "missing" }

  switch (question.type) {
    case "single": {
      if (typeof raw !== "string") return { status: "invalid", reason: "expected a single option value" }
      const trimmed = raw.trim()
      if (trimmed === "") return { status: "missing" }
      const allowed = new Set((question.options ?? []).map((o) => o.value))
      if (!allowed.has(trimmed)) return { status: "invalid", reason: `"${trimmed}" is not an offered option` }
      return { status: "valid", value: trimmed }
    }

    case "multi": {
      if (!Array.isArray(raw)) return { status: "invalid", reason: "expected a list of option values" }
      if (raw.length === 0) return { status: "missing" }
      if (!raw.every((v): v is string => typeof v === "string")) {
        return { status: "invalid", reason: "every selection must be an option value" }
      }
      const values = raw.map((v) => v.trim())
      if (new Set(values).size !== values.length) return { status: "invalid", reason: "the same option is selected twice" }

      const options = question.options ?? []
      const allowed = new Map(options.map((o) => [o.value, o]))
      for (const v of values) {
        if (!allowed.has(v)) return { status: "invalid", reason: `"${v}" is not an offered option` }
      }

      // Exclusivity is read from the option's own `exclusive` flag. It is never
      // inferred from a label reading "none" or "not sure" — a rephrase would
      // silently switch that off, and the customer would end up with "Nothing
      // much has changed" recorded alongside three things that changed.
      const chosenExclusive = values.filter((v) => allowed.get(v)?.exclusive)
      if (chosenExclusive.length > 0 && values.length > 1) {
        return {
          status: "invalid",
          reason: `"${chosenExclusive[0]}" cannot be combined with another answer`,
        }
      }

      const min = question.minSelections ?? 1
      if (question.required && values.length < min) {
        return { status: "invalid", reason: `needs at least ${min} selection(s)` }
      }
      return { status: "valid", value: values }
    }

    case "slider": {
      if (typeof raw !== "number" || !Number.isFinite(raw)) {
        return { status: "invalid", reason: "expected a number" }
      }
      const { min, max } = question
      if (typeof min !== "number" || typeof max !== "number") {
        return { status: "invalid", reason: "the question declares no bounds" }
      }
      if (raw < min || raw > max) return { status: "invalid", reason: `outside ${min}–${max}` }
      return { status: "valid", value: raw }
    }

    case "textarea": {
      if (typeof raw !== "string") return { status: "invalid", reason: "expected text" }
      const trimmed = raw.trim()
      // Whitespace is not an answer, for a required question or an optional
      // one. It becomes `missing`, so a required textarea fails completeness
      // rather than storing a blank the Report would quote back.
      if (trimmed === "") return { status: "missing" }
      const max = question.maxLength ?? 0
      if (max > 0 && trimmed.length > max) {
        return { status: "invalid", reason: `longer than ${max} characters` }
      }
      return { status: "valid", value: trimmed }
    }

    default:
      return { status: "invalid", reason: "unknown question type" }
  }
}

/** Convenience for review tooling: the questions a foundation would be asked. */
export function bankSummary(
  bank: readonly ConsultationQuestion[],
  foundation: ConsultationFoundation,
): { baseline: number; adaptive: number; total: number; freeText: number } {
  const mine = bank.filter((q) => q.foundations.includes(foundation))
  return {
    baseline: mine.filter((q) => !q.applicableWhen).length,
    adaptive: mine.filter((q) => q.applicableWhen).length,
    total: mine.length,
    freeText: mine.filter((q) => q.type === "textarea").length,
  }
}
