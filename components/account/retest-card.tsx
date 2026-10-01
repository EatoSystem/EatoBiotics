"use client"

import Link from "next/link"
import { ArrowRight, Share2, TrendingDown, TrendingUp, Minus } from "lucide-react"
import type { RetestState } from "@/lib/account/retest"
import { RETEST_DAY } from "@/lib/account/retest"

/* ── Day-75 Retest Card ──────────────────────────────────────────────────
   The before/after moment for the foundation Biotics Score™. Three states
   driven by lib/account/retest.ts:
     countdown → progress toward the Day-75 retest,
     due       → invitation to retake the assessment,
     compare   → baseline vs latest, with what changed in the answers.

   ══ WHAT THIS CARD MAY NOT SAY, AND WHY ═════════════════════════════════

   `ScorePoint` is `{ score, at }`. THERE IS NO PROVENANCE ON IT — no method
   version, no question-set version, nothing recording which instrument
   produced either number. `leads.score_history` stores bare numbers.

   In practice the two points almost certainly came from the same instrument:
   one route writes the column, keyed on (email, assessment_type), and the
   fifteen questions are inside the methodology freeze. But "almost certainly,
   because the methodology happened not to change" is not the same as
   "recorded as comparable" — and the day the instrument does change, every
   historical pair silently becomes a comparison between two different things
   and nothing here would notice.

   So the two numbers stay: each is true, and each is what the person was told
   at the time. What goes is the ACHIEVEMENT framing — the claim that the
   difference between them is an improvement the person earned. A delta
   between two unversioned numbers describes a change in reported answers, and
   that is all this card may say about it.

   The honest version of this card needs provenance stored alongside each
   point. That is a schema change, so it is recorded rather than written.
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
          Retake the assessment and see what your answers say now.
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
  /*
   * No before/after claim. "Went from X to Y" presents the difference between
   * two unversioned numbers as a result the person achieved; neither the
   * stored points nor any approved comparison rule supports that. What is
   * true, and shareable, is the current score.
   */
  const shareText = `I'm tracking my Biotics Score™ with EatoBiotics — currently ${state.latest.score}/100.`

  async function share() {
    const url = "https://eatobiotics.com/assessment"
    try {
      if (navigator.share) {
        await navigator.share({ title: "My Biotics Score™", text: shareText, url })
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
          {flat
            ? "about the same"
            : `${up ? "+" : ""}${state.delta} in ${state.days} days`}
        </span>
      </div>
      {/*
        Says what the two numbers are, so the pill above reads as a change in
        answers rather than a verdict. "Your reported X increased" is the
        permitted form; "you improved" is not.
      */}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Both numbers came from the same assessment, taken {state.days} days apart. The difference
        describes what your answers said — not a measurement of your health.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={share}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-icon-green hover:text-icon-green"
        >
          <Share2 size={14} /> Share my score
        </button>
        <Link href="/assessment/you" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
          Retest again
        </Link>
      </div>
    </div>
  )
}
