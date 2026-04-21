"use client"

import { useState } from "react"
import { Share2, Copy, Check, MessageCircle, Image as ImageIcon, Instagram } from "lucide-react"
import posthog from "posthog-js"
import { useFeatureGate } from "@statsig/react-bindings"
import { logEvent } from "@/lib/statsig-client"
import { getPercentile } from "@/lib/percentile"
import { getIdentityLabel } from "@/lib/identity-labels"
import type { AnalysisResult } from "./result-builder"

/* X (Twitter) icon — not in lucide-react */
function XIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
    </svg>
  )
}

/* WhatsApp icon */
function WhatsAppIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

/* ── Share Meal Card ─────────────────────────────────────────────────────
   Collapsible share card rendered after a meal analysis result.
   Mirrors the ShareScoreCard UX pattern from assessment-results.
────────────────────────────────────────────────────────────────────── */

interface ShareMealCardProps {
  result: AnalysisResult
}

export function ShareMealCard({ result }: ShareMealCardProps) {
  const [copied,        setCopied]        = useState(false)
  const [expanded,      setExpanded]      = useState(false)
  const [igCopied,      setIgCopied]      = useState(false)
  const [ugcOptIn,      setUgcOptIn]      = useState(false)
  const [ugcSubmitted,  setUgcSubmitted]  = useState(false)

  // Feature gates
  // share_card_v2    — when ON, shows the platform share buttons (X/WhatsApp/Instagram).
  //                    Turn OFF to hide the social platform section for a subset of users.
  // percentile_copy_v2 — when ON, uses the v2 percentile phrasing in the share text.
  //                      Create in Statsig and enable to test alternate copy.
  const { value: shareCardV2 }      = useFeatureGate("share_card_v2")
  const { value: percentileCopyV2 } = useFeatureGate("percentile_copy_v2")

  const score         = Math.round(result.score)
  const percentile    = getPercentile(score)
  const identityLabel = getIdentityLabel(score)

  // Top 5 food emojis (high-confidence foods first, then all others)
  const topFoods = [
    ...result.foods.filter((f) => f.confidence === "high"),
    ...result.foods.filter((f) => f.confidence !== "high"),
  ].slice(0, 5)

  const foodEmojiStr = topFoods.map((f) => f.emoji).join("")

  // Biotic params
  const pre  = result.prebioticStrength ?? "low"
  const pro  = result.foods.some((f) => f.biotic === "probiotic")  ? "1" : "0"
  const post = result.foods.some((f) => f.biotic === "postbiotic") ? "1" : "0"

  const shareUrl  = typeof window !== "undefined"
    ? window.location.origin + "/analyse"
    : "https://eatobiotics.com/analyse"

  // percentile_copy_v2: alternate phrasing for the percentile claim in share text.
  // V1 (default): "better gut than X% of people"
  // V2 (gate ON) : "top X% for gut diversity"
  const percentileClaim = percentileCopyV2
    ? `top ${100 - percentile}% for gut diversity`
    : `better gut than ${percentile}% of people`

  const shareText =
    `I scanned my meal on EatoBiotics and scored ${score}/100 — ` +
    `I'm a ${identityLabel.word} ${identityLabel.emoji}, ${percentileClaim}. ` +
    (topFoods.length > 0 ? `I tracked: ${foodEmojiStr}. ` : "") +
    `Check yours:`

  const ogCardUrl =
    `/api/og/meal-scan?score=${score}&percentile=${percentile}` +
    `&label=${encodeURIComponent(identityLabel.word)}&emoji=${encodeURIComponent(identityLabel.emoji)}` +
    `&pre=${encodeURIComponent(pre)}&pro=${pro}&post=${post}` +
    (foodEmojiStr ? `&foods=${encodeURIComponent(foodEmojiStr)}` : "")

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
      posthog.capture("meal_shared", {
        method:         "clipboard",
        score,
        identity_label: identityLabel.word,
        percentile,
      })
      // Statsig: share_card_exported
      logEvent("share_card_exported", undefined, { method: "clipboard", score: String(score) })
    } catch {
      // ignore — clipboard access denied
    }
  }

  function handleShareImage() {
    window.open(ogCardUrl, "_blank", "noopener")
    posthog.capture("meal_shared", {
      method:         "image",
      score,
      identity_label: identityLabel.word,
      percentile,
    })
    // Statsig: share_card_exported
    logEvent("share_card_exported", undefined, { method: "image", score: String(score) })
  }

  async function handleNativeShare() {
    if (!navigator.share) return
    try {
      await navigator.share({
        title: `My Gut Meal Score — EatoBiotics`,
        text:  shareText,
        url:   shareUrl,
      })
      posthog.capture("meal_shared", {
        method:         "native",
        score,
        identity_label: identityLabel.word,
        percentile,
      })
    } catch {
      // user dismissed, ignore
    }
  }

  function handleShareX() {
    const xText =
      `I just scanned my meal on @EatoBiotics and scored ${score}/100 🎯\n` +
      `I'm a ${identityLabel.word} ${identityLabel.emoji} — ${percentileClaim}.\n` +
      (foodEmojiStr ? `${foodEmojiStr}\n` : "") +
      `#GutHealth #EatoBiotics`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(xText)}&url=${encodeURIComponent(shareUrl)}`
    window.open(url, "_blank", "noopener")
    posthog.capture("meal_shared", {
      method:         "x",
      score,
      identity_label: identityLabel.word,
      percentile,
    })
    // Statsig: share_card_exported
    logEvent("share_card_exported", undefined, { method: "x", score: String(score) })
    maybeSubmitUgc()
  }

  function handleShareWhatsApp() {
    const waText = `${shareText} ${shareUrl}`
    const url = `https://wa.me/?text=${encodeURIComponent(waText)}`
    window.open(url, "_blank", "noopener")
    posthog.capture("meal_shared", {
      method:         "whatsapp",
      score,
      identity_label: identityLabel.word,
      percentile,
    })
    // Statsig: share_card_exported
    logEvent("share_card_exported", undefined, { method: "whatsapp", score: String(score) })
    maybeSubmitUgc()
  }

  async function handleShareInstagram() {
    const caption =
      `${shareText} ${shareUrl}\n.\n#GutHealth #EatoBiotics #GutMicrobiome`
    try {
      await navigator.clipboard.writeText(caption)
      setIgCopied(true)
      setTimeout(() => setIgCopied(false), 3000)
    } catch {
      // clipboard denied — silently ignore
    }
    posthog.capture("meal_shared", {
      method:         "instagram",
      score,
      identity_label: identityLabel.word,
      percentile,
    })
    // Statsig: share_card_exported
    logEvent("share_card_exported", undefined, { method: "instagram", score: String(score) })
    maybeSubmitUgc()
  }

  async function maybeSubmitUgc() {
    if (!ugcOptIn || ugcSubmitted) return
    try {
      await fetch("/api/social/submit", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          percentile,
          label:     identityLabel.word,
          emoji:     identityLabel.emoji,
          ogCardUrl: ogCardUrl,
        }),
      })
      setUgcSubmitted(true)
    } catch {
      // Non-fatal — ignore submission errors
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
            <p className="text-sm font-semibold text-foreground">Share this meal</p>
            <p className="text-xs text-muted-foreground">Let people know what you ate</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{identityLabel.emoji}</span>
          <div
            className="rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
          >
            {score}/100 · {identityLabel.word}
          </div>
        </div>
      </button>

      {/* Expanded state */}
      {expanded && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
          {/* Identity + percentile summary */}
          <div className="flex items-center gap-3 rounded-xl bg-secondary/40 px-4 py-3">
            <span className="text-2xl">{identityLabel.emoji}</span>
            <div>
              <p className="text-sm font-bold text-foreground">{identityLabel.word}</p>
              <p className="text-xs text-muted-foreground">
                Better gut health than <strong>{percentile}%</strong> of people with typical eating habits
              </p>
            </div>
          </div>

          {/* Pre-written share text */}
          <div className="rounded-xl bg-secondary/20 p-4">
            <p className="text-sm leading-relaxed text-foreground">
              {shareText}{" "}
              <span className="text-muted-foreground">{shareUrl}</span>
            </p>
          </div>

          {/* Action buttons — standard */}
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
              Share meal card
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

          {/* Platform share buttons — shown when share_card_v2 gate is ON */}
          {shareCardV2 && <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Share on
            </p>
            <div className="flex flex-wrap gap-2">
              {/* X (Twitter) */}
              <button
                onClick={handleShareX}
                className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold transition-all hover:bg-secondary/60"
              >
                <XIcon size={12} />
                Post on X
              </button>

              {/* WhatsApp */}
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold transition-all hover:bg-secondary/60"
              >
                <WhatsAppIcon size={13} />
                WhatsApp
              </button>

              {/* Instagram */}
              <button
                onClick={handleShareInstagram}
                className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold transition-all hover:bg-secondary/60"
              >
                {igCopied ? (
                  <>
                    <Check size={13} className="text-[var(--icon-teal)]" />
                    <span className="text-[var(--icon-teal)]">Caption copied!</span>
                  </>
                ) : (
                  <>
                    <Instagram size={13} />
                    Instagram
                  </>
                )}
              </button>
            </div>
            {igCopied && (
              <p className="mt-1.5 text-[11px] text-muted-foreground/70">
                Caption copied — open Instagram and paste it on your story or post.
              </p>
            )}
          </div>}

          {/* UGC opt-in toggle */}
          <label className="flex cursor-pointer items-start gap-3">
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                className="sr-only"
                checked={ugcOptIn}
                onChange={(e) => setUgcOptIn(e.target.checked)}
                disabled={ugcSubmitted}
              />
              <div
                className="flex h-5 w-5 items-center justify-center rounded border transition-colors"
                style={{
                  background: ugcOptIn ? "var(--icon-green)" : "transparent",
                  borderColor: ugcOptIn ? "var(--icon-green)" : "var(--border)",
                }}
              >
                {ugcOptIn && <Check size={11} className="text-white" strokeWidth={3} />}
              </div>
            </div>
            <span className="text-xs text-muted-foreground leading-relaxed">
              {ugcSubmitted
                ? "✓ Submitted to @EatoBiotics — thank you!"
                : "Submit my result to be featured on @EatoBiotics"}
            </span>
          </label>

          <p className="text-[11px] text-muted-foreground/50">
            Inspire someone to check what their meals are doing for their gut health.
          </p>
        </div>
      )}
    </div>
  )
}
