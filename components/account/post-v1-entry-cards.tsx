"use client"

/**
 * Account entry cards for products outside the V1 launch surface.
 *
 * Each of these is a single Link into a route that lib/v1-surface.ts
 * classifies POST_V1 — /account/glp1, /stability, /eatobiotic — so none of
 * them is mounted on /account while the V1 scope freeze holds.
 *
 * They live in their own module rather than in dashboard-parts.tsx for a
 * reason that is a guard, not tidiness: the link audit in
 * tests/unit/v1-surface.test.ts walks the import graph from every served page
 * and fails on any link into a refused route. While these three sat in
 * dashboard-parts.tsx — which /account still imports for the journey card, the
 * referral card and the score rings — the module stayed inside that graph and
 * the audit could not tell an unmounted component from a live one. Moving them
 * out makes "not reachable from the V1 product" true of the file, not just of
 * the JSX.
 *
 * Nothing is deleted. Remounting one after launch is an import and a line.
 */

import Link from "next/link"
import { Activity, ChevronRight, Dumbbell, Mic } from "lucide-react"

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

/** EatoBiotics Stability entry card — links to the digestive-stability tool. */
export function StabilityCard() {
  return (
    <Link href="/stability" className="group block overflow-hidden rounded-2xl transition-shadow hover:shadow-[0_8px_28px_rgba(26,46,18,0.14)]"
      style={{ background: "white", border: "1px solid #ebebeb", boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
      <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-orange), var(--icon-yellow), var(--icon-green))" }} />
      <div className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
          style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}>
          <Activity size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>EatoBiotics Stability™</p>
          <h3 className="font-serif text-base font-bold leading-snug" style={{ color: "var(--foreground)" }}>Bowel urgency or unpredictability?</h3>
          <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>Track stool, urgency, and triggers — and build digestive stability.</p>
        </div>
        <ChevronRight size={16} className="shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: "var(--icon-green)" }} />
      </div>
    </Link>
  )
}

/** Voice consultation entry card — links to the EatoBiotic voice agent (/eatobiotic).
 *  The page self-handles tier gating (voice = paid; text free) and the "being set up"
 *  state, so this card is safe to show to every signed-in member. */
export function VoiceConsultCard() {
  return (
    <Link href="/eatobiotic" className="group block overflow-hidden rounded-2xl transition-shadow hover:shadow-[0_8px_28px_rgba(26,46,18,0.14)]"
      style={{ background: "white", border: "1px solid #ebebeb", boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
      <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-teal), var(--icon-green), var(--icon-lime))" }} />
      <div className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
          style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}>
          <Mic size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>EatoBiotic Voice</p>
          <h3 className="font-serif text-base font-bold leading-snug" style={{ color: "var(--foreground)" }}>Prefer to talk it through?</h3>
          <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>Start a voice conversation with your gut-health expert.</p>
        </div>
        <ChevronRight size={16} className="shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: "var(--icon-green)" }} />
      </div>
    </Link>
  )
}
