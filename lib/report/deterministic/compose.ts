import { findConsultationQuestion } from "@/lib/consultation/question-bank"
import type { ConsultationFinalisation } from "@/lib/consultation/finalisation"
import { SCIENCE_CONTRACT_VERSION } from "@/lib/consultation/science-contract"
import type { ConsultationAnswers } from "@/lib/consultation/types"

import { reportCapabilities, reportCapabilityEnabled } from "./capabilities"
import { CONTENT_PACK_VERSION, STRUCTURAL_COPY, templateFor } from "./content-pack"
import { REPORT_USE_RECORD_VERSION, permissionFor } from "./permissions"
import { choosePriority } from "./priority"
import { buildProposition, type ReportProposition } from "./proposition"
import { resolveReportSafety } from "./report-safety"
import {
  COMPOSER_VERSION,
  REPORT_SCHEMA_VERSION,
  type LoopStep,
  type PersonalFoodSystemReportV1,
  type ReportResult,
  type ReportSection,
} from "./report-types"

/**
 * The canonical composer — Phase 4A-S2.
 *
 * ══ PURE, AND WHAT THAT COSTS ══════════════════════════════════════════════
 *
 * No database client, no Supabase import, no HTTP, no model, no clock, no
 * randomness. The only input is a trusted, already-parsed
 * `ConsultationFinalisation` and its handoff id. Where a time is legitimately
 * needed it is `finalisation.finalisedAt` — the sealed one — because a Report
 * that stamped itself with `new Date()` would differ from its own reprint.
 *
 * The cost is that this module cannot look anything up. Everything it needs
 * must already be in the seal, which is the property that makes the Report
 * reproducible and the reason the seal was designed the way it was.
 *
 * ══ ORDERING ═══════════════════════════════════════════════════════════════
 *
 * Every list is built in BANK ORDER, taken from `applicableQuestionIds` — the
 * finalisation's own record of what was live, in bank order. Object key
 * insertion order is never relied on, and `Object.entries` over
 * `trustedAnswers` is never used to drive output.
 */

/** Bank order for the questions this Consultation actually asked. */
function orderedQuestionIds(finalisation: ConsultationFinalisation): readonly string[] {
  return finalisation.applicableQuestionIds
}

/** The answer values for a question, as an array whatever its type. */
function valuesOf(answers: ConsultationAnswers, questionId: string): readonly string[] {
  const raw = answers[questionId]
  if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === "string")
  if (typeof raw === "string") return [raw]
  return []
}

/**
 * Recap propositions for one question, in bank option order.
 *
 * Returns `[]` where the pack is deliberately silent. A missing pack entry is
 * a different thing — a coverage failure — and is surfaced as a refusal rather
 * than skipped, because silently dropping an answer is how a Report quietly
 * stops describing what somebody said.
 */
function recapFor(
  finalisation: ConsultationFinalisation,
  questionId: string,
  target: "systemSnapshot" | "familyContext",
): { propositions: ReportProposition[]; error?: string } {
  const record = permissionFor(questionId)
  if (!record) return { propositions: [] }
  if (!record.allowedUses.includes("descriptive-recap")) return { propositions: [] }
  if (!record.allowedTargets.includes(target)) return { propositions: [] }

  const question = findConsultationQuestion(questionId)
  /*
   * Enumerated questions only.
   *
   * A textarea's answer is the customer's own prose, not an option value, so
   * looking it up in the content pack is a category error — it would report
   * "no disposition" for a sentence no pack could ever hold. The free-text
   * answer is handled once, as a quotation, by the composer.
   */
  if (!question?.options || question.options.length === 0) return { propositions: [] }

  const chosen = valuesOf(finalisation.trustedAnswers, questionId)
  if (chosen.length === 0) return { propositions: [] }

  // Bank option order, not answer order: two customers who selected the same
  // things in a different sequence must get the same Report.
  const ordered = question.options.map((o) => o.value).filter((v) => chosen.includes(v))

  const propositions: ReportProposition[] = []
  for (const value of ordered) {
    const disposition = templateFor(questionId, value)
    if (disposition === undefined) {
      return { propositions: [], error: `${questionId}="${value}" has no content-pack disposition` }
    }
    // `null` is reviewed silence. Distinct from undefined above.
    if (disposition === null) continue

    const built = buildProposition({
      id: `${record.answerField}.${value}`,
      kind: "recap",
      sourceQuestionIds: [questionId],
      sourceValues: { [questionId]: [value] },
      allowedUse: "descriptive-recap",
      target,
      templateId: disposition.templateId,
      text: disposition.text,
    })
    if (!built.ok) {
      // A value-level silence reaches here as a refusal; that is expected and
      // is a skip. Anything else is a real composition fault.
      if (built.reason === "value-silenced") continue
      return { propositions: [], error: built.detail }
    }
    propositions.push(built.proposition)
  }
  return { propositions }
}

