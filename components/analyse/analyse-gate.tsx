"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useFeatureGate } from "@statsig/react-bindings"
import { logEvent } from "@/lib/statsig-client"
import { GuestScanFlow } from "./guest-scan-flow"

interface AnalyseGateProps {
  membershipTier: "free" | "trial" | "member" | "grow" | "restore" | "transform"
  isLoggedIn: boolean
  /** Lifetime scan count for free users — used to allow the first free scan */
  lifetimeCount?: number
  children: React.ReactNode
}

/**
 * Wraps the analyse page content with tier-based gating.
 *
 * - Not logged in: renders children; a modal intercepts submit attempts
 * - Logged in, free tier, 0 lifetime scans + gate ON: renders children (free first scan)
 * - Logged in, free tier, scan used OR gate OFF: upsell gate (no upload shown)
 * - Paid member: renders children normally
 *
 * Statsig gates wired here:
 *   free_first_meal_scan — kill switch for the free-first-scan feature
 */
export function AnalyseGate({ membershipTier, isLoggedIn, lifetimeCount = 0, children }: AnalyseGateProps) {
  // Feature gate: free_first_meal_scan
  // When ON  → free users get their first scan for free (existing behaviour).
  // When OFF → all free users see the upsell wall (kill switch).
  // Default in Statsig (gate not created yet) → false → upsell shown.
  // Create this gate in Statsig and enable it to activate the free-scan feature.
  const { value: freeScanGateOn } = useFeatureGate("free_first_meal_scan")

  // ── Logged-in free users ──────────────────────────────────────────────────
  if (isLoggedIn && membershipTier === "free") {
    // First-time scan AND gate enabled: show the scan with a "free scan" banner
    if (lifetimeCount === 0 && freeScanGateOn) {
      return (
        <>
          {/* Free first scan banner */}
          <div
            className="mb-5 flex items-start gap-3 rounded-2xl px-5 py-4"
            style={{
              background: "color-mix(in srgb, var(--icon-lime) 8%, var(--card))",
              border: "1px solid color-mix(in srgb, var(--icon-lime) 25%, transparent)",
            }}
          >
            <span className="text-xl leading-none mt-0.5">🎁</span>
            <div>
              <p className="text-sm font-semibold text-foreground">Your free meal scan</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Scan one meal for free — no subscription needed. Upgrade to track daily.
              </p>
            </div>
          </div>
          {children}
        </>
      )
    }

    // Scan already used, OR gate is OFF — show upsell wall and fire paywall_seen
    return (
      <PaywallGate reason={lifetimeCount > 0 ? "scan_used" : "gate_disabled"} />
    )
  }

  // ── Guest (not logged in) ─────────────────────────────────────────────────
  // Show the full guest scan flow — one free scan with email capture
  if (!isLoggedIn) {
    return <GuestScanFlow />
  }

  // ── Paid member ───────────────────────────────────────────────────────────
  // Both free-tier branches return early above; a paying member has full access.
  return <>{children}</>
}

/* ── Paywall gate — fires paywall_seen on mount ──────────────────────── */

function PaywallGate({ reason }: { reason: string }) {
  // Fire paywall_seen once when this component mounts
  useEffect(() => {
    logEvent("paywall_seen", undefined, { reason, page: "analyse" })
  }, [reason])

  return (
    <div
      className="rounded-3xl p-8 text-center sm:p-12"
      style={{
        background: "color-mix(in srgb, var(--icon-lime) 6%, var(--card))",
        border: "1px solid color-mix(in srgb, var(--icon-lime) 25%, transparent)",
      }}
    >
      <span
        className="inline-flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
        style={{ background: "color-mix(in srgb, var(--icon-lime) 15%, transparent)" }}
      >
        🌿
      </span>
      <h2 className="mt-4 font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Ready to track daily?
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-base text-muted-foreground">
        You&apos;ve used your free scan. Become a Member for €24.99/month to get unlimited meal
        analyses with full biotic breakdowns and personalised food recommendations.
      </p>
      <Link
        href="/pricing"
        className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
      >
        Become a Member <ArrowRight size={14} />
      </Link>
      <p className="mt-4 text-xs text-muted-foreground/60">
        Already a member?{" "}
        <Link href="/account" className="underline hover:text-foreground">
          Check your account
        </Link>
      </p>
    </div>
  )
}

/* ── Guest interceptor — captures submit click and shows auth modal ── */

function GuestInterceptor({
  onAuthRequired,
  children,
}: {
  onAuthRequired: () => void
  children: React.ReactNode
}) {
  return (
    <div
      onClickCapture={(e) => {
        const target = e.target as HTMLElement
        // Intercept form submit buttons and file inputs
        if (
          target.closest("button[type='submit']") ||
          target.closest("input[type='file']") ||
          target.closest("[data-analyse-submit]")
        ) {
          e.stopPropagation()
          e.preventDefault()
          onAuthRequired()
        }
      }}
    >
      {children}
    </div>
  )
}

