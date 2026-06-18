// lib/glucose-assessment-scoring.ts
//
// Scoring + report model for the EatoBetics (glucose) assessment. Mirrors the
// EatoBiotics scoring approach (lib/assessment-scoring.ts) but across 4 glucose
// pillars, and additionally derives the pieces the full EatoBetics Report
// renders (energy-stability sub-metric, meal-timing pattern, GLP-1 focus, a
// tailored 30-day protocol). Educational only — not a medical assessment.

import {
  GLUCOSE_PILLARS,
  GLUCOSE_PILLAR_IDS,
  GLP1_QUESTION_ID,
  type GlucosePillarKey,
} from "./glucose-assessment-data"

export type GlucoseSubScores = Record<GlucosePillarKey, number>

// Weighting (sums to 1): Plate 30%, Rhythm 20%, Strength 25%, Recovery 25%.
export const PILLAR_WEIGHTS: Record<GlucosePillarKey, number> = {
  plate: 0.3,
  rhythm: 0.2,
  strength: 0.25,
  recovery: 0.25,
}

export type Glp1Status = "none" | "considering" | "active"

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

export interface MealTimingPattern {
  label: string
  description: string
}

export interface ProtocolWeek {
  week: string
  title: string
  body: string
  gradient: string
}

export interface GlucoseResult {
  subScores: GlucoseSubScores
  overall: number
  profile: GlucoseProfile
  energyStability: number
  mealTiming: MealTimingPattern
  glp1: Glp1Status
  insights: GlucoseInsight[] // weakest-first
  strongest: GlucoseInsight
  weakest: GlucoseInsight
  nextActions: string[]
  protocol: ProtocolWeek[]
  completedAt: number
}

const num = (answers: Record<string, number>, id: string): number =>
  typeof answers[id] === "number" ? answers[id] : 0

/* ── Sub-scores ─────────────────────────────────────────────────── */

export function computeGlucoseSubScores(answers: Record<string, number>): GlucoseSubScores {
  const out = {} as GlucoseSubScores
  for (const key of Object.keys(GLUCOSE_PILLAR_IDS) as GlucosePillarKey[]) {
    const ids = GLUCOSE_PILLAR_IDS[key]
    const raw = ids.reduce((sum, id) => sum + num(answers, id), 0)
    out[key] = Math.round((raw / (ids.length * 3)) * 100)
  }
  return out
}

export function computeGlucoseOverall(sub: GlucoseSubScores): number {
  const floor = (x: number) => Math.max(x, 20)
  let total = 0
  for (const key of Object.keys(PILLAR_WEIGHTS) as GlucosePillarKey[]) {
    total += floor(sub[key]) * PILLAR_WEIGHTS[key]
  }
  return Math.round(total)
}

/* ── Derived metrics ────────────────────────────────────────────── */

// Energy stability blends post-meal energy (e1), cravings (e2) and overall
// steadiness (e5) into a standalone 0–100 sub-metric for the report.
export function computeEnergyStability(answers: Record<string, number>): number {
  const raw = num(answers, "e1") + num(answers, "e2") + num(answers, "e5")
  return Math.round((raw / 9) * 100)
}

export function getMealTimingPattern(rhythmScore: number): MealTimingPattern {
  if (rhythmScore >= 70)
    return {
      label: "Steady",
      description:
        "Your meals land at fairly predictable times and you rarely eat late or skip-then-overeat. A consistent rhythm helps your body anticipate food and keeps energy even.",
    }
  if (rhythmScore >= 45)
    return {
      label: "Variable",
      description:
        "Your timing shifts from day to day — some structure, some scatter. Nudging meals toward more regular times, and easing off late-night eating, will smooth your curve.",
    }
  return {
    label: "Irregular",
    description:
      "Your meal timing is unpredictable, with late meals or long gaps followed by large ones. Building a steadier daily rhythm is one of the fastest ways to steady your energy.",
  }
}

export function getGlp1Status(answers: Record<string, number>): Glp1Status {
  const v = num(answers, GLP1_QUESTION_ID)
  if (v >= 2) return "active"
  if (v === 1) return "considering"
  return "none"
}

/* ── Profile ────────────────────────────────────────────────────── */

