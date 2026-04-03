"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, ArrowRight, Star, Zap, AlertTriangle, ClipboardList, BarChart2, Utensils, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Types ───────────────────────────────────────────────────────────── */

type Tier = "free" | "grow" | "restore" | "transform"

interface PricingClientProps {
  isLoggedIn: boolean
  currentTier: Tier
  currentStatus: string
  isFoundingMember: boolean
  highlightFeature: string | null
  growPriceId: string
  restorePriceId: string
  transformPriceId: string
}

/* ── Feature lists ───────────────────────────────────────────────────── */

const TIER_FEATURES: Record<Tier, string[]> = {
  free: [
    "Know your Biotics Score",
    "Understand what it means",
    "Get your food system baseline",
    "Access the full food library",
  ],
  grow: [
    "Track meals daily — 2 analyses per day",
    "See your score move in real time",
    "Build a streak with daily habit nudges",
    "Your 30-day score history",
    "Create My Plate — AI daily & weekly meal plans",
  ],
  restore: [
    "Your AI-built monthly gut plan",
    "5 daily meal analyses",
    "Deep-dive your weakest pillar",
    "Condition-specific guidance",
    "Create My Plate — AI daily & weekly meal plans",
  ],
  transform: [
    "Unlimited EatoBiotic consultations",
    "Weekly AI check-in",
    "Create My Plate — AI daily & weekly meal plans",
    "Full food system optimisation",
    "Founding member status",
  ],
}

const TIER_META: Record<Tier, { label: string; price: string; tagline: string; color: string; gradient: string }> = {
  free: {
    label: "Free",
    price: "Free",
    tagline: "Understand your system",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), #56C135)",
  },
  grow: {
    label: "Grow",
    price: "€9.99/mo",
    tagline: "Build daily habits",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  restore: {
    label: "Restore",
    price: "€49/mo",
    tagline: "Fix what's holding you back",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  },
  transform: {
    label: "Transform",
    price: "€99/mo",
    tagline: "Fully optimise your system",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
  },
}

const TIER_ORDER: Record<Tier, number> = { free: 0, grow: 1, restore: 2, transform: 3 }

/* ── Subscribe Button ────────────────────────────────────────────────── */

function SubscribeButton({
  priceId,
  label,
  gradient,
  isLoggedIn,
  disabled,
}: {
  priceId: string
  label: string
  gradient: string
  isLoggedIn: boolean
  disabled?: boolean
}) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (disabled) return
    if (!isLoggedIn) {
      window.location.href = `/assessment?signin=1&redirect=/pricing`
      return
    }
    if (!priceId) return
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/create-subscription-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error("[pricing checkout]", err)
    } finally {
      setLoading(false)
    }
  }

  if (disabled) {
    return (
      <div className="w-full rounded-full bg-muted py-3 text-center text-sm font-semibold text-muted-foreground">
        {label}
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full rounded-full py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-50"
      style={{ background: gradient }}
    >
      {loading ? "Loading…" : label}
    </button>
  )
}

/* ── Portal Button (used in past_due banner) ─────────────────────────── */

function PortalButton({ label, className }: { label: string; className?: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/create-portal-session", { method: "POST" })
      const data = await res.json() as { url?: string }
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error("[portal]", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} className={className}>
      {loading ? "Loading…" : label}
    </button>
  )
}

/* ── Pricing Page ────────────────────────────────────────────────────── */

const TIERS: Tier[] = ["free", "grow", "restore", "transform"]

