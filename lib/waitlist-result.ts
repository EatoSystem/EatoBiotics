/* ── Waitlist result helpers ─────────────────────────────────────────────
 * Shared, server-safe helpers for the waitlist "mini report":
 *  - generateShareCode(): a short, unguessable public code stored on the lead
 *    that powers the /discover/[code] mini-report page, the OG share card, and
 *    referral attribution.
 *  - resultFromLead(): rebuild a full AssessmentResult from the columns we store
 *    on the lead (overall_score + sub_scores), reusing the real scoring engine
 *    so the mini report matches the quiz reveal exactly.
 */
import {
  normaliseSubScores,
  computeOverall,
  getProfile,
  getInsights,
  type AssessmentResult,
} from "./assessment-scoring"

// No-confusable alphabet (excludes 0/O, 1/I/L) — matches the promo-code style.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

/** 9-char public share code, e.g. "K7P2M9QXT". */
export function generateShareCode(): string {
  const arr = new Uint8Array(9)
  crypto.getRandomValues(arr)
  let code = ""
  for (const byte of arr) code += CODE_ALPHABET[byte % CODE_ALPHABET.length]
  return code
}

export interface LeadResultRow {
  overall_score?: number | null
  sub_scores?: Record<string, number> | null
}

/** Rebuild the AssessmentResult from a stored lead row (or null if no scores). */
export function resultFromLead(row: LeadResultRow): AssessmentResult | null {
  if (!row.sub_scores) return null
  const subScores = normaliseSubScores(row.sub_scores)
  const overall = row.overall_score ?? computeOverall(subScores)
  const insights = getInsights(subScores)
  return {
    subScores,
    overall,
    profile: getProfile(overall, subScores),
    insights,
    nextActions: insights.slice(0, 3).map((i) => i.action),
    completedAt: Date.now(),
  }
}
