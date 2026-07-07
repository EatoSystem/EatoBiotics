"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Sparkles, CheckCircle2, Target, CalendarDays } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ScoreRing } from "@/components/assessment/score-ring"
import { resolvedFoundation, getJourney, journeyType } from "@/lib/assessment/journey"
import { getSummary, isComplete, type AssessmentSummary, type AnyAssessedKey } from "@/lib/assessment/registry"
import { ensureHydrated, persist } from "@/lib/assessment/sync"
import { loadLeadData } from "@/lib/assessment-storage"
import { buildCombinedResult } from "@/lib/combined-assessment-result"

const EMAILED_KEY = "eb_assessment_report_emailed_v1"

/** Email the combined report once per journey state (re-sends if an add-on is added). */
function maybeEmailReport(foundation: AssessmentSummary | null, addon: AssessmentSummary | null) {
  if (typeof window === "undefined" || !foundation) return
  const lead = loadLeadData()
  if (!lead?.email) return
  const marker = `${lead.email}|${journeyType() ?? "unknown"}`
  try {
    if (window.localStorage.getItem(EMAILED_KEY) === marker) return
    window.localStorage.setItem(EMAILED_KEY, marker) // optimistic — avoid duplicate sends on re-mount
  } catch {
    return
  }
  void fetch("/api/assessment/email-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lead: { name: lead.name, email: lead.email }, foundation, addon }),
  }).catch(() => {})
}

const ADDON_FOCUS: Record<AnyAssessedKey, string> = {
  stability: "consistency and digestive comfort",
  glucose: "energy, cravings, and glucose rhythm",
  mind: "mood, focus, and mental clarity",
  performance: "energy, recovery, and output",
  pregnancy: "food variety, meal rhythm, and general wellbeing",
}

