"use client"

/* ─────────────────────────────────────────────────────────────────────────
   dashboard-parts.tsx — presentational primitives for the account dashboard.

   Pure, self-contained components extracted from live-dashboard.tsx (which was
   ~2,400 lines). These take explicit props only — no closure over dashboard
   state — so they're safe to share and unit-test in isolation. Behaviour is
   unchanged from the originals.
   ───────────────────────────────────────────────────────────────────────── */

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { Check, ChevronRight, Copy, Dumbbell, Gift } from "lucide-react"

/** GLP-1 Companion entry card — compact, self-selecting. Links to /account/glp1. */
export function Glp1CompanionCard() {
  return (
    <Link href="/account/glp1" className="group block overflow-hidden rounded-2xl transition-shadow hover:shadow-[0_8px_28px_rgba(26,46,18,0.14)]"
      style={{ background: "white", border: "1px solid #ebebeb", boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
      <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange), var(--icon-green))" }} />
      <div className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
          style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
          <Dumbbell size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>GLP-1 Companion</p>
          <h3 className="font-serif text-base font-bold leading-snug" style={{ color: "var(--foreground)" }}>On Ozempic, Wegovy, or Mounjaro?</h3>
          <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>Track your protein and protect muscle while you lose weight.</p>
        </div>
        <ChevronRight size={16} className="shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: "var(--icon-green)" }} />
      </div>
    </Link>
  )
}

/** Refer-a-friend card — surfaces the referral code. Share link → assessment?ref=CODE. */
export function ReferralCard({ code }: { code: string | null }) {
  const [copied, setCopied] = useState(false)
  if (!code) return null

  const shareUrl = `https://eatobiotics.com/assessment?ref=${code}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl" style={{ background: "white", border: "1px solid #ebebeb", boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
      <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}>
            <Gift size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Refer a friend</p>
            <h3 className="font-serif text-base font-bold leading-snug" style={{ color: "var(--foreground)" }}>Share your food system</h3>
            <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>Invite friends to take the free assessment with your link.</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-muted-foreground">
            eatobiotics.com/assessment?ref={code}
          </span>
          <button
            onClick={copy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
            aria-label="Copy referral link"
          >
            {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Score ring — gradient arc. */
export function ScoreRing({ score, size = 96, strokeWidth = 7 }: { score: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <defs>
        <linearGradient id="hero-ring-grad" x1="0" y1="0" x2={size} y2={size} gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#A8E063" />
          <stop offset="30%"  stopColor="#4CB648" />
          <stop offset="60%"  stopColor="#F5C518" />
          <stop offset="100%" stopColor="#F5A623" />
        </linearGradient>
        <linearGradient id="hero-ring-track" x1="0" y1="0" x2={size} y2={size} gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#d4f0b8" />
          <stop offset="100%" stopColor="#fde5b8" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#hero-ring-track)" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#hero-ring-grad)"
        strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s ease" }} />
    </svg>
  )
}

/** Mini ring — gradient arc, unique ID per pillar. */
export function MiniRing({
  score, gradId,
  c0, c1, textColor,
}: {
  score: number; gradId: string; c0: string; c1: string; textColor: string
}) {
  const r = 22; const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div className="relative flex items-center justify-center" style={{ width: 60, height: 60 }}>
      <svg width={60} height={60} viewBox="0 0 60 60" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor={c0} />
            <stop offset="100%" stopColor={c1} />
          </linearGradient>
        </defs>
        <circle cx={30} cy={30} r={r} fill="none" stroke="#e8e8e8" strokeWidth={5} />
        <circle cx={30} cy={30} r={r} fill="none" stroke={`url(#${gradId})`}
          strokeWidth={5} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <span className="relative text-sm font-bold tabular-nums" style={{ color: textColor }}>{score}</span>
    </div>
  )
}

/** Gradient fill for score bars/badges by score band. */
export function barGradient(s: number) {
  if (s >= 60) return "linear-gradient(90deg, var(--icon-lime), var(--icon-green))"
  if (s >= 30) return "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))"
  return "linear-gradient(90deg, var(--icon-orange), var(--destructive))"
}

export function labelColor(s: number) {
  if (s >= 60) return "#2d6b0e"; if (s >= 30) return "#a05a0a"; return "#b91c1c"
}

export function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-sm" style={{ color: "var(--muted-foreground)" }}>{label}</span>
      <div className="flex-1 overflow-hidden rounded-full" style={{ height: "7px", background: "#ebebeb" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: barGradient(score) }} />
      </div>
      <span className="w-7 text-right text-sm font-bold tabular-nums" style={{ color: labelColor(score) }}>{score}</span>
    </div>
  )
}

/** Score badge — compact pill. */
export function ScoreBadge({ score }: { score: number }) {
  return (
    <span className="rounded-full px-2.5 py-0.5 text-sm font-bold tabular-nums text-white"
      style={{ background: barGradient(score) }}>
      {score}
    </span>
  )
}

/** Gradient tag pill — branded, not grey. */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{ borderColor: "var(--icon-green)", color: "var(--icon-green)", background: "white" }}>
      {children}
    </span>
  )
}

/** Section label with gradient dot accent. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="h-2 w-2 rounded-full" style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))" }} />
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
        {children}
      </p>
    </div>
  )
}

/** Gradient CTA button. */
export function GradientButton({ children, onClick, fullWidth, small }: {
  children: ReactNode; onClick?: () => void; fullWidth?: boolean; small?: boolean
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] ${fullWidth ? "w-full" : ""} ${small ? "px-4 py-2 text-xs" : "px-5 py-3 text-sm"}`}
      style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", boxShadow: "0 4px 14px rgba(45,170,110,0.30)" }}>
      {children}
    </button>
  )
}

/** Ring colour stops [c0, c1, text] by score band — used by meal cards. */
export function ringColors(s: number): [string, string, string] {
  if (s >= 60) return ["#A8E063", "#4CB648", "#2DAA6E"]   // lime → green → teal
  if (s >= 30) return ["#F5C518", "#F5A623", "#e8830a"]   // yellow → orange
  return ["#F5A623", "#E53E3E", "#c41a1a"]                // orange → red
}
