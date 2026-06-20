/**
 * Centralised, non-negotiable safety / disclaimer copy for the EatoBiotics
 * assessment suite. Every score is a behaviour-based educational support score —
 * never a medical measurement. Keep these strings exact; tests assert them.
 */

import type { AssessmentKey } from "@/lib/assessment-types"

/** Shown on every assessment result. */
export const GLOBAL_DISCLAIMER =
  "This score reflects how strongly your current food and lifestyle patterns support this area. It is not a diagnosis, medical test, or replacement for professional advice."

export const MIND_DISCLAIMER =
  "This is a food-pattern reflection tool, not a mental-health screening or diagnosis."

export const GLUCOSE_DISCLAIMER =
  "This is a glucose-supportive behavior score. It does not measure blood glucose."

export const STABILITY_DISCLAIMER =
  "This is not a diagnosis. If you have red-flag symptoms, sudden changes, bleeding, black stools, unexplained weight loss, fever, night symptoms, or severe pain, seek medical advice."

export const PERFORMANCE_DISCLAIMER =
  "This score reflects performance-fuelling support patterns. It does not measure athletic ability, recovery status, or injury risk."

/** Per-assessment extra line (added on top of the global disclaimer). */
export const ASSESSMENT_DISCLAIMERS: Record<AssessmentKey, string | null> = {
  you: null,
  family: null,
  mind: MIND_DISCLAIMER,
  glucose: GLUCOSE_DISCLAIMER,
  stability: STABILITY_DISCLAIMER,
  performance: PERFORMANCE_DISCLAIMER,
}

/**
 * Full disclaimer text for an assessment: the global support-score framing plus
 * any assessment-specific safety line.
 */
export function disclaimerFor(key: AssessmentKey): string {
  const specific = ASSESSMENT_DISCLAIMERS[key]
  return specific ? `${GLOBAL_DISCLAIMER} ${specific}` : GLOBAL_DISCLAIMER
}
