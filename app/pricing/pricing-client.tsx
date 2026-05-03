"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Check,
  ArrowRight,
  AlertTriangle,
  ClipboardList,
  BarChart2,
  FileText,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import posthog from "posthog-js"

/* ── Types ───────────────────────────────────────────────────────────── */

type LegacyTier = "free" | "grow" | "restore" | "transform"
type Tier = LegacyTier | "trial" | "member"

interface PricingClientProps {
  isLoggedIn: boolean
  currentTier: LegacyTier
  currentStatus: string
  isFoundingMember: boolean
  highlightFeature: string | null
  growPriceId: string
  restorePriceId: string
  transformPriceId: string
}

/* ── Report Purchase Button (€49 one-time) ───────────────────────────── */

function ReportButton({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    posthog.capture("report_purchase_clicked", { source: "pricing_page", tier: "personal" })

    if (!isLoggedIn) {
      // Take assessment first — checkout will be available after
      window.location.href = "/assessment"
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "personal" }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error("[report checkout]", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full rounded-full py-4 text-base font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-50"
      style={{
        background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal))",
      }}
    >
      {loading ? "Loading…" : isLoggedIn ? "Get My Personal Report →" : "Take the free assessment →"}
    </button>
  )
}

/* ── Subscribe Button (€24.99/month) ────────────────────────────────── */

