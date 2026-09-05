"use client"

import { useMemo, useState } from "react"
import { CheckCircle2 } from "lucide-react"
import type { ConsultationAnswer, ConsultationContext } from "@/lib/consultation/types"
import { SECTION_META } from "@/lib/consultation/types"
import {
  begin,
  canGoBack as canGoBackFrom,
  createConsultationSession,
  currentQuestion as currentQuestionOf,
  goBack,
  goNext,
  isLastQuestion,
  isSectionStart,
  progress as progressOf,
  setAnswer,
  type ConsultationSessionState,
} from "@/lib/consultation/session"
import { ConsultationOrientation } from "./consultation-orientation"
import { ConsultationProgressBar } from "./consultation-progress"
import { ConsultationQuestionView } from "./consultation-question"

/**
 * The deterministic Personal Food System Consultation — Phase 3B.
 *
 * ══ NOT THE PAID FLOW ═══════════════════════════════════════════════════════
 *
 * Reachable only by asking for it explicitly: the deep-assessment page renders
 * this from inside its existing demo branch, behind a second opt-in parameter,
 * so no paid entry point can reach it. Real paid sessions continue to render
 * the legacy client unchanged, and `tests/unit/consultation-preview-route.test
 * .ts` pins both halves — including that no other file anywhere builds a link
 * carrying those parameters. Activating this for paying customers is a later,
 * separate decision.
 *
 * ══ WHAT IT DOES NOT DO ═════════════════════════════════════════════════════
 *
 * It does not generate questions. There is no request to the question-
 * generation route and none to any model provider — the sequence is derivable
 * offline from the bank plus the customer's own answers (§37/§38), and a guard
 * asserts this directory issues no network request at all.
 *
 * It does not submit. The Consultation ends at a neutral pre-Review state
 * (§35): no Report, and none of the legacy client's timed progress stages
 * describing work that nothing has started (§36).
 *
 * It does not persist. See the save-state note below.
 *
 * ══ WHY ALL THE LOGIC IS ELSEWHERE ══════════════════════════════════════════
 *
 * Every decision — which question is next, whether Continue is allowed, what
 * Back means, which branches are open — lives in `lib/consultation/session.ts`
 * over the canonical Phase 3A engine. This component holds one piece of state
 * and renders the result, so the frozen rules cannot be re-decided in JSX.
 */

interface Props {
  context: ConsultationContext
  /** Rendered as a standing notice so a preview can never be mistaken for the
   *  real paid Consultation. Always true in Phase 3B. */
  preview?: boolean
}

export function DeterministicConsultationClient({ context, preview = true }: Props) {
  const [state, setState] = useState<ConsultationSessionState>(() =>
    createConsultationSession({ context }),
  )

  const question = currentQuestionOf(state)
  const progress = useMemo(() => progressOf(state), [state])
  const { foundation } = state.context

  function handleAnswer(id: string, value: ConsultationAnswer) {
    // Records only. Advancing is `handleNext`, and nothing else may call it.
    setState((s) => setAnswer(s, id, value))
  }

  const sectionTitle = progress.current
    ? foundation === "family"
      ? SECTION_META[progress.current.section].familyTitle
      : SECTION_META[progress.current.section].title
    : ""

  return (
    <div className="min-h-screen bg-background pt-[57px]">
      {preview && <PreviewNotice />}

      {!state.currentQuestionId && !state.finished && (
        <ConsultationOrientation
          foundation={foundation}
          onBegin={() => setState((s) => begin(s))}
        />
      )}

      {question && !state.finished && (
        <>
          <ConsultationProgressBar progress={progress} foundation={foundation} />
          {isSectionStart(state) && progress.current && (
            <SectionTransition
              title={sectionTitle}
              purpose={SECTION_META[progress.current.section].purpose}
            />
          )}
          <ConsultationQuestionView
            key={question.id}
            question={question}
            foundation={foundation}
            answer={state.answers[question.id]}
            touched={state.touched.has(question.id)}
            onAnswer={handleAnswer}
            onBack={() => setState((s) => goBack(s))}
            onNext={() => setState((s) => goNext(s))}
            canGoBack={canGoBackFrom(state)}
            isLast={isLastQuestion(state)}
            validationError={state.validationError}
            sectionTitle={sectionTitle}
            questionNumber={progress.current?.questionNumber ?? 1}
            questionCount={progress.current?.questionCount ?? 1}
          />
        </>
      )}

      {state.finished && <PreReviewState onBack={() => setState((s) => goBack(s))} />}
    </div>
  )
}

/**
 * Standing preview notice.
 *
 * Structural, not decorative: it is what makes the preview identifiable as a
 * preview from inside the page (§5), and it names Phase 3C as the owner of the
 * part that does not exist yet.
 */
function PreviewNotice() {
  return (
    <div className="border-b border-[var(--icon-yellow)]/40 bg-[var(--icon-yellow)]/10">
      <p className="mx-auto max-w-2xl px-6 py-2 text-xs leading-relaxed text-foreground">
        <span className="font-semibold">Preview — in development.</span> This is the deterministic
        Consultation experience. It is not the live paid Consultation, nothing is saved, and no
        Report is generated.
      </p>
    </div>
  )
}

/**
 * A short beat when a section opens (§34).
 *
 * The section's own `purpose` from the canonical `SECTION_META`, not new copy:
 * a second description written here would be an unreviewed line about what the
 * Consultation is doing. No separate Continue screen — it sits above the first
 * question of the section rather than replacing it.
 */
function SectionTransition({ title, purpose }: { title: string; purpose: string }) {
  return (
    <div className="border-b bg-secondary/40">
      <div className="mx-auto max-w-2xl px-6 py-4">
        <p className="font-serif text-lg font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{purpose}</p>
      </div>
    </div>
  )
}

/**
 * The end of Phase 3B (§35).
 *
 * A neutral resting state. Review and Edit, server completeness, the trusted
 * handoff and Report generation are all Phase 3C, and this screen says so
 * rather than implying work is under way. Back still works, so the preview can
 * be walked in both directions.
 */
function PreReviewState({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <CheckCircle2 className="mx-auto text-[var(--icon-green)]" size={40} aria-hidden />
      <h2 className="mt-5 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
        Your Consultation answers are ready to review.
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
        Reviewing and editing your answers, and turning them into your Personal Food System
        Report, is Phase 3C — in development, and not part of this preview.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-8 min-h-[44px] rounded-full border-2 border-border px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60"
      >
        Back to the last question
      </button>
    </div>
  )
}
