"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import type { AssessmentResult } from "@/lib/assessment-scoring"

interface PersonalReportCtaProps {
  result: AssessmentResult
}

const REPORT_FEATURES = [
  "Full gut health score breakdown",
  "Your 30-day gut reset plan",
  "Top 10 food recommendations",
  "Weekly shopping framework",
  "Meal timing guidance",
  "Food swaps and avoid/reduce list",
  "Free 30-day EatoBiotics account",
]

export function PersonalReportCta({ result }: PersonalReportCtaProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePurchase() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: "personal",
          overall: result.overall,
          profile: result.profile.type,
          subScores: result.subScores,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout. Please try again.")
        return
      }

      window.location.href = data.url
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <p
          className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ color: "var(--icon-green)" }}
        >
          Next Step
        </p>
        <h3 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          Unlock your full 30-day plan
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-md mx-auto">
          Your free score is the starting point. Your Personal Report is where the real change begins.
        </p>
      </div>

      {/* Report card */}
      <div className="rounded-3xl border-2 border-[var(--icon-green)]/30 bg-card overflow-hidden">
        <div
          className="h-1.5 w-full"
          style={{
            background:
              "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))",
          }}
        />
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-sm font-bold text-foreground">Personal EatoBiotics Report</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                AI-generated from your assessment. Yours forever.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className="font-serif text-4xl font-bold"
                style={{ color: "var(--icon-green)" }}
              >
                €49
              </p>
              <p className="text-xs text-muted-foreground">one time</p>
            </div>
          </div>

          <ul className="mb-6 space-y-2.5">
            {REPORT_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/80">
                <Check size={14} className="shrink-0" style={{ color: "var(--icon-green)" }} />
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background:
                "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
            }}
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Redirecting…
              </>
            ) : (
              <>
                Generate My Personal Report <ArrowRight size={16} />
              </>
            )}
          </button>

          {error && (
            <p className="mt-3 text-center text-sm text-destructive">{error}</p>
          )}
        </div>
      </div>

      {/* Membership continuation */}
      <div
        className="rounded-2xl px-5 py-4"
        style={{ background: "color-mix(in srgb, var(--icon-teal) 6%, transparent)" }}
      >
        <p className="text-xs font-semibold text-foreground mb-1">
          After your 30 days — continue with EatoBiotics Member
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Monthly score updates, new 30-day plans, and ongoing food guidance — €24.99/month, cancel anytime.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: "var(--icon-teal)" }}
        >
          See what&apos;s included <ArrowRight size={11} />
        </Link>
      </div>

      <p className="text-center text-xs text-muted-foreground/50">
        Secure payment via Stripe · Instant access · No subscription required
      </p>
    </div>
  )
}
