"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, X, Zap, Leaf, Brain, Shield, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "eatobiotics_onboarded"

const INTENTS = [
  { id: "digestion",  label: "Digestion",  icon: <Leaf size={18} />,      color: "var(--icon-lime)" },
  { id: "energy",     label: "Energy",     icon: <Zap size={18} />,       color: "var(--icon-yellow)" },
  { id: "mood",       label: "Mood",       icon: <Brain size={18} />,     color: "var(--icon-teal)" },
  { id: "immunity",   label: "Immunity",   icon: <Shield size={18} />,    color: "var(--icon-green)" },
  { id: "recovery",   label: "Recovery",   icon: <RefreshCw size={18} />, color: "var(--icon-orange)" },
]

interface OnboardingModalProps {
  memberName: string | null
  consultHref?: string
  skip?: boolean  // suppresses the modal (e.g. WelcomeScreen is showing instead)
}

export function OnboardingModal({ memberName, consultHref, skip }: OnboardingModalProps) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const firstName = memberName?.split(" ")[0] ?? null

  useEffect(() => {
    if (skip) return  // WelcomeScreen is handling the first-visit experience
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch { /* SSR / private browsing */ }
  }, [skip])

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, "1") } catch { /* ignore */ }
    setVisible(false)
  }

  async function saveIntentAndNext() {
    if (!selected) { setStep(1); return }
    setSaving(true)
    try {
      await fetch("/api/profile/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals: [selected] }),
      })
    } catch { /* non-fatal */ }
    setSaving(false)
    setStep(1)
  }

  if (!visible) return null

  const dots = [0, 1, 2]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Top bar */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-teal), var(--icon-orange))" }} />

        <div className="p-6">
          {/* Header row */}
          <div className="flex items-center justify-between mb-5">
            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {dots.map((i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? "24px" : "6px",
                    background: i <= step ? "var(--icon-lime)" : "var(--border)",
                  }}
                />
              ))}
            </div>
            <button
              onClick={dismiss}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Skip onboarding"
            >
              <X size={14} />
            </button>
          </div>

          {/* ── Step 0: Set Intent ── */}
          {step === 0 && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-1">
                {firstName ? `Welcome, ${firstName}.` : "Welcome."}
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                What do you most want to improve?
              </p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {INTENTS.map((intent) => (
                  <button
                    key={intent.id}
                    onClick={() => setSelected(intent.id)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-2xl border p-3.5 text-left text-sm font-semibold transition-all",
                      selected === intent.id
                        ? "border-current text-foreground shadow-sm"
                        : "border-border text-muted-foreground hover:border-current hover:text-foreground"
                    )}
                    style={selected === intent.id ? { borderColor: intent.color, background: `color-mix(in srgb, ${intent.color} 8%, white)` } : undefined}
                  >
                    <span style={{ color: intent.color }}>{intent.icon}</span>
                    {intent.label}
                  </button>
                ))}
              </div>
              <button
                onClick={saveIntentAndNext}
                disabled={saving}
                className="w-full rounded-full py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
              >
                {saving ? "Saving…" : selected ? "Continue" : "Skip for now"}{!saving && <ArrowRight size={14} className="inline ml-1.5" />}
              </button>
            </div>
          )}

          {/* ── Step 1: Log First Meal ── */}
          {step === 1 && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-1">
                Log your first meal
              </h2>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                Take a photo or describe what you just ate. EatoBiotics will score it across the 3 Biotics: <strong>Pre, Pro, and Post</strong>.
              </p>
              <div
                className="rounded-2xl p-4 mb-5 text-sm"
                style={{
                  background: "color-mix(in srgb, var(--icon-teal) 8%, white)",
                  border: "1px solid color-mix(in srgb, var(--icon-teal) 20%, transparent)",
                }}
              >
                <p className="font-semibold text-foreground mb-1">Why log meals?</p>
                <p className="text-muted-foreground leading-relaxed">
                  Every meal builds your food system picture. The more you log, the smarter EatoBiotic becomes about your patterns.
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/analyse"
                  onClick={dismiss}
                  className="flex-1 rounded-full py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
                >
                  Log a Meal <ArrowRight size={14} className="inline ml-1" />
                </Link>
                <button
                  onClick={() => setStep(2)}
                  className="rounded-full px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Meet EatoBiotic ── */}
          {step === 2 && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-1">
                Meet EatoBiotic
              </h2>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                Your personal food system consultant — built on your scores, meals, and patterns.
              </p>
              <div className="space-y-3 mb-5">
                {[
                  { label: "Learns from you", desc: "Every meal and score shapes what EatoBiotic knows about your system." },
                  { label: "Answers your questions", desc: "Ask anything about your food system, symptoms, or progress." },
                  { label: "Gets smarter over time", desc: "Monthly reviews and check-ins build a richer picture every week." },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex gap-3">
                    <div
                      className="mt-0.5 h-5 w-5 shrink-0 rounded-full flex items-center justify-center"
                      style={{ background: "color-mix(in srgb, var(--icon-lime) 20%, white)" }}
                    >
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--icon-lime)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                {consultHref && (
                  <Link
                    href={consultHref}
                    onClick={dismiss}
                    className="flex-1 rounded-full py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, var(--icon-orange), var(--icon-teal))" }}
                  >
                    Ask EatoBiotic <ArrowRight size={14} className="inline ml-1" />
                  </Link>
                )}
                <button
                  onClick={dismiss}
                  className={cn(
                    "rounded-full py-3 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors",
                    consultHref ? "px-4" : "flex-1"
                  )}
                >
                  {consultHref ? "Done" : "Get started"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
