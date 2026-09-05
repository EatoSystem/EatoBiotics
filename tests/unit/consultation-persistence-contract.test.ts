import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { readQuestionSnapshot } from "@/lib/assessment/question-snapshot"
import {
  resolveTrustedQuestions,
  answersForTrustedQuestions,
} from "@/lib/assessment/trusted-questions"
import { FALLBACK_DEEP_QUESTIONS } from "@/lib/deep-assessment"
import { CONSULTATION_QUESTION_BANK, findConsultationQuestion } from "@/lib/consultation/question-bank"
import {
  CONSULTATION_BANKS,
  CONSULTATION_BANK_V1,
  CURRENT_CONSULTATION_BANK,
  bankMatches,
  fingerprintBank,
  fingerprintFor,
  isKnownBankVersion,
  resolveConsultationBank,
} from "@/lib/consultation/bank-registry"
import {
  createDeterministicConsultationSnapshot,
  readDeterministicConsultationSnapshot,
  readDeterministicConsultationState,
  readDeterministicStateSlot,
  sanitiseCandidateAnswers,
  snapshotIsResolvable,
  DETERMINISTIC_STATE_KIND,
  DETERMINISTIC_STATE_SCHEMA_VERSION,
  EMPTY_DETERMINISTIC_STATE,
} from "@/lib/consultation/session-envelope"
import { resolveDeterministicInit, resumeDeterministicSession } from "@/lib/consultation/session-init"
import type { ConsultationQuestion } from "@/lib/consultation/types"

/**
 * Phase 3C-A — the legacy/deterministic boundary.
 *
 * ══ WHY THESE TESTS ARE LOAD-BEARING ════════════════════════════════════════
 *
 * The deterministic session stores an OBJECT in `deep_assessments.questions`,
 * where a legacy session stores a `DeepQuestion[]`. That structural difference
 * is the entire discriminator — there is no new column and no migration — so
 * the safety of the design rests on a claim about code nobody is changing:
 * that every existing legacy reader already refuses a non-array.
 *
 * A comment asserting that would rot. These assert it against the REAL modules,
 * so if a future edit loosens `readQuestionSnapshot` or `resolveTrustedQuestions`,
 * the failure lands here rather than in a customer's Report.
 */

const Q1 = "core_signals_post_meal_pattern_v1"
const CONSTRAINTS = "core_environment_constraints_v1"
const AVOIDANCES = "core_environment_food_avoidances_v1"
const SUCCESS = "core_intentions_success_v1"

const snapshot = () =>
  createDeterministicConsultationSnapshot({ foundation: "you", entitledLens: null })

const legacyQuestions = () => [
  { id: "dq1", text: "How do you usually feel after eating?", type: "single" },
  { id: "dq2", text: "What is your biggest goal?", type: "textarea" },
]

const legacyAnswers = () => ({ dq1: "sluggish", dq2: "more energy" })

const deterministicState = (over: Record<string, unknown> = {}) => ({
  kind: DETERMINISTIC_STATE_KIND,
  schemaVersion: DETERMINISTIC_STATE_SCHEMA_VERSION,
  candidateAnswers: {},
  touchedQuestionIds: [],
  skippedOptionalQuestionIds: [],
  currentQuestionId: null,
  phase: "questions",
  ...over,
})

/* ══ §24 A–G — the legacy stack cannot read, write or destroy ═══════════════ */

describe("A. a legacy question array parses only as legacy", () => {
  it("readQuestionSnapshot accepts it", () => {
    expect(readQuestionSnapshot(legacyQuestions())).toHaveLength(2)
  })

  it("the deterministic parser refuses it", () => {
    expect(readDeterministicConsultationSnapshot(legacyQuestions())).toBeNull()
  })
})

describe("B. a deterministic envelope does NOT parse as legacy", () => {
  it("readQuestionSnapshot rejects it, because it rejects every non-array", () => {
    expect(readQuestionSnapshot(snapshot())).toBeNull()
    // The property the whole design rests on, stated directly.
    for (const nonArray of [{}, { kind: "anything" }, "string", 7, true]) {
      expect(readQuestionSnapshot(nonArray)).toBeNull()
    }
  })

  it("the source really does test Array.isArray first", () => {
    const src = readFileSync(join(process.cwd(), "lib/assessment/question-snapshot.ts"), "utf8")
    expect(src).toMatch(/if\s*\(!Array\.isArray\(persisted\)\)\s*return null/)
  })
})

