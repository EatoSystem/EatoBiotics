/* ── Customer feedback — shared types ─────────────────────────────────────
   The feedback bot captures a free-text message (+ optional 1–5 rating) and a
   single Claude extraction call turns it into these triage fields. Everything
   AI-derived is optional so a submission is never lost when extraction fails.
──────────────────────────────────────────────────────────────────────── */

export const FEEDBACK_CATEGORIES = [
  "bug",
  "feature",
  "ux",
  "pricing",
  "content",
  "praise",
  "other",
] as const
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]

export const FEEDBACK_SENTIMENTS = ["positive", "neutral", "negative"] as const
export type FeedbackSentiment = (typeof FEEDBACK_SENTIMENTS)[number]

export const FEEDBACK_SEVERITIES = ["low", "medium", "high"] as const
export type FeedbackSeverity = (typeof FEEDBACK_SEVERITIES)[number]

/** What the Claude extraction call is asked to return. All fields best-effort. */
export interface FeedbackExtraction {
  category: FeedbackCategory
  sentiment: FeedbackSentiment
  severity: FeedbackSeverity | null
  feature_area: string | null
  summary: string | null
  suggested_improvement: string | null
  /** One warm, specific follow-up question to show the user (optional). */
  follow_up: string | null
}

/** A stored feedback row (mirrors the `feedback` table, Migration 46). */
export interface FeedbackRow extends Partial<FeedbackExtraction> {
  id: string
  user_id: string | null
  source_page: string | null
  rating: number | null
  message: string
  status: string
  created_at: string
  /** Server-set 90-day retention horizon. Never sent by a client or a route. */
  expires_at?: string
}

/** Coerce an unknown parsed value into a valid category (defensive). */
export function coerceCategory(v: unknown): FeedbackCategory {
  return FEEDBACK_CATEGORIES.includes(v as FeedbackCategory) ? (v as FeedbackCategory) : "other"
}

export function coerceSentiment(v: unknown): FeedbackSentiment {
  return FEEDBACK_SENTIMENTS.includes(v as FeedbackSentiment) ? (v as FeedbackSentiment) : "neutral"
}

export function coerceSeverity(v: unknown): FeedbackSeverity | null {
  return FEEDBACK_SEVERITIES.includes(v as FeedbackSeverity) ? (v as FeedbackSeverity) : null
}