export function getGlucoseProfile(overall: number): GlucoseProfile {
  if (overall >= 80)
    return {
      type: "Steady System",
      tagline: "Your glucose rhythm is working in your favour.",
      description:
        "Your meals, timing, strength habits, and recovery already support stable energy and steady glucose. The focus now is protecting and fine-tuning what's working.",
      color: "var(--icon-green)",
    }
  if (overall >= 65)
    return {
      type: "Balanced Rhythm",
      tagline: "Strong foundations — now to sharpen them.",
      description:
        "You've built real habits that support a steadier food system. A few targeted tweaks could noticeably smooth out your energy, cravings, and post-meal dips.",
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
  strength: {
    strength: "You're protecting muscle well — protein and resistance habits support stronger, more insulin-sensitive tissue.",
    opportunity: "Muscle is where glucose gets used. More protein and a little resistance work make your whole system more stable.",
    actionLow: "Aim for a palm of protein at each main meal, and add two short resistance sessions a week (even bodyweight).",
    actionHigh: "Keep training and eating for strength — protein at each meal plus regular resistance work protects your metabolism.",
  },
  recovery: {
    strength: "Your energy, sleep, and stress are supporting your metabolic resilience and steady day-to-day glucose.",
    opportunity: "Sleep, stress, and energy quietly shape your glucose response. This is where steady energy is won or lost.",
    actionLow: "Protect a consistent sleep window and take a 10-minute walk after your largest meal to steady energy.",
    actionHigh: "Keep up the recovery habits — consistent sleep and stress management protect your stability.",
  },
}

const STRENGTH_THRESHOLD = 65

export function generateGlucoseInsights(sub: GlucoseSubScores): GlucoseInsight[] {
  const order: GlucosePillarKey[] = ["plate", "rhythm", "strength", "recovery"]
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
  return insights.sort((a, b) => a.score - b.score) // weakest first
}

/* ── Tailored 30-day protocol ───────────────────────────────────── */

const WEEK_GRADIENTS = [
  "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
  "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
]

const WEEK1_FOCUS: Record<GlucosePillarKey, string> = {
  plate: "Rebuild your most-repeated meal: add vegetables and a palm of protein, and eat them before the starch.",
  rhythm: "Anchor your meal times. Eat at roughly the same hours and stop eating two hours before bed.",
  strength: "Add protein to every main meal and fit in two short resistance sessions — even 15 minutes counts.",
  recovery: "Protect your sleep window and take a 10-minute walk after your largest meal each day.",
}

export function buildProtocol(weakest: GlucosePillarKey, glp1: Glp1Status): ProtocolWeek[] {
  const week2 = glp1 === "active"
    ? "Protect muscle on your appetite window: prioritise protein first at every meal and keep up resistance training."
    : "Build better plates: increase protein, fibre, and food quality across your most repeated meals."
  return [
    { week: "Week 1", title: "Stabilise", body: WEEK1_FOCUS[weakest], gradient: WEEK_GRADIENTS[0] },
    { week: "Week 2", title: "Build Better Plates", body: week2, gradient: WEEK_GRADIENTS[1] },
    { week: "Week 3", title: "Flatten the Curve", body: "Use food order, a post-meal walk, and smarter carbohydrate choices to soften your glucose response.", gradient: WEEK_GRADIENTS[2] },
    { week: "Week 4", title: "Sustain the System", body: "Lock in a few repeatable meals and habits that keep your energy and glucose steady for the long run.", gradient: WEEK_GRADIENTS[3] },
  ]
}

/* ── Top-level ──────────────────────────────────────────────────── */

export function computeGlucoseResult(answers: Record<string, number>): GlucoseResult {
  const subScores = computeGlucoseSubScores(answers)
  const overall = computeGlucoseOverall(subScores)
  const profile = getGlucoseProfile(overall)
  const insights = generateGlucoseInsights(subScores)
  const weakest = insights[0]
  const strongest = insights[insights.length - 1]
  const glp1 = getGlp1Status(answers)
  return {
    subScores,
    overall,
    profile,
    energyStability: computeEnergyStability(answers),
    mealTiming: getMealTimingPattern(subScores.rhythm),
    glp1,
    insights,
    strongest,
    weakest,
    nextActions: insights.slice(0, 3).map((i) => i.action),
    protocol: buildProtocol(weakest.pillar, glp1),
    completedAt: Date.now(),
  }
}
