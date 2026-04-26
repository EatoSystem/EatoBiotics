"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, FileText, X, ArrowRight, Loader2 } from "lucide-react"
import { ResultBuilder, type AnalysisResult } from "./result-builder"

/* ── Types ──────────────────────────────────────────────────────────── */

type Stage = "idle" | "loading" | "capture" | "result"

/* ── Hash generation ─────────────────────────────────────────────────── */

function generateHash(): string {
  return btoa(Date.now().toString(36) + Math.random().toString(36))
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 12)
}

/* ── Image compression ──────────────────────────────────────────────── */

async function compressImage(file: File): Promise<{ base64: string; mimeType: "image/jpeg" | "image/png" | "image/webp" }> {
  return new Promise((resolve) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1200
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height / width) * MAX)
          width = MAX
        } else {
          width = Math.round((width / height) * MAX)
          height = MAX
        }
      }
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, width, height)
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
      const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, "")
      resolve({ base64, mimeType: "image/jpeg" })
    }
    img.src = url
  })
}

/* ── Loading messages ───────────────────────────────────────────────── */

const LOADING_MESSAGES = [
  "Identifying your foods...",
  "Scoring your prebiotics...",
  "Analysing fermentation...",
  "Calculating gut metrics...",
  "Building your results...",
]

function LoadingState() {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-8">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl animate-pulse"
          style={{ background: "color-mix(in srgb, var(--icon-green) 12%, var(--card))" }}
        >
          🌿
        </div>
      </div>
      <div className="flex gap-3 mb-6">
        {["🌱", "🦠", "✨"].map((icon, i) => (
          <span
            key={icon}
            className="text-2xl"
            style={{
              animation: "bounce 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          >
            {icon}
          </span>
        ))}
      </div>
      <p
        className="text-base font-semibold text-foreground transition-all duration-500"
        key={msgIndex}
        style={{ animation: "fadeSlideUp 400ms ease-out both" }}
      >
        {LOADING_MESSAGES[msgIndex]}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Analysing your meal with AI…
      </p>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/* ── Email capture overlay ──────────────────────────────────────────── */

function EmailCapture({
  result,
  onSubmit,
  onSkip,
}: {
  result: AnalysisResult
  onSubmit: (email: string, name: string) => Promise<void>
  onSkip: () => void
}) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const score = Math.round(result.score)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    await onSubmit(email, name)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred backdrop showing score */}
      <div className="absolute inset-0 backdrop-blur-sm bg-background/70" />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm rounded-3xl p-8 shadow-2xl"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-3xl mb-4"
            style={{ background: "color-mix(in srgb, var(--icon-green) 12%, transparent)" }}
          >
            🌿
          </div>
          <h3 className="font-serif text-xl font-semibold text-foreground">
            Your result is ready
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your meal scored{" "}
            <span className="font-bold" style={{ color: "var(--icon-green)" }}>
              {score}/100
            </span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground/70">
            Enter your email to unlock your full score and share it
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--icon-green)]/30"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--icon-green)]/30"
          />
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <>See My Score <ArrowRight size={14} /></>
            )}
          </button>
        </form>

        <button
          onClick={onSkip}
          className="mt-4 w-full text-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          Skip →
        </button>
      </div>
    </div>
  )
}

/* ── Main Guest Scan Flow ───────────────────────────────────────────── */

