"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, CalendarDays, RefreshCw, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface Review {
  id: string
  month: string
  content: string | null
  score_start: number | null
  score_end: number | null
  created_at: string
}

interface MonthlyReviewClientProps {
  reviews: Review[]
}

function monthLabel(month: string) {
  return new Date(month + "-02").toLocaleDateString("en-IE", {
    month: "long",
    year: "numeric",
  })
}

function ScoreChip({ score, label }: { score: number | null; label: string }) {
  if (score == null) return null
  const color =
    score >= 70 ? "var(--icon-green)" : score >= 50 ? "var(--icon-yellow)" : "var(--icon-orange)"
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-serif text-2xl font-bold tabular-nums" style={{ color }}>
        {score}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

export function MonthlyReviewClient({ reviews }: MonthlyReviewClientProps) {
  const [allReviews, setAllReviews] = useState<Review[]>(reviews)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeIdx, setActiveIdx] = useState(0)

  const latest = allReviews[activeIdx] ?? null

  async function generate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch("/api/monthly-review/generate", { method: "POST" })
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: "Request failed" })) as { error?: string }
        throw new Error(d.error ?? "Generation failed")
      }
      const d = await res.json() as { review?: Review }
      if (d.review) {
        setAllReviews((prev) => [d.review!, ...prev])
        setActiveIdx(0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Back */}
      <Link
        href="/account"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft size={14} /> My Account
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color: "var(--icon-green)" }}
          >
            Transform Feature
          </p>
          <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">
            Monthly Review
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your monthly food system reflection — generated automatically on the 1st.
          </p>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className={cn(
            "shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90",
            generating && "opacity-60 cursor-not-allowed"
          )}
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
        >
          <RefreshCw size={13} className={generating ? "animate-spin" : ""} />
          {generating ? "Generating…" : "Generate"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-4 rounded-2xl p-4 text-sm"
          style={{
            background: "color-mix(in srgb, var(--icon-orange) 10%, var(--card))",
            border: "1px solid color-mix(in srgb, var(--icon-orange) 30%, transparent)",
            color: "var(--icon-orange)",
          }}
        >
          {error}
        </div>
      )}

      {/* No reviews yet */}
      {allReviews.length === 0 && !generating && (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "color-mix(in srgb, var(--icon-green) 12%, transparent)" }}
          >
            <CalendarDays size={24} style={{ color: "var(--icon-green)" }} />
          </div>
          <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
            No reviews yet
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
            Monthly reviews are generated automatically on the 1st of each month. You can also generate one now.
          </p>
          <button
            onClick={generate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
          >
            <Sparkles size={14} /> Generate This Month&apos;s Review
          </button>
        </div>
      )}

      {/* Generating state */}
      {generating && (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <div
            className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-muted"
            style={{ borderTopColor: "var(--icon-green)" }}
          />
          <p className="text-sm text-muted-foreground">Generating your review…</p>
          <p className="text-xs text-muted-foreground/60 mt-1">This takes about 15 seconds</p>
        </div>
      )}

      {/* Review tabs (multiple months) */}
      {allReviews.length > 1 && !generating && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {allReviews.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setActiveIdx(i)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                i === activeIdx
                  ? "text-white"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
              style={
                i === activeIdx
                  ? { background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }
                  : undefined
              }
            >
              {monthLabel(r.month)}
            </button>
          ))}
        </div>
      )}

      {/* Latest review */}
      {latest && !generating && (
        <div className="space-y-4">
          {/* Score comparison */}
          {(latest.score_start != null || latest.score_end != null) && (
            <div
              className="flex items-center gap-6 rounded-2xl p-4"
              style={{
                background: "color-mix(in srgb, var(--icon-green) 6%, var(--card))",
                border: "1px solid color-mix(in srgb, var(--icon-green) 18%, var(--border))",
              }}
            >
              <ScoreChip score={latest.score_start} label="Month start" />
              {latest.score_start != null && latest.score_end != null && (
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              )}
              <ScoreChip score={latest.score_end} label="Month end" />
            </div>
          )}

          {/* Review content */}
          <div
            className="rounded-2xl border bg-card p-6"
            style={{ borderTopWidth: "3px", borderTopColor: "var(--icon-green)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays size={15} style={{ color: "var(--icon-green)" }} />
              <p className="text-sm font-semibold text-foreground">{monthLabel(latest.month)}</p>
            </div>
            {latest.content ? (
              <div className="space-y-4">
                {latest.content.split("\n\n").map((para, i) => (
                  <p
                    key={i}
                    className="text-sm leading-relaxed text-foreground"
                    style={{ lineHeight: "1.75" }}
                  >
                    {para}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No content generated for this month.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
