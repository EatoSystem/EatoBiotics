/**
 * EatoBiotics Agent Loop — safety framework.
 *
 * The loop never diagnoses or claims to treat disease. Recommendations are
 * food-first and educational. This module centralises the non-diagnostic
 * disclaimers and a light language guard the deterministic provider uses, so the
 * same guardrails apply everywhere (and later to AI providers too).
 */

export const LOOP_DISCLAIMER =
  "This supports general wellbeing through food patterns — it is not medical advice and does not diagnose or treat any condition."

export const RED_FLAG_DISCLAIMER =
  "If you have persistent or severe symptoms, please speak with a healthcare professional."

/** Phrasings we prefer (supportive, non-diagnostic) vs ones to avoid (clinical claims). */
export const PREFERRED_LANGUAGE = ["supports", "may help", "food patterns", "general wellbeing"]

const DISALLOWED = [
  /\bcures?\b/i,
  /\btreats?\b/i,
  /\bdiagnos(e|is|ing)\b/i,
  /\bheals? (your )?(disease|illness|condition)\b/i,
  /\bprevents? (disease|cancer|diabetes)\b/i,
]

/** True if copy is free of diagnostic/treatment claims. Used by tests + as a guard. */
export function isNonDiagnostic(text: string): boolean {
  return !DISALLOWED.some((re) => re.test(text))
}

/** Append the standard disclaimer once, idempotently. */
export function withDisclaimer(text: string, disclaimer: string = LOOP_DISCLAIMER): string {
  const trimmed = text.trim()
  if (trimmed.includes(disclaimer)) return trimmed
  return `${trimmed} ${disclaimer}`.trim()
}
