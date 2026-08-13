import type { AddonType } from "@/lib/addon-types"
import type { DeepQuestion } from "@/lib/deep-assessment"
import { FALLBACK_DEEP_QUESTIONS } from "@/lib/deep-assessment"
import { addonQuestionsFor, LENS_SHAPED_ID } from "@/lib/assessment/addon-questions"

/**
 * The question set the SERVER believes was asked.
 *
 * ── Why the request body cannot be the source ────────────────────────────────
 *
 * `submit-deep-assessment` used to take `questions` straight from the POST body
 * and hand it to two things:
 *
 *   1. the Claude prompt — `buildQABlock` prints `q.text` verbatim, so a caller
 *      could write any instruction they liked into the model's context;
 *   2. `buildFallbackPaidReport` — which is worse. `findAnswerText` in
 *      lib/fallback-paid-report.ts picks an answer by regex-matching `q.text`:
 *
 *          const question = questions.find((q) => matcher.test(q.text))
 *
 *      so crafted question text steers which answer becomes `goal`, `symptoms`,
 *      `stress`, `sleep` and `energy` in the fallback report. That is the
 *      report that actually ships whenever Claude is unavailable, and it lands
 *      in report_json, the web page and the PDF.
 *
 * Escaping or "ignore previous instructions" preamble would not fix either one;
 * the boundary has to be provenance, not phrasing.
 *
 * ── Where the truth already lives ────────────────────────────────────────────
 *
 * `generate-deep-questions` already persists the exact set it produced into
 * `deep_assessments.questions`, keyed by the same `stripe_session_id`. So there
 * is nothing to sign and no column to add: read the row back.
 *
 * The lens questions are NOT read back. They are re-derived from
 * `addonQuestionsFor(entitledAddon, foundation)`, which is deterministic, so
 * the lens portion is bound to the entitlement on the settled session rather
 * than to whatever a stored row happens to contain. A wrong-add-on question set
 * is therefore unrepresentable rather than merely rejected.
 */

/** A question is only usable if it has the three fields both consumers read. */
function isUsableQuestion(value: unknown): value is DeepQuestion {
  if (!value || typeof value !== "object") return false
  const q = value as Partial<DeepQuestion>
  return typeof q.id === "string" && q.id.length > 0 && typeof q.text === "string" && q.text.length > 0
}

export type TrustedQuestionsInput = {
  /** `deep_assessments.questions` for THIS session. Unknown shape by definition. */
  persisted: unknown
  /** The add-on on the settled session, already narrowed. */
  entitledAddon: AddonType | null
  foundation: "you" | "family"
  /** No STRIPE_SECRET_KEY — there is no session to have persisted anything. */
  devMode?: boolean
}

export type TrustedQuestionsResult =
  | { ok: true; questions: DeepQuestion[] }
  | { ok: false; reason: "no_question_set" }

/**
 * Resolve the trusted set, or refuse.
 *
 * Refusing matters: for a paid health report, a clear retry is better than
 * generating from context we cannot vouch for. The caller turns `ok: false`
 * into a 400 so the client can re-run generate-deep-questions — recoverable,
 * and never silently degraded.
 */
export function resolveTrustedQuestions(input: TrustedQuestionsInput): TrustedQuestionsResult {
  const { persisted, entitledAddon, foundation, devMode = false } = input

  // Always re-derived, never read back from storage or the body.
  const lens = addonQuestionsFor(entitledAddon, foundation)

  const stored = Array.isArray(persisted) ? persisted.filter(isUsableQuestion) : []

  // Lens questions in the stored row are discarded: the freshly derived ones
  // above are authoritative, and keeping both would duplicate ids.
  const core: DeepQuestion[] = []
  const seen = new Set<string>()
  for (const q of stored) {
    if (LENS_SHAPED_ID.test(q.id)) continue
    // First occurrence wins; a duplicated id would print the same question
    // twice and let one copy carry different text.
    if (seen.has(q.id)) continue
    seen.add(q.id)
    core.push(q)
  }

  if (core.length === 0) {
    // Dev has no Stripe session and therefore no persisted row; the
    // deterministic bank is the honest stand-in and is fully server-authored.
    if (devMode) return { ok: true, questions: [...FALLBACK_DEEP_QUESTIONS, ...lens] }
    return { ok: false, reason: "no_question_set" }
  }

  return { ok: true, questions: [...core, ...lens] }
}

/**
 * Answers reduced to the trusted question ids.
 *
 * Both consumers iterate the trusted questions, so an unknown answer id is
 * already unreachable — this exists so the *stored* answers and anything else
 * downstream carry the same guarantee, and so a test can assert it directly.
 */
export function answersForTrustedQuestions(
  questions: DeepQuestion[],
  answers: Record<string, unknown>,
): Record<string, unknown> {
  const ids = new Set(questions.map((q) => q.id))
  return Object.fromEntries(Object.entries(answers ?? {}).filter(([k]) => ids.has(k)))
}
