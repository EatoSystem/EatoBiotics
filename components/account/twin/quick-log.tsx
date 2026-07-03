"use client"

/**
 * QuickLog — log a meal from anywhere without leaving the page.
 *
 * A portalled full-screen modal in the dark stage language: describe a meal →
 * it analyses (same POST /api/analyse-meal the inline logger uses) → the score
 * counts up with the three biotics and the insight → "Done" refreshes the
 * server-derived Twin and lets the parent fire the stage burst. `mock` mode
 * (demo pages + tests) skips the API and resolves a canned result so the full
 * loop is previewable without auth.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { X, Sparkles, Utensils, Camera } from "lucide-react"
import { useCountUp } from "./use-count-up"
import { MealImpactChips } from "./meal-impact"
import { AFTER_MEAL_STEPS } from "@/lib/account/evolution"
import type { BioticKey } from "@/lib/agent-loop/types"

/** The slice of /api/analyse-meal's response QuickLog renders. */
export interface QuickLogResult {
  meal_name: string
  biotics_score: number
  prebiotic_score: number
  probiotic_score: number
  postbiotic_score: number
  insight: string
  /** analyse-meal tags (Fermented Foods, High Fibre, …) — drive the impact chips. */
  tags?: string[]
}

const MOCK_RESULT: QuickLogResult = {
  meal_name: "Salmon, quinoa & kimchi bowl",
  biotics_score: 79,
  prebiotic_score: 68,
  probiotic_score: 74,
  postbiotic_score: 61,
  insight: "Strong all-rounder — the kimchi brings live cultures while quinoa and vegetables feed your resident microbes.",
  tags: ["Fermented Foods", "Omega-3s", "Plant Diversity", "Protein Rich"],
}

const EXAMPLES = ["Porridge with berries & seeds", "Lentil soup and sourdough", "Chicken, greens & kefir"]

const BIOTIC_META: { key: BioticKey; label: string; color: string; pick: (r: QuickLogResult) => number }[] = [
  { key: "prebiotics", label: "Prebiotics", color: "#A8E063", pick: (r) => r.prebiotic_score },
  { key: "probiotics", label: "Probiotics", color: "#2DAA6E", pick: (r) => r.probiotic_score },
  { key: "postbiotics", label: "Postbiotics", color: "#F5C518", pick: (r) => r.postbiotic_score },
]

function ResultScore({ result }: { result: QuickLogResult }) {
  const score = useCountUp(result.biotics_score, 1100)
  return (
    <div className="flex items-baseline justify-center gap-2">
      <span className="font-serif text-7xl font-bold leading-none" style={{ color: "#A8E063" }}>{score}</span>
      <span className="text-base font-semibold" style={{ color: "rgba(253,251,247,0.4)" }}>/100</span>
    </div>
  )
}

