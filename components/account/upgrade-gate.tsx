"use client"

import Link from "next/link"
import { Lock, ArrowRight, Zap, TrendingUp, Calendar } from "lucide-react"

/* ── Upgrade Gate ────────────────────────────────────────────────────────
   Replaces locked tab content with a blurred preview + upgrade prompt.
   Shows a genuine preview of what the feature looks like (blurred)
   so users understand what they're unlocking — not just a wall of text.
────────────────────────────────────────────────────────────────────── */

interface UpgradeGateProps {
  feature: "meals" | "plate" | "monthly-plan" | "consult"
  currentTier: string
}

type GateConfig = {
  icon: React.ReactNode
  title: string
  description: string
  requiredTier: string
  requiredLabel: string
  price: string
  benefits: string[]
  previewRows: Array<{ label: string; value: string; color: string }>
}

const GATE_CONFIGS: Record<string, GateConfig> = {
  meals: {
    icon: <Zap size={20} style={{ color: "var(--icon-yellow)" }} />,
    title: "Track meals & watch your score move",
    description: "Log what you eat and see your Biotics Score shift in real time. Build a streak. Get daily nudges based on your weakest pillar.",
    requiredTier: "grow",
    requiredLabel: "Grow",
    price: "€9.99/mo",
    benefits: [
      "2 meal analyses per day",
      "See your score move in real time",
      "30-day score history",
      "Build a daily habit streak",
      "Nudges based on your weakest pillar",
    ],
    previewRows: [
      { label: "Today's Biotics Score",  value: "74/100", color: "var(--icon-green)" },
      { label: "Prebiotic foods",         value: "Strong",  color: "var(--icon-lime)" },
      { label: "Probiotic foods",         value: "Building",color: "var(--icon-teal)" },
      { label: "Current streak",          value: "5 days 🔥",color: "var(--icon-yellow)" },
    ],
  },
  plate: {
    icon: <TrendingUp size={20} style={{ color: "var(--icon-teal)" }} />,
    title: "Build your personalised food plate",
    description: "Create your weekly plate with AI meal plans built around your score and profile. See exactly what to eat each day.",
    requiredTier: "grow",
    requiredLabel: "Grow",
    price: "€9.99/mo",
    benefits: [
      "AI-generated daily & weekly meal plans",
      "Plans built around your profile type",
      "Swap suggestions for your weakest pillar",
      "Seasonal food recommendations",
      "Shopping list export",
    ],
    previewRows: [
      { label: "Monday plan",    value: "Lentil soup + kefir", color: "var(--icon-green)" },
      { label: "Tuesday plan",   value: "Overnight oats + kimchi", color: "var(--icon-lime)" },
      { label: "Weekly variety", value: "18 plant species",    color: "var(--icon-teal)" },
      { label: "Probiotic days", value: "5 of 7",              color: "var(--icon-yellow)" },
    ],
  },
  "monthly-plan": {
    icon: <Calendar size={20} style={{ color: "var(--icon-teal)" }} />,
    title: "Your personalised monthly gut plan",
    description: "Every month, a new gut plan drops — built from your score data, your weakest pillars, and your goals. Feels like a personal nutritionist.",
    requiredTier: "restore",
    requiredLabel: "Restore",
    price: "€49/mo",
    benefits: [
      "Monthly AI-built gut plan",
      "5 daily meal analyses",
      "Deep-dive into your weakest pillar",
      "Condition-specific guidance",
      "Pillar-by-pillar food protocols",
    ],
    previewRows: [
      { label: "This month's focus", value: "Live Foods + Diversity", color: "var(--icon-teal)" },
      { label: "Week 1 priority",    value: "Fermented food daily",   color: "var(--icon-green)" },
      { label: "Week 2 priority",    value: "20+ plant species",      color: "var(--icon-lime)" },
      { label: "Condition guidance", value: "Gut-brain protocol",     color: "var(--icon-yellow)" },
    ],
  },
  consult: {
    icon: <span className="text-xl">🤖</span>,
    title: "Your personal EatoBiotic AI",
    description: "Unlimited conversations with an AI nutritionist that knows your score, your history, and your goals. Weekly check-ins. Full food system optimisation.",
    requiredTier: "transform",
    requiredLabel: "Transform",
    price: "€99/mo",
    benefits: [
      "Unlimited AI consultations",
      "AI references your full history",
      "Weekly check-in — tracks progress",
      "Full food system optimisation",
      "Founding member status",
    ],
    previewRows: [
      { label: "Last check-in",    value: "3 days ago",          color: "var(--icon-green)" },
      { label: "Conversations",    value: "12 sessions",         color: "var(--icon-teal)" },
      { label: "Score change",     value: "+9 pts this month",   color: "var(--icon-lime)" },
      { label: "Focus this week",  value: "Serotonin Foods",     color: "var(--icon-yellow)" },
    ],
  },
}

export function UpgradeGate({ feature, currentTier }: UpgradeGateProps) {
  const config = GATE_CONFIGS[feature]
  if (!config) return null

  return (
    <div className="relative">
      {/* Blurred preview of what the feature would show */}
      <div className="relative rounded-2xl border border-border overflow-hidden mb-5">
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{ backdropFilter: "blur(6px)", background: "rgba(255,255,255,0.55)" }}
        />
        {/* Fake data rows */}
        <div className="p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Preview</p>
          {config.previewRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className="text-sm font-bold" style={{ color: row.color }}>{row.value}</span>
            </div>
          ))}
        </div>
        {/* Lock overlay */}
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/10 backdrop-blur-sm">
              <Lock size={20} className="text-foreground/50" />
            </div>
            <span className="rounded-full bg-foreground/10 px-3 py-1 text-xs font-semibold text-foreground/60 backdrop-blur-sm">
              {config.requiredLabel} plan
            </span>
          </div>
        </div>
      </div>

      {/* Upgrade card */}
      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div
          className="h-1 w-full"
          style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }}
        />
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60">
              {config.icon}
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-foreground">{config.title}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">{config.description}</p>
            </div>
          </div>

          {/* Benefits */}
          <ul className="mb-5 space-y-2">
            {config.benefits.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-sm text-foreground">
                <div
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "var(--icon-green)" }}
                />
                {b}
              </li>
            ))}
          </ul>

          {/* Price + CTA */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-2xl font-bold text-foreground">{config.price}</span>
              <span className="ml-1 text-sm text-muted-foreground">· cancel anytime</span>
            </div>
            <Link
              href={`/pricing?feature=${config.requiredTier}`}
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-icon-green/25 transition-all hover:opacity-90"
            >
              Unlock {config.requiredLabel} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
