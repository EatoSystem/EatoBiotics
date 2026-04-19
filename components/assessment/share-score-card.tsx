"use client"

import { useState } from "react"
import { Share2, Copy, Check, MessageCircle } from "lucide-react"
import posthog from "posthog-js"
import type { AssessmentResult } from "@/lib/assessment-scoring"

/* ── Share Score Card ────────────────────────────────────────────────────
   Shown at the top of the results page.
   Lets the user copy a pre-written social share snippet or the direct link.
   Drives organic word-of-mouth without requiring any backend.
────────────────────────────────────────────────────────────────────── */

interface ShareScoreCardProps {
  result: AssessmentResult
}

export function ShareScoreCard({ result }: ShareScoreCardProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const { overall, profile, subScores } = result

  const weakestKey = Object.entries(subScores).sort(([, a], [, b]) => a - b)[0][0]
  const weakestLabels: Record<string, string> = {
    diversity: "Plant Diversity",
    feeding: "Feeding",
    adding: "Live Foods",
    consistency: "Consistency",
    feeling: "Feeling",
  }
  const weakestLabel = weakestLabels[weakestKey] ?? weakestKey

  const shareText = `I just checked my Food System Score on EatoBiotics — ${overall}/100 (${profile.type}). My weakest pillar is ${weakestLabel}. Turns out most people score below 60 without knowing it. Check yours:`

  const shareUrl = typeof window !== "undefined" ? window.location.origin + "/assessment" : "https://eatobiotics.com/assessment"

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
      posthog.capture("score_shared", { method: "clipboard", score: overall })
    } catch {
      // fallback — select the text
    }
  }

  async function handleNativeShare() {
    if (!navigator.share) return
    try {
      await navigator.share({
        title: "My Food System Score — EatoBiotics",
        text: shareText,
        url: shareUrl,
      })
      posthog.capture("score_shared", { method: "native", score: overall })
    } catch {
      // user dismissed, ignore
    }
  }

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share

  return (
    <div className="rounded-2xl border border-border bg-background overflow-hidden">
      {/* Collapsed trigger */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-secondary/30"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--icon-green)]/12">
            <Share2 size={15} style={{ color: "var(--icon-green)" }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Share your score</p>
            <p className="text-xs text-muted-foreground">Spread the word — one click copy</p>
          </div>
        </div>
        <div
          className="rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
        >
          {overall}/100
        </div>
      </button>

      {/* Expanded state */}
      {expanded && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
          {/* Pre-written text */}
          <div className="rounded-xl bg-secondary/40 p-4">
            <p className="text-sm leading-relaxed text-foreground">
              {shareText}{" "}
              <span className="text-muted-foreground">{shareUrl}</span>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold transition-all hover:bg-secondary/60"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-[var(--icon-green)]" />
                  <span className="text-[var(--icon-green)]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  Copy to clipboard
                </>
              )}
            </button>

            {canNativeShare && (
              <button
                onClick={handleNativeShare}
                className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold transition-all hover:bg-secondary/60"
              >
                <MessageCircle size={13} />
                Share via…
              </button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground/50">
            Help someone you know discover their gut health baseline — it only takes 2 minutes.
          </p>
        </div>
      )}
    </div>
  )
}
