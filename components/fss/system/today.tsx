"use client"

import { DOMAIN_PRESENTATION } from "@/lib/fss/presentation/domains"
import { TODAY_COPY, UNRESOLVABLE_COPY, WALK_COPY } from "@/lib/fss/presentation/system"
import { daysUntil } from "@/lib/fss/system/review"
import type { TodaySlice } from "@/lib/fss/system/sections"

/**
 * Today — the home screen, and the test of whether this is a daily product.
 *
 * ══ SIX LINES AND ONE SENTENCE ══════════════════════════════════════════════
 *
 *   My Food System
 *   Your focus     Diversity: widen the range, not the amount
 *   Today          One plant you have not had this week
 *   This week      2 of 3 actions remaining
 *   Your Food System Score™   67
 *   Review again   in 24 days
 *   <one reviewed sentence about the focus domain>
 *
 * Not twelve charts. Not every domain. Not a miniature report. The restraint is
 * the specification: a dashboard of everything we happen to know is the thing
 * this replaces, and the discipline has to live in the component because the
 * data is all right there.
 *
 * ══ EVERY STRING IS LOOKED UP ═══════════════════════════════════════════════
 *
 * The labels come from `TODAY_COPY`, the focus headline from
 * `DOMAIN_PRESENTATION[d].priorityHeadline`, the action's name from the
 * catalogue entry's `title`, the sentence from `whereYouAre`. This component
 * authors nothing — not one template literal containing prose.
 *
 * ══ THE CLOCK IS A PROP ═════════════════════════════════════════════════════
 *
 * `review.dueAt` is an absolute date, computed by a pure function. "in 24 days"
 * is made HERE, from a `now` the shell passes in. That is the only reason the
 * composer can be pure, and it is why a test can state which day it is
 * pretending to be.
 */
export function TodaySection({
  slice,
  now,
  onReassess,
}: {
  slice: TodaySlice
  now: Date
  /** Absent in a fixture. Present on the real surface once a system exists. */
  onReassess?: () => void
}) {
  const { focus, today, weekTotal, weekRemaining, score, review, insight, unresolved } = slice

  return (
    <div className="space-y-10">
      <h1 className="font-serif text-3xl font-bold sm:text-4xl">{TODAY_COPY.title}</h1>

      {unresolved && unresolved.state === "unresolvable" && (
        <p
          className="rounded-2xl border p-5 text-sm leading-relaxed text-muted-foreground"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}
        >
          {UNRESOLVABLE_COPY[unresolved.reason]}
        </p>
      )}

      <dl className="space-y-8">
        <Line label={TODAY_COPY.focusLabel}>
          {focus ? (
            <>
              <span style={{ color: DOMAIN_PRESENTATION[focus.sourceDomain].color }}>
                {DOMAIN_PRESENTATION[focus.sourceDomain].label}
              </span>
              {": "}
              {DOMAIN_PRESENTATION[focus.sourceDomain].priorityHeadline.toLowerCase()}
            </>
          ) : (
            <span className="text-base font-normal text-muted-foreground">{TODAY_COPY.noFocus}</span>
          )}
        </Line>

        {today && (
          <Line label={TODAY_COPY.todayLabel}>
            {today.title}
            <span className="mt-2 block text-base font-normal leading-relaxed text-muted-foreground">
              {today.practicalAction}
            </span>
          </Line>
        )}

        {weekTotal > 0 && (
          <Line label={TODAY_COPY.thisWeekLabel}>
            {weekRemaining === 0
              ? TODAY_COPY.actionsAllMarked(weekTotal)
              : TODAY_COPY.actionsRemaining(weekRemaining, weekTotal)}
          </Line>
        )}

        {/*
         * The score, with no band word beside it.
         *
         * `FSS_V1_PROVENANCE.interpretationVersion` is "interpretation-v1.0"
         * and `bands.ts` registers no such ladder on purpose, so asking for a
         * band throws. The absence here is that refusal, rendered.
         */}
        {score !== null && (
          <Line label={TODAY_COPY.scoreLabel}>
            <span className="tabular-nums">{score}</span>
          </Line>
        )}

        <Line label={TODAY_COPY.reviewLabel}>
          {review.state === "set" ? (
            TODAY_COPY.reviewIn(daysUntil(review.dueAt, now))
          ) : (
            <span className="text-base font-normal leading-relaxed text-muted-foreground">
              {review.comparabilityRule}
            </span>
          )}
        </Line>
      </dl>

      {/* One small contextual insight. Reviewed, observed-behaviour class, and
          about the focus domain — not a summary of five. */}
      {insight && (
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{insight}</p>
      )}

      {/*
        The reassessment entry point sits with the review date, because that is
        the line it answers. Pressing it starts an ATTEMPT — this Food System
        stays current, and stays on screen, until a new one is established.

        It is NOT gated on the review date having arrived. Refusing early would
        assert that thirty days is required, which is a methodology claim
        nobody has reviewed; `REASSESSMENT.afterDays` says when reassessing
        makes sense, not when it is permitted.
      */}
      {onReassess && (
        <button
          type="button"
          onClick={onReassess}
          className="inline-flex min-h-[48px] items-center rounded-full border px-6 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ borderColor: "var(--border)" }}
        >
          {WALK_COPY.reassessCta}
        </button>
      )}

      <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
        {TODAY_COPY.statusNote}
      </p>
    </div>
  )
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-2 font-serif text-2xl font-bold leading-snug">{children}</dd>
    </div>
  )
}
