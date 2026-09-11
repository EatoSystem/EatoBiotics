import { findConsultationQuestion } from "@/lib/consultation/question-bank"
import type { ConsultationFinalisation } from "@/lib/consultation/finalisation"
import { SCIENCE_CONTRACT_VERSION } from "@/lib/consultation/science-contract"

import { reportCapabilities, reportCapabilityEnabled, type ReportCapability } from "./capabilities"
import { canonicalValues } from "./canonical-order"
import { CONTENT_PACK_VERSION, STRUCTURAL_COPY, templateFor } from "./content-pack"
import { REPORT_USE_RECORD_VERSION, permissionFor } from "./permissions"
import { choosePriority } from "./priority"
import { buildProposition, type ReportProposition } from "./proposition"
import { mayNameSpecificFoods, resolveReportSafety } from "./report-safety"
import {
  COMPOSER_VERSION,
  REPORT_SCHEMA_VERSION,
  type LoopStep,
  type PersonalFoodSystemReportV1,
  type ReportResult,
  type ReportSafety,
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

/**
 * The ONE capability boundary — Phase 4A-S2 review fix.
 *
 * ══ WHY A SINGLE FUNCTION, APPLIED TO EVERY SECTION ═════════════════════════
 *
 * The first implementation checked capabilities in the constraints path and
 * nowhere else, so a proposition carrying a disabled requirement could enter
 * any other section untouched. Per-section checks are a list of places to
 * remember; the place that forgot would be the hole.
 *
 * So nothing reaches the document except through here, and the assembled
 * document is re-checked afterwards (`unsatisfiedIn`) — a belt that does not
 * depend on every caller having worn the braces.
 *
 * ══ TWO AXES, BOTH FAIL-CLOSED ═════════════════════════════════════════════
 *
 * A capability is usable only when the specialist gate is closed AND this
 * customer's own safety state permits it. Q17 suppresses specific foods even
 * if the dietetic gate were closed tomorrow, because an unrepresented
 * household allergy is about this Consultation, not about the taxonomy.
 */
function capabilityUsable(capability: ReportCapability, safety: ReportSafety): boolean {
  if (!reportCapabilityEnabled(capability)) return false
  if (capability === "specificFoods" && !mayNameSpecificFoods(safety)) return false
  return true
}

/** Only propositions whose every requirement is usable. */
function admit(
  propositions: readonly ReportProposition[],
  safety: ReportSafety,
): ReportProposition[] {
  return propositions.filter((p) => p.requiredCapabilities.every((c) => capabilityUsable(c, safety)))
}

/**
 * A section, kept only if something survives admission.
 *
 * An empty titled section is a promise the Report did not keep, so a household
 * section whose every sentence was suppressed is absent rather than blank.
 */
function admitSection(
  section: ReportSection | undefined,
  safety: ReportSafety,
): ReportSection | undefined {
  if (!section) return undefined
  const propositions = admit(section.propositions, safety)
  return propositions.length > 0 ? { ...section, propositions } : undefined
}

/**
 * Anything that slipped past `admit`, found by inspecting the finished document.
 *
 * The universal enforcement the review asked for: it does not trust the
 * sections to have filtered themselves, it reads what they produced.
 */
function unsatisfiedIn(
  report: PersonalFoodSystemReportV1,
  safety: ReportSafety,
): readonly string[] {
  const every: ReportProposition[] = [
    ...report.systemSnapshot.propositions,
    ...report.priorityLever.propositions,
    ...report.thirtyDayLoop.map((s) => s.proposition),
    ...report.constraints.propositions,
    ...(report.familyContext?.propositions ?? []),
    ...(report.quotation ? [report.quotation] : []),
  ]
  return every
    .filter((p) => !p.requiredCapabilities.every((c) => capabilityUsable(c, safety)))
    .map((p) => `${p.id} requires ${p.requiredCapabilities.join("+")}`)
}

/** Bank order for the questions this Consultation actually asked. */
function orderedQuestionIds(finalisation: ConsultationFinalisation): readonly string[] {
  return finalisation.applicableQuestionIds
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

  /*
   * Enumerated questions only, in the bank's own option order.
   *
   * `null` is a textarea or a question unknown to this build: its answer is
   * the customer's prose, not an option value, so looking it up in the content
   * pack is a category error — it would report "no disposition" for a sentence
   * no pack could ever hold. The free-text answer is handled once, as a
   * quotation, by the composer.
   */
  const ordered = canonicalValues(finalisation.trustedAnswers, questionId)
  if (ordered === null || ordered.length === 0) return { propositions: [] }

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
      templateCapabilities: disposition.requiresCapabilities,
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
  /*
   * Admitted FIRST, so the loop can only ever rest on a lever the document
   * will actually contain. Re-framing a suppressed sentence four times would
   * reintroduce it four times.
   */
  const admittedPriority = admit(priorityPropositions, safety)

  const loop: LoopStep[] = []
  const leverForLoop = admittedPriority[0]
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
    // The same canonical order as every other section, from the same helper —
    // and the same refusal to read a non-enumerated question as option values.
    const ordered = canonicalValues(answers, questionId) ?? []

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
        templateCapabilities: disposition.requiresCapabilities,
      })
      if (!built.ok) {
        if (built.reason === "value-silenced") continue
        return { ok: false, reason: "proposition-refused", detail: built.detail }
      }
      /*
       * NOT filtered here. Every proposition in this composer goes through the
       * one admission boundary below — a section that did its own capability
       * check would be a second answer, and the section that forgot to do one
       * would be the hole.
       */
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

  /* ══ THE ADMISSION BOUNDARY ═════════════════════════════════════════════ */
  /*
   * Every section's propositions pass through `admit` here, in one place, and
   * the finished document is re-read by `unsatisfiedIn` below. A section that
   * checked itself would be a second answer to the same question, and the
   * section that forgot to would be the hole.
   */
  const admittedSnapshot = admit(snapshot, safety)
  const admittedConstraints = admit(constraintPropositions, safety)
  const admittedQuotation = quotation && admit([quotation], safety).length === 1 ? quotation : undefined
  // All four beats or none: three quarters of a loop is a broken instruction,
  // not a shorter one.
  const admittedLoop = loop.every((s) => admit([s.proposition], safety).length === 1) ? loop : []
  const admittedFamily = admitSection(familyContext, safety)

  /* ══ Assemble ═══════════════════════════════════════════════════════════ */
  if (admittedSnapshot.length === 0 && admittedPriority.length === 0) {
    return {
      ok: false,
      reason: "no-authorised-content",
      detail: "no authorised proposition could be composed from this finalisation",
    }
  }

  const report: PersonalFoodSystemReportV1 = {
    kind: REPORT_SCHEMA_VERSION,
    foundation,
    systemSnapshot: { title: STRUCTURAL_COPY.systemSnapshotTitle, propositions: admittedSnapshot },
    priorityLever: { title: STRUCTURAL_COPY.priorityLeverTitle, propositions: admittedPriority },
    thirtyDayLoop: admittedLoop,
    constraints: { title: STRUCTURAL_COPY.constraintsTitle, propositions: admittedConstraints },
    safety,
    ...(admittedFamily ? { familyContext: admittedFamily } : {}),
    ...(admittedQuotation ? { quotation: admittedQuotation } : {}),
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

  /*
   * The belt. `admit` is the braces, and this does not trust them: it reads
   * what the sections actually produced. If a future section is added and its
   * author forgets the boundary, the Report refuses rather than ships.
   */
  const slipped = unsatisfiedIn(report, safety)
  if (slipped.length > 0) {
    return {
      ok: false,
      reason: "proposition-refused",
      detail: `capability requirement unmet after assembly: ${slipped.join("; ")}`,
    }
  }

  return { ok: true, report }
}
