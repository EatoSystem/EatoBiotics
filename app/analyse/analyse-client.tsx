"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import {
  Camera, RefreshCw, Loader2, AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThinkingStream } from "@/components/analyse/thinking-stream"
import { ResultBuilder } from "@/components/analyse/result-builder"
import type { AnalysisResult } from "@/components/analyse/result-builder"

/* ── Types ──────────────────────────────────────────────────────────── */

type State =
  | { kind: "idle" }
  | { kind: "loading"; previewUrl: string }
  | { kind: "streaming"; previewUrl: string; thinking: string; thinkingDone: boolean }
  | { kind: "result"; previewUrl: string; result: AnalysisResult }
  | { kind: "error"; previewUrl: string; message: string }


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
  const inputRef    = useRef<HTMLInputElement>(null)
  const cameraRef   = useRef<HTMLInputElement>(null)
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
      className={cn(
        "relative flex flex-col items-center justify-center gap-6 rounded-3xl border-2 p-12 sm:p-16 text-center transition-all duration-200",
        dragging
          ? "border-[var(--icon-green)] bg-[var(--icon-green)]/5 scale-[1.01]"
          : "border-dashed border-border"
      )}
    >
      {/* Browse from library (desktop + mobile gallery) */}
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

      {/* Camera capture — opens rear camera directly on mobile */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {/* Icon */}
      <div className="relative">
        <div
          className="absolute inset-0 rounded-2xl blur-xl opacity-40"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
        />
        <div
          className="relative flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
        >
          <Camera size={32} className="text-white" />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xl font-semibold text-foreground">Scan your meal</p>
        <p className="text-sm text-muted-foreground">
          Take a photo or upload from your library
        </p>
      </div>

      {/* Two CTAs: camera (mobile-first) + browse */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="brand-gradient flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white shadow-md shadow-icon-green/20 transition-all hover:opacity-90 hover:shadow-lg hover:shadow-icon-green/30"
        >
          <Camera size={16} /> Take photo
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-full border border-border px-7 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60"
        >
          Choose from library
        </button>
      </div>

      {/* Biotic pill decorations */}
      <div className="flex items-center gap-2 opacity-40">
        <div className="biotic-pill" style={{ background: "var(--icon-lime)" }} />
        <div className="biotic-pill" style={{ background: "var(--icon-green)" }} />
        <div className="biotic-pill" style={{ background: "var(--icon-teal)" }} />
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
          <div className="rounded-2xl bg-background/90 backdrop-blur-sm px-5 py-3 flex items-center gap-3 shadow-lg">
            <Loader2 size={18} className="animate-spin text-[var(--icon-green)]" />
            <span className="text-sm font-semibold">EatoBiotics is analysing your meal…</span>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Identifying every food and scoring against the 3 biotics framework
      </p>
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
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm font-medium transition-colors hover:bg-secondary/40"
      >
        <RefreshCw size={14} /> Try again
      </button>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────── */

export function AnalyseClient({ tier }: { tier?: "free" | "grow" | "restore" | "transform" }) {
  const [state, setState] = useState<State>({ kind: "idle" })

  const handleFile = useCallback(async (file: File) => {
    const previewUrl = URL.createObjectURL(file)
    setState({ kind: "loading", previewUrl })

    try {
      const { base64, mimeType } = await compressImage(file)

      // Paid members → streaming endpoint with extended thinking
      // Free tier → existing non-streaming public route
      if (tier && tier !== "free") {
        setState({ kind: "streaming", previewUrl, thinking: "", thinkingDone: false })

        const res = await fetch("/api/analyse/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        })

        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({})) as { error?: string }
          setState({ kind: "error", previewUrl, message: err.error ?? "Analysis failed. Please try again." })
          return
        }

        const reader  = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer    = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const payload = line.slice(6).trim()
            if (payload === "[DONE]") break

            let event: Record<string, unknown>
            try { event = JSON.parse(payload) as Record<string, unknown> } catch { continue }

            if (event.type === "thinking") {
              setState((s) =>
                s.kind === "streaming"
                  ? { ...s, thinking: s.thinking + (event.text as string) }
                  : s
              )
            } else if (event.type === "complete") {
              setState({ kind: "result", previewUrl, result: event.result as unknown as AnalysisResult })
            } else if (event.type === "error") {
              setState({ kind: "error", previewUrl, message: event.message as string })
            }
          }
        }

        // If we exit the loop without a result (e.g. server closed stream early), flag it
        setState((s) => {
          if (s.kind === "streaming") {
            return { kind: "error", previewUrl, message: "Analysis did not complete. Please try again." }
          }
          return s
        })
      } else {
        // Free tier — existing blocking endpoint
        const res = await fetch("/api/analyse-plate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        })

        const data = await res.json() as Record<string, unknown>
        if (data.error) {
          setState({ kind: "error", previewUrl, message: data.error as string })
          return
        }
        setState({ kind: "result", previewUrl, result: data as unknown as AnalysisResult })
      }
    } catch {
      setState({
        kind: "error",
        previewUrl,
        message: "Something went wrong. Please check your connection and try again.",
      })
    }
  }, [tier])

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
      {state.kind === "streaming" && (
        <div className="space-y-4">
          {/* Meal image */}
          <div className="relative overflow-hidden rounded-2xl">
            <Image
              src={state.previewUrl} alt="Your meal"
              width={600} height={400}
              className="w-full object-cover max-h-72"
              unoptimized
            />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/60 to-transparent" />
          </div>

          {/* Status pill */}
          <div className="flex items-center justify-center gap-2">
            {state.thinkingDone ? (
              <>
                <Loader2 size={14} className="animate-spin" style={{ color: "var(--icon-teal)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--icon-teal)" }}>
                  Building your result…
                </span>
              </>
            ) : (
              <>
                <Loader2 size={14} className="animate-spin" style={{ color: "var(--icon-green)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--icon-green)" }}>
                  Claude is reasoning through your meal…
                </span>
              </>
            )}
          </div>

          {/* Live thinking trail */}
          <ThinkingStream thinking={state.thinking} isComplete={state.thinkingDone} />
        </div>
      )}
      {state.kind === "result" && (
        <ResultBuilder previewUrl={state.previewUrl} result={state.result} onReset={reset} />
      )}
      {state.kind === "error" && (
        <ErrorView message={state.message} previewUrl={state.previewUrl} onReset={reset} />
      )}
    </div>
  )
}
