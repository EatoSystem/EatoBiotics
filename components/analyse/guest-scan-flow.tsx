"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, FileText, X, ArrowRight, Loader2, ImageIcon } from "lucide-react"
import Image from "next/image"
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

/* ── Loading messages ───────────────────────────────────────────────── */

const LOADING_MESSAGES = [
  "Identifying your foods...",
  "Scoring your prebiotics...",
  "Analysing fermentation...",
  "Calculating gut metrics...",
  "Building your results...",
]

function LoadingState({ previewUrl }: { previewUrl?: string }) {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-5">
      {previewUrl && (
        <div className="relative overflow-hidden rounded-2xl">
          <Image
            src={previewUrl}
            alt="Your meal"
            width={600} height={400}
            className="w-full object-cover max-h-64"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--icon-green)]/20 to-transparent" />
        </div>
      )}
      <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl animate-pulse"
          style={{ background: "color-mix(in srgb, var(--icon-green) 12%, var(--card))" }}
        >
          🌿
        </div>
        <div className="flex gap-2">
          {["🌱", "🦠", "✨"].map((icon, i) => (
            <span
              key={icon}
              className="text-xl"
              style={{
                display: "inline-block",
                animation: "guestBounce 1.4s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }}
            >
              {icon}
            </span>
          ))}
        </div>
        <div>
          <p
            className="text-base font-semibold text-foreground"
            key={msgIndex}
            style={{ animation: "guestFadeUp 400ms ease-out both" }}
          >
            {LOADING_MESSAGES[msgIndex]}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Analysing with AI…</p>
        </div>
      </div>
      <style>{`
        @keyframes guestBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
        @keyframes guestFadeUp {
          from { opacity: 0; transform: translateY(6px); }
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
}: {
  result: AnalysisResult
  onSubmit: (email: string, name: string) => Promise<void>
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
      <div className="absolute inset-0 backdrop-blur-sm bg-background/75" />

      <div
        className="relative w-full max-w-sm rounded-3xl p-8 shadow-2xl"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-2xl mb-3"
            style={{ background: "color-mix(in srgb, var(--icon-green) 12%, transparent)" }}
          >
            🌿
          </div>
          <h3 className="font-serif text-xl font-semibold text-foreground">
            Your result is ready
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Meal scored{" "}
            <span className="font-bold" style={{ color: "var(--icon-green)" }}>
              {score}/100
            </span>
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground/70">
            Enter your email to unlock your full score and save your result
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
            autoFocus
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

        <p className="mt-4 text-center text-xs text-muted-foreground/50">
          One free scan per person · No spam, ever
        </p>
      </div>
    </div>
  )
}

/* ── Upload zone ────────────────────────────────────────────────────── */

function UploadZone({
  onFile,
  error,
}: {
  onFile: (file: File) => void
  error: string | null
}) {
  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef  = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return
    onFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      {/* Primary CTA buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
        >
          <Camera size={16} /> Take a Photo
        </button>
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 rounded-full border border-border py-3.5 text-sm font-semibold text-foreground transition-all hover:bg-secondary/60 active:scale-[0.98]"
        >
          <ImageIcon size={16} /> Choose from Library
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 p-3">
          <X size={14} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-6 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-[var(--icon-green)] bg-[var(--icon-green)]/5"
            : "border-border hover:border-[var(--icon-green)]/40 hover:bg-secondary/30"
        }`}
        onClick={() => galleryRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <span className="text-2xl">📸</span>
        <p className="text-sm text-muted-foreground">
          Or <span className="font-semibold text-foreground">drag and drop</span> a photo here
        </p>
      </div>

      <p className="text-center text-xs text-muted-foreground/60">
        🔒 Free · No account needed · Takes ~20 seconds
      </p>
    </div>
  )
}

const SCAN_USED_KEY = "eatobiotics_guest_scanned"

/* ── Already-used wall ──────────────────────────────────────────────── */

function AlreadyUsedWall() {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card p-8 text-center">
      <div
        className="inline-flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
        style={{ background: "color-mix(in srgb, var(--icon-green) 12%, transparent)" }}
      >
        🌿
      </div>
      <div>
        <h3 className="font-serif text-xl font-semibold text-foreground">
          You&apos;ve used your free scan
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-xs mx-auto">
          Create a free account to score unlimited meals, track your progress, and build your personal food system.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <a
          href="/assessment"
          className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
        >
          Get My Full Biotics Score <ArrowRight size={14} />
        </a>
        <p className="text-xs text-muted-foreground/60">Free · Takes 3 minutes</p>
      </div>
    </div>
  )
}

