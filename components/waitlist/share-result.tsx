"use client"

/**
 * Share UI for a waitlist Food System result. Lets the visitor copy their link,
 * use the native share sheet, or jump to WhatsApp / X — all pointing at their
 * public mini-report page (/discover/[code]), which carries the OG share card so
 * the link unfurls beautifully. Also acts as the referral link (?ref=code is
 * appended for skip-the-line credit in Phase B).
 */

import { useState } from "react"
import { Share2, Copy, Check, MessageCircle } from "lucide-react"
import posthog from "posthog-js"
import { useTranslations } from "@/components/i18n/locale-provider"
import { interpolate } from "@/lib/i18n/config"

interface ShareResultProps {
  shareUrl: string      // absolute URL to /discover/[code]
  profileType: string
  overall: number
  /** Tighter layout for embedding under the reveal card. */
  compact?: boolean
}

export function ShareResult({ shareUrl, profileType, overall, compact }: ShareResultProps) {
  const t = useTranslations().waitlist.share
  const [copied, setCopied] = useState(false)

  const text = interpolate(t.text, { profile: profileType, score: overall })
  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share

  function track(method: string) {
    try { posthog.capture("waitlist_shared", { method, profile_type: profileType, score: overall }) } catch { /* analytics optional */ }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${text} ${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
      track("clipboard")
    } catch { /* clipboard blocked — ignore */ }
  }

  async function handleNative() {
    if (!navigator.share) return
    try {
      await navigator.share({ title: t.nativeTitle, text, url: shareUrl })
      track("native")
    } catch { /* user dismissed — ignore */ }
  }

  function openWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}`, "_blank", "noopener")
    track("whatsapp")
  }

  function openX() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, "_blank", "noopener")
    track("x")
  }

  const btn = "inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:shadow-md"

  return (
    <div className={compact ? "" : "rounded-2xl border border-border bg-card p-5"}>
      {!compact && (
        <div className="mb-3 flex items-center gap-2">
          <Share2 size={15} style={{ color: "var(--icon-green)" }} />
          <p className="text-sm font-bold text-foreground">{t.heading}</p>
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-2.5">
        {canNativeShare && (
          <button onClick={handleNative} className={btn}>
            <Share2 size={14} /> {t.share}
          </button>
        )}
        <button onClick={openWhatsApp} className={btn}>
          <MessageCircle size={14} style={{ color: "var(--icon-green)" }} /> {t.whatsapp}
        </button>
        <button onClick={openX} className={btn} aria-label={t.post}>
          <span className="text-sm font-bold">𝕏</span> {t.post}
        </button>
        <button onClick={handleCopy} className={btn}>
          {copied ? <><Check size={14} className="text-[var(--icon-green)]" /> {t.copied}</> : <><Copy size={14} /> {t.copyLink}</>}
        </button>
      </div>
    </div>
  )
}
