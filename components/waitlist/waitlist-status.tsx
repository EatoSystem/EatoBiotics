"use client"

/**
 * Live "skip the line" panel: shows the lead's waitlist position, referral
 * progress toward the founding-member unlock, and the share UI. Fetches
 * /api/waitlist/status?code= on mount. Used on the quiz done screen and the
 * /discover/[code] mini-report page.
 */

import { useEffect, useState } from "react"
import { Trophy, Users } from "lucide-react"
import { ShareResult } from "@/components/waitlist/share-result"
import { REFERRAL_JUMP } from "@/lib/waitlist-referral"
import { useTranslations } from "@/components/i18n/locale-provider"
import { interpolate } from "@/lib/i18n/config"

interface Status {
  position: number
  total: number
  referralCount: number
  threshold: number
  unlocked: boolean
  rewardCode: string | null
}

interface WaitlistStatusProps {
  shareCode: string
  shareUrl: string
  profileType: string
  overall: number
}

export function WaitlistStatus({ shareCode, shareUrl, profileType, overall }: WaitlistStatusProps) {
  const t = useTranslations().waitlist.status
  const [status, setStatus] = useState<Status | null>(null)

  useEffect(() => {
    let alive = true
    fetch(`/api/waitlist/status?code=${encodeURIComponent(shareCode)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d?.ok) setStatus(d as Status) })
      .catch(() => {})
    return () => { alive = false }
  }, [shareCode])

  const remaining = status ? Math.max(0, status.threshold - status.referralCount) : 0
  const pct = status ? Math.min(100, Math.round((status.referralCount / status.threshold) * 100)) : 0

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_2px_12px_rgba(26,46,18,0.05)]">
      <div className="h-1.5 w-full brand-gradient" />
      <div className="p-6 text-center">
        {/* Position */}
        <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--icon-green)]">
          <Users size={14} /> {t.eyebrow}
        </div>
        <p className="mt-2 font-serif text-4xl font-bold text-foreground">
          {status ? <>#{status.position.toLocaleString()}</> : <span className="text-muted-foreground">…</span>}
        </p>
        {status && (
          <p className="mt-1 text-sm text-muted-foreground">
            {interpolate(t.ofTotal, { total: status.total.toLocaleString(), jump: REFERRAL_JUMP })}
          </p>
        )}

        {/* Unlock progress / reward */}
        <div className="mt-6 rounded-2xl border border-border p-4 text-left"
          style={{ background: "color-mix(in srgb, var(--icon-green) 5%, transparent)" }}>
          {status?.unlocked ? (
            <div className="flex items-start gap-3">
              <Trophy size={18} className="mt-0.5 shrink-0 text-[var(--icon-yellow)]" />
              <div>
                <p className="text-sm font-bold text-foreground">{t.unlockedTitle}</p>
                {status.rewardCode ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {(() => {
                      const [before, after] = t.yourCode.split("{code}")
                      return <>{before}<span className="font-mono font-bold text-foreground">{status.rewardCode}</span>{after}</>
                    })()}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">{t.codeEmail}</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">
                  {status ? interpolate(t.inviteMore, { n: remaining }) : t.inviteGeneric}
                </span>
                {status && <span className="tabular-nums text-muted-foreground">{status.referralCount}/{status.threshold}</span>}
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full brand-gradient transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
              </div>
            </>
          )}
        </div>

        {/* Share */}
        <div className="mt-5">
          <ShareResult shareUrl={shareUrl} profileType={profileType} overall={overall} compact />
        </div>
      </div>
    </div>
  )
}
