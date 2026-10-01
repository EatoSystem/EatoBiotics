"use client"

import { ACTION_CATEGORIES, ACTION_CATEGORY_ORDER } from "@/lib/fss/action/categories"
import { TIME_HORIZONS } from "@/lib/fss/action/horizons"
import { PLAN_COPY } from "@/lib/fss/presentation/plan"
import {
  ACTION_STATE_COPY,
  SECTION_COPY,
  TODAY_COPY,
  UNRESOLVABLE_COPY,
} from "@/lib/fss/presentation/system"
import { CandidatePlan } from "@/components/fss/candidate-plan"
import type { ActionState } from "@/lib/fss/persistence/repository"
import type { MyPlanSlice } from "@/lib/fss/system/sections"
import type { ResolvedAction } from "@/lib/fss/system/types"

/**
 * My Plan — Feed · Seed · Rejuvenate, and where the person stands on each.
 *
 * ══ FEED · SEED · REJUVENATE LIVES HERE, NOT IN THE NAVIGATION ══════════════
 *
 * It is `ActionCategory`, already on every catalogue entry and every stored
 * action. It groups the actions inside this section and it is NOT a tab, NOT a
 * score, and NOT a pathway page. Turning every concept into another
 * destination is how a product becomes a dashboard of everything we happen to
 * know; the concept belongs inside the experience it describes.
 *
 * Feed · Seed · Rejuvenate is also not Prebiotics · Probiotics · Postbiotics
 * renamed. One is how a person acts, the other is how the science is
 * understood, and `tests/unit/score-hierarchy.test.ts` refuses a sentence that
 * equates any pair of them.
 *
 * ══ AN UNRESOLVABLE ACTION IS RENDERED, NOT HIDDEN ══════════════════════════
 *
 * When a stored action's content version has moved, or its catalogue entry was
 * withdrawn, the card says so and shows nothing in its place. Dropping it would
 * make the method change invisible — and would quietly reduce the person's own
 * counts, so their plan would appear to shrink on its own.
 *
 * ══ AND MARKING SOMETHING RECORDS NOTHING ABOUT ITS EFFECT ══════════════════
 *
 * Three states, both terminal ones reversible. No congratulation, no streak, no
 * benefit, no "this will help". A person marking an action done is telling us
 * what they did, which is all we know.
 */
export function MyPlanSection({
  slice,
  onMove,
  pending,
}: {
  slice: MyPlanSlice
  onMove: (actionId: string, state: ActionState) => void
  pending: string | null
}) {
  const { plan, priorities, actions } = slice

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">
          {SECTION_COPY["my-plan"].label}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {SECTION_COPY["my-plan"].says}
        </p>
      </header>

      {priorities.state === "unresolvable" && (
        <Refusal>{UNRESOLVABLE_COPY[priorities.reason]}</Refusal>
      )}
      {plan.state === "unresolvable" && <Refusal>{UNRESOLVABLE_COPY[plan.reason]}</Refusal>}
      {plan.state === "none-selected" && <Refusal>{PLAN_COPY.empty}</Refusal>}

      {/* The Gate 3 plan surface, reused unchanged. Its reviewed copy, its
          horizons, its context note — all of it, rather than a second
          rendering of the same object that would drift from the first. */}
      {plan.state === "resolved" && <CandidatePlan plan={plan.plan} />}

      {actions.length > 0 && (
        <section>
          <h2 className="font-serif text-2xl font-bold">Where you are on each</h2>
          <div className="mt-6 space-y-8">
            {ACTION_CATEGORY_ORDER.map((category) => {
              const inCategory = actions.filter((a) => a.actionCategory === category)
              if (inCategory.length === 0) return null
              const meta = ACTION_CATEGORIES[category]
              return (
                <div key={category}>
                  <h3
                    className="text-xs font-semibold uppercase tracking-[0.22em]"
                    style={{ color: meta.color }}
                  >
                    {meta.label}
                  </h3>
                  <ul className="mt-3 space-y-3">
                    {inCategory.map((action) => (
                      <li key={action.id}>
                        <ActionRow
                          action={action}
                          onMove={onMove}
                          busy={pending === action.id}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
        {TODAY_COPY.statusNote}
      </p>
    </div>
  )
}

function Refusal({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="rounded-2xl border p-5 text-sm leading-relaxed text-muted-foreground"
      style={{ borderColor: "var(--border)", background: "var(--card)" }}
    >
      {children}
    </p>
  )
}

function ActionRow({
  action,
  onMove,
  busy,
}: {
  action: ResolvedAction
  onMove: (actionId: string, state: ActionState) => void
  busy: boolean
}) {
  const resolved = action.content.state === "resolved" ? action.content.recommendation : null

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ borderColor: "var(--border)", background: "var(--card)" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <p className="font-semibold text-foreground">
          {resolved ? resolved.title : "Recommended under a method that has moved"}
        </p>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {TIME_HORIZONS[action.timeHorizon].label} · {ACTION_STATE_COPY[action.state].label}
        </span>
      </div>

      {resolved ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {resolved.practicalAction}
        </p>
      ) : (
        /* No substitution. The refusal is the content. */
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {UNRESOLVABLE_COPY[
            action.content.state === "unresolvable" && action.content.reason === "entry-withdrawn"
              ? "entry-withdrawn"
              : "content-version-moved"
          ]}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {(["done", "skipped", "planned"] as const).map((state) => {
          const isCurrent = action.state === state
          return (
            <button
              key={state}
              type="button"
              disabled={busy || isCurrent}
              onClick={() => onMove(action.id, state)}
              aria-pressed={isCurrent}
              className="min-h-[44px] rounded-full border px-4 text-sm font-semibold transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                borderColor: isCurrent ? "var(--icon-green)" : "var(--border)",
                background: isCurrent
                  ? "color-mix(in srgb, var(--icon-green) 10%, var(--card))"
                  : "transparent",
              }}
            >
              {ACTION_STATE_COPY[state].verb}
            </button>
          )
        })}
      </div>
    </div>
  )
}