/** Questions a Family Report may recap. `you`-only questions can never leak. */
function questionsForFoundation(
  finalisation: ConsultationFinalisation,
  foundation: "you" | "family",
): readonly string[] {
  return orderedQuestionIds(finalisation).filter((id) => {
    const q = findConsultationQuestion(id)
    // Unknown to this build: excluded. The seal records what was asked, but a
    // question this build cannot describe is one it must not paraphrase.
    if (!q) return false
    return q.foundations.includes(foundation)
  })
}

/**
 * Build the Report, or refuse.
 *
 * @param finalisation a TRUSTED, already-parsed finalisation. This function
 *   does not parse, fetch or validate provenance — that is the caller's job,
 *   and doing it here would mean the composer had opinions about storage.
 */
export function composePersonalFoodSystemReport(input: {
  finalisation: ConsultationFinalisation
  handoffId: string
}): ReportResult {
  const { finalisation, handoffId } = input

  /* ══ Lens: refuse before composing anything ═════════════════════════════ */
  if (finalisation.entitledLens !== null) {
    /*
     * The deterministic bank contains no lens questions — its validator
     * forbids lens-shaped ids outright, and `resolveApplicableQuestions` never
     * reads the lens. A core-only Report carrying a Stability, Glucose, Mind
     * or Performance entitlement would therefore attest a purchase it asked
     * nothing about. Refuse rather than label.
     */
    return {
      ok: false,
      reason: "lens-unsupported",
      detail: `entitledLens="${finalisation.entitledLens}" but the deterministic bank holds no lens questions`,
    }
  }

  const foundation = finalisation.foundation
  const answers = finalisation.trustedAnswers
  const questionIds = questionsForFoundation(finalisation, foundation)

  /* ══ Safety, before any content ═════════════════════════════════════════ */
  const safety = resolveReportSafety(answers, finalisation.foodGuidance)

  /* ══ What you told us ═══════════════════════════════════════════════════ */
  const snapshot: ReportProposition[] = []
  for (const questionId of questionIds) {
    const { propositions, error } = recapFor(finalisation, questionId, "systemSnapshot")
    if (error) return { ok: false, reason: "proposition-refused", detail: error }
    snapshot.push(...propositions)
  }

  /* ══ The customer's own words ═══════════════════════════════════════════ */
  let quotation: ReportProposition | undefined
  const successRaw = answers["core_intentions_success_v1"]
  if (typeof successRaw === "string" && successRaw.trim().length > 0) {
    /*
     * Quoted, never read. The text is the customer's, reproduced inside
     * quotation marks after a lead-in that attributes it to them — no
     * summary, no paraphrase, and it selects no other content anywhere in
     * this composer.
     */
    const built = buildProposition({
      id: "intentions.success.quotation",
      kind: "quotation",
      sourceQuestionIds: ["core_intentions_success_v1"],
      allowedUse: "descriptive-recap",
      target: "systemSnapshot",
      templateId: "intentions.success.quotation",
      text: `${STRUCTURAL_COPY.quotationLeadIn} “${successRaw.trim()}”`,
    })
    if (!built.ok) return { ok: false, reason: "proposition-refused", detail: built.detail }
    quotation = built.proposition
  }

  /* ══ Where to start ═════════════════════════════════════════════════════ */
  const choice = choosePriority(answers, questionIds)
  const priorityPropositions: ReportProposition[] = []
  if (choice) {
    const disposition = templateFor(choice.questionId, choice.value)
    if (disposition === undefined) {
      return {
        ok: false,
        reason: "proposition-refused",
        detail: `${choice.questionId}="${choice.value}" has no content-pack disposition`,
      }
    }
    if (disposition !== null) {
      const built = buildProposition({
        id: `priority.${choice.questionId}.${choice.value}`,
        kind: "lever",
        sourceQuestionIds: [choice.questionId],
        sourceValues: { [choice.questionId]: [choice.value] },
        // Every question in the precedence list permits exactly one of these
        // for priorityLever; the record decides which, not this function.
        allowedUse: permissionFor(choice.questionId)?.allowedUses.includes("practical-timing")
          ? "practical-timing"
          : "practical-fit",
        target: "priorityLever",
        templateId: disposition.templateId,
        text: disposition.text,
      })
      if (!built.ok) return { ok: false, reason: "proposition-refused", detail: built.detail }
      priorityPropositions.push(built.proposition)
    }
  }

  /* ══ The 30-day loop ════════════════════════════════════════════════════ */
  /*
   * Four beats over the same starting point — Try, Notice, Adjust, Repeat.
   * Not four different instructions: the AI and Product Constitutions both
   * say the loop resolves to ONE action, and four actions is a list of tips.
   *
   * The loop carries no treatment language, no physiological claim, and while
   * `specificFoods` is disabled it names no food. Its content is the priority
   * proposition, re-framed by beat — so a loop step can never say more than
   * the proposition it rests on.
   */
  const loop: LoopStep[] = []
  const leverForLoop = priorityPropositions[0]
  if (leverForLoop) {
    const beats = STRUCTURAL_COPY.loopBeats
    for (let i = 0; i < beats.length; i++) {
      const week = (i + 1) as 1 | 2 | 3 | 4
      const built = buildProposition({
        id: `loop.week${week}`,
        kind: "loop-step",
        sourceQuestionIds: leverForLoop.sourceQuestionIds,
        allowedUse: leverForLoop.allowedUse,
        target: "thirtyDayLoop",
        templateId: `${leverForLoop.templateId}.loop.${beats[i].toLowerCase()}`,
        text: leverForLoop.text,
      })
      if (!built.ok) {
        // A source that permits priorityLever need not permit thirtyDayLoop.
        // That is a legitimate outcome, not a fault: the loop is simply absent.
        break
      }
      loop.push({ week, beat: beats[i], proposition: built.proposition })
    }
  }

  /* ══ What this works around ═════════════════════════════════════════════ */
  const constraintPropositions: ReportProposition[] = []
  for (const questionId of ["core_environment_constraints_v1", "core_environment_food_avoidances_v1"]) {
    if (!questionIds.includes(questionId)) continue
    const record = permissionFor(questionId)
    if (!record) continue
    const question = findConsultationQuestion(questionId)
    const chosen = valuesOf(answers, questionId)
    const ordered = question?.options
      ? question.options.map((o) => o.value).filter((v) => chosen.includes(v))
      : [...chosen].sort()

    for (const value of ordered) {
      const disposition = templateFor(questionId, value)
      if (disposition === undefined) {
        return {
          ok: false,
          reason: "proposition-refused",
          detail: `${questionId}="${value}" has no content-pack disposition`,
        }
      }
      if (disposition === null) continue
      const built = buildProposition({
        id: `${record.answerField}.${value}`,
        kind: "constraint",
        sourceQuestionIds: [questionId],
        sourceValues: { [questionId]: [value] },
        allowedUse: "operational-filtering",
        target: "foodTools",
        templateId: disposition.templateId,
        text: disposition.text,
        capability: "specificFoods",
      })
      if (!built.ok) {
        if (built.reason === "value-silenced") continue
        return { ok: false, reason: "proposition-refused", detail: built.detail }
      }
      /*
       * These carry `capability: "specificFoods"`. While the dietetic gate is
       * OPEN they are DROPPED, not rendered — the customer is told the Report
       * keeps to general guidance via `safety.note`, which is structural copy
       * rather than a food statement.
       */
      if (built.proposition.capability && !reportCapabilityEnabled(built.proposition.capability)) {
        continue
      }
      constraintPropositions.push(built.proposition)
    }
  }

  /* ══ Household ══════════════════════════════════════════════════════════ */
  let familyContext: ReportSection | undefined
  if (foundation === "family") {
    const householdPropositions: ReportProposition[] = []
    for (const questionId of questionIds) {
      const { propositions, error } = recapFor(finalisation, questionId, "familyContext")
      if (error) return { ok: false, reason: "proposition-refused", detail: error }
      householdPropositions.push(...propositions)
    }
    // Absent rather than empty: a titled section with nothing in it is a
    // promise the Report did not keep.
    if (householdPropositions.length > 0) {
      familyContext = { title: STRUCTURAL_COPY.familyTitle, propositions: householdPropositions }
    }
  }

  /* ══ Assemble ═══════════════════════════════════════════════════════════ */
  if (snapshot.length === 0 && priorityPropositions.length === 0) {
    return {
      ok: false,
      reason: "no-authorised-content",
      detail: "no authorised proposition could be composed from this finalisation",
    }
  }

  const report: PersonalFoodSystemReportV1 = {
    kind: REPORT_SCHEMA_VERSION,
    foundation,
    systemSnapshot: { title: STRUCTURAL_COPY.systemSnapshotTitle, propositions: snapshot },
    priorityLever: { title: STRUCTURAL_COPY.priorityLeverTitle, propositions: priorityPropositions },
    thirtyDayLoop: loop,
    constraints: { title: STRUCTURAL_COPY.constraintsTitle, propositions: constraintPropositions },
    safety,
    ...(familyContext ? { familyContext } : {}),
    ...(quotation ? { quotation } : {}),
    provenance: {
      reportSchemaVersion: REPORT_SCHEMA_VERSION,
      handoffId,
      bankVersion: finalisation.bankVersion,
      bankFingerprint: finalisation.bankFingerprint,
      scienceContractVersion: SCIENCE_CONTRACT_VERSION,
      finalisationVersion: finalisation.finalisationVersion,
      reportUseRecordVersion: REPORT_USE_RECORD_VERSION,
      composerVersion: COMPOSER_VERSION,
      contentPackVersion: CONTENT_PACK_VERSION,
      capabilitiesAtCompose: reportCapabilities(),
      // The SEALED time. Never `new Date()` — see the determinism rules.
      finalisedAt: finalisation.finalisedAt,
    },
  }

  return { ok: true, report }
}