describe("C. a legacy answer map does NOT parse as deterministic state", () => {
  it("is refused for having no kind", () => {
    expect(readDeterministicConsultationState(legacyAnswers())).toBeNull()
  })

  it("and the deterministic state does not parse as anything legacy-shaped", () => {
    // A legacy consumer looks answers up by question id at the top level.
    const state = deterministicState({ candidateAnswers: { [Q1]: "bloating" } })
    expect((state as Record<string, unknown>)[Q1]).toBeUndefined()
  })
})

describe("D. deterministic state exposes no top-level question ids", () => {
  it("answers live under candidateAnswers, never beside the envelope fields", () => {
    const parsed = readDeterministicConsultationState(
      deterministicState({ candidateAnswers: { [Q1]: "bloating" } }),
    )!
    expect(parsed.candidateAnswers[Q1]).toBe("bloating")
    expect(Object.keys(parsed).sort()).toEqual([
      "candidateAnswers",
      "currentQuestionId",
      "kind",
      "phase",
      "schemaVersion",
      "skippedOptionalQuestionIds",
      "touchedQuestionIds",
    ])
  })
})

describe("E. the legacy save route refuses a deterministic session", () => {
  it("gates every write on readQuestionSnapshot and 409s when it is null", () => {
    const src = readFileSync(join(process.cwd(), "app/api/save-deep-progress/route.ts"), "utf8")
    expect(src).toContain("const snapshot = readQuestionSnapshot(row.questions)")
    expect(src).toMatch(/if\s*\(!snapshot\)\s*\{[\s\S]{0,200}status:\s*409/)
    // And the id check runs against that snapshot, so nothing can be stored
    // against a session whose questions it could not read.
    expect(src).toContain("snapshot.some((q) => q.id === questionId)")
  })

  it("readQuestionSnapshot returns null for the envelope, which is what drives the 409", () => {
    expect(readQuestionSnapshot(snapshot())).toBeNull()
  })
})

describe("F. the legacy trusted-question resolver refuses a deterministic envelope", () => {
  it("resolves no core questions and reports no_question_set", () => {
    const result = resolveTrustedQuestions({
      persisted: snapshot(),
      entitledAddon: null,
      foundation: "you",
    })
    expect(result).toEqual({ ok: false, reason: "no_question_set" })
  })

  it("never returns a question derived from the envelope's own fields", () => {
    const result = resolveTrustedQuestions({
      persisted: snapshot(),
      entitledAddon: null,
      foundation: "you",
      devMode: true,
    })
    // In dev there is no Stripe session and the fallback bank stands in. That
    // set is entirely server-authored, so the envelope still contributes
    // nothing — which is the property that matters.
    expect(result.ok).toBe(true)
    if (result.ok) {
      const ids = result.questions.map((q) => q.id)
      expect(ids).toEqual(expect.arrayContaining(FALLBACK_DEEP_QUESTIONS.map((q) => q.id)))
      expect(ids.some((id) => id.startsWith("core_"))).toBe(false)
      expect(ids).not.toContain("kind")
    }
  })
})

describe("G. legacy submit cannot build a Report from a deterministic session", () => {
  it("submit resolves its questions only through the trusted resolver", () => {
    const src = readFileSync(join(process.cwd(), "app/api/submit-deep-assessment/route.ts"), "utf8")
    expect(src).toContain("resolveTrustedQuestions")
    expect(src).toContain("persisted: existingRow?.questions")
  })

  it("and with a deterministic envelope that resolver refuses, so there is nothing to prompt with", () => {
    const result = resolveTrustedQuestions({
      persisted: snapshot(),
      entitledAddon: null,
      foundation: "you",
    })
    expect(result.ok).toBe(false)
  })

  it("deterministic answers cannot survive the legacy answer narrowing either", () => {
    // Even if a question set existed, the legacy narrowing keeps only answers
    // whose key is a trusted question id — and deterministic ids never are.
    const kept = answersForTrustedQuestions(legacyQuestions() as never, {
      dq1: "sluggish",
      [Q1]: "bloating",
    })
    expect(Object.keys(kept)).toEqual(["dq1"])
  })
})

describe("the question generator refuses to overwrite a deterministic session", () => {
  it("declines rather than replacing a stored value it cannot characterise", () => {
    // This is the third and least obvious guarantee: not only can legacy code
    // not READ a deterministic session, it cannot DESTROY one by regenerating
    // over it.
    const src = readFileSync(join(process.cwd(), "app/api/generate-deep-questions/route.ts"), "utf8")
    expect(src).toMatch(/if\s*\(observed\s*&&\s*observed\.questions\s*!=\s*null\)/)
    expect(src).toContain("cannot be replaced safely")
  })
})

/* ══ Bank version + fingerprint ════════════════════════════════════════════ */

describe("the bank is versioned and fingerprinted", () => {
  it("v1 is registered and is the current bank", () => {
    expect(CURRENT_CONSULTATION_BANK).toBe(CONSULTATION_BANK_V1)
    expect(resolveConsultationBank(CONSULTATION_BANK_V1)).toBe(CONSULTATION_QUESTION_BANK)
    expect(isKnownBankVersion(CONSULTATION_BANK_V1)).toBe(true)
  })

  it("the registry holds one bank, not a copy of it", () => {
    expect(Object.keys(CONSULTATION_BANKS)).toEqual([CONSULTATION_BANK_V1])
    expect(CONSULTATION_BANKS[CONSULTATION_BANK_V1]).toBe(CONSULTATION_QUESTION_BANK)
  })

  it("an unknown version resolves to null rather than falling back", () => {
    for (const v of ["consultation-v2", "v1", "", null, undefined, 1]) {
      expect(resolveConsultationBank(v), String(v)).toBeNull()
    }
  })

  it("the fingerprint is stable and order-independent", () => {
    const a = fingerprintBank(CONSULTATION_QUESTION_BANK)
    const b = fingerprintBank([...CONSULTATION_QUESTION_BANK].reverse())
    expect(a).toBe(b)
    expect(a).toBe(fingerprintFor(CONSULTATION_BANK_V1))
    expect(a).toMatch(/^[0-9a-f]{32}$/)
  })

  it("changing customer wording moves it", () => {
    const edited = CONSULTATION_QUESTION_BANK.map((q) =>
      q.id === Q1 ? { ...q, text: `${q.text} (reworded)` } : q,
    )
    expect(fingerprintBank(edited)).not.toBe(fingerprintBank(CONSULTATION_QUESTION_BANK))
  })

  it("changing an option value, label or exclusivity moves it", () => {
    const base = fingerprintBank(CONSULTATION_QUESTION_BANK)
    const mutate = (fn: (q: ConsultationQuestion) => ConsultationQuestion) =>
      fingerprintBank(CONSULTATION_QUESTION_BANK.map((q) => (q.id === CONSTRAINTS ? fn(q) : q)))

    expect(
      mutate((q) => ({ ...q, options: q.options!.map((o, i) => (i === 0 ? { ...o, value: "x" } : o)) })),
    ).not.toBe(base)
    expect(
      mutate((q) => ({ ...q, options: q.options!.map((o, i) => (i === 0 ? { ...o, label: "X" } : o)) })),
    ).not.toBe(base)
    expect(
      mutate((q) => ({
        ...q,
        options: q.options!.map((o, i) => (i === 0 ? { ...o, exclusive: true } : o)),
      })),
    ).not.toBe(base)
  })

  it("changing an applicability rule moves it", () => {
    const edited = CONSULTATION_QUESTION_BANK.map((q) =>
      q.id === AVOIDANCES
        ? { ...q, applicableWhen: { ...q.applicableWhen!, values: ["allergy"] } }
        : q,
    )
    expect(fingerprintBank(edited)).not.toBe(fingerprintBank(CONSULTATION_QUESTION_BANK))
  })

  it("changing internal governance prose does NOT move it", () => {
    // Deliberate: `intent` and friends govern how a question was built, not
    // what the customer read or what their answer means. Folding them in would
    // invalidate every live session for a review note.
    const edited = CONSULTATION_QUESTION_BANK.map((q) =>
      q.id === Q1
        ? { ...q, intent: "rewritten", whyNeeded: "rewritten", reportTargets: ["foodTools" as const] }
        : q,
    )
    expect(fingerprintBank(edited)).toBe(fingerprintBank(CONSULTATION_QUESTION_BANK))
  })

  it("bankMatches requires both the version and the digest", () => {
    const fp = fingerprintFor(CONSULTATION_BANK_V1)!
    expect(bankMatches(CONSULTATION_BANK_V1, fp)).toBe(true)
    expect(bankMatches(CONSULTATION_BANK_V1, "0".repeat(32))).toBe(false)
    expect(bankMatches("consultation-v2", fp)).toBe(false)
    expect(bankMatches(CONSULTATION_BANK_V1, "")).toBe(false)
  })
})

/* ══ Envelope parsing ══════════════════════════════════════════════════════ */

describe("the deterministic snapshot parser is strict and non-coercive", () => {
  it("round-trips a well-formed snapshot", () => {
    const s = snapshot()
    expect(readDeterministicConsultationSnapshot(s)).toEqual(s)
    expect(snapshotIsResolvable(s)).toBe(true)
  })

  it.each([
    ["wrong kind", { kind: "something-else" }],
    ["wrong schema version", { schemaVersion: 2 }],
    ["missing bank version", { bankVersion: "" }],
    ["missing fingerprint", { bankFingerprint: "" }],
    ["bad foundation", { foundation: "household" }],
    ["missing createdAt", { createdAt: "" }],
    ["unknown lens", { entitledLens: "not-a-lens" }],
  ])("refuses %s", (_label, override) => {
    expect(readDeterministicConsultationSnapshot({ ...snapshot(), ...override })).toBeNull()
  })

  it("refuses arrays, primitives and null", () => {
    for (const v of [[], [snapshot()], "x", 7, null, undefined, true]) {
      expect(readDeterministicConsultationSnapshot(v)).toBeNull()
    }
  })

  it("accepts a null lens as a real value, not as a coercion target", () => {
    const s = createDeterministicConsultationSnapshot({ foundation: "family", entitledLens: null })
    expect(readDeterministicConsultationSnapshot(s)?.entitledLens).toBeNull()
    const withLens = createDeterministicConsultationSnapshot({
      foundation: "you",
      entitledLens: "stability",
    })
    expect(readDeterministicConsultationSnapshot(withLens)?.entitledLens).toBe("stability")
  })

  it("a snapshot naming an unknown bank is well-formed but not resolvable", () => {
    const stale = { ...snapshot(), bankVersion: "consultation-v0" }
    expect(readDeterministicConsultationSnapshot(stale)).not.toBeNull()
    expect(snapshotIsResolvable(readDeterministicConsultationSnapshot(stale)!)).toBe(false)
  })

  it("a drifted fingerprint is not resolvable either", () => {
    const drifted = { ...snapshot(), bankFingerprint: "f".repeat(32) }
    expect(snapshotIsResolvable(readDeterministicConsultationSnapshot(drifted)!)).toBe(false)
  })
})

/* ══ §14 candidate sanitisation ════════════════════════════════════════════ */

describe("candidate answers are sanitised without being pruned by applicability", () => {
  it("drops unknown ids", () => {
    const out = sanitiseCandidateAnswers({ nope: "x", [Q1]: "bloating" }, CONSULTATION_BANK_V1)
    expect(out.answers).toEqual({ [Q1]: "bloating" })
    expect(out.droppedUnknownIds).toEqual(["nope"])
  })

  it("drops malformed values", () => {
    const out = sanitiseCandidateAnswers(
      { [Q1]: "not-an-option", [CONSTRAINTS]: "should-be-an-array" },
      CONSULTATION_BANK_V1,
    )
    expect(out.answers).toEqual({})
    expect([...out.droppedInvalidIds].sort()).toEqual([CONSTRAINTS, Q1].sort())
  })

  it("KEEPS a valid answer whose branch no longer applies", () => {
    // The Phase 3B rule, in storage: the customer really did answer it.
    const out = sanitiseCandidateAnswers(
      { [CONSTRAINTS]: ["budget"], [AVOIDANCES]: ["nuts"] },
      CONSULTATION_BANK_V1,
    )
    expect(out.answers[AVOIDANCES]).toEqual(["nuts"])
    expect(out.droppedInvalidIds).toEqual([])
  })

  it("returns nothing for an unknown bank", () => {
    expect(sanitiseCandidateAnswers({ [Q1]: "bloating" }, "consultation-v9").answers).toEqual({})
  })
})

/* ══ §25 initialisation safety ═════════════════════════════════════════════ */

describe("initialisation refuses everything it should", () => {
  const trusted = { foundation: "you" as const, entitledLens: null }

  it("null questions may be initialised", () => {
    const out = resolveDeterministicInit({ persistedQuestions: null, ...trusted })
    expect(out.status).toBe("initialise")
    if (out.status === "initialise") {
      expect(out.snapshot.foundation).toBe("you")
      expect(out.snapshot.bankVersion).toBe(CURRENT_CONSULTATION_BANK)
    }
  })

  it("the same snapshot is reused idempotently", () => {
    const existing = snapshot()
    const out = resolveDeterministicInit({ persistedQuestions: existing, ...trusted })
    expect(out.status).toBe("reuse")
    if (out.status === "reuse") expect(out.snapshot).toEqual(existing)
  })

  it("a legacy array is reported as legacy and never overwritten", () => {
    expect(resolveDeterministicInit({ persistedQuestions: legacyQuestions(), ...trusted })).toEqual({
      status: "legacy_session",
    })
  })

  it("a mismatched foundation is refused, not adopted", () => {
    const existing = createDeterministicConsultationSnapshot({
      foundation: "family",
      entitledLens: null,
    })
    expect(resolveDeterministicInit({ persistedQuestions: existing, ...trusted })).toEqual({
      status: "context_conflict",
      field: "foundation",
    })
  })

  it("a mismatched lens is refused, not adopted", () => {
    const existing = createDeterministicConsultationSnapshot({
      foundation: "you",
      entitledLens: "glucose",
    })
    expect(resolveDeterministicInit({ persistedQuestions: existing, ...trusted })).toEqual({
      status: "context_conflict",
      field: "entitledLens",
    })
  })

  it("an unknown bank version is refused", () => {
    const out = resolveDeterministicInit({
      persistedQuestions: { ...snapshot(), bankVersion: "consultation-v0" },
      ...trusted,
    })
    expect(out.status).toBe("bank_unavailable")
  })

  it("a drifted fingerprint is refused", () => {
    const out = resolveDeterministicInit({
      persistedQuestions: { ...snapshot(), bankFingerprint: "a".repeat(32) },
      ...trusted,
    })
    expect(out.status).toBe("bank_unavailable")
  })

  it("an uncharacterisable value is refused rather than replaced", () => {
    expect(resolveDeterministicInit({ persistedQuestions: { some: "object" }, ...trusted })).toEqual({
      status: "unreadable",
    })
  })
})

/* ══ §27 resume ════════════════════════════════════════════════════════════ */

describe("resume rebuilds from the bank, never from the stored row", () => {
  const resume = (answers: unknown, questions: unknown = snapshot()) =>
    resumeDeterministicSession({ persistedQuestions: questions, persistedAnswers: answers })

  it("reports a legacy session rather than trying to resume it", () => {
    expect(resume(legacyAnswers(), legacyQuestions()).status).toBe("legacy_session")
  })

  it("refuses a session whose bank is gone", () => {
    const out = resume(deterministicState(), { ...snapshot(), bankVersion: "consultation-v0" })
    expect(out.status).toBe("bank_unavailable")
  })

  it("sanitises candidates and names what it dropped", () => {
    const out = resume(
      deterministicState({
        candidateAnswers: { [Q1]: "bloating", nope: "x", [SUCCESS]: "   " },
      }),
    )
    expect(out.status).toBe("ok")
    if (out.status !== "ok") return
    expect(out.session.state.candidateAnswers[Q1]).toBe("bloating")
    expect(out.session.droppedUnknownIds).toEqual(["nope"])
  })

  it("keeps a stale candidate but excludes it from trusted answers", () => {
    const out = resume(
      deterministicState({
        candidateAnswers: { [CONSTRAINTS]: ["budget"], [AVOIDANCES]: ["nuts"] },
      }),
    )
    if (out.status !== "ok") throw new Error("expected ok")
    expect(out.session.state.candidateAnswers[AVOIDANCES]).toEqual(["nuts"])
    expect(out.session.applicableQuestionIds).not.toContain(AVOIDANCES)
    expect(out.session.trustedAnswers[AVOIDANCES]).toBeUndefined()
  })

  it("restores a cursor that still applies", () => {
    const out = resume(
      deterministicState({ candidateAnswers: { [Q1]: "bloating" }, currentQuestionId: CONSTRAINTS }),
    )
    if (out.status !== "ok") throw new Error("expected ok")
    expect(out.session.state.currentQuestionId).toBe(CONSTRAINTS)
    expect(out.session.cursorRepaired).toBe(false)
  })

  it("repairs a cursor that no longer applies", () => {
    // The customer was on the avoidance branch; the trigger is now budget-only.
    const out = resume(
      deterministicState({
        candidateAnswers: { [CONSTRAINTS]: ["budget"] },
        currentQuestionId: AVOIDANCES,
      }),
    )
    if (out.status !== "ok") throw new Error("expected ok")
    expect(out.session.cursorRepaired).toBe(true)
    expect(out.session.applicableQuestionIds).toContain(out.session.state.currentQuestionId!)
    expect(out.session.state.currentQuestionId).not.toBe(AVOIDANCES)
  })

  it("treats a stored valid answer as already touched", () => {
    const out = resume(deterministicState({ candidateAnswers: { [Q1]: "bloating" } }))
    if (out.status !== "ok") throw new Error("expected ok")
    expect(out.session.state.touchedQuestionIds).toContain(Q1)
  })

  it("keeps an optional skip distinct from prefer-not-to-say", () => {
    const skipped = resume(
      deterministicState({
        candidateAnswers: { [CONSTRAINTS]: ["allergy"] },
        skippedOptionalQuestionIds: [AVOIDANCES],
      }),
    )
    if (skipped.status !== "ok") throw new Error("expected ok")
    expect(skipped.session.state.skippedOptionalQuestionIds).toContain(AVOIDANCES)
    expect(skipped.session.state.candidateAnswers[AVOIDANCES]).toBeUndefined()

    const declined = resume(
      deterministicState({
        candidateAnswers: { [CONSTRAINTS]: ["allergy"], [AVOIDANCES]: ["prefer-not-to-say"] },
      }),
    )
    if (declined.status !== "ok") throw new Error("expected ok")
    expect(declined.session.state.skippedOptionalQuestionIds).not.toContain(AVOIDANCES)
    expect(declined.session.trustedAnswers[AVOIDANCES]).toEqual(["prefer-not-to-say"])
  })

  it("drops a skip recorded against a required question", () => {
    const out = resume(deterministicState({ skippedOptionalQuestionIds: [Q1] }))
    if (out.status !== "ok") throw new Error("expected ok")
    expect(findConsultationQuestion(Q1)!.required).toBe(true)
    expect(out.session.state.skippedOptionalQuestionIds).not.toContain(Q1)
  })

  it("returns no question list — the bank is authority", () => {
    const out = resume(deterministicState())
    if (out.status !== "ok") throw new Error("expected ok")
    expect(Object.keys(out.session)).not.toContain("questions")
    expect(out.session.applicableQuestionIds.every((id) => typeof id === "string")).toBe(true)
  })
})

/* ══ The routes ════════════════════════════════════════════════════════════ */

describe("the deterministic routes keep the authority boundary", () => {
  const PROGRESS = readFileSync(join(process.cwd(), "app/api/consultation/progress/route.ts"), "utf8")
  const SESSION = readFileSync(join(process.cwd(), "app/api/consultation/session/route.ts"), "utf8")

  it("derive foundation and lens from Stripe, never from the body", () => {
    for (const [name, src] of [["progress", PROGRESS], ["session", SESSION]] as const) {
      expect(src, name).toContain("isCheckoutSessionSettled")
      expect(src, name).toContain("resolvePaidReportSummary")
      expect(src, name).toContain("asFoundation(summary.foundationType)")
      expect(src, name).toContain("asAddonType(summary.selectedAddon)")
    }
  })

  it("the request body cannot carry identity fields at all", () => {
    // The schema is the boundary: if these are not accepted, they cannot be
    // trusted by accident later.
    for (const banned of ["foundation:", "entitledLens:", "bankVersion:", "bankFingerprint:", "tier:", "freeScores"]) {
      const schema = PROGRESS.slice(PROGRESS.indexOf("const bodySchema"), PROGRESS.indexOf("const SAVE_ATTEMPTS"))
      expect(schema, banned).not.toContain(banned)
    }
  })

  it("progress keeps the legacy persistence discipline", () => {
    expect(PROGRESS).toContain("nextUpdatedAt(row.updated_at)")
    expect(PROGRESS).toMatch(/q\.is\("updated_at", null\)/)
    expect(PROGRESS).toMatch(/q\.eq\("updated_at", row\.updated_at\)/)
    expect(PROGRESS).toContain("SAVE_ATTEMPTS")
    // Never claims a save the database did not confirm.
    expect(PROGRESS).toMatch(/if \(data && data\.length > 0\)[\s\S]{0,120}ok: true/)
  })

  it("progress refuses a legacy row rather than converting it", () => {
    expect(PROGRESS).toMatch(/Array\.isArray\(row\.questions\)[\s\S]{0,120}409/)
  })

  it("progress validates the question against the bank and applicability", () => {
    expect(PROGRESS).toContain("resolveConsultationBank(snapshot.bankVersion)")
    expect(PROGRESS).toContain("bank.find((q) => q.id === questionId)")
    expect(PROGRESS).toContain("applicableIds.has(questionId)")
    expect(PROGRESS).toContain("validateAnswer(question, body.value)")
  })

  it("neither route creates a row, generates questions, or submits", () => {
    for (const [name, src] of [["progress", PROGRESS], ["session", SESSION]] as const) {
      expect(src, name).not.toContain(".insert(")
      expect(src, name).not.toContain("upsert")
      expect(src, name).not.toContain("generate-deep-questions")
      expect(src, name).not.toContain("submit-deep-assessment")
      expect(src, name).not.toMatch(/anthropic|openai/i)
    }
  })

  it("the resume route returns no stored question list", () => {
    expect(SESSION).not.toMatch(/questions:\s*(row|data|stored)/)
    expect(SESSION).toContain("bankVersion: resumed.snapshot.bankVersion")
  })

  it("neither route can set a finalisation phase", () => {
    expect(PROGRESS).not.toContain('"ready-for-report"')
    expect(PROGRESS).not.toContain('phase: "review"')
  })
})

/* ══ Non-activation, still ═════════════════════════════════════════════════ */

describe("Phase 3C-A changes nothing a paying customer sees", () => {
  it("the deep-assessment page still routes paid traffic to the legacy client", () => {
    const src = readFileSync(join(process.cwd(), "app/assessment/deep/page.tsx"), "utf8")
    const realFlow = src.slice(src.indexOf("// ── Real flow "))
    expect(realFlow).toContain("<DeepAssessmentClient")
    expect(realFlow).not.toContain("Deterministic")
  })

  it("no page or component calls the deterministic routes", () => {
    const src = readFileSync(join(process.cwd(), "app/assessment/deep/page.tsx"), "utf8")
    expect(src).not.toContain("/api/consultation/")
    const client = readFileSync(
      join(process.cwd(), "components/assessment/consultation/deterministic-consultation-client.tsx"),
      "utf8",
    )
    expect(client).not.toContain("/api/consultation/")
    expect(client).not.toMatch(/\bfetch\(/)
  })

  it("nothing in the deterministic stack imports the legacy question schema", () => {
    for (const f of [
      "lib/consultation/bank-registry.ts",
      "lib/consultation/session-envelope.ts",
      "lib/consultation/session-init.ts",
    ]) {
      const src = readFileSync(join(process.cwd(), f), "utf8")
      expect(src, f).not.toContain("lib/deep-assessment")
      expect(src, f).not.toContain("DeepQuestion")
    }
  })
})

/* ══ Empty vs unreadable — the fail-closed correction ══════════════════════ */

describe("only an ABSENT answers column means 'nothing stored yet'", () => {
  /**
   * The defect this replaced: both callers did
   * `readDeterministicConsultationState(row.answers) ?? EMPTY_DETERMINISTIC_STATE`,
   * so a PRESENT but unreadable value — a legacy flat answer map, a truncated
   * write, anything — was indistinguishable from a session that had stored
   * nothing. The progress route would then have written over it.
   *
   * `?? EMPTY` is an easy pattern to reintroduce, which is why the call sites
   * are asserted directly rather than only the behaviour.
   */

  it("A. answers = null reads as empty", () => {
    const slot = readDeterministicStateSlot(null)
    expect(slot.status).toBe("empty")
    if (slot.status === "empty") expect(slot.state.candidateAnswers).toEqual({})
  })

  it("B. answers = undefined reads as empty", () => {
    const slot = readDeterministicStateSlot(undefined)
    expect(slot.status).toBe("empty")
    if (slot.status === "empty") expect(slot.state).toEqual(EMPTY_DETERMINISTIC_STATE)
  })

  it("a null answers column still resumes into a working session", () => {
    const out = resumeDeterministicSession({
      persistedQuestions: snapshot(),
      persistedAnswers: null,
    })
    expect(out.status).toBe("ok")
    if (out.status !== "ok") return
    expect(out.session.state.candidateAnswers).toEqual({})
    expect(out.session.applicableQuestionIds.length).toBeGreaterThan(0)
  })

  it("C. a legacy flat answer map is unreadable, and resume REFUSES", () => {
    expect(readDeterministicStateSlot(legacyAnswers()).status).toBe("unreadable")
    expect(
      resumeDeterministicSession({
        persistedQuestions: snapshot(),
        persistedAnswers: legacyAnswers(),
      }),
    ).toEqual({ status: "state_unreadable" })
  })

  it("D. the progress route refuses that same row before any write", () => {
    const src = readFileSync(join(process.cwd(), "app/api/consultation/progress/route.ts"), "utf8")
    // The check exists, refuses, and — the part that matters — sits before the
    // update, so a refusal returns without touching the row.
    expect(src).toContain("readDeterministicStateSlot(row.answers)")
    expect(src).toMatch(/slot\.status === "unreadable"[\s\S]{0,120}refuse\(409/)
    expect(src.indexOf("readDeterministicStateSlot")).toBeLessThan(src.indexOf(".update("))
  })

  it("neither call site may collapse a refusal into an empty state", () => {
    for (const f of ["app/api/consultation/progress/route.ts", "lib/consultation/session-init.ts"]) {
      const src = readFileSync(join(process.cwd(), f), "utf8")
      expect(src, `${f} fails open`).not.toContain("?? EMPTY_DETERMINISTIC_STATE")
      expect(src, `${f} should use the three-state read`).toContain("readDeterministicStateSlot")
    }
  })

  it.each([
    ["wrong kind", { kind: "something-else" }],
    ["wrong schema version", { schemaVersion: 2 }],
    ["candidateAnswers is an array", { candidateAnswers: [] }],
    ["candidateAnswers is a string", { candidateAnswers: "x" }],
    ["touchedQuestionIds is a string", { touchedQuestionIds: "qid" }],
    ["touchedQuestionIds holds a non-string", { touchedQuestionIds: ["a", 7] }],
    ["skippedOptionalQuestionIds is an object", { skippedOptionalQuestionIds: {} }],
    ["currentQuestionId is a number", { currentQuestionId: 123 }],
    ["phase is not a declared phase", { phase: "complete" }],
  ])("E. refuses a malformed envelope rather than emptying it: %s", (_label, override) => {
    const malformed = { ...deterministicState(), ...override }
    expect(readDeterministicConsultationState(malformed)).toBeNull()
    expect(readDeterministicStateSlot(malformed).status).toBe("unreadable")
    expect(
      resumeDeterministicSession({ persistedQuestions: snapshot(), persistedAnswers: malformed }).status,
    ).toBe("state_unreadable")
  })

  it("F. a valid state still round-trips unchanged", () => {
    const valid = deterministicState({
      candidateAnswers: { [Q1]: "bloating" },
      touchedQuestionIds: [Q1],
      skippedOptionalQuestionIds: [AVOIDANCES],
      currentQuestionId: CONSTRAINTS,
      phase: "questions",
    })
    const slot = readDeterministicStateSlot(valid)
    expect(slot.status).toBe("ok")
    if (slot.status !== "ok") return
    expect(slot.state.candidateAnswers).toEqual({ [Q1]: "bloating" })
    expect(slot.state.touchedQuestionIds).toEqual([Q1])
    expect(slot.state.skippedOptionalQuestionIds).toEqual([AVOIDANCES])
    expect(slot.state.currentQuestionId).toBe(CONSTRAINTS)
    expect(slot.state.phase).toBe("questions")
    // Duplicates in a set-shaped field are normalised, not treated as malformed.
    const deduped = readDeterministicStateSlot(
      deterministicState({ touchedQuestionIds: [Q1, Q1] }),
    )
    expect(deduped.status).toBe("ok")
    if (deduped.status === "ok") expect(deduped.state.touchedQuestionIds).toEqual([Q1])
  })

  it("G. a bad answer VALUE inside a good envelope is still only sanitised", () => {
    // The distinction the strictness must not swallow: a malformed envelope is
    // unreadable, but an invalid answer inside a well-formed one is dropped —
    // and a valid-but-inapplicable one is still kept.
    const state = deterministicState({
      candidateAnswers: {
        [Q1]: "not-an-option",
        nope: "x",
        [CONSTRAINTS]: ["budget"],
        [AVOIDANCES]: ["nuts"],
      },
    })
    expect(readDeterministicStateSlot(state).status).toBe("ok")

    const out = resumeDeterministicSession({ persistedQuestions: snapshot(), persistedAnswers: state })
    if (out.status !== "ok") throw new Error("expected ok")
    expect(out.session.droppedInvalidIds).toContain(Q1)
    expect(out.session.droppedUnknownIds).toContain("nope")
    // Stale but valid: retained as a candidate, excluded from trusted.
    expect(out.session.state.candidateAnswers[AVOIDANCES]).toEqual(["nuts"])
    expect(out.session.trustedAnswers[AVOIDANCES]).toBeUndefined()
  })

  it("H. deterministic code leaves a legacy answer map byte-untouched", () => {
    const legacy = legacyAnswers()
    const before = JSON.stringify(legacy)
    readDeterministicStateSlot(legacy)
    readDeterministicConsultationState(legacy)
    sanitiseCandidateAnswers(legacy, CONSULTATION_BANK_V1)
    resumeDeterministicSession({ persistedQuestions: snapshot(), persistedAnswers: legacy })
    expect(JSON.stringify(legacy)).toBe(before)
  })

  it("the resume route maps every non-ok outcome to one generic 409", () => {
    // `state_unreadable` needs no new branch there, and must not get one that
    // tells a customer what shape their stored data is in.
    const src = readFileSync(join(process.cwd(), "app/api/consultation/session/route.ts"), "utf8")
    expect(src).toMatch(/outcome\.status !== "ok"[\s\S]{0,160}status: 409/)
    expect(src).not.toContain("state_unreadable")
  })
})
