"use client"

import { cn } from "@/lib/utils"
import { SECTION_META, type ConsultationFoundation, type ConsultationSection } from "@/lib/consultation/types"
import type { ConsultationProgress } from "@/lib/consultation/session"

/**
 * Section-first progress (§9).
 *
 * ══ WHY THE SECTION IS THE HEADLINE ═════════════════════════════════════════
 *
 * A raw "7 of 16" is not a truthful headline for an adaptive questionnaire. The
 * total moves as branches open and close, so a customer who changes an earlier
 * answer watches the denominator jump for reasons they cannot see, and a
 * progress bar built on it can go backwards. The legacy client shows exactly
 * that (`{currentIndex + 1} / {questions.length}` with a width driven by it).
 *
 * Position within a section is stable: "Your Rhythm — Question 2 of 4" stays
 * meaningful because sections are few, named, and ordered. The overall figure
 * is still computed and still exposed, but to assistive technology rather than
 * as the number the design leans on.
 */

const SECTION_COLOR: Record<ConsultationSection, string> = {
  signals: "var(--icon-orange)",
  rhythm: "var(--icon-yellow)",
  environment: "var(--icon-teal)",
  intentions: "var(--icon-green)",
}

function titleFor(section: ConsultationSection, foundation: ConsultationFoundation): string {
  const meta = SECTION_META[section]
  return foundation === "family" ? meta.familyTitle : meta.title
}

interface Props {
  progress: ConsultationProgress
  foundation: ConsultationFoundation
}

export function ConsultationProgressBar({ progress, foundation }: Props) {
  const { sections, sectionIndex, current } = progress
  if (!current || sectionIndex < 0) return null

  const color = SECTION_COLOR[current.section]
  const withinSection = current.questionCount > 0 ? current.questionNumber / current.questionCount : 0

  return (
    <div className="sticky top-[57px] z-10 border-b bg-card/80 backdrop-blur">
      <div className="mx-auto max-w-2xl px-6 py-3">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color }}>
            {titleFor(current.section, foundation)}
          </p>
          <p className="shrink-0 text-xs text-muted-foreground">
            Question {current.questionNumber} of {current.questionCount}
          </p>
        </div>

        {/* Progress WITHIN the current section. The bar cannot run backwards
          * when a branch closes, because it is scoped to a section the customer
          * is already inside. */}
        <div className="mt-2 h-1.5 rounded-full bg-border/40">
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.round(withinSection * 100)}%`, background: color }}
          />
        </div>

        {/* The journey. Named sections rather than a count, so the customer can
          * see where they are and what is left. */}
        <ol className="mt-2.5 flex items-center gap-1.5 overflow-x-auto">
          {sections.map((section, i) => {
            const done = i < sectionIndex
            const active = i === sectionIndex
            return (
              <li key={section} className="flex shrink-0 items-center gap-1.5">
                <span
                  className={cn(
                    "whitespace-nowrap text-[11px] font-medium transition-colors",
                    active ? "text-foreground" : "text-muted-foreground/70",
                  )}
                  style={active ? { color: SECTION_COLOR[section] } : undefined}
                  aria-current={active ? "step" : undefined}
                >
                  {titleFor(section, foundation)}
                  {done && (
                    <span className="sr-only"> (completed)</span>
                  )}
                </span>
                {i < sections.length - 1 && (
                  <span aria-hidden className="h-px w-3 bg-border" />
                )}
              </li>
            )
          })}
        </ol>

        {/* The overall figure, for screen readers only — see the header note. */}
        <p className="sr-only" role="status">
          Question {progress.overallNumber} of {progress.overallCount} in total. The total can
          change as questions adapt to your answers.
        </p>
      </div>
    </div>
  )
}
