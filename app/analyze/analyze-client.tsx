"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Camera, Upload, RefreshCw, ArrowRight, Loader2, AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Types ──────────────────────────────────────────────────────────── */

type BioticType = "prebiotic" | "probiotic" | "postbiotic" | "protein"

interface AnalysedFood {
  name: string
  emoji: string
  biotic: BioticType
  confidence: "high" | "medium" | "low"
}

interface AnalysisResult {
  foods: AnalysedFood[]
  missingBiotics: string[]
  suggestions: string[]
  overallAssessment: string
}

type State =
  | { kind: "idle" }
  | { kind: "loading"; previewUrl: string }
  | { kind: "result"; previewUrl: string; result: AnalysisResult }
  | { kind: "error"; previewUrl: string; message: string }

/* ── Biotic styling ─────────────────────────────────────────────────── */

const BIOTIC_CONFIG: Record<BioticType, { label: string; color: string; bg: string }> = {
  prebiotic:  { label: "Prebiotic",  color: "var(--icon-lime)",   bg: "color-mix(in srgb, var(--icon-lime) 15%, transparent)" },
  probiotic:  { label: "Probiotic",  color: "var(--icon-green)",  bg: "color-mix(in srgb, var(--icon-green) 15%, transparent)" },
  postbiotic: { label: "Postbiotic", color: "var(--icon-teal)",   bg: "color-mix(in srgb, var(--icon-teal) 15%, transparent)" },
  protein:    { label: "Protein",    color: "var(--icon-yellow)", bg: "color-mix(in srgb, var(--icon-yellow) 15%, transparent)" },
}

const MISSING_LABELS: Record<string, string> = {
  prebiotic: "prebiotic foods (fibre / plant diversity)",
  probiotic: "probiotic foods (live cultures / fermented)",
  postbiotic: "postbiotic foods (fermentation by-products / aged)",
}

/* ── Image compression ──────────────────────────────────────────────── */

function compressImage(file: File): Promise<{ base64: string; mimeType: "image/jpeg" | "image/png" | "image/webp" }> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img")
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1200
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      // Always output JPEG for photos — smaller
      const base64 = canvas.toDataURL("image/jpeg", 0.85).replace(/^data:image\/jpeg;base64,/, "")
      resolve({ base64, mimeType: "image/jpeg" })
    }
    img.onerror = reject
    img.src = url
  })
}

/* ── Score calculation ──────────────────────────────────────────────── */

function calcScore(foods: AnalysedFood[]): number {
  const BASE = [8, 6, 4, 3, 2]
  const countByType: Record<string, number> = {}
  for (const f of foods) {
    countByType[f.biotic] = (countByType[f.biotic] ?? 0) + 1
  }
  let base = 0
  for (const count of Object.values(countByType)) {
    for (let i = 0; i < count; i++) {
      base += BASE[Math.min(i, BASE.length - 1)]
    }
  }
  const types = Object.keys(countByType).length
  const balanceBonus = [0, 0, 10, 20, 30][Math.min(types, 4)]
  return Math.min(base + balanceBonus, 100)
}

/* ── Score ring SVG ─────────────────────────────────────────────────── */

function ScoreRing({ score }: { score: number }) {
  const r = 44
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 70 ? "var(--icon-green)" : score >= 45 ? "var(--icon-yellow)" : "var(--icon-orange)"
  return (
    <div className="relative flex items-center justify-center">
      <svg width="110" height="110" className="-rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
        <circle
          cx="55" cy="55" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-bold tabular-nums" style={{ color }}>{score}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Score</p>
      </div>
    </div>
  )
}

/* ── Upload zone ────────────────────────────────────────────────────── */

function UploadZone({ onFile }: { onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return
    onFile(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center transition-all",
        dragging
          ? "border-[var(--icon-green)] bg-[var(--icon-green)]/5"
          : "border-border hover:border-[var(--icon-green)]/50 hover:bg-secondary/30"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50">
        <Camera size={28} className="text-muted-foreground" />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">
          Upload a meal photo
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Drag & drop or tap to browse · JPEG, PNG, WebP · up to 5MB
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2">
        <Upload size={14} className="text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Choose photo</span>
      </div>
    </div>
  )
}

/* ── Loading state ──────────────────────────────────────────────────── */

function LoadingView({ previewUrl }: { previewUrl: string }) {
  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl">
        <Image src={previewUrl} alt="Your meal" width={600} height={400} className="w-full object-cover max-h-72" unoptimized />
        {/* Scan line animation */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--icon-green)]/20 to-transparent animate-scan" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl bg-background/90 backdrop-blur-sm px-5 py-3 flex items-center gap-3">
            <Loader2 size={18} className="animate-spin text-[var(--icon-green)]" />
            <span className="text-sm font-semibold">Claude is analysing your meal…</span>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Identifying foods and scoring against the 3 biotics framework
      </p>
    </div>
  )
}

