"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Zap, X } from "lucide-react"
import { useFeatureGate } from "@statsig/react-bindings"
import { logEvent } from "@/lib/statsig-client"

interface AnalyseGateProps {
  membershipTier: "free" | "grow" | "restore" | "transform"
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
 * - Paid tier (grow/restore/transform): renders children normally
 *
 * Statsig gates wired here:
 *   free_first_meal_scan — kill switch for the free-first-scan feature
 */
export function AnalyseGate({ membershipTier, isLoggedIn, lifetimeCount = 0, children }: AnalyseGateProps) {
  const [showAuthModal, setShowAuthModal] = useState(false)

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
  // Render children but intercept any submit attempt with an auth modal
  if (!isLoggedIn) {
    return (
      <>
        {/* Auth-required modal */}
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAuthModal(false)}
            />
            <div className="relative w-full max-w-sm rounded-3xl bg-card p-8 shadow-2xl">
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X size={16} />
              </button>
              <span className="text-3xl">🌿</span>
              <h3 className="mt-3 font-serif text-xl font-semibold text-foreground">
                Create a free account to analyse your meals
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Meal analysis is available from the{" "}
                <span className="font-semibold text-foreground">Grow plan — €9.99/month</span>.
                Start with a free assessment to get your Biotics Score first.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/assessment"
                  className="flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
                >
                  Sign Up — it&apos;s free
                </Link>
                <Link
                  href="/pricing"
                  className="flex items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  See Plans
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Render children with an intercepting wrapper */}
        <GuestInterceptor onAuthRequired={() => setShowAuthModal(true)}>
          {children}
        </GuestInterceptor>
      </>
    )
  }

  // ── Paid tier ─────────────────────────────────────────────────────────────
  // Both free-tier branches return early above; membershipTier is paid here.
  return (
    <AnalyseWrapper membershipTier={membershipTier as "grow" | "restore" | "transform"}>
      {children}
    </AnalyseWrapper>
  )
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
        You&apos;ve used your free scan. Upgrade to Grow for €9.99/month to get daily meal
        analyses with full biotic breakdowns and personalised food recommendations.
      </p>
      <Link
        href="/pricing"
        className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
      >
        Upgrade to Grow <ArrowRight size={14} />
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

/* ── Paid tier wrapper — handles post-analysis upgrade prompts ─────── */

function AnalyseWrapper({
  membershipTier,
  children,
}: {
  membershipTier: "grow" | "restore" | "transform"
  children: React.ReactNode
}) {
  return (
    <div>
      {children}
      {/* Contextual upgrade prompts rendered below results */}
      {membershipTier === "grow" && (
        <GrowUpgradePrompt />
      )}
      {membershipTier === "restore" && (
        <RestoreUpgradePrompt />
      )}
    </div>
  )
}

/* ── Contextual upgrade prompts ────────────────────────────────────── */

const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000

function isDismissed(key: string): boolean {
  if (typeof window === "undefined") return false
  const val = localStorage.getItem(`eatobiotics-prompt-dismissed-${key}`)
  return !!val && Date.now() - Number(val) < DISMISS_TTL_MS
}

function dismiss(key: string) {
  localStorage.setItem(`eatobiotics-prompt-dismissed-${key}`, String(Date.now()))
}

function GrowUpgradePrompt() {
  const [visible, setVisible] = useState(!isDismissed("grow_post_analysis"))

  if (!visible) return null

  return (
    <div
      className="mt-6 flex items-start justify-between gap-4 rounded-2xl p-5"
      style={{
        background: "color-mix(in srgb, var(--icon-green) 8%, var(--card))",
        border: "1px solid color-mix(in srgb, var(--icon-green) 20%, transparent)",
      }}
    >
      <div className="flex items-start gap-3">
        <Zap size={16} className="mt-0.5 shrink-0" style={{ color: "var(--icon-green)" }} />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Want to see how this compares to your last 30 days?
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Upgrade to Restore for your full score history and a personalised monthly food system plan.
          </p>
          <Link
            href="/pricing"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ color: "var(--icon-green)" }}
          >
            See Restore <ArrowRight size={11} />
          </Link>
        </div>
      </div>
      <button
        onClick={() => { dismiss("grow_post_analysis"); setVisible(false) }}
        className="shrink-0 text-xs text-muted-foreground/60 hover:text-muted-foreground"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}

function RestoreUpgradePrompt() {
  const [visible, setVisible] = useState(!isDismissed("restore_post_analysis"))

  if (!visible) return null

  return (
    <div
      className="mt-6 flex items-start justify-between gap-4 rounded-2xl p-5"
      style={{
        background: "color-mix(in srgb, var(--icon-teal) 8%, var(--card))",
        border: "1px solid color-mix(in srgb, var(--icon-teal) 20%, transparent)",
      }}
    >
      <div className="flex items-start gap-3">
        <Zap size={16} className="mt-0.5 shrink-0" style={{ color: "var(--icon-teal)" }} />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Have a question about this result?
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Transform members can ask our AI food system consultant anything, any time.
          </p>
          <Link
            href="/pricing"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ color: "var(--icon-teal)" }}
          >
            Ask the advisor <ArrowRight size={11} />
          </Link>
        </div>
      </div>
      <button
        onClick={() => { dismiss("restore_post_analysis"); setVisible(false) }}
        className="shrink-0 text-xs text-muted-foreground/60 hover:text-muted-foreground"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}
