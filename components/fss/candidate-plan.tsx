"use client"

import { ACTION_CATEGORIES } from "@/lib/fss/action/categories"
import { TIME_HORIZONS } from "@/lib/fss/action/horizons"
import type { FoodSystemPlan, Recommendation } from "@/lib/fss/action/types"
import { DOMAIN_PRESENTATION } from "@/lib/fss/presentation/domains"
import { PLAN_COPY, describeConstraints } from "@/lib/fss/presentation/plan"

/**
 * Your Plan — Feed · Seed · Rejuvenate, across three horizons.
 *
 * ══ WHAT THIS COMPONENT MAY NOT DO ══════════════════════════════════════════
 *
 * Invent a customer-visible sentence. Every word comes from `PLAN_COPY`,
 * `ACTION_CATEGORIES`, `TIME_HORIZONS` or the action catalogue, all of which
 * are reviewed data. The component arranges; it does not author. Same rule the
 * candidate result and the canonical Report renderer already run under, and
 * for the same reason.
 *
 * ══ TWO THINGS IT DELIBERATELY DOES NOT RENDER ══════════════════════════════
 *
 * A NUMBER ON AN ACTION. The category appears as a name and never with a
 * value. "Feed: 67" is a personal Biotic score wearing a verb, and the whole
 * score hierarchy exists to keep the two apart.
 *
 * A BAND. `FSS_V1_PROVENANCE.interpretationVersion` is `interpretation-v1.0`,
 * which `lib/fss/interpretation/bands.ts` deliberately does not register — so
 * `getScoreBand` would THROW here. That is the right answer anyway: a plan is
 * about what to do, not about which tier a number sits in.
 *
 * ══ AND THE ONE IT DOES, THAT MIGHT LOOK OPTIONAL ═══════════════════════════
 *
 * The context note. When somebody has told us that time or money is tight, the
 * plan quietly leaves out the suggestions that would need more of either — and
 * a person who cannot see that happen has no way to know the plan is shorter
 * for a reason rather than thinner by accident.
 */
export function CandidatePlan({ plan }: { plan: FoodSystemPlan }) {
  const hasAnything = plan.today !== null || plan.thisWeek.length > 0 || plan.thirtyDays !== null

  return (
    <section className="mt-16">
      <h2 className="font-serif text-3xl font-bold">{PLAN_COPY.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{PLAN_COPY.intro}</p>

      {!hasAnything ? (
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{PLAN_COPY.empty}</p>
      ) : (
        <>
          {plan.today && (
            <Horizon horizon="today">
              <ActionCard recommendation={plan.today} />
            </Horizon>
          )}

          {plan.thisWeek.length > 0 && (
            <Horizon horizon="this-week">
              <div className="space-y-4">
                {plan.thisWeek.map((r) => (
                  <ActionCard key={r.id} recommendation={r} />
                ))}
              </div>
            </Horizon>
          )}

          {plan.thirtyDays && (
            <Horizon horizon="thirty-days">
              <div
                className="rounded-2xl border p-6"
                style={{ borderColor: "var(--border)", background: "var(--card)" }}
              >
                <Field label={PLAN_COPY.thirtyDayBehaviourLabel}>
                  <span className="font-medium text-foreground">{plan.thirtyDays.behaviour}</span>
                </Field>
                <Field label={PLAN_COPY.thirtyDayWhyLabel}>{plan.thirtyDays.whyThisOne}</Field>
                <Field label={PLAN_COPY.reassessmentLabel}>
                  {plan.thirtyDays.reassessment.whatItCompares}
                  <span className="mt-2 block text-xs">
                    {plan.thirtyDays.reassessment.comparabilityRule}
                  </span>
                </Field>
              </div>
            </Horizon>
          )}

          {/*
            Why the plan looks the way it does. Reviewed copy either way — the
            branch chooses a sentence, it does not compose one.
          */}
          <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
            {plan.context.answered
              ? plan.context.limiting.length > 0
                ? PLAN_COPY.contextRespected(describeConstraints(plan.context.limiting))
                : null
              : PLAN_COPY.contextUnknown}
          </p>
        </>
      )}

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground/80">
        {PLAN_COPY.statusNote}
      </p>
    </section>
  )
}

/** One horizon, with its reviewed label and the question it answers. */
function Horizon({
  horizon,
  children,
}: {
  horizon: keyof typeof TIME_HORIZONS
  children: React.ReactNode
}) {
  const meta = TIME_HORIZONS[horizon]
  return (
    <div className="mt-10">
      <h3 className="font-serif text-xl font-bold">{meta.label}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{meta.question}</p>
      <p className="mt-1 text-xs text-muted-foreground/80">{meta.cadence}</p>
      <div className="mt-4">{children}</div>
    </div>
  )
}

/**
 * One recommendation, with its reason attached.
 *
 * The category and the domain sit side by side as two labels, with no operator
 * between them — adjacency is the shipped design across the product, and an
 * operator would be the equation the score hierarchy refuses.
 */
function ActionCard({ recommendation: r }: { recommendation: Recommendation }) {
  const category = ACTION_CATEGORIES[r.category]
  const domain = DOMAIN_PRESENTATION[r.sourceDomain]

  return (
    <div
      className="rounded-2xl border p-6"
      style={{ borderColor: "var(--border)", background: "var(--card)" }}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: category.color }}
        >
          {category.label}
        </span>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {domain.label}
        </span>
      </div>

      <p className="mt-2 font-serif text-lg font-bold">{r.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{r.practicalAction}</p>

      <Field label={PLAN_COPY.whyLabel}>{r.rationale}</Field>
      <Field label={PLAN_COPY.frequencyLabel}>{r.suggestedFrequency}</Field>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  )
}
