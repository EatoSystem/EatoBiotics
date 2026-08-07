"use client"

import Link from "next/link"
import { ArrowRight, Check, Compass } from "lucide-react"

interface ReportMembershipCTAProps {
  /** The customer's current overall score — the one real number this report
   *  produced. No future score is shown anywhere: a questionnaire cannot
   *  honestly forecast one, and the old projection card once promised a
   *  98/100 customer they could reach "100–100". */
  overall?: number
  /** Display label of the pathway the report chose to start with. */
  priorityLabel?: string
  membershipBridge?: string
  membershipTier?: string
}

const TIERS = [
  {
    id: "grow",
    name: "Grow",
    price: "€9.99",
    period: "/mo",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    tagline: "Build daily habits",
    features: [
      "2 meal analyses per day",
      "30-day score history",
      "Daily habit nudges + streak",
      "Create My Plate — AI meal plans",
    ],
  },
  {
    id: "restore",
    name: "Restore",
    price: "€49",
    period: "/mo",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    tagline: "Fix what's holding you back",
    featured: true,
    features: [
      "5 daily meal analyses",
      "AI-built monthly gut plan",
      "Deep-dive your weakest pillar",
      "Condition-specific guidance",
    ],
  },
  {
    id: "transform",
    name: "Transform",
    price: "€99",
    period: "/mo",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    tagline: "Fully optimise your system",
    features: [
      "Unlimited AI consultations",
      "Weekly AI check-in",
      "Full food system optimisation",
      "Founding member status",
    ],
  },
]

/* The score-projection card that used to live here rendered a predicted
 * future score with a deadline ("You could reach 74–84 in 8–10 weeks") — a
 * result-by-date forecast a questionnaire cannot honestly make, and one that
 * degenerated to "100–100" for high scorers. Replaced by ContinuationCard:
 * the real current score, the report's own priority pathway, and what
 * membership is actually for — practising the plan, not receiving a number. */
function ContinuationCard({
  overall,
  priorityLabel,
}: {
  overall: number
  priorityLabel?: string
}) {
  return (
    <div
      className="rounded-2xl border-2 border-transparent p-5"
      style={{
        background:
          "linear-gradient(var(--background), var(--background)) padding-box, linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal)) border-box",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Compass size={15} aria-hidden style={{ color: "var(--icon-green)" }} />
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
          Where your report hands over
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="shrink-0 text-center">
          <p className="font-serif text-3xl font-bold leading-none text-foreground">{overall}</p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Today&apos;s score
          </p>
        </div>

        <div className="flex-1">
          <p className="font-serif text-base font-bold text-foreground leading-snug">
            {priorityLabel
              ? `Your plan starts with ${priorityLabel} — membership is where you practise it.`
              : "Your plan is set — membership is where you practise it."}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Log what you actually eat, watch your{" "}
            {priorityLabel ? `${priorityLabel} habits` : "new habits"} hold through ordinary
            weeks, and retake the assessment after your 30-day cycle. Your score is
            recalculated from your answers each time — individual outcomes vary.
          </p>
        </div>
      </div>
    </div>
  )
}

export function ReportMembershipCTA({
  overall,
  priorityLabel,
  membershipBridge,
  membershipTier,
}: ReportMembershipCTAProps) {
  const hasActiveMembership =
    membershipTier && ["grow", "restore", "transform"].includes(membershipTier)

  return (
    <div className="space-y-5 pt-2">
      {/* Section label */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-2">
          Your Next Step
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Continuation — current score + priority, never a forecast */}
      {typeof overall === "number" && (
        <ContinuationCard overall={overall} priorityLabel={priorityLabel} />
      )}

      {/* Membership bridge */}
      {membershipBridge && (
        <div
          className="rounded-xl border-l-4 py-3 px-4 text-sm leading-relaxed text-foreground/80"
          style={{
            borderColor: "var(--icon-green)",
            background: "color-mix(in srgb, var(--icon-green) 6%, transparent)",
          }}
        >
          {membershipBridge}
        </div>
      )}

      {/* Already a member */}
      {hasActiveMembership ? (
        <div
          className="flex items-center gap-3 rounded-2xl border p-4"
          style={{
            background: "color-mix(in srgb, var(--icon-green) 6%, transparent)",
            borderColor: "color-mix(in srgb, var(--icon-green) 25%, transparent)",
          }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: "color-mix(in srgb, var(--icon-green) 15%, transparent)" }}
          >
            <Check size={16} style={{ color: "var(--icon-green)" }} />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground capitalize">
              Your {membershipTier} plan is tracking your progress
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Use daily meal analyses to monitor the changes from this report
            </p>
          </div>
          <Link
            href="/account"
            className="ml-auto shrink-0 flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary"
          >
            Dashboard <ArrowRight size={11} />
          </Link>
        </div>
      ) : (
        <>
          {/* Membership tier cards */}
          <p className="text-sm font-semibold text-foreground text-center">
            Choose the plan that fits your journey
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {TIERS.map((tier) => (
              <div
                key={tier.id}
                className="relative flex flex-col rounded-2xl border overflow-hidden"
                style={
                  tier.featured
                    ? {
                        borderColor: `color-mix(in srgb, ${tier.color} 40%, transparent)`,
                        background: `color-mix(in srgb, ${tier.color} 4%, var(--card))`,
                      }
                    : { borderColor: "var(--border)", background: "var(--card)" }
                }
              >
                {/* Top accent */}
                <div className="h-1 w-full" style={{ background: tier.gradient }} />

                {tier.featured && (
                  <div
                    className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-bold text-white"
                    style={{ background: tier.gradient }}
                  >
                    Most Popular
                  </div>
                )}

                <div className="flex flex-1 flex-col p-4 pt-3">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: tier.color }}>
                    {tier.name}
                  </p>
                  <div className="mt-1 flex items-baseline gap-0.5">
                    <span className="text-2xl font-bold text-foreground">{tier.price}</span>
                    <span className="text-xs text-muted-foreground">{tier.period}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground mb-3">{tier.tagline}</p>

                  <ul className="space-y-1.5 flex-1 mb-4">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-[11px] text-foreground/80">
                        <Check size={11} className="mt-0.5 shrink-0" style={{ color: tier.color }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/pricing"
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-white transition hover:opacity-90"
                    style={{ background: tier.gradient }}
                  >
                    Start {tier.name} <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Cancel any time · Start free and upgrade when you&apos;re ready
          </p>

          <Link
            href="/pricing"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm font-medium text-foreground transition hover:bg-secondary/60"
          >
            Compare all plans <ArrowRight size={13} />
          </Link>
        </>
      )}
    </div>
  )
}
