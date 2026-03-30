"use client"

import Link from "next/link"
import { ArrowRight, Check, TrendingUp } from "lucide-react"
import type { ScoreProjection } from "@/lib/claude-report"

interface ReportMembershipCTAProps {
  scoreProjection?: ScoreProjection
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
      "Full gut health optimisation",
      "Founding member status",
    ],
  },
]

function ScoreProjectionCard({ projection }: { projection: ScoreProjection }) {
  const r = 44
  const circ = 2 * Math.PI * r
  const lowOffset = circ * (1 - projection.low / 100)
  const highOffset = circ * (1 - projection.high / 100)

  return (
    <div
      className="rounded-2xl border-2 border-transparent p-5"
      style={{
        background:
          "linear-gradient(var(--background), var(--background)) padding-box, linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal)) border-box",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={15} style={{ color: "var(--icon-green)" }} />
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
          Your score potential
        </p>
      </div>

      <div className="flex items-center gap-6">
        {/* Score range rings */}
        <div className="relative flex shrink-0 items-center justify-center h-24 w-24">
          {/* Low ring (background) */}
          <svg width="96" height="96" className="-rotate-90 absolute inset-0">
            <circle cx="48" cy="48" r={r} fill="none" strokeWidth="7" stroke="var(--border)" />
            <circle
              cx="48" cy="48" r={r} fill="none" strokeWidth="7"
              stroke="color-mix(in srgb, var(--icon-green) 30%, transparent)"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={lowOffset}
            />
            <circle
              cx="48" cy="48" r={r} fill="none" strokeWidth="7"
              stroke="var(--icon-green)"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={highOffset}
            />
          </svg>
          <div className="relative text-center">
            <p className="font-serif text-lg font-bold leading-none" style={{ color: "var(--icon-green)" }}>
              {projection.low}–{projection.high}
            </p>
            <p className="text-[9px] font-bold tracking-widest text-muted-foreground mt-0.5">/100</p>
          </div>
        </div>

        {/* Text */}
        <div className="flex-1">
          <p className="font-serif text-base font-bold text-foreground leading-snug">
            You could reach {projection.low}–{projection.high} in {projection.timeline}
          </p>
          <div className="mt-3 space-y-1.5">
            {projection.keyDrivers.map((driver, i) => (
              <div key={i} className="flex items-start gap-2">
                <span
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ background: "var(--icon-green)" }}
                >
                  {i + 1}
                </span>
                <p className="text-xs text-muted-foreground leading-snug">{driver}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ReportMembershipCTA({
  scoreProjection,
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

      {/* Score projection */}
      {scoreProjection && <ScoreProjectionCard projection={scoreProjection} />}

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
