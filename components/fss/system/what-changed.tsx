"use client"

import { CHANGED_COPY, DOMAIN_CHANGE_COPY, type ChangeDirection } from "@/lib/fss/presentation/changed"
import { DOMAIN_PRESENTATION } from "@/lib/fss/presentation/domains"
import { CONSTRAINT_LABELS } from "@/lib/fss/presentation/plan"
import type { FssDomain } from "@/lib/fss/questions/types"
import type { ObservationChange, WhatChanged } from "@/lib/fss/system/changed"

/**
 * WHAT CHANGED — the surface.
 *
 * ══ IT RENDERS. IT DOES NOT CALCULATE, AND IT DOES NOT WRITE. ═══════════════
 *
 * No subtraction happens here. Every number comes from the comparison object,
 * which `canCompare` and `canCompareDomains` gated before it existed, and every
 * sentence comes from `CHANGED_COPY` or `DOMAIN_CHANGE_COPY`. There is no
 * template literal producing customer prose in this file, because nobody
 * reviews a template literal.
 *
 * ══ THE HIERARCHY IS FIXED AND UNRANKED ════════════════════════════════════
 *
 *   food patterns → what you notice → your context → your actions → the score
 *
 * The score is near the end on purpose: it is the thing a person will read as a
 * verdict, and the explanation of what moved in their answers is the thing that
 * is actually about them.
 *
 * There is NO "most improved" anywhere. Ranking the five changes is an
 * interpretation nobody has reviewed, and the first thing a ranking does is
 * imply the top item mattered most — which is a causal claim wearing a sort
 * order.
 *
 * ══ AND THE FIVE CLASSES NEVER JOIN ════════════════════════════════════════
 *
 * Each block reads its own field and renders its own reviewed sentence. The one
 * place two classes appear together is `coOccurrence`, a single reviewed
 * constant that says explicitly that both happened and neither explains the
 * other. No function in this file receives both an action count and a change
 * set.
 */
