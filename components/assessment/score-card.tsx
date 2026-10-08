"use client"

import { useState } from "react"
import { Share2, Copy, Check, ExternalLink } from "lucide-react"

interface ScoreCardProps {
  score: number
  profile: string
}

export function ScoreCard({ score, profile }: ScoreCardProps) {
  const [copied, setCopied] = useState(false)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"

  // Was https://eatobiotics.com/score?… — a route that has never existed, with no
  // rewrite pointing at it, so every score anyone shared led to a 404. The score
  // itself travels in the share text and the card image; the link's job is to send
  // the recipient somewhere they can get their own.
  const shareUrl = `${siteUrl}/assessment`

  // The parameter names here must match what app/api/score-card/route.tsx reads.
  // They did not: this sent prebiotics/probiotics/postbiotics while the route read
  // feed/seed/heal, so every generated card rendered 0 / 0 / 0. The route now
  // accepts both spellings, which also repairs cards shared before this fix.
  //
  // The three sub-scores are no longer SENT, because the image no longer renders
  // them — a number per Biotic is a personal biological claim. The route keeps
  // parsing both spellings regardless, so links shared before this still resolve;
  // it simply has nothing to draw with them.
  const ogImageUrl = `${siteUrl}/api/score-card?score=${score}&profile=${encodeURIComponent(profile)}`

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `My Biotics Score: ${score}/100`,
          text: `My Biotics Score is ${score}/100 — ${profile}. Take the free Food System Assessment to discover yours.`,
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } catch {
      // Fallback: just copy
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } catch {
        // ignore
      }
    }
  }

  const pillars = [
    { label: "Prebiotics", color: "var(--icon-lime)" },
    { label: "Probiotics", color: "var(--icon-teal)" },
    { label: "Postbiotics", color: "var(--icon-yellow)" },
  ]

  const scoreColor =
    score >= 80 ? "var(--icon-green)"
    : score >= 65 ? "var(--icon-teal)"
    : score >= 50 ? "var(--icon-lime)"
    : score >= 35 ? "var(--icon-yellow)"
    : "var(--icon-orange)"

  return (
    <div className="rounded-3xl border bg-card overflow-hidden">
      {/* Top gradient bar */}
      <div
        className="h-1.5 w-full"
        style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }}
      />

      <div className="p-6">
        {/* Score card preview (dark) */}
        <div
          className="mb-5 rounded-2xl px-6 py-5"
          style={{ background: "#0f1a13" }}
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[3px] text-white/40">EatoBiotics</p>
              <p className="text-sm font-semibold text-white/70">3 Biotics</p>
            </div>
            <span
              className="rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{
                background: "rgba(76,175,125,0.15)",
                border: "1px solid rgba(76,175,125,0.35)",
                color: "#4caf7d",
              }}
            >
              {profile}
            </span>
          </div>

          {/* Score + bars */}
          <div className="flex items-center gap-6">
            {/* Big score */}
            <div className="shrink-0">
              <p
                className="font-serif text-7xl font-bold leading-none"
                style={{ color: scoreColor }}
              >
                {score}
              </p>
              <p className="mt-1 text-xs text-white/30">/100</p>
            </div>

            {/* The three Biotics, named — with no personal number.
              *
              * This rendered a bar and a value per Biotic, and the share text
              * read "My Prebiotics, Probiotics, and Postbiotics scores are X,
              * Y, Z". A per-Biotic number is a personal biological state,
              * which POSTBIOTICS_INFERENCE_BOUNDARY prohibits for Postbiotics
              * by name and which strict ISAPP makes unmeasurable by
              * questionnaire for all three. The Biotics stay — they are the
              * foundation the card is about — and only the claim goes. */}
            <div className="flex flex-1 flex-col gap-2">
              {pillars.map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: color }}
                  />
                  <span className="text-xs font-semibold text-white/60">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 text-[11px] italic text-white/25">
            &ldquo;Improving my inner food system in 30 days.&rdquo;
          </p>
        </div>

        {/* Share controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))" }}
          >
            {copied ? (
              <>
                <Check size={14} /> Link copied!
              </>
            ) : (
              <>
                <Share2 size={14} /> Share my score
              </>
            )}
          </button>

          <button
            onClick={async () => {
              await navigator.clipboard.writeText(shareUrl)
              setCopied(true)
              setTimeout(() => setCopied(false), 2500)
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-muted"
            title="Copy link"
          >
            {copied ? <Check size={14} className="text-icon-green" /> : <Copy size={14} className="text-muted-foreground" />}
          </button>

          <a
            href={ogImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-muted"
            title="Download score card image"
          >
            <ExternalLink size={14} className="text-muted-foreground" />
          </a>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Share your score and invite others to discover theirs
        </p>
      </div>
    </div>
  )
}