export function GuestScanFlow() {
  const [stage, setStage] = useState<Stage>("idle")
  const [mode, setMode] = useState<"photo" | "text">("photo")
  const [description, setDescription] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [hash, setHash] = useState<string>("")
  const [emailCaptured, setEmailCaptured] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageDataRef = useRef<{ base64: string; mimeType: "image/jpeg" | "image/png" | "image/webp" } | null>(null)

  async function runAnalysis(imageData?: typeof imageDataRef.current, desc?: string) {
    setStage("loading")
    setError(null)

    try {
      const body = imageData
        ? { imageBase64: imageData.base64, mimeType: imageData.mimeType }
        : { description: desc }

      const res = await fetch("/api/analyse-plate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setStage("idle")
        return
      }

      setResult(data as AnalysisResult)
      setHash(generateHash())
      setStage("capture")
    } catch {
      setError("Analysis failed. Please try again.")
      setStage("idle")
    }
  }

  async function handleFileSelect(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.")
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    const imageData = await compressImage(file)
    imageDataRef.current = imageData
    await runAnalysis(imageData)
  }

  async function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return
    await runAnalysis(undefined, description.trim())
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) await handleFileSelect(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  async function handleEmailSubmit(email: string, name: string) {
    try {
      await fetch("/api/guest-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, result, hash }),
      })
    } catch {
      // Non-fatal — proceed regardless
    }
    setEmailCaptured(true)
    if (result) {
      setResult({ ...result, shareHash: hash })
    }
    setStage("result")
  }

  function handleSkip() {
    setStage("result")
  }

  function handleReset() {
    setStage("idle")
    setResult(null)
    setPreviewUrl(null)
    setDescription("")
    setHash("")
    setEmailCaptured(false)
    setError(null)
    imageDataRef.current = null
  }

  // ── Idle stage ──
  if (stage === "idle") {
    return (
      <div className="space-y-6">
        {/* Mode toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode("photo")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              mode === "photo"
                ? "text-white"
                : "border border-border text-muted-foreground hover:bg-secondary/60"
            }`}
            style={mode === "photo" ? { background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" } : {}}
          >
            <Camera size={15} /> Take a Photo
          </button>
          <button
            onClick={() => setMode("text")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              mode === "text"
                ? "text-white"
                : "border border-border text-muted-foreground hover:bg-secondary/60"
            }`}
            style={mode === "text" ? { background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" } : {}}
          >
            <FileText size={15} /> Describe Instead
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 p-4">
            <X size={15} className="mt-0.5 shrink-0 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Photo upload */}
        {mode === "photo" && (
          <>
            <div
              className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center transition-all cursor-pointer ${
                isDragging
                  ? "border-[var(--icon-green)] bg-[var(--icon-green)]/5"
                  : "border-border hover:border-[var(--icon-green)]/50 hover:bg-secondary/30"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
                style={{ background: "color-mix(in srgb, var(--icon-green) 12%, var(--card))" }}
              >
                📸
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Drop your meal photo here
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  or click to select · JPG, PNG, WebP · Max 5MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              🔒 Free scan · No account needed · Takes ~20 seconds
            </p>
          </>
        )}

        {/* Text description */}
        {mode === "text" && (
          <form onSubmit={handleTextSubmit} className="space-y-3">
            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your meal in detail… e.g. 'Grilled salmon with steamed broccoli, brown rice, and a side of kimchi'"
                rows={5}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--icon-green)]/30 resize-none"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Be specific — include cooking method, sauces, and sides for the best results.
              </p>
            </div>
            <button
              type="submit"
              disabled={!description.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
            >
              Analyse My Meal <ArrowRight size={14} />
            </button>
            <p className="text-center text-xs text-muted-foreground">
              🔒 Free scan · No account needed · Takes ~20 seconds
            </p>
          </form>
        )}
      </div>
    )
  }

  // ── Loading stage ──
  if (stage === "loading") {
    return <LoadingState />
  }

  // ── Capture stage (email gate) ──
  if (stage === "capture" && result) {
    return (
      <>
        {/* Blurred preview of result */}
        <div className="pointer-events-none select-none blur-sm opacity-40 overflow-hidden max-h-80">
          <ResultBuilder result={result} previewUrl={previewUrl ?? undefined} isGuest />
        </div>

        {/* Email capture modal */}
        <EmailCapture
          result={result}
          onSubmit={handleEmailSubmit}
          onSkip={handleSkip}
        />
      </>
    )
  }

  // ── Result stage ──
  if (stage === "result" && result) {
    return (
      <div className="space-y-5">
        {/* Nudge banner for skipped email */}
        {!emailCaptured && (
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
            style={{
              background: "color-mix(in srgb, var(--icon-lime) 8%, var(--card))",
              border: "1px solid color-mix(in srgb, var(--icon-lime) 25%, transparent)",
            }}
          >
            <span className="text-lg leading-none">💡</span>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Save your result next time</span> — enter your email to track and share your scores.
            </p>
          </div>
        )}

        <ResultBuilder
          result={result}
          previewUrl={previewUrl ?? undefined}
          onReset={handleReset}
          isGuest
        />
      </div>
    )
  }

  return null
}