/* ── Main Guest Scan Flow ───────────────────────────────────────────── */

export function GuestScanFlow({ demoMode = false }: { demoMode?: boolean }) {
  const [stage, setStage] = useState<Stage>("idle")
  const [mode, setMode] = useState<"photo" | "text">("photo")
  const [description, setDescription] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [hash, setHash] = useState<string>("")
  const [alreadyUsed, setAlreadyUsed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const imageDataRef = useRef<{ base64: string; mimeType: "image/jpeg" | "image/png" | "image/webp" } | null>(null)

  // Check localStorage on mount — skip in demo mode
  useEffect(() => {
    if (demoMode) return
    try {
      if (localStorage.getItem(SCAN_USED_KEY)) setAlreadyUsed(true)
    } catch {
      // Private browsing — ignore
    }
  }, [demoMode])

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

  async function handleFile(file: File) {
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

  async function handleEmailSubmit(email: string, name: string) {
    try {
      await fetch("/api/guest-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, result, hash }),
      })
    } catch {
      // Non-fatal
    }
    // Mark as used so the gate shows on next visit (skip in demo mode)
    if (!demoMode) {
      try { localStorage.setItem(SCAN_USED_KEY, "1") } catch { /* ignore */ }
    }
    if (result) setResult({ ...result, shareHash: hash })
    setStage("result")
  }

  function handleReset() {
    setStage("idle")
    setResult(null)
    setPreviewUrl(null)
    setDescription("")
    setHash("")
    setError(null)
    imageDataRef.current = null
  }

  // ── Already used gate ──
  if (alreadyUsed && stage === "idle") {
    return <AlreadyUsedWall />
  }

  // ── Idle stage ──
  if (stage === "idle") {
    return (
      <div className="space-y-5">
        {/* Mode toggle */}
        <div className="flex rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setMode("photo")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all ${
              mode === "photo"
                ? "text-white"
                : "text-muted-foreground hover:bg-secondary/40"
            }`}
            style={mode === "photo" ? { background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" } : {}}
          >
            <Camera size={14} /> Photo
          </button>
          <button
            onClick={() => setMode("text")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all ${
              mode === "text"
                ? "text-white"
                : "text-muted-foreground hover:bg-secondary/40"
            }`}
            style={mode === "text" ? { background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" } : {}}
          >
            <FileText size={14} /> Describe
          </button>
        </div>

        {/* Photo upload */}
        {mode === "photo" && (
          <UploadZone onFile={handleFile} error={error} />
        )}

        {/* Text description */}
        {mode === "text" && (
          <form onSubmit={handleTextSubmit} className="space-y-3">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 p-3">
                <X size={14} className="mt-0.5 shrink-0 text-red-500" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your meal… e.g. 'Grilled salmon with steamed broccoli, brown rice, and a side of kimchi'"
              rows={5}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--icon-green)]/30 resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be specific — include cooking method, sauces, and sides for best results.
            </p>
            <button
              type="submit"
              disabled={!description.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
            >
              Analyse My Meal <ArrowRight size={14} />
            </button>
            <p className="text-center text-xs text-muted-foreground/60">
              🔒 Free · No account needed · Takes ~20 seconds
            </p>
          </form>
        )}
      </div>
    )
  }

  // ── Loading stage ──
  if (stage === "loading") {
    return <LoadingState previewUrl={previewUrl ?? undefined} />
  }

  // ── Capture stage (email gate over blurred preview) ──
  if (stage === "capture" && result) {
    return (
      <>
        <div className="pointer-events-none select-none blur-sm opacity-40 overflow-hidden max-h-80">
          <ResultBuilder result={result} previewUrl={previewUrl ?? undefined} isGuest />
        </div>
        <EmailCapture
          result={result}
          onSubmit={handleEmailSubmit}
        />
      </>
    )
  }

  // ── Result stage ──
  if (stage === "result" && result) {
    return (
      <ResultBuilder
        result={result}
        previewUrl={previewUrl ?? undefined}
        onReset={handleReset}
        isGuest
      />
    )
  }

  return null
}