export function WhatChangedBlock({ changed }: { changed: WhatChanged }) {
  if (changed.state === "no-predecessor") {
    return <Note>{CHANGED_COPY.noPredecessor}</Note>
  }

  if (changed.state === "unavailable") {
    return <Note>{CHANGED_COPY.unavailable}</Note>
  }

  const { comparison, observations, context, actions } = changed

  return (
    <section className="space-y-10" aria-labelledby="what-changed">
      <header>
        <h2 id="what-changed" className="font-serif text-2xl font-bold">
          {CHANGED_COPY.title}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {CHANGED_COPY.says}
        </p>
      </header>

      {/*
       * A REFUSAL IS A USEFUL PRODUCT STATE, not an error and not a blank.
       *
       * Both records are still there and both are still complete, so the person
       * sees two results side by side, labelled, with the reason. This is the
       * only place `methodChanged`-class language is true: there really are two
       * results and the method really did change between them.
       */}
      {comparison.state === "refused" && (
        <div className="space-y-4">
          <Note>{CHANGED_COPY.refusedNote}</Note>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Figure label={CHANGED_COPY.previousLabel}>
              {comparison.previousScore.state === "scored" ? comparison.previousScore.score : "—"}
            </Figure>
            <Figure label={CHANGED_COPY.currentLabel}>
              {comparison.currentScore.state === "scored" ? comparison.currentScore.score : "—"}
            </Figure>
          </dl>
          <Note>{comparison.scoreVerdict.comparable ? "" : comparison.scoreVerdict.explain}</Note>
        </div>
      )}

      {/* ── 1 · Food patterns ─────────────────────────────────────────── */}
      {comparison.state === "fully-comparable" && (
        <Block label={CHANGED_COPY.domainsLabel}>
          <ul className="space-y-3">
            {comparison.domains.map((d) => {
              const presentation = DOMAIN_PRESENTATION[d.domain as FssDomain]
              if (!presentation) return null
              return (
                <li key={d.domain} className="text-sm leading-relaxed">
                  <span className="font-semibold">{presentation.label}</span>{" "}
                  {d.state === "both-scored"
                    ? DOMAIN_CHANGE_COPY[d.domain as FssDomain][directionWord(d.direction)]
                    : CHANGED_COPY.domainNotBothScored(presentation.label)}
                </li>
              )
            })}
          </ul>
        </Block>
      )}

      {comparison.state === "score-only-comparable" && (
        <Block label={CHANGED_COPY.domainsLabel}>
          <Note>{CHANGED_COPY.domainsNotComparable}</Note>
        </Block>
      )}

      {/* ── 2 · What you notice ───────────────────────────────────────── */}
      <Block label={CHANGED_COPY.observationsLabel}>
        {observations ? (
          <>
            <ul className="space-y-4">
              {observations.map((o) => (
                <Observation key={o.questionId} item={o} />
              ))}
            </ul>
            <Note>{CHANGED_COPY.observationsNote}</Note>
          </>
        ) : (
          <Note>{CHANGED_COPY.observationsNotComparable}</Note>
        )}
      </Block>

      {/* ── 3 · Your context ─────────────────────────────────────────── */}
      {context && (
        <Block label={CHANGED_COPY.contextLabel}>
          {context.every((c) => c.state === "unchanged") ? (
            /*
             * One sentence, not four lines each saying nothing happened. See
             * `contextNoneChanged` for why reading it rendered changed this.
             */
            <p className="text-sm leading-relaxed">{CHANGED_COPY.contextNoneChanged}</p>
          ) : (
            <ul className="space-y-2">
              {context
                .filter((c) => c.state !== "unchanged")
                .map((c) => {
                  const label = CONSTRAINT_LABELS[c.constraint]
                  return (
                    <li key={c.constraint} className="text-sm leading-relaxed">
                      {c.state === "appeared"
                        ? CHANGED_COPY.contextAppeared(label)
                        : CHANGED_COPY.contextDisappeared(label)}
                    </li>
                  )
                })}
            </ul>
          )}
          <Note>{CHANGED_COPY.contextNote}</Note>
        </Block>
      )}

      {/* ── 4 · Your actions ─────────────────────────────────────────── */}
      <Block label={CHANGED_COPY.actionsLabel}>
        {actions.total === 0 ? (
          <Note>{CHANGED_COPY.actionsNone}</Note>
        ) : (
          <>
            <p className="text-sm leading-relaxed">
              {CHANGED_COPY.actionsFacts(actions.done, actions.total)}
            </p>
            {actions.skipped > 0 && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {CHANGED_COPY.actionsSkipped(actions.skipped)}
              </p>
            )}
          </>
        )}
      </Block>

      {/* ── 5 · The score, last of the five ──────────────────────────── */}
      {comparison.state !== "refused" && (
        <Block label={CHANGED_COPY.scoreLabel}>
          {comparison.score === null ? (
            <Note>{CHANGED_COPY.scoreUnavailable}</Note>
          ) : comparison.score.direction === "same" ? (
            <Note>{CHANGED_COPY.scoreSame}</Note>
          ) : (
            <>
              <p className="font-serif text-3xl font-bold tabular-nums">
                {CHANGED_COPY.scoreMove(comparison.score.previous, comparison.score.current)}
              </p>
              <Note>{CHANGED_COPY.scoreNote}</Note>
            </>
          )}
        </Block>
      )}

      {/*
       * The one sentence touching two classes, and it refuses to join them.
       * Shown only when there is something in both — otherwise it would be
       * asserting a co-occurrence that did not occur.
       */}
      {actions.done > 0 && observations && (
        <Note>{CHANGED_COPY.coOccurrence(actions.done)}</Note>
      )}
    </section>
  )
}

/**
 * One observation, with both answers quoted.
 *
 * No direction and no comparative verb. `ObservationChange` has no field for
 * either, so this cannot characterise the change even by accident — it shows
 * what the person said then and what they say now.
 */
function Observation({ item }: { item: ObservationChange }) {
  return (
    <li>
      <p className="text-sm font-semibold leading-relaxed">{item.question}</p>
      {item.state === "same" ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {CHANGED_COPY.observationSame}
          {item.current ? ` — ${item.current}` : ""}
        </p>
      ) : item.state === "newly-answered" ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {CHANGED_COPY.observationNew}
          {item.current ? ` — ${item.current}` : ""}
        </p>
      ) : item.state === "no-longer-answered" ? (
        <p className="mt-1 text-sm text-muted-foreground">{CHANGED_COPY.observationDropped}</p>
      ) : (
        <dl className="mt-1 grid gap-1 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {CHANGED_COPY.observationThen}
            </dt>
            <dd>{item.previous}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {CHANGED_COPY.observationNow}
            </dt>
            <dd>{item.current}</dd>
          </div>
        </dl>
      )}
    </li>
  )
}

/** `DomainChange.direction` names arithmetic; the copy keys name a sentence. */
function directionWord(d: "higher" | "lower" | "same"): ChangeDirection {
  return d === "same" ? "similar" : d
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="space-y-3 rounded-2xl border p-5"
      style={{ borderColor: "var(--border)", background: "var(--card)" }}
    >
      <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </h3>
      {children}
    </div>
  )
}

function Figure({ label, children }: { label: string; children: React.ReactNode }) {
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

function Note({ children }: { children: React.ReactNode }) {
  if (!children) return null
  return <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{children}</p>
}