function List({ title, items, icon: Icon, accent }: { title: string; items: string[]; icon: typeof Target; accent: string }) {
  if (!items.length) return null
  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide" style={{ color: accent }}>
        <Icon size={15} /> {title}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((t, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: accent }} />
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Patterns({ items }: { items?: { label: string; text: string }[] }) {
  if (!items || items.length === 0) return null
  return (
    <div className="mt-5 space-y-2.5">
      <p className="text-sm font-bold uppercase tracking-wide text-icon-teal">Key patterns</p>
      {items.map((d, i) => (
        <p key={i} className="text-sm leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">{d.label}:</span> {d.text}
        </p>
      ))}
    </div>
  )
}

function ScoreBlock({ s, gradientId }: { s: AssessmentSummary; gradientId: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <ScoreRing score={s.score} color="var(--icon-green)" gradientId={gradientId} profileType={s.bandLabel} className="relative mx-auto h-44 w-44 sm:h-52 sm:w-52" />
      <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{s.scoreLabel}</p>
    </div>
  )
}

export function CombinedReport() {
  const [ready, setReady] = useState(false)
  const [foundation, setFoundation] = useState<AssessmentSummary | null>(null)
  const [addon, setAddon] = useState<AssessmentSummary | null>(null)
  const [addonKey, setAddonKey] = useState<AnyAssessedKey | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await ensureHydrated() // pull signed-in user's journey (cross-device) before rendering
      if (cancelled) return
      const f = resolvedFoundation()
      const fSummary = f ? getSummary(f) : null
      setFoundation(fSummary)
      const sel = getJourney().selectedAddon
      const aSummary = sel && isComplete(sel) ? getSummary(sel) : null
      if (aSummary && sel) {
        setAddon(aSummary)
        setAddonKey(sel)
      }
      setReady(true)
      void persist() // push local journey up if signed in
      maybeEmailReport(fSummary, aSummary) // email the report (once per journey state)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) return null

  if (!foundation) {
    return (
      <section className="px-6 pt-28 pb-24 text-center">
        <div className="mx-auto max-w-xl">
          <h1 className="font-serif text-3xl font-bold text-foreground">No report yet</h1>
          <p className="mt-4 text-muted-foreground">Start with your Food System foundation to generate your report.</p>
          <Link href="/assessment" className="brand-gradient mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 hover:opacity-90">
            Start your assessment <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    )
  }

  // Typed, non-diagnostic merge of foundation + add-on (title, summary,
  // foundation influence, merged actions, and the right disclaimer).
  const combined = buildCombinedResult(foundation, addon)
  const title = combined.reportTitle
  const mergedSeven = combined.first7Days
  const thirtyDay = combined.next30Days

  return (
    <section className="px-6 pt-28 pb-24 md:pt-32">
      <div className="mx-auto max-w-[920px]">
        {/* 1–3. Title + foundation/add-on framing */}
        <ScrollReveal>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-icon-green">
              {foundation.label} foundation{addon ? ` · ${addon.label} focus` : ""}
            </p>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-[1.1] text-foreground sm:text-5xl text-balance">{title}</h1>
          </div>
        </ScrollReveal>

        {/* 4–5. Scores */}
        <ScrollReveal delay={80}>
          <div className="mt-12 rounded-[1.75rem] border border-border bg-card p-8 shadow-lg sm:p-10">
            <div className={`grid items-center gap-10 ${addon ? "sm:grid-cols-2" : ""}`}>
              <ScoreBlock s={foundation} gradientId="cr-foundation" />
              {addon && <ScoreBlock s={addon} gradientId="cr-addon" />}
            </div>
            {addon && (
              <p className="mx-auto mt-8 max-w-xl text-center text-sm leading-relaxed text-muted-foreground">
                Your <strong className="text-foreground">{addon.label}</strong> score builds on your Food System
                foundation. It shows how your daily food habits, meal rhythm, and diversity may be affecting{" "}
                {addonKey ? ADDON_FOCUS[addonKey] : "your focus area"}.
              </p>
            )}
          </div>
        </ScrollReveal>

        {/* Combined summary + how the foundation supports the add-on area */}
        <ScrollReveal delay={100}>
          <div className="mt-8 rounded-[1.5rem] border border-border bg-card p-7">
            <p className="text-sm font-bold uppercase tracking-wide text-icon-green">What this means together</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{combined.combinedSummary}</p>
            <p className="mt-4 text-sm leading-relaxed text-foreground">
              <span className="font-semibold">How your foundation helps: </span>
              {combined.foundationInfluence}
            </p>
          </div>
        </ScrollReveal>

        {/* 6–7. What each tells us */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <ScrollReveal delay={120}>
            <div className="h-full rounded-[1.5rem] border border-border bg-card p-7">
              <h2 className="font-serif text-xl font-semibold text-foreground">What your foundation tells us</h2>
              {foundation.bandDescription && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{foundation.bandDescription}</p>}
              <Patterns items={foundation.details} />
              <div className="mt-6 space-y-5">
                <List title="Strengths" items={foundation.strengths} icon={Sparkles} accent="var(--icon-green)" />
                <List title="Priority areas" items={foundation.priorities} icon={Target} accent="var(--icon-orange)" />
              </div>
            </div>
          </ScrollReveal>

          {addon ? (
            <ScrollReveal delay={180}>
              <div className="h-full rounded-[1.5rem] border border-border bg-card p-7">
                <h2 className="font-serif text-xl font-semibold text-foreground">What your {addon.label} system tells us</h2>
                {addon.bandDescription && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{addon.bandDescription}</p>}
                <Patterns items={addon.details} />
                <div className="mt-6 space-y-5">
                  <List title="Strengths" items={addon.strengths} icon={Sparkles} accent="var(--icon-green)" />
                  <List title="Priority areas" items={addon.priorities} icon={Target} accent="var(--icon-orange)" />
                </div>
              </div>
            </ScrollReveal>
          ) : (
            <ScrollReveal delay={180}>
              <div className="flex h-full flex-col rounded-[1.5rem] border border-dashed border-border bg-card/50 p-7">
                <h2 className="font-serif text-xl font-semibold text-foreground">Go deeper with a system</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  Add Stability, Glucose, Mind, or Performance to layer focused insights onto your foundation and create a deeper combined report.
                </p>
                <Link href="/assessment" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-icon-green underline underline-offset-4">
                  Add a focus <ArrowRight size={15} />
                </Link>
              </div>
            </ScrollReveal>
          )}
        </div>

        {/* 8. 7-day actions */}
        <ScrollReveal delay={220}>
          <div className="mt-8 rounded-[1.5rem] border border-border bg-card p-7">
            <List title="Your 7-day actions" items={mergedSeven} icon={CheckCircle2} accent="var(--icon-teal)" />
          </div>
        </ScrollReveal>

        {/* 9. 30-day plan (when the add-on provides one) */}
        {thirtyDay && thirtyDay.length > 0 && (
          <ScrollReveal delay={260}>
            <div className="mt-8 rounded-[1.5rem] border border-border bg-card p-7">
              <List title="Your 30-day improvement plan" items={thirtyDay} icon={CalendarDays} accent="var(--icon-orange)" />
            </div>
          </ScrollReveal>
        )}

        {/* 10. Suggested next step */}
        <ScrollReveal delay={300}>
          <div className="mt-10 rounded-[1.75rem] p-8 text-center text-white shadow-lg" style={{ background: "linear-gradient(135deg, #14250F, #1A2E12 45%, #2C3A12)" }}>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-lime">Suggested next step</p>
            <h3 className="mt-3 font-serif text-2xl font-semibold">
              {addon ? "Keep building — one habit at a time." : "Add a focus for a deeper report."}
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/70">
              {addon
                ? "Start with your top priority this week. Small, consistent changes compound quickly."
                : "Layer Stability, Glucose, Mind, or Performance onto your foundation to understand a deeper area of focus."}
            </p>
            <Link href={addon ? "/account" : "/assessment"} className="brand-gradient mt-6 inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg hover:opacity-90">
              {addon ? "Go to my account" : "Add a focus"} <ArrowRight size={18} />
            </Link>
          </div>
        </ScrollReveal>

        {/* Disclaimer — behaviour-based support score, never a diagnosis */}
        <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground/80">{combined.disclaimer}</p>
      </div>
    </section>
  )
}
