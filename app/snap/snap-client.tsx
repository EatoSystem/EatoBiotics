"use client"

import { useState, useRef, useEffect, useCallback, type FormEvent, type DragEvent, type ChangeEvent } from "react"
import { Camera, Loader2, Lock, Share2, ArrowRight, RotateCcw, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Types ──────────────────────────────────────────────────────────── */

type Stage = "upload" | "loading" | "teaser" | "unlocked" | "error"

interface Food {
  name: string
  emoji: string
  biotic: "prebiotic" | "probiotic" | "postbiotic" | "protein"
  confidence: "high" | "medium" | "low"
}

interface AnalysisResult {
  score: number
  boostedScore: number
  prebioticStrength: "strong" | "moderate" | "low"
  foods: Food[]
  missingBiotics: string[]
  whatThisMealDoes: string
  suggestions: string[]
  overallAssessment: string
  nutrition: {
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
    fibre_g: number
  }
}

/* ── Constants ──────────────────────────────────────────────────────── */

const BIOTIC_COLORS: Record<string, string> = {
  prebiotic: "var(--icon-green)",
  probiotic: "var(--icon-teal)",
  postbiotic: "var(--icon-orange)",
  protein: "var(--icon-yellow)",
}

const BIOTIC_LABELS: Record<string, string> = {
  prebiotic: "Prebiotic",
  probiotic: "Probiotic",
  postbiotic: "Postbiotic",
  protein: "Protein",
}

const LOADING_STEPS = [
  "Scanning your plate…",
  "Detecting prebiotics, probiotics & postbiotics…",
  "Scoring your gut health…",
  "Almost there…",
]

const GRAD = "linear-gradient(135deg, var(--icon-lime), var(--icon-green))"
const GRAD_BORDER = `linear-gradient(var(--background), var(--background)) padding-box, linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal)) border-box`

/* ── Helpers ────────────────────────────────────────────────────────── */

function scoreBand(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 70) return { label: "Excellent", color: "var(--icon-green)", bgColor: "color-mix(in srgb, var(--icon-green) 12%, transparent)" }
  if (score >= 50) return { label: "Good", color: "var(--icon-yellow)", bgColor: "color-mix(in srgb, var(--icon-yellow) 12%, transparent)" }
  return { label: "Needs Work", color: "var(--icon-orange)", bgColor: "color-mix(in srgb, var(--icon-orange) 12%, transparent)" }
}

function gutStatus(result: AnalysisResult): string {
  const hasPre = result.foods.some(f => f.biotic === "prebiotic")
  const hasPro = result.foods.some(f => f.biotic === "probiotic")
  const hasPost = result.foods.some(f => f.biotic === "postbiotic")
  if (hasPre && hasPro && hasPost) return "Fully Balanced"
  if (hasPre && hasPro) return "Well-Balanced"
  if (hasPre) return "Prebiotic-Rich"
  if (hasPro) return "Probiotic-Rich"
  if (hasPost) return "Postbiotic-Rich"
  return "Building Potential"
}

async function compressImage(file: File): Promise<{ base64: string; mimeType: "image/jpeg" }> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1200
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
        resolve({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg" })
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

/* ── Score Ring ─────────────────────────────────────────────────────── */

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 60
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)

  return (
    <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
      <svg width="160" height="160" className="-rotate-90 absolute inset-0">
        <circle cx="80" cy="80" r={r} fill="none" strokeWidth="10" stroke="var(--border)" />
        <circle
          cx="80" cy="80" r={r} fill="none" strokeWidth="10"
          stroke={color} strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="relative text-center">
        <p className="font-serif text-4xl font-bold leading-none" style={{ color }}>{score}</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">/ 100</p>
      </div>
    </div>
  )
}

/* ── Biotics Bar ────────────────────────────────────────────────────── */

