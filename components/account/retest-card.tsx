"use client"

import Link from "next/link"
import { ArrowRight, Share2, TrendingDown, TrendingUp, Minus } from "lucide-react"
import type { RetestState } from "@/lib/account/retest"
import { RETEST_DAY } from "@/lib/account/retest"

/* ── Day-75 Retest Card ──────────────────────────────────────────────────
   The before/after moment for the foundation Food System Score. Three
   states driven by lib/account/retest.ts:
     countdown → progress toward the Day-75 retest,
     due       → invitation to retake the assessment,
     compare   → baseline vs latest score with delta + share.
────────────────────────────────────────────────────────────────────── */

const GRADIENT = "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))"

function fmtDate(at: string): string {
  return new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export function RetestCard({ state }: { state: RetestState }) {
  return (
    <div className="mx-auto max-w-5xl px-4 md:px-8">
      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="h-1 w-full" style={{ background: GRADIENT }} />
        <div className="p-6 md:p-7">
          {state.kind === "countdown" && <Countdown state={state} />}
          {state.kind === "due" && <Due state={state} />}
          {state.kind === "compare" && <Compare state={state} />}
        </div>
      </div>
    </div>
  )
}

function Countdown({ state }: { state: Extract<RetestState, { kind: "countdown" }> }) {
  const pct = Math.min(100, Math.round((state.day / RETEST_DAY) * 100))
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">The Day-{RETEST_DAY} Retest</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-serif text-2xl font-semibold text-foreground">
          Day {state.day} <span className="text-base font-normal text-muted-foreground">of {RETEST_DAY}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Baseline score <strong className="text-foreground">{state.baseline.score}</strong> · {fmtDate(state.baseline.at)}
        </p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: GRADIENT }} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Keep feeding your system — on day {RETEST_DAY} you retake the assessment and see how far your
        score has moved. That before-and-after is the whole point.
      </p>
    </div>
  )
}

function Due({ state }: { state: Extract<RetestState, { kind: "due" }> }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
          It&apos;s retest day
        </p>
        <p className="mt-2 font-serif text-2xl font-semibold text-foreground">
          {state.day} days since your baseline of {state.baseline.score}.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Retake the assessment and see what all those meals actually changed.
        </p>
      </div>
      <Link
        href="/assessment/you"
        className="brand-gradient inline-flex w-fit shrink-0 items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Retake my assessment <ArrowRight size={15} />
      </Link>
    </div>
  )
}

function Compare({ state }: { state: Extract<RetestState, { kind: "compare" }> }) {
  const up = state.delta > 0
  const flat = state.delta === 0
  const DeltaIcon = flat ? Minus : up ? TrendingUp : TrendingDown
  const deltaColor = flat ? "var(--icon-teal)" : up ? "var(--icon-green)" : "var(--icon-orange)"
  const shareText = up
    ? `My Food System Score went from ${state.baseline.score} to ${state.latest.score} in ${state.days} days with EatoBiotics.`
    : `I'm tracking my Food System Score with EatoBiotics — currently ${state.latest.score}/100.`

  async function share() {
    const url = "https://eatobiotics.com/assessment"
    try {
      if (navigator.share) {
        await navigator.share({ title: "My Food System Score", text: shareText, url })
        return
      }
      await navigator.clipboard.writeText(`${shareText} ${url}`)
    } catch {
      /* user cancelled the share sheet — nothing to do */
    }
  }

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Your before &amp; after</p>
      <div className="mt-4 flex flex-wrap items-center gap-6">
        <div className="text-center">
          <p className="font-serif text-4xl font-bold text-muted-foreground">{state.baseline.score}</p>
          <p className="mt-1 text-xs text-muted-foreground">{fmtDate(state.baseline.at)}</p>
        </div>
        <ArrowRight size={20} className="text-muted-foreground" aria-hidden />
        <div className="text-center">
          <p className="font-serif text-4xl font-bold text-foreground">{state.latest.score}</p>
          <p className="mt-1 text-xs text-muted-foreground">{fmtDate(state.latest.at)}</p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-white"
          style={{ background: deltaColor }}
        >
          <DeltaIcon size={14} />
          {flat ? "held steady" : `${up ? "+" : ""}${state.delta} in ${state.days} days`}
        </span>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={share}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-icon-green hover:text-icon-green"
        >
          <Share2 size={14} /> Share my progress
        </button>
        <Link href="/assessment/you" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
          Retest again
        </Link>
      </div>
    </div>
  )
}
