"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, FileText, Download, Stethoscope } from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Types ───────────────────────────────────────────────────────────── */

interface DoctorReportClientProps {
  memberName: string | null
  healthGoals: string[]
  overallScore: number | null
  subScores: Record<string, number> | null
  assessmentDate: string | null
  consultSummaries: string[]
}

interface GeneratedReport {
  content: string
  name: string
  assessmentDate: string
  overallScore: number | null
}

/* ── Pillar row ──────────────────────────────────────────────────────── */

const PILLAR_COLORS: Record<string, string> = {
  diversity: "var(--icon-lime)",
  feeding: "var(--icon-green)",
  adding: "var(--icon-teal)",
  consistency: "var(--icon-yellow)",
  feeling: "var(--icon-orange)",
}

function PillarRow({ label, score }: { label: string; score: number }) {
  const color = PILLAR_COLORS[label.toLowerCase()] ?? "var(--icon-green)"
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-xs font-medium text-muted-foreground capitalize">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="w-8 text-right text-xs font-bold tabular-nums" style={{ color }}>
        {Math.round(score)}
      </span>
    </div>
  )
}

/* ── Main component ──────────────────────────────────────────────────── */

export function DoctorReportClient({
  memberName,
  healthGoals,
  overallScore,
  subScores,
  assessmentDate,
  consultSummaries,
}: DoctorReportClientProps) {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<GeneratedReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  const formattedDate = assessmentDate
    ? new Date(assessmentDate).toLocaleDateString("en-IE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  async function generateReport() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/doctor-report/generate", { method: "POST" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Request failed" })) as { error?: string }
        throw new Error(data.error ?? "Failed to generate report")
      }
      const data = await res.json() as GeneratedReport
      setReport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  function downloadReport() {
    if (!report) return
    const blob = new Blob([report.content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `EatoBiotics-Health-Report-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Back */}
      <Link
        href="/account"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft size={14} /> My Account
      </Link>

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--icon-teal)" }}>
          Transform Feature
        </p>
        <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">
          Food System Health Report
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A structured summary for your doctor, nutritionist, or healthcare provider — evidence-based, precise, and personalised.
        </p>
      </div>

      {/* Preview card */}
      {!report && (
        <div className="space-y-4 mb-6">
          <div
            className="rounded-2xl border bg-card p-5"
            style={{
              borderTopWidth: "3px",
              borderTopColor: "var(--icon-teal)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Stethoscope size={16} style={{ color: "var(--icon-teal)" }} />
              <p className="text-sm font-semibold text-foreground">Report Preview</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Patient name</span>
                <span className="font-medium text-foreground">{memberName ?? "Not set"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Assessment date</span>
                <span className="font-medium text-foreground">{formattedDate ?? "N/A"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Biotics Score</span>
                <span
                  className="font-bold tabular-nums"
                  style={{ color: overallScore != null && overallScore >= 70 ? "var(--icon-green)" : "var(--icon-orange)" }}
                >
                  {overallScore != null ? `${overallScore}/100` : "N/A"}
                </span>
              </div>

              {healthGoals.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Health goals</span>
                  <span className="font-medium text-foreground text-right max-w-[60%]">
                    {healthGoals.join(", ")}
                  </span>
                </div>
              )}
            </div>

            {/* Pillar scores */}
            {subScores && (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  5-Pillar Breakdown
                </p>
                {Object.entries(subScores).map(([key, val]) => (
                  <PillarRow key={key} label={key} score={val} />
                ))}
              </div>
            )}

            {/* Consultation topics */}
            {consultSummaries.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Consultation Topics
                </p>
                <ul className="space-y-1">
                  {consultSummaries.map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: "var(--icon-teal)" }}
                      />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* What's included */}
          <div className="rounded-2xl border bg-muted/20 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Report Includes
            </p>
            <ul className="space-y-1">
              {[
                "Patient food system summary",
                "Biotics Score breakdown with clinical interpretation",
                "Dietary pattern analysis",
                "Key areas for clinical attention",
                "Evidence-based food recommendations",
                "Methodology notes for clinicians",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--icon-teal)" }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="mb-4 rounded-2xl p-4 text-sm"
          style={{
            background: "color-mix(in srgb, var(--icon-orange) 10%, var(--card))",
            border: "1px solid color-mix(in srgb, var(--icon-orange) 30%, transparent)",
            color: "var(--icon-orange)",
          }}
        >
          {error}
        </div>
      )}

      {/* Generate button */}
      {!report && (
        <button
          onClick={generateReport}
          disabled={loading}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold text-white transition-opacity",
            loading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"
          )}
          style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Generating report…
            </>
          ) : (
            <>
              <FileText size={15} /> Generate Report
            </>
          )}
        </button>
      )}

      {/* Generated report */}
      {report && (
        <div className="space-y-4">
          <div
            className="rounded-2xl border bg-card p-6"
            style={{
              borderTopWidth: "3px",
              borderTopColor: "var(--icon-teal)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Food System Health Report
                </p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {report.name} · {report.assessmentDate}
                </p>
              </div>
              <button
                onClick={downloadReport}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted/30"
                style={{ color: "var(--icon-teal)" }}
              >
                <Download size={12} /> Download
              </button>
            </div>

            <div className="prose prose-sm max-w-none">
              {report.content.split("\n\n").map((para, i) => (
                <p key={i} className="text-sm text-foreground leading-relaxed mb-3 last:mb-0 whitespace-pre-line">
                  {para}
                </p>
              ))}
            </div>
          </div>

          <button
            onClick={() => setReport(null)}
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Generate a new report
          </button>
        </div>
      )}
    </div>
  )
}
