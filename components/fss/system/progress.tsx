"use client"

import { PROGRESS_COPY, SECTION_COPY, TODAY_COPY } from "@/lib/fss/presentation/system"
import { daysUntil } from "@/lib/fss/system/review"
import type { WhatChanged } from "@/lib/fss/system/changed"
import type { ProgressSlice } from "@/lib/fss/system/sections"
import { WhatChangedBlock } from "@/components/fss/system/what-changed"

/**
 * Progress — four facts, and no fifth.
 *
 * ══ THIS IS WHERE THE DISHONEST THING IS CHEAPEST ═══════════════════════════
 *
 * A progress screen wants a line going up. With one score there is nothing to
 * draw: no trend, no delta, no arrow, no "since", no second number. So it says
 * four things it knows and one sentence about why there are only four.
 *
 * The absence is enforced rather than remembered. This section is not passed
 * the score at all — `PROGRESS.select` gives it the counts and the review point
 * and nothing else — so there is no number here a comparison could be made
 * from. And `ProgressFacts.scoresAvailable` is the literal type `1`, which Gate
 * 5 has to widen on purpose before two of anything can be held.
 *
 * ══ MARKING AN ACTION MOVES NO NUMBER ══════════════════════════════════════
 *
 * Nothing on this screen responds to a completion except the count of
 * completions. The claim "you completed three actions, so your food system
 * improved" is the single most natural sentence for a product like this to
 * write and the one it has the least evidence for — so `noOutcomeClaim` says
 * the opposite, in so many words.
 *
 * ══ "MARKED DONE ON THIS DEVICE" IS PRECISE, NOT PEDANTIC ═══════════════════
 *
 * What we know is that somebody tapped a button in one browser. We do not know
 * they ate the thing. The label says the first and not the second, and the
 * storage really is per-device, so a person on their phone would otherwise
 * wonder where their record went.
 */
export function ProgressSection({
  slice,
  now,
  changed,
}: {
  slice: ProgressSlice
  now: Date
  /**
   * Passed in rather than selected, because building it needs the REPOSITORY.
   *
   * `PROGRESS.select` is pure and reads one `MyFoodSystem`; a comparison needs
   * a second system loaded by id, which is async. So the edge loads it and
   * hands it down, and `MyFoodSystem` stays a composition of ONE system's
   * trusted objects rather than quietly becoming a two-system record.
   */
  changed?: WhatChanged
}) {
  const { progress, review } = slice

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">{PROGRESS_COPY.title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {SECTION_COPY.progress.says}
        </p>
      </header>

      {/*
       * WHAT CHANGED comes first, because it is the thing a returning person
       * came back for. The four facts below it are the record of this system;
       * this is the relationship between two of them.
       */}
      {changed && <WhatChangedBlock changed={changed} />}

      <dl className="grid gap-3 sm:grid-cols-2">
        <Fact label={PROGRESS_COPY.baselineLabel}>
          {new Date(progress.baselineEstablishedAt).toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Fact>
        <Fact label={PROGRESS_COPY.plannedLabel}>{progress.actionsPlanned}</Fact>
        <Fact label={PROGRESS_COPY.doneLabel}>{progress.actionsDone}</Fact>
        <Fact label={PROGRESS_COPY.skippedLabel}>{progress.actionsSkipped}</Fact>
        <Fact label={PROGRESS_COPY.reviewLabel}>
          {review.state === "set" ? TODAY_COPY.reviewIn(daysUntil(review.dueAt, now)) : "—"}
        </Fact>
      </dl>

      <div className="space-y-4">
        {/*
         * Two different statements, and both can be true at once.
         *
         * `noComparison` is about COUNT: there is one set of answers, so there
         * is nothing to compare it with yet.
         *
         * `comparability` is about POSSIBILITY: for a score whose provenance is
         * `legacy-unversioned`, no future reassessment could be compared with
         * it either, and somebody is entitled to know that before waiting a
         * month for a comparison that cannot happen.
         */}
        {/*
         * Only true with ONE score. `scoresAvailable` was the literal `1`
         * through Gate 4, so this was unconditional and correct; now that it is
         * `1 | 2` the sentence has to be conditional or it would tell somebody
         * holding two assessments that they have nothing to compare.
         */}
        {progress.scoresAvailable === 1 && (
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {PROGRESS_COPY.noComparison}
          </p>
        )}
        {!progress.comparability.comparable && (
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {PROGRESS_COPY.neverComparable(progress.comparability.explain)}
          </p>
        )}
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          {PROGRESS_COPY.noOutcomeClaim}
        </p>
      </div>

      <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
        {TODAY_COPY.statusNote}
      </p>
    </div>
  )
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ borderColor: "var(--border)", background: "var(--card)" }}
    >
      <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-2 font-serif text-2xl font-bold tabular-nums">{children}</dd>
    </div>
  )
}
