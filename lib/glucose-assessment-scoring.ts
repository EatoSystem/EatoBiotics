// lib/glucose-assessment-scoring.ts
//
// Scoring for the EatoBetics (glucose) assessment — mirrors the EatoBiotics
// scoring model (lib/assessment-scoring.ts): per-pillar sub-scores 0–100, a
// weighted overall EatoBetics Score, a glucose profile, and per-pillar
// insights. Educational only — not medical assessment.

import { GLUCOSE_PILLARS, type GlucosePillarKey } from "./glucose-assessment-data"

export interface GlucoseSubScores {
  plate: number // 0–100
  rhythm: number // 0–100
  recovery: number // 0–100
}

export interface GlucoseProfile {
  type: string
  tagline: string
  description: string
  color: string
}

export interface GlucoseInsight {
  pillar: GlucosePillarKey
  label: string
  score: number
  strength?: string
  opportunity?: string
  action: string
  icon: string
  color: string
  gradient: string
}

export interface GlucoseResult {
  subScores: GlucoseSubScores
  overall: number
  profile: GlucoseProfile
  insights: GlucoseInsight[] // weakest-first
  nextActions: string[]
  completedAt: number
}

/* ── Sub-scores ─────────────────────────────────────────────────── */

export function computeGlucoseSubScores(answers: Record<string, number>): GlucoseSubScores {
  const n = (id: string): number => (typeof answers[id] === "number" ? answers[id] : 0)

  const plateRaw = n("g1") + n("g2") + n("g3") + n("g4") + n("g5") + n("g6") // max 18
  const rhythmRaw = n("g7") + n("g8") + n("g9") // max 9
  const recoveryRaw = n("g10") + n("g11") + n("g12") + n("g13") + n("g14") + n("g15") // max 18

  return {
    plate: Math.round((plateRaw / 18) * 100),
    rhythm: Math.round((rhythmRaw / 9) * 100),
    recovery: Math.round((recoveryRaw / 18) * 100),
  }
}

/* ── Overall ────────────────────────────────────────────────────── */

export function computeGlucoseOverall(sub: GlucoseSubScores): number {
  const floor = (x: number) => Math.max(x, 20)
  // Weighted: Plate 40% (6 Qs), Rhythm 20% (3 Qs), Recovery 40% (6 Qs)
  return Math.round(floor(sub.plate) * 0.4 + floor(sub.rhythm) * 0.2 + floor(sub.recovery) * 0.4)
}

/* ── Profile ────────────────────────────────────────────────────── */

export function getGlucoseProfile(overall: number): GlucoseProfile {
  if (overall >= 80)
    return {
      type: "Steady System",
      tagline: "Your glucose rhythm is working in your favour.",
      description:
        "Your meals, timing, and daily habits already support stable energy and steady glucose. The focus now is protecting and fine-tuning what's working.",
      color: "var(--icon-green)",
    }
  if (overall >= 65)
    return {
      type: "Balanced Rhythm",
      tagline: "Strong foundations — now to sharpen them.",
      description:
        "You've built real habits that support a steadier food system. A few targeted tweaks to your plates or rhythm could noticeably smooth out your energy and cravings.",
      color: "var(--icon-teal)",
    }
  if (overall >= 50)
    return {
      type: "Emerging Stability",
      tagline: "The building blocks are there.",
      description:
        "Some of your habits already support stable glucose; others send mixed signals. Consistency is your next step — small, repeatable changes will move the needle.",
      color: "var(--icon-yellow)",
    }
  if (overall >= 35)
    return {
      type: "Variable Pattern",
      tagline: "Mixed signals you can steady.",
      description:
        "Your current meals and rhythm likely create swings in energy and cravings. The good news: a handful of foundational changes can bring real stability, fast.",
      color: "var(--icon-orange)",
    }
  return {
    type: "Spike-Prone Start",
    tagline: "You're at the beginning of something good.",
    description:
      "Right now your food system probably runs on peaks and crashes. That's a clear starting point — a few simple, foundational habits can make a big difference.",
    color: "var(--icon-orange)",
  }
}

/* ── Insights ───────────────────────────────────────────────────── */

interface PillarCopy {
  strength: string
  opportunity: string
  actionLow: string
  actionHigh: string
}

const PILLAR_COPY: Record<GlucosePillarKey, PillarCopy> = {
  plate: {
    strength: "Your plates are well-built — fibre, protein, and carbohydrate quality are supporting steadier glucose.",
    opportunity: "How your meals are built is your biggest lever. Fibre, protein, and food order shape the glucose response of every plate.",
    actionLow: "Add a fist of vegetables or a protein source to your most-repeated meal, and eat it before the starch.",
    actionHigh: "Keep building balanced plates — try swapping one refined carbohydrate a day for a wholegrain or legume.",
  },
  rhythm: {
    strength: "Your eating rhythm is consistent — regular timing and spacing support a steadier glucose curve.",
    opportunity: "Your timing and spacing are sending mixed signals. When you eat matters as much as what you eat.",
    actionLow: "Aim for roughly consistent meal times and avoid eating within two hours of bed for one week.",
    actionHigh: "Protect your rhythm — keep meals evenly spaced so you're not skipping then overeating.",
  },
  recovery: {
    strength: "The life around your meals — movement, sleep, and stress — is supporting your metabolic resilience.",
    opportunity: "Movement, sleep, and stress quietly shape your glucose response. This is where steady energy is won or lost.",
    actionLow: "Take a 10-minute walk after your largest meal each day — it's one of the simplest ways to support glucose.",
    actionHigh: "Keep up the recovery habits — a short post-meal walk and a consistent sleep window protect your stability.",
  },
}

const STRENGTH_THRESHOLD = 65

export function generateGlucoseInsights(sub: GlucoseSubScores): GlucoseInsight[] {
  const order: GlucosePillarKey[] = ["plate", "rhythm", "recovery"]

  const insights = order.map<GlucoseInsight>((key) => {
    const meta = GLUCOSE_PILLARS[key]
    const score = sub[key]
    const isStrength = score >= STRENGTH_THRESHOLD
    const copy = PILLAR_COPY[key]
    return {
      pillar: key,
      label: meta.label,
      score,
      strength: isStrength ? copy.strength : undefined,
      opportunity: isStrength ? undefined : copy.opportunity,
      action: isStrength ? copy.actionHigh : copy.actionLow,
      icon: meta.icon,
      color: meta.color,
      gradient: meta.gradient,
    }
  })

  // Weakest first — surface the biggest opportunity at the top.
  return insights.sort((a, b) => a.score - b.score)
}

/* ── Top-level ──────────────────────────────────────────────────── */

export function computeGlucoseResult(answers: Record<string, number>): GlucoseResult {
  const subScores = computeGlucoseSubScores(answers)
  const overall = computeGlucoseOverall(subScores)
  const profile = getGlucoseProfile(overall)
  const insights = generateGlucoseInsights(subScores)
  const nextActions = insights.slice(0, 3).map((i) => i.action)
  return { subScores, overall, profile, insights, nextActions, completedAt: Date.now() }
}