function MemberButton({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [loading, setLoading] = useState(false)
  const priceId = process.env.NEXT_PUBLIC_STRIPE_MEMBER_PRICE_ID ?? ""

  async function handleClick() {
    posthog.capture("member_subscribe_clicked", { source: "pricing_page" })

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
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error("[member checkout]", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full rounded-full py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-md disabled:opacity-50"
      style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
    >
      {loading ? "Loading…" : "Continue My Journey"}
    </button>
  )
}

/* ── Portal Button (existing subscribers) ───────────────────────────── */

function PortalButton({ label, className }: { label: string; className?: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/create-portal-session", { method: "POST" })
      const data = (await res.json()) as { url?: string }
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

/* ── FAQ Accordion ───────────────────────────────────────────────────── */

const FAQS = [
  {
    q: "What happens after 30 days?",
    a: "After your 30-day account period ends, you'll be invited to continue with an EatoBiotics Member plan at €24.99/month. Nothing is charged automatically — you choose whether to continue.",
  },
  {
    q: "Is this a subscription?",
    a: "The Personal Report is a one-time €49 purchase. The monthly plan is completely optional and only starts if you choose it after your free 30-day account ends.",
  },
  {
    q: "What's in the report?",
    a: "Your report is generated personally for you by AI, based on your assessment and deep-dive answers. It includes your full Feed · Seed · Heal analysis, a 30-day plan, your top 10 food recommendations, a weekly shopping framework, meal timing guidance, food swaps, and a 7-day kickstart.",
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-sm cursor-pointer"
      onClick={() => setOpen((o) => !o)}
    >
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <p className="text-sm font-semibold text-foreground">{q}</p>
        {open ? (
          <ChevronUp size={16} className="shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-muted-foreground" />
        )}
      </div>
      {open && (
        <div className="border-t px-6 py-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

/* ── Main Pricing Page ───────────────────────────────────────────────── */

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
  const isLegacySubscriber =
    currentStatus === "active" && ["grow", "restore", "transform"].includes(currentTier)
  const isPastDue = currentStatus === "past_due"

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">

      {/* Past due banner */}
      {isPastDue && (
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
          <PortalButton
            label="Update payment method"
            className="shrink-0 text-xs font-semibold text-red-400 underline hover:text-red-300"
          />
        </div>
      )}

      {/* Existing legacy subscriber note */}
      {isLegacySubscriber && (
        <div
          className="mb-8 rounded-2xl p-4 text-center text-sm"
          style={{
            background: "color-mix(in srgb, var(--icon-green) 8%, var(--card))",
            border: "1px solid color-mix(in srgb, var(--icon-green) 25%, transparent)",
          }}
        >
          <p className="font-semibold" style={{ color: "var(--icon-green)" }}>
            You&apos;re on an active{" "}
            {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} plan.
          </p>
          <p className="mt-1 text-muted-foreground">
            Manage your subscription, billing, and plan changes from{" "}
            <Link href="/account" className="underline hover:text-foreground">
              your account
            </Link>
            .
          </p>
        </div>
      )}

      {/* ── A. Hero strip ──────────────────────────────────────────────── */}
      <div className="mb-12 text-center">
        <div
          className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
          style={{
            background: "color-mix(in srgb, var(--icon-lime) 15%, transparent)",
            color: "var(--icon-green)",
          }}
        >
          One clear path to a healthier food system
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground sm:text-5xl">
          Improve your inner food system{" "}
          <span
            style={{
              background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            in 30 days.
          </span>
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Take the free EatoBiotics Assessment, discover your Feed · Seed · Heal scores, and get a
          personalised plan to improve your gut health — starting today.
        </p>
      </div>

      {/* ── 4-step journey strip ──────────────────────────────────────── */}
      <div className="mb-12 overflow-hidden rounded-3xl border bg-card">
        <div
          className="h-1 w-full"
          style={{
            background:
              "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-orange))",
          }}
        />
        <div className="grid gap-0 divide-y sm:grid-cols-4 sm:divide-x sm:divide-y-0 divide-border">
          {[
            {
              icon: ClipboardList,
              step: "01",
              label: "Assess",
              desc: "Take the free 15-question assessment — no account needed.",
              color: "var(--icon-lime)",
            },
            {
              icon: BarChart2,
              step: "02",
              label: "Score",
              desc: "Get your EatoBiotics Score across Feed · Seed · Heal — free.",
              color: "var(--icon-green)",
            },
            {
              icon: FileText,
              step: "03",
              label: "Report",
              desc: "Unlock your Personal Report and 30-day plan for €49.",
              color: "var(--icon-teal)",
            },
            {
              icon: Calendar,
              step: "04",
              label: "30 Days",
              desc: "Follow your plan with a free 30-day EatoBiotics account.",
              color: "var(--icon-orange)",
            },
          ].map(({ icon: Icon, step, label, desc, color }) => (
            <div key={step} className="flex gap-3 p-5">
              <div className="mt-0.5 shrink-0">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
                >
                  <Icon size={15} style={{ color }} />
                </div>
              </div>
              <div>
                <p
                  className="mb-0.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color }}
                >
                  {step} — {label}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── B. Main offer (€49) ────────────────────────────────────────── */}
      <div
        className="relative mb-6 overflow-hidden rounded-3xl border-2 bg-card shadow-xl"
        style={{
          borderColor: "color-mix(in srgb, var(--icon-teal) 50%, transparent)",
        }}
      >
        {/* Gradient top bar */}
        <div
          className="h-1.5 w-full"
          style={{
            background:
              "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))",
          }}
        />

        <div className="px-6 py-8 sm:px-10 sm:py-10">
          {/* Label + price */}
          <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p
                className="mb-1 text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--icon-teal)" }}
              >
                Personal Report
              </p>
              <h2 className="font-serif text-3xl font-bold text-foreground">
                EatoBiotics Personal Report
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Everything you need to understand and improve your inner food system in 30 days.
              </p>
            </div>
            <div className="shrink-0 sm:text-right">
              <p className="font-serif text-4xl font-bold text-foreground">€49</p>
              <p className="text-xs text-muted-foreground">one-time payment</p>
            </div>
          </div>

          {/* Feature list */}
          <div className="mb-8 grid gap-2.5 sm:grid-cols-2">
            {[
              "Your EatoBiotics Score analysis",
              "Full Feed · Seed · Heal breakdown",
              "Your top 10 food recommendations",
              "30-day gut reset plan",
              "Weekly shopping framework",
              "Meal timing and food rhythm guidance",
              "Food swaps and avoid/reduce list",
              "Free 30-day EatoBiotics account",
            ].map((f) => (
              <div key={f} className="flex items-start gap-2.5">
                <Check size={14} className="mt-0.5 shrink-0" style={{ color: "var(--icon-teal)" }} />
                <span className="text-sm text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <ReportButton isLoggedIn={isLoggedIn} />

          {!isLoggedIn && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Take the free assessment first — your report purchase is the final step.
            </p>
          )}
        </div>
      </div>

      {/* ── C. The 30-day account (free after purchase) ────────────────── */}
      <div
        className="mb-6 rounded-3xl border bg-card px-6 py-7 sm:px-10"
        style={{
          background: "color-mix(in srgb, var(--icon-lime) 5%, var(--card))",
        }}
      >
        <p
          className="mb-1 text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--icon-green)" }}
        >
          Included with your report
        </p>
        <h3 className="mb-1 font-serif text-xl font-bold text-foreground">
          Free 30-Day EatoBiotics Account
        </h3>
        <p className="mb-5 text-sm text-muted-foreground">
          After your report is ready, you get a free 30-day account to follow your plan.
          No subscription required to get started.
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {[
            "Your EatoBiotics Score dashboard",
            "Week-by-week 30-day plan",
            "Daily food focus and action",
            "Progress check-ins",
            "Weekly email guidance",
            "Food and meal tracking",
          ].map((f) => (
            <div key={f} className="flex items-start gap-2.5">
              <Check
                size={14}
                className="mt-0.5 shrink-0"
                style={{ color: "var(--icon-lime)" }}
              />
              <span className="text-sm text-muted-foreground">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── D. After 30 days — €24.99/month ────────────────────────────── */}
      <div className="mb-12 overflow-hidden rounded-3xl border bg-card">
        <div className="px-6 py-7 sm:px-10">
          <p
            className="mb-1 text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--icon-green)" }}
          >
            After 30 days — optional
          </p>
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-foreground">
                Continue Your Journey
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep the momentum going with a monthly EatoBiotics Member plan.
              </p>
            </div>
            <div className="shrink-0 sm:text-right">
              <p className="font-serif text-2xl font-bold text-foreground">€24.99<span className="text-base font-normal text-muted-foreground">/month</span></p>
              <p className="text-xs text-muted-foreground">cancel any time</p>
            </div>
          </div>

          <div className="mb-5 grid gap-2 sm:grid-cols-2">
            {[
              "Monthly updated EatoBiotics Score",
              "New 30-day focus plan each month",
              "Weekly personalised food guidance",
              "Monthly progress report (included)",
              "Ongoing food recommendations",
              "Priority access to new features",
            ].map((f) => (
              <div key={f} className="flex items-start gap-2.5">
                <Check
                  size={14}
                  className="mt-0.5 shrink-0"
                  style={{ color: "var(--icon-green)" }}
                />
                <span className="text-sm text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <MemberButton isLoggedIn={isLoggedIn} />
            <button
              className="w-full rounded-full border py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted sm:max-w-[180px]"
              onClick={() => {
                posthog.capture("annual_interest_clicked")
              }}
            >
              Annual: €249/yr
              <span
                className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
              >
                Save €50
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── E. FAQ ────────────────────────────────────────────────────── */}
      <div className="mb-12">
        <h2 className="mb-5 text-center font-serif text-2xl font-bold text-foreground">
          Common questions
        </h2>
        <div className="flex flex-col gap-3">
          {FAQS.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>

      {/* ── F. Trust strip ────────────────────────────────────────────── */}
      <div
        className="rounded-2xl px-6 py-5 text-center text-sm text-muted-foreground"
        style={{ background: "color-mix(in srgb, var(--muted) 60%, transparent)" }}
      >
        <p>
          EatoBiotics is designed for education and personal food-system guidance.{" "}
          <strong>Not medical advice.</strong> If you have a health condition, consult a qualified
          healthcare professional before making dietary changes.
        </p>
        <p className="mt-2 text-xs">
          All payments handled securely by Stripe. Cancel any time — no lock-in.
        </p>
      </div>

      {/* Legacy subscriber management (hidden from public, shown only if on old plan) */}
      {(isLegacySubscriber || isPastDue) && (
        <div className="mt-10 border-t pt-8 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Legacy plan management
          </p>
          <p className="mb-4 text-sm text-muted-foreground">
            You&apos;re on a legacy EatoBiotics subscription. Manage billing, cancel, or change your
            plan from the Stripe portal.
          </p>
          <PortalButton
            label="Manage my subscription →"
            className="text-sm font-semibold text-foreground underline hover:text-muted-foreground"
          />
        </div>
      )}
    </div>
  )
}
