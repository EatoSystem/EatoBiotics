"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, FileText, Printer, Stethoscope } from "lucide-react"
import { MedicalDisclaimer } from "@/components/stability/MedicalDisclaimer"
import { RedFlagWarning } from "@/components/stability/RedFlagWarning"
import type { StabilityReportData, StabilityScore } from "@/lib/stability/types"

/* ── Types ───────────────────────────────────────────────────────────── */

export interface ClinicianReportData {
  memberName: string | null
  healthGoals: string[]
  consultSummaries: string[]
  biotics: {
    overallScore: number | null
    subScores: Record<string, number> | null
    assessmentDate: string | null
    recentAnalyses: { date: string; score: number | null; meal: string | null }[]
  } | null
  glp1: {
    medication: string | null
    startWeightKg: number | null
    goalWeightKg: number | null
    startedAt: string | null
    latestWeightKg: number | null
    logCount: number
    proteinAdherencePct: number | null
    strengthSessions: number
    topSideEffects: { name: string; count: number }[]
  } | null
  stability: {
    score: StabilityScore
    report: StabilityReportData | null
  } | null
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" }) : "N/A"

const PILLAR_COLORS: Record<string, string> = {
  prebiotics: "var(--icon-lime)",
  probiotics: "var(--icon-green)",
  postbiotics: "var(--icon-teal)",
  diversity: "var(--icon-lime)",
  feeding: "var(--icon-green)",
  adding: "var(--icon-teal)",
  consistency: "var(--icon-yellow)",
  feeling: "var(--icon-orange)",
}

const STOOL_LABEL: Record<number, string> = {
  1: "Type 1 (hard lumps)",
  2: "Type 2 (lumpy)",
  3: "Type 3 (cracked)",
  4: "Type 4 (smooth, ideal)",
  5: "Type 5 (soft blobs)",
  6: "Type 6 (mushy)",
  7: "Type 7 (liquid)",
}

function PillarRow({ label, score }: { label: string; score: number }) {
  const color = PILLAR_COLORS[label.toLowerCase()] ?? "var(--icon-green)"
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-xs font-medium capitalize text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="w-8 text-right text-xs font-bold tabular-nums" style={{ color }}>
        {Math.round(score)}
      </span>
    </div>
  )
}

function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid rounded-2xl border bg-card p-5" style={{ borderTopWidth: 3, borderTopColor: accent }}>
      <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-1.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  )
}

/* ── Main component ──────────────────────────────────────────────────── */

interface GeneratedSummary {
  content: string
}

