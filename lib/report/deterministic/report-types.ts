import type { ConsultationFoundation } from "@/lib/consultation/types"

import type { ReportCapability } from "./capabilities"
import type { ReportProposition } from "./proposition"

/**
 * The canonical deterministic Report — Phase 4A-S2.
 *
 * ══ WHY A NEW SCHEMA, NOT AN EXTENSION OF FoodSystemReport ══════════════════
 *
 * `FoodSystemReport` REQUIRES `overallScore` and `bioticScores`. Those come
 * from the free assessment, and the sealed finalisation — the only input here
 * — contains no scores at all. Extending that type would mean populating two
 * required fields with values nothing authorises, which is the precise failure
 * the seal exists to prevent. A type whose required fields cannot be honestly
 * filled is an invitation to invent them.
 *
 * So this is its own contract, and it has no score of any kind: no overall, no
 * pathway, no band, no traffic light, no hidden ranking metric.
 *
 * ══ NO EMPTY SECTIONS ═══════════════════════════════════════════════════════
 *
 * Sections are optional and simply absent when nothing authorises them. There
 * is no `foods: []` waiting to be filled, no `bioticsAnalysis: null` — a
 * placeholder for a suppressed capability advertises a section the customer
 * has not been sold and invites somebody to populate it.
 */

export const REPORT_SCHEMA_VERSION = "personal-food-system-report-v1" as const

/**
 * Bumped when the COMPOSER's behaviour changes, independently of wording.
 *
 * v2 — Phase 4A-S2 third review repair. Each proposition now records the
 * exact `{questionId, value}` sources its words were resolved from, derived
 * rather than supplied, so a document's provenance cannot describe a
 * different answer from the one that produced the sentence. No customer-facing
 * text changed; the artifact's bytes did, which is what this version is for.
 */
export const COMPOSER_VERSION = "composer-v2" as const

/**
 * What a section is: a title plus the propositions that earned their place.
 * Propositions are carried whole, so every rendered sentence keeps its
 * provenance all the way to the page.
 */
export interface ReportSection {
  readonly title: string
  readonly propositions: readonly ReportProposition[]
}

/** One beat of the 30-day loop. */
export interface LoopStep {
  readonly week: 1 | 2 | 3 | 4
  /** Try · Notice · Adjust · Repeat. */
  readonly beat: string
  readonly proposition: ReportProposition
}

/**
 * The food-safety position, stated rather than implied.
 *
 * `state` is never absent: a Report that says nothing about constraints is a
 * Report a reader will assume has none.
 */
export type FoodSafetyState =
  /** The customer affirmatively said there is nothing to work around. */
  | "none-declared"
  /** Constraints exist and are known. */
  | "constraints-known"
  /** An avoidance exists and was not identified. General guidance only. */
  | "unresolved-avoidance"
  /** The customer declined to say. NEVER equivalent to none-declared. */
  | "undisclosed"
  /** Inputs contradict each other (see report-safety.ts). Fail closed. */
  | "contradictory"

export interface ReportSafety {
  readonly state: FoodSafetyState
  /** Reviewed copy for the state, when the state calls for a sentence. */
  readonly note?: string
  /**
   * True whenever no specific food may be named, for ANY reason — the gate
   * being open, an unresolved avoidance, or a contradiction. One field so no
   * renderer has to re-derive the conjunction.
   */
  readonly specificFoodsSuppressed: boolean
  /** Why, in machine-readable form, for tests and audit. */
  readonly suppressionReasons: readonly string[]
}

export interface ReportProvenance {
  readonly reportSchemaVersion: typeof REPORT_SCHEMA_VERSION
  readonly handoffId: string
  readonly bankVersion: string
  readonly bankFingerprint: string
  readonly scienceContractVersion: string
  readonly finalisationVersion: string
  readonly reportUseRecordVersion: string
  readonly composerVersion: typeof COMPOSER_VERSION
  readonly contentPackVersion: string
  readonly capabilitiesAtCompose: Readonly<Record<ReportCapability, boolean>>
  /** From the seal. Never `new Date()` — see the determinism rules. */
  readonly finalisedAt: string
}

export interface PersonalFoodSystemReportV1 {
  readonly kind: typeof REPORT_SCHEMA_VERSION
  readonly foundation: ConsultationFoundation
  /** What you told us. */
  readonly systemSnapshot: ReportSection
  /** Where to start — exactly one. */
  readonly priorityLever: ReportSection
  /** Four weeks, one beat each. */
  readonly thirtyDayLoop: readonly LoopStep[]
  /** What this works around. Always present; always states its position. */
  readonly constraints: ReportSection
  readonly safety: ReportSafety
  /** Households only. Absent for a personal Consultation. */
  readonly familyContext?: ReportSection
  /** The customer's own words, when they gave any. Quoted, never read. */
  readonly quotation?: ReportProposition
  readonly provenance: ReportProvenance
}

/* ══ Refusals ══════════════════════════════════════════════════════════════ */

export type ReportRefusalReason =
  /**
   * The seal names a bank generation Report v1 was not written for. An
   * interpretation refusal, never a statement that the seal is invalid.
   */
  | "bank-unsupported"
  /**
   * The bank version is one this Report knows, but its fingerprint is not —
   * the wording or the options moved under a seal that still names it.
   */
  | "bank-fingerprint-unsupported"
  /**
   * A trusted answer holds an option value the supported bank does not offer.
   * Refused rather than dropped: silently shortening an immutable input
   * produces a Report that looks like one the customer answered less of.
   */
  | "unsupported-answer-value"
  /**
   * The finalisation carries an entitled lens. The deterministic bank holds no
   * lens questions, so a core-only Report labelled with that entitlement would
   * claim a purchase it never asked about.
   */
  | "lens-unsupported"
  /** The trusted answers and the frozen food-safety state disagree. */
  | "safety-contradiction"
  /** A required section could not be composed from authorised propositions. */
  | "no-authorised-content"
  /** A proposition the composer requires was refused. */
  | "proposition-refused"

export type ReportResult =
  | { readonly ok: true; readonly report: PersonalFoodSystemReportV1 }
  | { readonly ok: false; readonly reason: ReportRefusalReason; readonly detail: string }
