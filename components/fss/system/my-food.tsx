"use client"

import { DOMAIN_PRESENTATION } from "@/lib/fss/presentation/domains"
import { PLAN_COPY, describeConstraints } from "@/lib/fss/presentation/plan"
import { CONTEXT_COPY, SECTION_COPY, TODAY_COPY } from "@/lib/fss/presentation/system"
import type { MyFoodSlice } from "@/lib/fss/system/sections"
import type { ReportedItem } from "@/lib/fss/system/types"

/**
 * My Food — what EatoBiotics currently understands about how somebody eats.
 *
 * ══ WHAT YOU NOTICE AND MY CONTEXT LIVE HERE, NOT AS TABS ═══════════════════
 *
 * Both are things a person told us, read back inside the section about what we
 * understand — rather than two more destinations in a navigation bar. Keeping a
 * concept inside the experience that uses it is the difference between a daily
 * product and a menu of everything we happen to store.
 *
 * ══ EVERY LINE IS TRACEABLE TO AN ANSWERED ITEM ═════════════════════════════
 *
 * There is no summary here that is not a question and the option that was
 * chosen for it. "You reported X" is a statement about what somebody said; a
 * sentence that characterised them from it would be a different claim class,
 * and this layer does not have one.
 *
 * An UNANSWERED item is shown as unanswered rather than dropped. A skipped part
 * is not a declaration that there was nothing to say, and hiding the gap would
 * make it look like a part we never asked about.
 *
 * ══ AND A CONSTRAINT IS NEVER A SHORTCOMING ═════════════════════════════════
 *
 * Food Context asks about circumstances rather than choices. It reaches the
 * Score by no path, it never reduces anything, and the reviewed note says so in
 * those terms: what it changes is what we would suggest, not what somebody is
 * worth.
 */
export function MyFoodSection({ slice }: { slice: MyFoodSlice }) {
  const { domains, observations, context, contextItems } = slice

  return (
    <div className="space-y-12">
      <header>
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">
          {SECTION_COPY["my-food"].label}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {SECTION_COPY["my-food"].says}
        </p>
      </header>

      <section>
        <h2 className="font-serif text-2xl font-bold">Your food patterns</h2>
        <div className="mt-5 space-y-3">
          {domains.map((d) => {
            const meta = DOMAIN_PRESENTATION[d.domain as keyof typeof DOMAIN_PRESENTATION]
            if (!meta) return null
            return (
              <article
                key={d.domain}
                className="rounded-2xl border p-5"
                style={{ borderColor: "var(--border)", background: "var(--card)" }}
              >
                <h3 className="text-sm font-semibold" style={{ color: meta.color }}>
                  {meta.label}
                </h3>
                {/*
                 * `whereYouAre` is a description of reported behaviour, never a
                 * verdict — "your answers described a moderate range", not "you
                 * are moderate". `whereYouAreUnknown` is the same move for a
                 * domain we could not characterise, which is said rather than
                 * left blank.
                 */}
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {d.state === "scored" && typeof d.score === "number"
                    ? meta.whereYouAre(d.score)
                    : meta.whereYouAreUnknown}
                </p>
              </article>
            )
          })}
        </div>
      </section>

      <Unscored
        title="What you notice"
        note="Not scored, on purpose. What you notice is an outcome rather than a food-system input — two people with identical habits would score differently for feeling worse, which would make the number impossible to read. So it is recorded and reflected back, and it stays out of the arithmetic."
        items={observations}
      />

      <Unscored
        title="Your food context"
        note="Not scored, and it never reduces anything. These are circumstances rather than choices, and scoring them would be scoring somebody's time, budget or postcode. What they change is what we would suggest, not what you are worth."
        items={contextItems}
      >
        {/* The reviewed sentence that closes the loop: here is what you told
            us, and here is what we did with it. */}
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          {!context.answered
            ? PLAN_COPY.contextUnknown
            : context.limiting.length > 0
              ? PLAN_COPY.contextRespected(describeConstraints(context.limiting))
              : CONTEXT_COPY.noneLimiting}
        </p>
      </Unscored>

      <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
        {TODAY_COPY.statusNote}
      </p>
    </div>
  )
}

function Unscored({
  title,
  note,
  items,
  children,
}: {
  title: string
  note: string
  items: readonly ReportedItem[]
  children?: React.ReactNode
}) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="font-serif text-2xl font-bold">{title}</h2>
        <span
          className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          style={{ borderColor: "var(--border)" }}
        >
          Not scored
        </span>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{note}</p>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li
            key={item.questionId}
            className="rounded-2xl border p-5"
            style={{ borderColor: "var(--border)", background: "var(--card)" }}
          >
            <p className="text-sm text-muted-foreground">{item.question}</p>
            <p className="mt-2 font-semibold text-foreground">
              {item.answer ? `You reported: ${item.answer}` : "Not answered"}
            </p>
          </li>
        ))}
      </ul>
      {children}
    </section>
  )
}