export function DoctorReportClient({ data }: { data: ClinicianReportData }) {
  const { memberName, healthGoals, consultSummaries, biotics, glp1, stability } = data
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generatedOn = new Date().toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })
  const hasAnyData = !!(biotics || glp1 || stability)

  async function generateSummary() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/doctor-report/generate", { method: "POST" })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d.error ?? "Failed to generate summary")
      }
      const d = (await res.json()) as GeneratedSummary & { content: string }
      setSummary(d.content)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Toolbar — hidden in print */}
      <div className="print-hide mb-6 flex items-center justify-between gap-3">
        <Link href="/account" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> My Account
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
        >
          <Printer size={14} /> Print / Save as PDF
        </button>
      </div>

      {/* Report header */}
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Stethoscope size={16} style={{ color: "var(--icon-teal)" }} />
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>
            EatoBiotics — Food System Health Report
          </p>
        </div>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-foreground">Bring this to your GP</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A structured summary of {memberName ? memberName.split(" ")[0] + "'s" : "your"} self-tracked food-system data
          to share with a doctor, nutritionist, or continence nurse. Educational — not a diagnosis.
        </p>
        <div className="mt-4 grid gap-1 rounded-2xl border bg-muted/20 p-4">
          <Stat label="Patient name" value={memberName ?? "Not set"} />
          <Stat label="Report generated" value={generatedOn} />
          {healthGoals.length > 0 && <Stat label="Health goals" value={healthGoals.join(", ")} />}
        </div>
      </header>

      {/* AI narrative summary — optional, print-friendly once generated */}
      <div className="mb-6">
        {summary ? (
          <Section title="Clinical Summary" accent="var(--icon-teal)">
            <div className="prose prose-sm max-w-none">
              {summary.split("\n\n").map((para, i) => (
                <p key={i} className="mb-3 whitespace-pre-line text-sm leading-relaxed text-foreground last:mb-0">
                  {para}
                </p>
              ))}
            </div>
          </Section>
        ) : (
          <div className="print-hide rounded-2xl border bg-muted/10 p-4">
            {error && <p className="mb-3 text-sm" style={{ color: "var(--icon-orange)" }}>{error}</p>}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Optional: add an AI-written clinical summary paragraph to the top of this report.
              </p>
              <button
                onClick={generateSummary}
                disabled={loading}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-muted/30 disabled:opacity-60"
                style={{ color: "var(--icon-teal)" }}
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                    Generating…
                  </>
                ) : (
                  <>
                    <FileText size={13} /> Add AI summary
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {!hasAnyData && (
        <div className="rounded-2xl border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No tracked data yet. Take an assessment or log a few days, then return to build your report.
          </p>
        </div>
      )}

      <div className="space-y-5">
        {/* ── Biotics ── */}
        {biotics && (
          <Section title="Gut Microbiome — Biotics Score" accent="var(--icon-green)">
            <div className="grid gap-1">
              <Stat
                label="Overall Biotics Score"
                value={biotics.overallScore != null ? `${biotics.overallScore}/100` : "N/A"}
              />
              <Stat label="Assessment date" value={fmtDate(biotics.assessmentDate)} />
            </div>
            {biotics.subScores && (
              <div className="mt-4 space-y-2">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pillar breakdown</p>
                {Object.entries(biotics.subScores).map(([k, v]) => (
                  <PillarRow key={k} label={k} score={v} />
                ))}
              </div>
            )}
            {biotics.recentAnalyses.length > 0 && (
              <div className="mt-4">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Recent meal analyses ({biotics.recentAnalyses.length})
                </p>
                <ul className="space-y-1">
                  {biotics.recentAnalyses.slice(0, 6).map((a, i) => (
                    <li key={i} className="flex justify-between gap-3 text-xs text-muted-foreground">
                      <span className="truncate">{a.meal ?? "Meal"}</span>
                      <span className="shrink-0 font-medium text-foreground">
                        {a.score != null ? `${a.score}/100` : "—"} · {fmtDate(a.date)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>
        )}

        {/* ── GLP-1 ── */}
        {glp1 && (
          <Section title="GLP-1 Companion — Muscle Protection" accent="var(--icon-teal)">
            <div className="grid gap-1">
              {glp1.medication && <Stat label="Medication" value={glp1.medication} />}
              {glp1.startedAt && <Stat label="Started" value={fmtDate(glp1.startedAt)} />}
              {glp1.startWeightKg != null && <Stat label="Start weight" value={`${glp1.startWeightKg} kg`} />}
              {glp1.latestWeightKg != null && <Stat label="Latest weight" value={`${glp1.latestWeightKg} kg`} />}
              {glp1.goalWeightKg != null && <Stat label="Goal weight" value={`${glp1.goalWeightKg} kg`} />}
              {glp1.startWeightKg != null && glp1.latestWeightKg != null && (
                <Stat
                  label="Weight change"
                  value={`${(glp1.latestWeightKg - glp1.startWeightKg).toFixed(1)} kg`}
                />
              )}
              <Stat label="Days logged" value={String(glp1.logCount)} />
              {glp1.proteinAdherencePct != null && (
                <Stat label="Protein-target adherence" value={`${glp1.proteinAdherencePct}%`} />
              )}
              <Stat label="Strength sessions" value={String(glp1.strengthSessions)} />
            </div>
            {glp1.topSideEffects.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Reported side-effects
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {glp1.topSideEffects.map((s) => (
                    <span key={s.name} className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
                      {s.name} ×{s.count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* ── Stability ── */}
        {stability && (
          <Section title="Digestive Stability" accent="var(--icon-orange)">
            {stability.score.redFlags.length > 0 && (
              <div className="mb-3">
                <RedFlagWarning matched={stability.score.redFlags} />
              </div>
            )}
            <div className="grid gap-1">
              <Stat label="Stability score" value={`${stability.score.totalScore}/100 · ${stability.score.band}`} />
              {stability.report && (
                <>
                  <Stat label="Days logged (30d)" value={String(stability.report.logCount)} />
                  {stability.report.avgStability != null && (
                    <Stat label="Avg daily stability" value={`${stability.report.avgStability}/10`} />
                  )}
                  <Stat label="Urgency episodes (30d)" value={String(stability.report.urgencyEpisodes)} />
                  <Stat label="Accident episodes (30d)" value={String(stability.report.accidentEpisodes)} />
                  {stability.report.commonStoolType != null && (
                    <Stat label="Most common stool" value={STOOL_LABEL[stability.report.commonStoolType] ?? "—"} />
                  )}
                </>
              )}
            </div>
            {stability.score.topRiskFactors.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Possible contributors
                </p>
                <ul className="space-y-1">
                  {stability.score.topRiskFactors.slice(0, 5).map((r) => (
                    <li key={r} className="flex gap-2 text-xs text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--icon-orange)" }} />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {stability.report && stability.report.focusNextMonth.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Focus areas</p>
                <ul className="space-y-1">
                  {stability.report.focusNextMonth.map((f) => (
                    <li key={f} className="flex gap-2 text-xs text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--icon-green)" }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>
        )}

        {/* ── Consultation topics ── */}
        {consultSummaries.length > 0 && (
          <Section title="Recent Consultation Topics" accent="var(--icon-yellow)">
            <ul className="space-y-1">
              {consultSummaries.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--icon-yellow)" }} />
                  {s}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      {/* Methodology + disclaimer */}
      <div className="mt-6">
        <MedicalDisclaimer />
      </div>
      <p className="mt-4 text-center text-[11px] text-muted-foreground/70">
        Generated by EatoBiotics · eatobiotics.com · Self-reported, educational data. Not a diagnosis or treatment plan.
      </p>
    </div>
  )
}