/* ── Results view ───────────────────────────────────────────────────── */

function ResultsView({
  previewUrl,
  result,
  onReset,
}: {
  previewUrl: string
  result: AnalysisResult
  onReset: () => void
}) {
  const score = calcScore(result.foods)

  // Group foods by biotic
  const byBiotic = result.foods.reduce((acc, f) => {
    if (!acc[f.biotic]) acc[f.biotic] = []
    acc[f.biotic].push(f)
    return acc
  }, {} as Record<BioticType, AnalysedFood[]>)

  return (
    <div className="space-y-5">
      {/* Meal preview + score */}
      <div className="flex gap-4 items-start">
        <Image
          src={previewUrl} alt="Your meal"
          width={160} height={120}
          className="h-28 w-36 rounded-xl object-cover shrink-0"
          unoptimized
        />
        <div className="flex flex-col justify-center gap-1">
          <ScoreRing score={score} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-foreground/80 leading-relaxed">{result.overallAssessment}</p>
        </div>
      </div>

      {/* Foods by biotic group */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Foods identified
        </p>
        {(["prebiotic", "probiotic", "postbiotic", "protein"] as const).map((biotic) => {
          const foods = byBiotic[biotic]
          if (!foods?.length) return null
          const cfg = BIOTIC_CONFIG[biotic]
          return (
            <div key={biotic} className="mb-3 last:mb-0">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
                {cfg.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {foods.map((f, i) => (
                  <span
                    key={i}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                      f.confidence === "low" && "opacity-60"
                    )}
                    style={{ background: cfg.bg, color: cfg.color }}
                    title={f.confidence === "low" ? "Low confidence identification" : undefined}
                  >
                    {f.emoji} {f.name}
                    {f.confidence === "low" && <span className="opacity-70">?</span>}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Missing biotics */}
      {result.missingBiotics.length > 0 && (
        <div className="rounded-2xl border border-[var(--icon-orange)]/30 bg-[var(--icon-orange)]/5 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--icon-orange)]">
            Missing from this meal
          </p>
          <ul className="space-y-1">
            {result.missingBiotics.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-foreground/80">
                <span className="mt-0.5 text-[var(--icon-orange)]">→</span>
                <span>No {MISSING_LABELS[b] ?? b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Suggestions
          </p>
          <ul className="space-y-2">
            {result.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: "var(--icon-green)" }}
                >
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Link
          href="/myplate"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl brand-gradient py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Add to My Plate <ArrowRight size={14} />
        </Link>
        <button
          onClick={onReset}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/40"
        >
          <RefreshCw size={14} /> Analyse another meal
        </button>
      </div>
    </div>
  )
}

/* ── Error view ─────────────────────────────────────────────────────── */

function ErrorView({ message, previewUrl, onReset }: { message: string; previewUrl: string; onReset: () => void }) {
  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden opacity-50">
        <Image src={previewUrl} alt="Your meal" width={600} height={400} className="w-full object-cover max-h-48" unoptimized />
      </div>
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
        <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
        <p className="text-sm text-red-700">{message}</p>
      </div>
      <button
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium transition-colors hover:bg-secondary/40"
      >
        <RefreshCw size={14} /> Try again
      </button>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────── */

export function AnalyzeClient() {
  const [state, setState] = useState<State>({ kind: "idle" })

  const handleFile = useCallback(async (file: File) => {
    const previewUrl = URL.createObjectURL(file)
    setState({ kind: "loading", previewUrl })

    try {
      const { base64, mimeType } = await compressImage(file)

      const res = await fetch("/api/analyze-plate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      })

      const data = await res.json()

      if (data.error) {
        setState({ kind: "error", previewUrl, message: data.error })
        return
      }

      setState({ kind: "result", previewUrl, result: data as AnalysisResult })
    } catch {
      setState({
        kind: "error",
        previewUrl,
        message: "Something went wrong. Please check your connection and try again.",
      })
    }
  }, [])

  function reset() {
    if (state.kind !== "idle" && "previewUrl" in state) {
      URL.revokeObjectURL(state.previewUrl)
    }
    setState({ kind: "idle" })
  }

  return (
    <div>
      {state.kind === "idle" && <UploadZone onFile={handleFile} />}
      {state.kind === "loading" && <LoadingView previewUrl={state.previewUrl} />}
      {state.kind === "result" && (
        <ResultsView previewUrl={state.previewUrl} result={state.result} onReset={reset} />
      )}
      {state.kind === "error" && (
        <ErrorView message={state.message} previewUrl={state.previewUrl} onReset={reset} />
      )}
    </div>
  )
}