export function QuickLog({
  open,
  onClose,
  onLearned,
  mock = false,
}: {
  open: boolean
  onClose: () => void
  /** Called once per analysed meal, when the result lands (fires the stage burst). */
  onLearned?: () => void
  mock?: boolean
}) {
  const router = useRouter()
  const [phase, setPhase] = useState<"idle" | "analysing" | "result">("idle")
  const [input, setInput] = useState("")
  const [photo, setPhoto] = useState<string | null>(null)
  const [result, setResult] = useState<QuickLogResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  /* Downscale a picked photo to ≤1024px JPEG so uploads stay small + fast. */
  const onPickPhoto = useCallback((file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const max = 1024
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height)
      setPhoto(canvas.toDataURL("image/jpeg", 0.85))
      URL.revokeObjectURL(url)
    }
    img.onerror = () => URL.revokeObjectURL(url)
    img.src = url
  }, [])
  /* The stage burst fires on close (not on result) so it's visible once the
     modal is out of the way. */
  const learnedRef = useRef(false)

  const close = useCallback(() => {
    if (learnedRef.current) {
      learnedRef.current = false
      onLearned?.()
    }
    onClose()
  }, [onClose, onLearned])

  useEffect(() => {
    if (open) {
      setPhase("idle")
      setResult(null)
      setError(null)
      setPhoto(null)
      learnedRef.current = false
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, close])

  const analyse = useCallback(async () => {
    const description = input.trim()
    if (!description && !photo) return
    setPhase("analysing")
    setError(null)
    try {
      let data: QuickLogResult
      if (mock) {
        await new Promise((r) => setTimeout(r, 1200))
        data = { ...MOCK_RESULT, meal_name: description && description.length < 48 ? description : MOCK_RESULT.meal_name }
      } else {
        const res = await fetch("/api/analyse-meal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: description || undefined, image: photo ?? undefined }),
        })
        if (!res.ok) throw new Error("Analysis failed")
        data = (await res.json()) as QuickLogResult
      }
      setResult(data)
      setPhase("result")
      setInput("")
      setPhoto(null)
      learnedRef.current = true
      if (!mock) router.refresh()
    } catch {
      setError("Analysis failed — please try again")
      setPhase("idle")
    }
  }, [input, photo, mock, router])

  if (!open || typeof document === "undefined") return null

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Log a meal">
      <button type="button" aria-label="Close" onClick={close} className="absolute inset-0" style={{ background: "rgba(5,10,3,0.72)", backdropFilter: "blur(4px)" }} />
      <div
        className="eb-pop-in relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl"
        style={{ background: "linear-gradient(175deg, #10200A 0%, #0B1607 70%)", border: "1px solid rgba(253,251,247,0.16)", boxShadow: "0 30px 90px rgba(0,0,0,0.6)" }}
      >
        <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #A8E063, #4CB648, #2DAA6E, #F5C518, #F5A623)" }} />
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          style={{ color: "rgba(253,251,247,0.6)", border: "1px solid rgba(253,251,247,0.2)" }}
        >
          <X size={14} />
        </button>

        <div className="p-6">
          {phase !== "result" && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#A8E063" }}>Quick log</p>
              <h2 className="mt-1 font-serif text-xl font-bold" style={{ color: "#FDFBF7" }}>Show your Food System a meal</h2>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void analyse()
                  }
                }}
                disabled={phase === "analysing"}
                placeholder="e.g. Grilled salmon with quinoa, roasted veg and a spoon of kimchi"
                rows={3}
                className="mt-4 w-full resize-none rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:border-[#A8E063]"
                style={{ background: "rgba(253,251,247,0.06)", border: "1px solid rgba(253,251,247,0.18)", color: "#FDFBF7" }}
              />
              {/* photo logging — snap the plate instead of typing */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
              />
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={phase === "analysing"}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors hover:bg-white/10"
                  style={{ border: "1px solid rgba(245,197,24,0.45)", color: "#F5C518" }}
                >
                  <Camera size={12} /> {photo ? "Retake photo" : "Photo of your plate"}
                </button>
                {photo && (
                  <span className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt="Your meal" className="h-9 w-9 rounded-lg object-cover" style={{ border: "1px solid rgba(253,251,247,0.25)" }} />
                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      aria-label="Remove photo"
                      className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-white"
                      style={{ background: "#F5A623" }}
                    >
                      <X size={9} strokeWidth={3} />
                    </button>
                  </span>
                )}
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setInput(ex)}
                    disabled={phase === "analysing"}
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-white/10"
                    style={{ border: "1px solid rgba(253,251,247,0.18)", color: "rgba(253,251,247,0.65)" }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
              {error && <p className="mt-2 text-xs font-semibold" style={{ color: "#F5A623" }}>{error}</p>}
              <button
                type="button"
                onClick={() => void analyse()}
                disabled={(!input.trim() && !photo) || phase === "analysing"}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #4CB648, #2DAA6E)", boxShadow: "0 6px 24px rgba(76,182,72,0.35)" }}
              >
                {phase === "analysing" ? (
                  <>
                    <span className="eb-aura h-4 w-4 rounded-full" style={{ background: "radial-gradient(circle, #A8E063 0%, rgba(168,224,99,0) 70%)" }} />
                    Your Food System is tasting it…
                  </>
                ) : (
                  <>
                    <Utensils size={14} /> Analyse this meal
                  </>
                )}
              </button>
            </>
          )}

          {phase === "result" && result && (
            <div className="text-center">
              <p className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ background: "rgba(168,224,99,0.12)", border: "1px solid rgba(168,224,99,0.35)", color: "#A8E063" }}>
                <Sparkles size={10} /> Your Food System just learned from this
              </p>
              <h2 className="mt-3 font-serif text-lg font-bold leading-snug" style={{ color: "#FDFBF7" }}>{result.meal_name}</h2>
              <div className="mt-3">
                <ResultScore result={result} />
              </div>
              <div className="mt-4 space-y-2.5 text-left">
                {BIOTIC_META.map((b) => {
                  const v = b.pick(result)
                  return (
                    <div key={b.key}>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(253,251,247,0.7)" }}>{b.label}</span>
                        <span className="text-xs font-bold" style={{ color: b.color }}>{v}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(253,251,247,0.1)" }}>
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.max(4, Math.min(100, v))}%`, background: b.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* what this meal does to the Food System — visual-first impact */}
              <MealImpactChips input={result} />

              <p className="mt-4 rounded-xl px-4 py-3 text-left text-sm leading-relaxed" style={{ background: "rgba(253,251,247,0.06)", border: "1px solid rgba(253,251,247,0.14)", color: "rgba(253,251,247,0.85)" }}>
                {result.insight}
              </p>

              {/* the after-meal journey — edutainment beat after every log */}
              <div className="mt-4 rounded-xl p-4 text-left" style={{ background: "rgba(253,251,247,0.04)", border: "1px solid rgba(253,251,247,0.1)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#A8E063" }}>What happens next inside you</p>
                <div className="mt-3 space-y-0">
                  {AFTER_MEAL_STEPS.map((s, i) => (
                    <div key={s.at} className="eb-reveal relative flex gap-3 pb-3 last:pb-0" style={{ animationDelay: `${300 + i * 180}ms` }}>
                      {i < AFTER_MEAL_STEPS.length - 1 && (
                        <span aria-hidden className="absolute left-[5px] top-4 h-full w-px" style={{ background: "rgba(253,251,247,0.15)" }} />
                      )}
                      <span className="relative mt-1 h-[11px] w-[11px] shrink-0 rounded-full" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}88` }} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold" style={{ color: "rgba(253,251,247,0.9)" }}>
                          <span style={{ color: s.color }}>{s.at}</span> · {s.title}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-snug" style={{ color: "rgba(253,251,247,0.6)" }}>{s.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setPhase("idle")
                    setResult(null)
                  }}
                  className="flex-1 rounded-full px-4 py-2.5 text-sm font-bold transition-colors hover:bg-white/10"
                  style={{ border: "1px solid rgba(168,224,99,0.5)", color: "#A8E063" }}
                >
                  Log another
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="flex-1 rounded-full px-4 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #4CB648, #2DAA6E)", boxShadow: "0 6px 20px rgba(76,182,72,0.3)" }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
