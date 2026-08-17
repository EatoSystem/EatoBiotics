import type { DeepQuestion } from "@/lib/deep-assessment"

/**
 * The persisted question snapshot for one paid session.
 *
 * ── What a snapshot is ───────────────────────────────────────────────────────
 *
 * `generate-deep-questions` asks Claude for a question set, appends the
 * purchased lens's questions, and writes the result to
 * `deep_assessments.questions` keyed by `stripe_session_id`. That row IS the
 * questionnaire: the customer answers it, and `submit-deep-assessment` reads it
 * back (via `resolveTrustedQuestions`) to build the report.
 *
 * There is no question "bank" for the core set to drift against — Claude
 * generates it per session and it is frozen in the row. #223 asked whether the
 * snapshot needs a version handle or a content hash; it does not, because
 * nothing re-derives it. What it does need is to reliably EXIST and to never be
 * silently replaced. Hence this module.
 *
 * ── Why replacement is the dangerous case ────────────────────────────────────
 *
 * Core ids are positional — "dq1", "dq2", … (see FALLBACK_DEEP_QUESTIONS, and
 * the `IDs: "dq1", "dq2", etc. in order` instruction in the generation prompt).
 * A regenerated set therefore reuses the SAME ids carrying DIFFERENT text, so
 * `answersForTrustedQuestions`, which narrows answers by id, cannot detect the
 * swap: an answer saved against the old "dq4" binds silently to the new "dq4".
 * Overwriting a snapshot the customer has already started answering mis-binds
 * their answers rather than losing them, which is the worse failure.
 *
 * So the reuse decision must key on the snapshot itself, never on the row's
 * `status` — see the status trace in the route.
 */

/**
 * Is this stored element shaped like a question the questionnaire can render
 * and the report can consume?
 *
 * Deliberately minimal: `id` to bind answers, `text` to display and to print
 * into the prompt, `type` to choose the input control and format the answer.
 * `type` is checked as a non-empty string rather than against
 * `DeepQuestionType`, because narrowing it here would mean re-interpreting
 * stored data — rows written by earlier versions are allowed to carry types
 * this build does not know about.
 */
function isRenderableQuestion(value: unknown): value is DeepQuestion {
  if (!value || typeof value !== "object") return false
  const q = value as Partial<DeepQuestion>
  return (
    typeof q.id === "string" &&
    q.id.length > 0 &&
    typeof q.text === "string" &&
    q.text.length > 0 &&
    typeof q.type === "string" &&
    (q.type as string).length > 0
  )
}

/**
 * The stored snapshot if it is usable as-is, otherwise `null`.
 *
 * All-or-nothing on purpose. A single malformed element invalidates the whole
 * snapshot rather than being filtered out, because filtering would be a silent
 * repair: the customer would be handed a questionnaire quietly shorter than the
 * one that was stored, and the survivors would keep ids that no longer describe
 * the set. `null` means "no usable snapshot" and sends the caller down its
 * existing regeneration path.
 *
 * A valid snapshot is returned VERBATIM — same objects, same order, original
 * wording, options, eduContext, slider bounds and follow-ups intact. Nothing in
 * here rewrites stored content.
 *
 * This is deliberately stricter than `isUsableQuestion` in
 * `lib/assessment/trusted-questions.ts`, which filters rather than refuses.
 * They answer different questions: that one resolves a set at submit time and
 * must tolerate stored lens entries it is about to discard and re-derive; this
 * one decides reuse-vs-regenerate, where partial acceptance has no safe meaning.
 */
export function readQuestionSnapshot(persisted: unknown): DeepQuestion[] | null {
  if (!Array.isArray(persisted)) return null
  if (persisted.length === 0) return null
  if (!persisted.every(isRenderableQuestion)) return null
  return persisted as DeepQuestion[]
}

/**
 * The only fields report generation reads off a persisted core question.
 *
 * Both consumers were traced for #223 and neither touches anything else — not
 * `options`, `pillar`, `section`, `min`/`max`, `eduContext`, `followUp` or
 * `required`:
 *
 *   - `buildQABlock` / `formatAnswer` in app/api/submit-deep-assessment/route.ts
 *     print `q.text`, switch on `q.type`, and look up `answers[q.id]`;
 *   - `findAnswerText` / `formatAnswer` in lib/fallback-paid-report.ts match on
 *     `q.text`, switch on `q.type`, and look up `answers[q.id]`.
 *
 * That narrowness is what makes a version handle unnecessary: the three fields
 * are stored verbatim by the generator and never re-derived downstream, so
 * there is nothing for a version to protect against.
 *
 * It is an assumption, not a law, so tests/unit/question-snapshot.test.ts reads
 * both sources and fails if either starts consuming a field outside this list.
 * If that guard goes red, the decision to skip versioning is what is being
 * reopened — widen this constant deliberately, don't silence the test.
 */
export const PROMPT_QUESTION_FIELDS = ["id", "text", "type"] as const

/** The projection of a stored question that report generation is allowed to see. */
export type PromptQuestionFields = Pick<DeepQuestion, (typeof PROMPT_QUESTION_FIELDS)[number]>