function BioticsBar({ result }: { result: AnalysisResult }) {
  const groups = {
    prebiotic: result.foods.filter(f => f.biotic === "prebiotic").length,
    probiotic: result.foods.filter(f => f.biotic === "probiotic").length,
    postbiotic: result.foods.filter(f => f.biotic === "postbiotic").length,
  }
  const total = groups.prebiotic + groups.probiotic + groups.postbiotic || 1

  return (
    <div className="space-y-2">
      {(["prebiotic", "probiotic", "postbiotic"] as const).map((b) => {
        const count = groups[b]
        const pct = Math.round((count / total) * 100)
        const missing = result.missingBiotics.includes(b)
        const color = BIOTIC_COLORS[b]
        return (
          <div key={b}>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="font-semibold" style={{ color: missing ? "var(--muted-foreground)" : color }}>
                {BIOTIC_LABELS[b]}
              </span>
              <span className="text-muted-foreground">
                {missing ? "Missing" : `${pct}%`}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-border/40">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{ width: missing ? "0%" : `${pct}%`, background: color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Share Card ─────────────────────────────────────────────────────── */

function ShareCard({ result }: { result: AnalysisResult }) {
  const [copied, setCopied] = useState(false)
  const band = scoreBand(result.score)
  const status = gutStatus(result)

  async function handleShare() {
    const text = `My meal scored ${result.score}/100 for gut health 🌿\nStatus: ${status}\nFind out yours → eatobiotics.com/snap`
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ text, url: "https://eatobiotics.com/snap" })
      } else {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } catch {
      // user cancelled share
    }
  }

  return (
    <div
      className="overflow-hidden rounded-3xl p-6 text-center"
      style={{ background: "linear-gradient(135deg, #1A2E12 0%, #0D1F08 60%, #162712 100%)" }}
    >
      {/* Brand */}
      <p className="mb-4 text-xs font-bold tracking-widest text-white/50 uppercase">EatoBiotics</p>

      {/* Score */}
      <div className="relative mx-auto mb-2 flex h-28 w-28 items-center justify-center">
        <svg width="112" height="112" className="-rotate-90 absolute inset-0">
          <circle cx="56" cy="56" r={46} fill="none" strokeWidth="7" stroke="rgba(255,255,255,0.12)" />
          <circle
            cx="56" cy="56" r={46} fill="none" strokeWidth="7"
            stroke={band.color} strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 46}
            strokeDashoffset={2 * Math.PI * 46 * (1 - result.score / 100)}
          />
        </svg>
        <div className="relative">
          <p className="font-serif text-3xl font-bold text-white">{result.score}</p>
          <p className="text-[9px] font-bold tracking-widest text-white/50">/100</p>
        </div>
      </div>

      {/* Status */}
      <p className="font-serif text-lg font-bold text-white">{status}</p>
      <p className="mt-1 text-xs text-white/60">Gut Health Score</p>

      {/* Biotics dots */}
      <div className="mt-4 flex items-center justify-center gap-3">
        {["prebiotic", "probiotic", "postbiotic"].map((b) => {
          const present = !result.missingBiotics.includes(b)
          return (
            <div key={b} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: present ? BIOTIC_COLORS[b] : "rgba(255,255,255,0.2)" }}
              />
              <span className="text-[10px] font-medium" style={{ color: present ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)" }}>
                {b.charAt(0).toUpperCase() + b.slice(1)}
              </span>
            </div>
          )
        })}
      </div>

      {/* URL */}
      <p className="mt-4 text-[10px] font-bold tracking-widest text-white/30 uppercase">eatobiotics.com/snap</p>

      {/* Share button */}
      <button
        onClick={handleShare}
        className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}
      >
        {copied ? <Check size={14} /> : <Share2 size={14} />}
        {copied ? "Copied to clipboard!" : "Share your score"}
      </button>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────── */

export default function SnapClient() {
  const [stage, setStage] = useState<Stage>("upload")
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [email, setEmail] = useState("")
  const [emailSubmitting, setEmailSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* Loading step cycling */
  useEffect(() => {
    if (stage !== "loading") return
    const id = setInterval(() => setLoadingStep(s => (s + 1) % LOADING_STEPS.length), 1800)
    return () => clearInterval(id)
  }, [stage])

  /* Handle file */
  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) { setErrorMsg("Please upload an image file."); setStage("error"); return }
    if (file.size > 10 * 1024 * 1024) { setErrorMsg("Image too large. Please use an image under 10MB."); setStage("error"); return }

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => setImageDataUrl(e.target?.result as string)
    reader.readAsDataURL(file)

    // Compress
    setStage("loading")
    setLoadingStep(0)
    const { base64 } = await compressImage(file)
    setImageBase64(base64)

    // Analyse
    try {
      const res = await fetch("/api/analyse-plate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: "image/jpeg" }),
      })
      const data = await res.json() as AnalysisResult & { error?: string }
      if (data.error) { setErrorMsg(data.error); setStage("error"); return }
      setResult(data)
      setStage("teaser")
    } catch {
      setErrorMsg("Analysis failed. Please try again.")
      setStage("error")
    }
  }, [])

  /* Drag and drop */
  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  /* Email submit */
  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || emailSubmitting) return
    setEmailSubmitting(true)
    try {
      await fetch("/api/submit-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
    } catch { /* silently continue */ }
    setEmailSubmitting(false)
    setStage("unlocked")
  }

  /* Reset */
  function reset() {
    setStage("upload")
    setImageDataUrl(null)
    setImageBase64(null)
    setResult(null)
    setEmail("")
    setErrorMsg("")
  }

  /* ── Upload ─────────────────────────────────────────────── */
  if (stage === "upload") {
    return (
      <div className="space-y-5">
        <div
          role="button"
          tabIndex={0}
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed px-6 py-14 text-center transition-all duration-200",
            dragOver && "scale-[1.02]"
          )}
          style={{
            borderColor: dragOver
              ? "var(--icon-green)"
              : "color-mix(in srgb, var(--icon-green) 30%, transparent)",
            background: dragOver
              ? "color-mix(in srgb, var(--icon-lime) 8%, transparent)"
              : "color-mix(in srgb, var(--icon-lime) 3%, transparent)",
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click() }}
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
            style={{ background: "color-mix(in srgb, var(--icon-lime) 20%, transparent)" }}
          >
            📸
          </div>
          <div>
            <p className="font-serif text-lg font-semibold text-foreground">Drop your meal photo here</p>
            <p className="mt-1 text-sm text-muted-foreground">or tap to choose a photo from your device</p>
          </div>
          <p className="text-[11px] text-muted-foreground">JPEG · PNG · WEBP · max 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
        </div>

        {/* Social proof strip */}
        <div className="flex items-center justify-center gap-6 text-center">
          {[["🌿", "3-Biotics", "Framework"], ["⚡", "Instant", "Results"], ["🔒", "No card", "needed"]].map(([icon, line1, line2]) => (
            <div key={line1} className="text-center">
              <p className="text-xl">{icon}</p>
              <p className="text-[11px] font-bold text-foreground">{line1}</p>
              <p className="text-[10px] text-muted-foreground">{line2}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* ── Loading ────────────────────────────────────────────── */
  if (stage === "loading") {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        {imageDataUrl && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageDataUrl}
              alt="Your meal"
              className="h-32 w-32 rounded-2xl object-cover opacity-60"
            />
            <div
              className="absolute inset-0 flex items-center justify-center rounded-2xl"
              style={{ background: "color-mix(in srgb, var(--background) 40%, transparent)" }}
            >
              <Loader2 size={32} className="animate-spin" style={{ color: "var(--icon-green)" }} />
            </div>
          </div>
        )}
        <div>
          <p className="font-serif text-lg font-semibold text-foreground">{LOADING_STEPS[loadingStep]}</p>
          <p className="mt-1 text-sm text-muted-foreground">Powered by Claude AI</p>
        </div>
        {/* Animated dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full animate-pulse"
              style={{
                background: "var(--icon-green)",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  /* ── Error ──────────────────────────────────────────────── */
  if (stage === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "color-mix(in srgb, var(--destructive) 10%, transparent)" }}
        >
          <AlertCircle size={24} style={{ color: "var(--destructive)" }} />
        </div>
        <div>
          <p className="font-serif text-base font-semibold text-foreground">Couldn&apos;t analyse that image</p>
          <p className="mt-1 text-sm text-muted-foreground">{errorMsg}</p>
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary"
        >
          <RotateCcw size={13} /> Try another photo
        </button>
      </div>
    )
  }

  /* ── Teaser + Unlocked ───────────────────────────────────── */
  if ((stage === "teaser" || stage === "unlocked") && result) {
    const band = scoreBand(result.score)
    const status = gutStatus(result)

    return (
      <div className="space-y-5">
        {/* Image preview strip */}
        {imageDataUrl && (
          <div className="flex items-center gap-3 rounded-2xl border bg-secondary/50 p-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageDataUrl} alt="Your meal" className="h-12 w-12 rounded-xl object-cover" />
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-foreground">Your meal</p>
              <p className="text-[11px] text-muted-foreground">{result.foods.length} items detected</p>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition"
            >
              <RotateCcw size={10} /> New
            </button>
          </div>
        )}

        {/* Score ring + status */}
        <div
          className="rounded-3xl border p-6 text-center"
          style={{
            background: band.bgColor,
            borderColor: `color-mix(in srgb, ${band.color} 25%, transparent)`,
          }}
        >
          <ScoreRing score={result.score} color={band.color} />
          <p className="mt-3 font-serif text-xl font-bold text-foreground">{status}</p>
          <p
            className="mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-bold"
            style={{
              background: `color-mix(in srgb, ${band.color} 15%, transparent)`,
              color: band.color,
            }}
          >
            {band.label} · {result.score}/100
          </p>

          {/* Detected foods */}
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {result.foods.map((food) => (
              <span
                key={food.name}
                className="rounded-full border px-2.5 py-1 text-xs font-medium"
                style={{
                  background: `color-mix(in srgb, ${BIOTIC_COLORS[food.biotic]} 10%, transparent)`,
                  borderColor: `color-mix(in srgb, ${BIOTIC_COLORS[food.biotic]} 25%, transparent)`,
                  color: BIOTIC_COLORS[food.biotic],
                }}
              >
                {food.emoji} {food.name}
              </span>
            ))}
          </div>

          {/* whatThisMealDoes teaser */}
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{result.whatThisMealDoes}</p>
        </div>

        {/* Email gate (teaser only) */}
        {stage === "teaser" && (
          <div
            className="rounded-2xl border-2 border-transparent p-5"
            style={{ background: GRAD_BORDER }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Lock size={14} style={{ color: "var(--icon-green)" }} />
              <p className="text-sm font-bold text-foreground">Unlock your full biotics breakdown</p>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              See your prebiotic, probiotic &amp; postbiotic scores, personalised suggestions, and a shareable score card — free, no card needed.
            </p>
            <form onSubmit={handleEmailSubmit} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none transition focus:ring-2"
                style={{ "--tw-ring-color": "var(--icon-green)" } as React.CSSProperties}
              />
              <button
                type="submit"
                disabled={emailSubmitting}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: GRAD }}
              >
                {emailSubmitting ? <Loader2 size={14} className="animate-spin" /> : "Unlock →"}
              </button>
            </form>
            <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
              Already a member?{" "}
              <a href="/account" className="font-medium underline underline-offset-2 hover:text-foreground">
                Sign in →
              </a>
            </p>
          </div>
        )}

        {/* Full reveal (unlocked only) */}
        {stage === "unlocked" && (
          <>
            {/* Biotics breakdown */}
            <div className="rounded-2xl border bg-card p-4">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Biotics Breakdown</p>
              <BioticsBar result={result} />

              {/* Missing biotics */}
              {result.missingBiotics.length > 0 && (
                <div
                  className="mt-4 rounded-xl border-l-2 py-2 pl-3 pr-2 text-xs leading-relaxed text-muted-foreground"
                  style={{
                    borderColor: "var(--icon-orange)",
                    background: "color-mix(in srgb, var(--icon-orange) 6%, transparent)",
                  }}
                >
                  <span className="font-semibold" style={{ color: "var(--icon-orange)" }}>Missing: </span>
                  {result.missingBiotics.map((b, i) => (
                    <span key={b}>
                      {b.charAt(0).toUpperCase() + b.slice(1)}
                      {i < result.missingBiotics.length - 1 ? " · " : ""}
                    </span>
                  ))}
                  {" — "}add fermented or fibre-rich foods to complete your 3-Biotics plate.
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div
              className="rounded-2xl border p-4"
              style={{
                background: "color-mix(in srgb, var(--icon-green) 4%, transparent)",
                borderColor: "color-mix(in srgb, var(--icon-green) 18%, transparent)",
              }}
            >
              <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
                💡 How to boost this meal
              </p>
              <ul className="space-y-2">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: "var(--icon-green)" }}
                    >
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Nutrition */}
            <div
              className="rounded-2xl border-2 border-transparent p-4"
              style={{ background: GRAD_BORDER }}
            >
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Estimated Nutrition</p>
              <div className="grid grid-cols-5 gap-2 text-center">
                {[
                  { label: "Calories", value: `${result.nutrition.calories}`, unit: "kcal", highlight: false },
                  { label: "Fibre", value: `${result.nutrition.fibre_g}g`, unit: "Gut Key", highlight: true },
                  { label: "Protein", value: `${result.nutrition.protein_g}g`, unit: "", highlight: false },
                  { label: "Carbs", value: `${result.nutrition.carbs_g}g`, unit: "", highlight: false },
                  { label: "Fat", value: `${result.nutrition.fat_g}g`, unit: "", highlight: false },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl py-2"
                    style={{
                      background: s.highlight
                        ? "color-mix(in srgb, var(--icon-green) 10%, transparent)"
                        : "color-mix(in srgb, var(--foreground) 4%, transparent)",
                    }}
                  >
                    <p className="font-serif text-sm font-bold" style={{ color: s.highlight ? "var(--icon-green)" : "var(--foreground)" }}>
                      {s.value}
                    </p>
                    <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
                    {s.highlight && (
                      <p className="text-[8px] font-bold uppercase" style={{ color: "var(--icon-green)" }}>Gut Key</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Shareable card */}
            <ShareCard result={result} />

            {/* Boosted score callout */}
            {result.boostedScore > result.score && (
              <div
                className="rounded-2xl border p-4 text-center"
                style={{
                  background: "color-mix(in srgb, var(--icon-teal) 6%, transparent)",
                  borderColor: "color-mix(in srgb, var(--icon-teal) 22%, transparent)",
                }}
              >
                <p className="text-xs text-muted-foreground">
                  With the suggestions above, this meal could score{" "}
                  <strong className="text-foreground" style={{ color: "var(--icon-teal)" }}>
                    {result.boostedScore}/100
                  </strong>{" "}
                  🚀
                </p>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col gap-3 pt-2">
              <a
                href="/assessment"
                className="flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: GRAD }}
              >
                Discover your full gut health profile
                <ArrowRight size={14} />
              </a>
              <div className="flex gap-3">
                <a
                  href="/pricing"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"
                >
                  See membership plans
                </a>
                <button
                  onClick={reset}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"
                >
                  <Camera size={13} /> Snap another
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return null
}
