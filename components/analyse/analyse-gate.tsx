"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Zap } from "lucide-react"

interface AnalyseGateProps {
  membershipTier: "free" | "grow" | "restore" | "transform"
  children: React.ReactNode
}

/**
 * Wraps the analyse page content.
 * For free-tier users: checks daily analysis count and shows a soft gate if limit reached.
 * Renders children normally for paid tiers.
 */
export function AnalyseGate({ membershipTier, children }: AnalyseGateProps) {
  const [dailyCount, setDailyCount] = useState<number | null>(null)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  const isFree = membershipTier === "free"

  useEffect(() => {
    if (!isFree) return

    fetch("/api/analyses/daily-count")
      .then((r) => r.json())
      .then((d: { count?: number }) => setDailyCount(d.count ?? 0))
      .catch(() => setDailyCount(0))
  }, [isFree])

  const limitReached = isFree && dailyCount !== null && dailyCount >= 1

  // After analysis completes, show contextual prompt for free users
  function handleAnalysisComplete(score?: number) {
    if (!isFree) return
    // Log to server
    fetch("/api/analyses/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ biotics_score: score }),
    }).catch(() => {})
    setShowUpgradePrompt(true)
  }

  return (
    <div>
      {/* Soft gate banner — shown above upload area when limit reached */}
      {limitReached && (
        <div
          className="mb-6 flex flex-col gap-3 overflow-hidden rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
          style={{ background: "color-mix(in srgb, var(--icon-lime) 10%, var(--card))", border: "1px solid color-mix(in srgb, var(--icon-lime) 30%, transparent)" }}
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-xl leading-none">🌿</span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                You&apos;ve used your free analysis for today
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Upgrade to Grow for unlimited daily analyses and 30-day score tracking.
              </p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
          >
            Upgrade to Grow <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Contextual post-analysis upgrade prompt (dismissable, 7-day cooldown) */}
      {showUpgradePrompt && <UpgradePromptBanner onDismiss={() => setShowUpgradePrompt(false)} />}

      {/* Main content — always rendered (soft gate, never hard block) */}
      {children}
    </div>
  )
}

/* ── Post-analysis upgrade prompt ────────────────────────────────────── */

const DISMISS_KEY = "eatobiotics-prompt-dismissed-score_history_30"
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function UpgradePromptBanner({ onDismiss }: { onDismiss: () => void }) {
  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    onDismiss()
  }

  // Check if already dismissed recently
  const dismissed = typeof window !== "undefined"
    ? localStorage.getItem(DISMISS_KEY)
    : null
  if (dismissed && Date.now() - Number(dismissed) < DISMISS_TTL_MS) return null

  return (
    <div
      className="mb-6 flex items-start justify-between gap-4 rounded-2xl p-5"
      style={{ background: "color-mix(in srgb, var(--icon-green) 10%, var(--card))", border: "1px solid color-mix(in srgb, var(--icon-green) 25%, transparent)" }}
    >
      <div className="flex items-start gap-3">
        <Zap size={16} className="mt-0.5 shrink-0" style={{ color: "var(--icon-green)" }} />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Track how your score changes over 30 days
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Upgrade to Grow to see your Biotics Score history and trend line.
          </p>
          <Link
            href="/pricing"
            className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ color: "var(--icon-green)" }}
          >
            See Grow plan <ArrowRight size={11} />
          </Link>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="shrink-0 text-xs text-muted-foreground/60 hover:text-muted-foreground"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
