"use client"

import { useState } from "react"
import { Share2, Copy, Check, MessageCircle, Image as ImageIcon } from "lucide-react"
import posthog from "posthog-js"
import type { StabilityScore } from "@/lib/stability/types"

/* ── Stability Share Card ────────────────────────────────────────────────
   Shown on the Stability results page. Lets the user copy a pre-written
   share snippet, share via the native share sheet, or open a branded score
   card image they can save + post. Mirrors components/assessment/
   share-score-card.tsx for the Biotics assessment.
────────────────────────────────────────────────────────────────────── */

interface StabilityShareCardProps {
  score: StabilityScore
}

export function StabilityShareCard({ score }: StabilityShareCardProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const { totalScore, band } = score

  const shareText = `My digestive stability score is ${totalScore}/100 — "${band}". Check your gut's stability in 3 minutes:`

  const shareUrl = typeof window !== "undefined"
    ? window.location.origin + "/stability"
    : "https://eatobiotics.com/stability"

  const ogCardUrl =
    `/api/og/stability?score=${totalScore}&band=${encodeURIComponent(band)}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
      posthog.capture("score_shared", { method: "clipboard", product: "stability", score: totalScore, band })
    } catch {
      // fallback — select the text
    }
  }

  async function handleNativeShare() {
    if (!navigator.share) return
    try {
      await navigator.share({
        title: "My Digestive Stability Score — EatoBiotics Stability™",
        text:  shareText,
        url:   shareUrl,
      })
      posthog.capture("score_shared", { method: "native", product: "stability", score: totalScore, band })
    } catch {
      // user dismissed, ignore
    }
  }

  function handleShareImage() {
    window.open(ogCardUrl, "_blank", "noopener")
    posthog.capture("score_shared", { method: "image", product: "stability", score: totalScore, band })
  }

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
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
            <p className="text-xs text-muted-foreground">Help someone find their stability baseline</p>
          </div>
        </div>
        <div
          className="rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
        >
          {totalScore}/100 · {band}
        </div>
      </button>

      {/* Expanded state */}
      {expanded && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
          {/* Pre-written text */}
          <div className="rounded-xl bg-secondary/20 p-4">
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
                  Copy text
                </>
              )}
            </button>

            <button
              onClick={handleShareImage}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold transition-all hover:bg-secondary/60"
            >
              <ImageIcon size={13} />
              Share image
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
            Your individual answers stay private — only the score and band are shared.
          </p>
        </div>
      )}
    </div>
  )
}