export function PricingClient({
  isLoggedIn,
  currentTier,
  currentStatus,
  isFoundingMember,
  highlightFeature,
  growPriceId,
  restorePriceId,
  transformPriceId,
}: PricingClientProps) {
  const priceIds: Record<Tier, string> = {
    free:      "",
    grow:      growPriceId,
    restore:   restorePriceId,
    transform: transformPriceId,
  }

  const isActive = currentStatus === "active"
  const currentOrder = TIER_ORDER[currentTier]

  // Check if founding member window is still open
  const cutoff = process.env.NEXT_PUBLIC_FOUNDING_MEMBER_CUTOFF_DATE
  const foundingWindowOpen = cutoff ? new Date() < new Date(cutoff) : false

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
          style={{ background: "color-mix(in srgb, var(--icon-lime) 15%, transparent)", color: "var(--icon-green)" }}>
          <Zap size={12} /> Membership Plans
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground sm:text-5xl">
          Your food system journey,<br />
          <span style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            your pace
          </span>
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Start free. Upgrade when you're ready. Cancel any time.
        </p>

        {highlightFeature === "ai-consultation" && (
          <div className="mx-auto mt-6 max-w-sm rounded-2xl p-4 text-sm"
            style={{ background: "color-mix(in srgb, var(--icon-orange) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--icon-orange) 30%, transparent)", color: "var(--icon-orange)" }}>
            EatoBiotic consultations are available exclusively on the <strong>Transform</strong> plan.
          </div>
        )}
      </div>

      {/* Funnel clarity strip */}
      <div className="mb-12 rounded-3xl border bg-card overflow-hidden">
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-orange))" }} />
        <div className="grid gap-0 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {[
            { icon: ClipboardList, step: "01", label: "Assess", desc: "Take the free 15-question assessment and get your food system score", color: "var(--icon-lime)" },
            { icon: BarChart2,     step: "02", label: "Score",  desc: "Understand your Biotics Score across 5 pillars — free, forever",       color: "var(--icon-green)" },
            { icon: Utensils,      step: "03", label: "Log",    desc: "Upgrade to log meals daily and track your Pre, Pro, Post intake",       color: "var(--icon-teal)" },
            { icon: TrendingUp,    step: "04", label: "Improve", desc: "Transform members get unlimited AI consultation and monthly reviews",  color: "var(--icon-orange)" },
          ].map(({ icon: Icon, step, label, desc, color }) => (
            <div key={step} className="flex gap-3 p-5">
              <div className="shrink-0 mt-0.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
                  <Icon size={15} style={{ color }} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color }}>{step} — {label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Past due banner */}
      {currentStatus === "past_due" && (
        <div
          className="mb-8 flex flex-col items-center gap-3 rounded-2xl p-5 text-center sm:flex-row sm:text-left"
          style={{
            background: "color-mix(in srgb, #ef4444 8%, var(--card))",
            border: "1px solid color-mix(in srgb, #ef4444 30%, transparent)",
          }}
        >
          <AlertTriangle size={18} className="shrink-0 text-red-400" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-400">Your payment failed.</p>
            <p className="text-xs text-muted-foreground">
              Please update your payment method to restore full access.
            </p>
          </div>
          <PortalButton label="Update payment method" className="shrink-0 text-xs font-semibold text-red-400 underline hover:text-red-300" />
        </div>
      )}

      {/* Tier cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier) => {
          const meta = TIER_META[tier]
          const features = TIER_FEATURES[tier]
          const tierOrder = TIER_ORDER[tier]
          const isCurrent = tier === currentTier && isActive
          const isHigher = tierOrder > currentOrder
          const isLower = tierOrder < currentOrder && isActive
          const isGrow = tier === "grow"
          const isTransform = tier === "transform"

          let ctaLabel = "Get started"
          if (tier === "free") ctaLabel = "Start with Assessment"
          else if (isCurrent) ctaLabel = "Current Plan"
          else if (isHigher) ctaLabel = "Upgrade"
          else if (isLower) ctaLabel = "Downgrade"

          return (
            <div
              key={tier}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-3xl border bg-card transition-shadow hover:shadow-xl",
                isCurrent && "ring-2 ring-offset-2",
                isGrow && !isCurrent && "border-2",
                isTransform && !isCurrent && "shadow-lg scale-[1.02]"
              )}
              style={{
                ...(isCurrent ? { "--tw-ring-color": meta.color } as React.CSSProperties : {}),
                ...(isGrow && !isCurrent ? { borderColor: `color-mix(in srgb, ${meta.color} 40%, var(--border))` } : {}),
              }}
            >
              {/* "Most Popular" badge on Grow */}
              {isGrow && (
                <div
                  className="absolute right-4 top-4 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
                  style={{ background: meta.gradient }}
                >
                  <Star size={9} fill="currentColor" /> Most Popular
                </div>
              )}

              {/* "Founding Member" badge on Transform */}
              {isTransform && (foundingWindowOpen || isFoundingMember) && (
                <div
                  className="absolute right-4 top-4 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
                  style={{ background: meta.gradient }}
                >
                  ✦ Founding Member
                </div>
              )}

              {/* Header */}
              <div
                className="px-6 py-5"
                style={isCurrent ? { background: meta.gradient } : { background: "var(--muted)" }}
              >
                <p className={cn("text-xs font-bold uppercase tracking-widest", isCurrent ? "text-white/70" : "text-muted-foreground")}>
                  {meta.label}
                </p>
                <p className={cn("mt-1 font-serif text-3xl font-bold", isCurrent ? "text-white" : "text-foreground")}>
                  {meta.price}
                </p>
                <p className={cn("mt-1 text-xs leading-snug", isCurrent ? "text-white/75" : "text-muted-foreground")}>
                  {meta.tagline}
                </p>
              </div>

              {/* Features */}
              <div className="flex flex-1 flex-col px-6 py-5">
                <ul className="mb-6 flex-1 space-y-2.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check size={14} className="mt-0.5 shrink-0" style={{ color: meta.color }} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {tier === "free" ? (
                  <Link
                    href="/assessment"
                    className="block w-full rounded-full py-3 text-center text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: meta.gradient }}
                  >
                    {ctaLabel} <ArrowRight size={13} className="inline" />
                  </Link>
                ) : isLower ? (
                  /* Downgrade goes to portal */
                  <form action="/api/stripe/create-portal-session" method="POST">
                    <button
                      type="submit"
                      className="w-full rounded-full bg-muted py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted/80"
                    >
                      {ctaLabel}
                    </button>
                  </form>
                ) : (
                  <SubscribeButton
                    priceId={priceIds[tier]}
                    label={ctaLabel}
                    gradient={meta.gradient}
                    isLoggedIn={isLoggedIn}
                    disabled={isCurrent}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <p className="mt-10 text-center text-xs text-muted-foreground">
        All plans are billed in EUR. Cancel any time — no lock-in. Payments handled securely by Stripe.
      </p>
    </div>
  )
}
