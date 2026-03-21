"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Camera, Upload, RefreshCw, ArrowRight, Loader2, AlertCircle, Sparkles } from "lucide-react"
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
  score: number
  prebioticStrength: "strong" | "moderate" | "low"
  foods: AnalysedFood[]
  missingBiotics: string[]
  whatThisMealDoes: string
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

const TRIFECTA_LABELS: Record<string, { add: string }> = {
  prebiotic:  { add: "Add prebiotic fibre — more plants, wholegrains or legumes" },
  probiotic:  { add: "Add a probiotic boost — yogurt, kefir, kimchi or sauerkraut" },
  postbiotic: { add: "Add a postbiotic source — sourdough, aged cheese or ACV dressing" },
}

/* ── Score band ─────────────────────────────────────────────────────── */

function getScoreBand(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Exceptional",       color: "var(--icon-green)" }
  if (score >= 65) return { label: "Strong Foundation", color: "var(--icon-lime)" }
  if (score >= 50) return { label: "Good Start",        color: "var(--icon-yellow)" }
  if (score >= 35) return { label: "Getting There",     color: "var(--icon-orange)" }
  return              { label: "Starting Out",       color: "#ef4444" }
}

/* ── Score display ──────────────────────────────────────────────────── */

function ScoreDisplay({
  score,
  prebioticStrength,
  hasProbiotic,
  hasPostbiotic,
}: {
  score: number
  prebioticStrength: "strong" | "moderate" | "low"
  hasProbiotic: boolean
  hasPostbiotic: boolean
}) {
  const { label, color } = getScoreBand(score)
  const r = 52
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ

  const pillars = [
    {
      icon: "🌱",
      label: "Prebiotics",
      strength: prebioticStrength === "strong" ? 1 : prebioticStrength === "moderate" ? 0.55 : 0.15,
      status: prebioticStrength === "strong" ? "Strong" : prebioticStrength === "moderate" ? "Moderate" : "Low",
      color: "var(--icon-lime)",
      present: prebioticStrength !== "low",
    },
    {
      icon: "🦠",
      label: "Probiotics",
      strength: hasProbiotic ? 0.8 : 0.12,
      status: hasProbiotic ? "Present" : "Not in meal",
      color: "var(--icon-green)",
      present: hasProbiotic,
    },
    {
      icon: "✨",
      label: "Postbiotics",
      strength: hasPostbiotic ? 0.7 : 0.12,
      status: hasPostbiotic ? "Present" : "Not in meal",
      color: "var(--icon-teal)",
      present: hasPostbiotic,
    },
  ]

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      {/* Main score */}
      <div className="flex items-center gap-5 mb-5">
        <div className="relative flex shrink-0 items-center justify-center">
          <svg width="130" height="130" className="-rotate-90">
            <circle cx="65" cy="65" r={r} fill="none" stroke="currentColor" strokeWidth="9" className="text-border" />
            <circle
              cx="65" cy="65" r={r} fill="none"
              stroke={color} strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute text-center">
            <p className="text-4xl font-bold tabular-nums leading-none" style={{ color }}>{score}</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Gut Score</p>
          </div>
        </div>
        <div>
          <p className="text-xl font-bold font-serif tracking-tight" style={{ color }}>{label}</p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {score >= 65
              ? "This meal is working well for your gut microbiome."
              : score >= 50
              ? "A decent foundation — small additions can boost it significantly."
              : "A starting point — the suggestions below will transform this meal."}
          </p>
        </div>
      </div>

      {/* Three pillar indicators */}
      <div className="space-y-2.5">
        {pillars.map((p) => (
          <div key={p.label} className="flex items-center gap-3">
            <span className="w-5 text-base leading-none">{p.icon}</span>
            <span className="w-20 shrink-0 text-xs font-medium text-foreground/70">{p.label}</span>
            <div className="flex-1 h-2 rounded-full bg-border/50 overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${p.strength * 100}%`, background: p.color, opacity: p.present ? 1 : 0.4 }}
              />
            </div>
            <span
              className="w-24 shrink-0 text-right text-xs font-medium"
              style={{ color: p.present ? p.color : "var(--muted-foreground)" }}
            >
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
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
      const base64 = canvas.toDataURL("image/jpeg", 0.85).replace(/^data:image\/jpeg;base64,/, "")
      resolve({ base64, mimeType: "image/jpeg" })
    }
    img.onerror = reject
    img.src = url
  })
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
        <p className="text-base font-semibold text-foreground">Upload a meal photo</p>
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
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--icon-green)]/20 to-transparent animate-scan" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl bg-background/90 backdrop-blur-sm px-5 py-3 flex items-center gap-3">
            <Loader2 size={18} className="animate-spin text-[var(--icon-green)]" />
            <span className="text-sm font-semibold">Claude is analysing your meal…</span>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Identifying every food and scoring against the 3 biotics framework
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
  const score = typeof result.score === "number" ? Math.round(result.score) : 50

  const hasProbiotic = result.foods.some((f) => f.biotic === "probiotic")
  const hasPostbiotic = result.foods.some((f) => f.biotic === "postbiotic")

  const byBiotic = result.foods.reduce((acc, f) => {
    if (!acc[f.biotic]) acc[f.biotic] = []
    acc[f.biotic].push(f)
    return acc
  }, {} as Record<BioticType, AnalysedFood[]>)

  return (
    <div className="space-y-4">

      {/* Meal photo — full width at top */}
      <div className="relative overflow-hidden rounded-2xl">
        <Image
          src={previewUrl} alt="Your meal"
          width={600} height={360}
          className="w-full object-cover max-h-56"
          unoptimized
        />
      </div>

      {/* Score display */}
      <ScoreDisplay
        score={score}
        prebioticStrength={result.prebioticStrength ?? "low"}
        hasProbiotic={hasProbiotic}
        hasPostbiotic={hasPostbiotic}
      />

      {/* What this meal does well — lead with positives */}
      {result.whatThisMealDoes && (
        <div className="rounded-2xl border border-[var(--icon-green)]/30 bg-[var(--icon-green)]/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={13} style={{ color: "var(--icon-green)" }} />
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--icon-green)]">
              What this meal does well
            </p>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{result.whatThisMealDoes}</p>
        </div>
      )}

      {/* Foods identified */}
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
                    title={f.confidence === "low" ? "Low confidence — Claude wasn't certain" : undefined}
                  >
                    {f.emoji} {f.name}
                    {f.confidence === "low" && <span className="opacity-60">?</span>}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Complete your gut trifecta — reframed as opportunity */}
      {result.missingBiotics.length > 0 && (
        <div className="rounded-2xl border border-[var(--icon-orange)]/30 bg-[var(--icon-orange)]/5 p-4">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-[var(--icon-orange)]">
            To complete your gut trifecta
          </p>
          <ul className="space-y-1.5">
            {result.missingBiotics.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-foreground/80">
                <span className="mt-0.5 font-semibold text-[var(--icon-orange)]">+</span>
                <span>{TRIFECTA_LABELS[b]?.add ?? `Add a ${b} source`}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            How to boost this meal
          </p>
          <ul className="space-y-2.5">
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
          Build it in My Plate <ArrowRight size={14} />
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
