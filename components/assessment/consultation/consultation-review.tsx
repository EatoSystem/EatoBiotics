"use client"

import { useEffect, useRef } from "react"
import { Pencil, X } from "lucide-react"
import type { ConsultationReview, ReviewItem } from "@/lib/consultation/review"

/**
 * Review your Consultation — Phase 3C-B.
 *
 * ══ A REFLECTION, NOT AN ANALYSIS ═══════════════════════════════════════════
 *
 * Every line on this screen is something the customer said, in the wording they
 * read it in. Nothing is derived from the pattern of the answers — no summary,
 * no ranking, no statement about the body, no cause named. Interpreting them is
 * the Report's job, under a science contract this screen has no part in, and a
 * guard asserts that none of that vocabulary appears here.
 *
 * ══ WHY IT IS NOT A TABLE ═══════════════════════════════════════════════════
 *
 * The obvious rendering of "questions and their answers" is a two-column grid,
 * and it reads like a database dump of a person. This shows the question quietly
 * and the answer as the statement, which is the way round a customer
 * experiences it.
 *
 * The model comes from `buildConsultationReview`, rebuilt on every render — so a
 * branch that closes disappears here without anything having to clean it up.
 */

interface Props {
  review: ConsultationReview
  onEdit: (questionId: string) => void
  /**
   * Remove a previously supplied OPTIONAL answer.
   *
   * Optional prop: the ephemeral preview and the persisted wrapper both supply
   * it, but a caller that cannot honour a removal must not render a control
   * that appears to.
   */
  onWithdraw?: (questionId: string) => void
  /** Rendered under the list. Phase 3C-B has no Report handoff. */
  footer?: React.ReactNode
}

export function ConsultationReviewView({ review, onEdit, onWithdraw, footer }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  /* Focus the Review heading on entry and on return from an edit, so the change
   * of screen is announced rather than silently swapping under a screen reader
   * whose focus is still on the Continue button that caused it. */
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className="mx-auto max-w-2xl px-6 pb-28 pt-8">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-serif text-3xl font-semibold leading-tight text-foreground outline-none sm:text-4xl"
      >
        Review your Consultation
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        Here is what you&apos;ve told us. You can edit any answer before moving to the next step.
      </p>

      <div className="mt-10 space-y-10">
        {review.sections.map((section) => (
          <section key={section.section} aria-labelledby={`review-${section.section}`}>
            <h2
              id={`review-${section.section}`}
              className="font-serif text-xl font-semibold text-foreground"
            >
              {section.title}
            </h2>
            <ul className="mt-4 space-y-3">
              {section.items.map((item) => (
                <ReviewRow
                  key={item.questionId}
                  item={item}
                  onEdit={onEdit}
                  onWithdraw={onWithdraw}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {footer}
    </div>
  )
}

function ReviewRow({
  item,
  onEdit,
  onWithdraw,
}: {
  item: ReviewItem
  onEdit: (id: string) => void
  onWithdraw?: (id: string) => void
}) {
  return (
    <li className="rounded-2xl border border-border bg-background p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm leading-snug text-muted-foreground">{item.question}</p>

          {item.state === "answered" ? (
            <ul className="mt-2 space-y-1">
              {item.answer.map((line) => (
                <li
                  key={line}
                  className="text-base font-semibold leading-snug text-foreground sm:text-lg"
                >
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            /* Truthful about the three states. An optional question nobody
             * answered is not "No" and not "I'd rather not say" — those are
             * answers a customer could have given and did not. */
            <p className="mt-2 text-base italic leading-snug text-muted-foreground sm:text-lg">
              {item.state === "skipped" ? "Not answered (optional)" : "Not answered yet"}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(item.questionId)}
            className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary/60"
          >
            <Pencil size={14} aria-hidden />
            Edit
            {/* The visible word is "Edit" for everyone; a screen reader gets the
              * question too, because a list of identical "Edit" buttons is
              * unusable without it. */}
            <span className="sr-only"> {item.question}</span>
          </button>

          {/* Offered only where it is real: an optional question that currently
            * holds an answer. A required one is never withdrawable, and a
            * question with nothing in it has nothing to remove.
            *
            * Deliberately quiet. This is a reversible product choice — the
            * customer can Edit and answer again — not an irreversible deletion,
            * and styling it like one would make an ordinary correction feel
            * dangerous. No confirmation dialog for the same reason. */}
          {onWithdraw && item.canWithdraw && (
            <button
              type="button"
              onClick={() => onWithdraw(item.questionId)}
              className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
            >
              <X size={14} aria-hidden />
              Remove answer
              <span className="sr-only"> for {item.question}</span>
            </button>
          )}
        </div>
      </div>
    </li>
  )
}
