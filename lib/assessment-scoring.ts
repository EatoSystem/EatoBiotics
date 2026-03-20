/* ── Assessment Scoring — Sub-scores, Profile, Insights ────────────── */

import type { PillarKey } from "./assessment-data"

export interface SubScores {
  diversity: number
  feeding: number
  adding: number
  consistency: number
  feeling: number
}

export interface AssessmentProfile {
  type: string
  tagline: string
  description: string
  color: string
}

export interface PillarInsight {
  pillar: PillarKey
  label: string
  score: number
  strength?: string
  opportunity?: string
  action: string
  icon: string // Lucide icon name
  color: string
  gradient: string
}

export interface AssessmentResult {
  subScores: SubScores
  overall: number
  profile: AssessmentProfile
  insights: PillarInsight[] // sorted weakest-first
  nextActions: string[] // top 3 actions from weakest pillars
  completedAt: number
}

/* ── Sub-score calculation ──────────────────────────────────────────── */

export function computeSubScores(
  answers: Record<string, number | string[]>
): SubScores {
  const n = (id: string): number => {
    const v = answers[id]
    return typeof v === "number" ? v : 0
  }
  const pct = (a: number, b: number, c: number) =>
    Math.round(((a + b + c) / 9) * 100)

  return {
    diversity:   pct(n("q1"),  n("q2"),  n("q3")),
    feeding:     pct(n("q4"),  n("q5"),  n("q6")),
    adding:      pct(n("q7"),  n("q8"),  n("q9")),
    consistency: pct(n("q10"), n("q11"), n("q12")),
    feeling:     pct(n("q13"), n("q14"), n("q15")),
  }
}

export function computeOverall(sub: SubScores): number {
  return Math.round(
    (sub.diversity + sub.feeding + sub.adding + sub.consistency + sub.feeling) / 5
  )
}

/* ── Profile determination ──────────────────────────────────────────── */

function getWeakestPillar(sub: SubScores): PillarKey {
  const entries = Object.entries(sub) as [PillarKey, number][]
  return entries.reduce((min, cur) => (cur[1] < min[1] ? cur : min), entries[0])[0]
}

export function getProfile(overall: number, sub: SubScores): AssessmentProfile {
  const weakest = getWeakestPillar(sub)

  if (overall >= 80) {
    return {
      type: "Thriving System",
      tagline: "Your internal food system is working hard in your favour.",
      description:
        "You're doing something genuinely rare — eating with intention, variety, and consistency in a way that meaningfully supports your gut microbiome. Your scores reflect a system that is well-fed, well-timed, and well-balanced. The opportunity now is to refine the edges, explore new foods, and deepen what's already working.",
      color: "var(--icon-green)",
    }
  }

  if (overall >= 65) {
    return {
      type: "Strong Foundation",
      tagline: "You've built something real — now it's time to sharpen it.",
      description:
        "You have solid eating habits and your gut health is benefiting from your effort. There are one or two pillars where a targeted shift would unlock noticeably better results. The good news: you don't need a transformation — just a refinement.",
      color: "var(--icon-teal)",
    }
  }

  if (overall >= 50) {
    return {
      type: "Emerging Balance",
      tagline: "The building blocks are there. Consistency is the next step.",
      description:
        "You have awareness and some strong habits, but they haven't fully integrated into a reliable daily pattern yet. Your gut system responds to consistency — even small, repeatable improvements compound quickly. You're closer to a strong foundation than you might think.",
      color: "var(--icon-lime)",
    }
  }

  if (overall >= 35) {
    if (weakest === "consistency") {
      return {
        type: "Inconsistent System",
        tagline: "Good intention, interrupted by an unpredictable rhythm.",
        description:
          "Your gut microbiome thrives on predictability. When eating is erratic — rushed meals, skipped meals, irregular timing — even good food choices deliver less benefit. The opportunity here isn't to eat more perfectly; it's to eat more predictably.",
        color: "var(--icon-yellow)",
      }
    }
    if (weakest === "adding") {
      return {
        type: "Underfed System",
        tagline: "Your gut is waiting for the live foods it needs to thrive.",
        description:
          "You may be eating reasonably well in other areas, but your microbiome is missing the live, fermented inputs that directly seed and sustain it. Adding even one or two fermented foods regularly can shift the balance meaningfully — and quickly.",
        color: "var(--icon-yellow)",
      }
    }
    return {
      type: "Emerging Balance",
      tagline: "Progress is underway — targeted effort will accelerate it.",
      description:
        "You have some good habits in place, but there are clear gaps where your food system isn't yet consistently supporting your gut. Focusing on your weakest areas first will create the fastest momentum.",
      color: "var(--icon-lime)",
    }
  }

  if (overall >= 20) {
    return {
      type: "Inconsistent System",
      tagline: "Your gut is waiting for a more stable foundation.",
      description:
        "Across most pillars, your current eating patterns aren't yet giving your microbiome what it needs to function well. This isn't a judgment — it's a starting point. Small, specific changes to your daily food rhythm will compound faster than you expect.",
      color: "var(--icon-orange)",
    }
  }

  return {
    type: "Early Builder",
    tagline: "You're at the beginning of something important.",
    description:
      "Your gut health journey is just beginning, and that means every improvement from here creates a meaningful impact. The most effective place to start is building a simple, repeatable base — a handful of whole foods, eaten consistently. Complexity comes later.",
    color: "var(--icon-orange)",
  }
}

/* ── Per-pillar insight copy ────────────────────────────────────────── */

const PILLAR_META: Record<
  PillarKey,
  {
    label: string
    icon: string
    color: string
    gradient: string
    strength: string
    opportunity: string
    actionLow: string
    actionHigh: string
  }
> = {
  diversity: {
    label: "Diversity",
    icon: "Leaf",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    strength:
      "You're regularly exposing your microbiome to a wide variety of plant inputs — one of the strongest predictors of a healthy, resilient gut.",
    opportunity:
      "Different plants feed different bacterial species. Expanding beyond your current plant range, even by adding 2–3 new foods per week, meaningfully increases microbial richness.",
    actionLow:
      "This week: introduce one unfamiliar plant food each day — a new bean, a different leafy green, or a vegetable you haven't eaten recently.",
    actionHigh:
      "Keep a loose mental note of your weekly plant count. If you dip below 20, add one new plant category — seeds, sea vegetables, or a new legume.",
  },
  feeding: {
    label: "Feeding",
    icon: "Wheat",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    strength:
      "You're consistently feeding your gut bacteria the fibre-rich whole foods they need — the raw material your microbiome converts into short-chain fatty acids.",
    opportunity:
      "Fibre from whole plants is the primary fuel for your beneficial gut bacteria. Without regular fibre inputs, the downstream benefits — digestion, immunity, mental clarity — are reduced.",
    actionLow:
      "This week: anchor every main meal with one fibre source. Lentils, oats, vegetables, wholegrains, or beans all count.",
    actionHigh:
      "Diversify your fibre sources. Add resistant starch (cooled potato, green banana) or new legumes to hit different microbial populations.",
  },
  adding: {
    label: "Adding",
    icon: "FlaskConical",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    strength:
      "You're regularly introducing live, fermented foods that directly seed your microbiome with beneficial bacteria — one of the most targeted dietary inputs available.",
    opportunity:
      "Fermented and live-culture foods are among the most direct ways to introduce beneficial bacteria into your gut ecosystem. Even one daily serving makes a measurable difference over time.",
    actionLow:
      "This week: add one fermented food to at least one meal each day — natural yoghurt with breakfast, miso broth with lunch, or a tablespoon of sauerkraut with dinner.",
    actionHigh:
      "Rotate your fermented food sources. Each carries a different bacterial profile — alternate between at least three types across the week.",
  },
  consistency: {
    label: "Consistency",
    icon: "Clock",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    strength:
      "Your eating rhythm is one of your biggest assets. Consistent meal timing allows your microbiome to anticipate and prepare — improving digestion, blood sugar stability, and nutrient absorption.",
    opportunity:
      "Your gut microbiome has its own circadian rhythm. Erratic meal timing, skipped meals, or rushed eating disrupts this rhythm and reduces the effectiveness of even good food choices.",
    actionLow:
      "This week: set three anchor meal times and protect them. Even rough consistency — within a 30-minute window — signals your gut bacteria to prepare and respond.",
    actionHigh:
      "Identify the conditions that break your rhythm (travel, late meetings, social eating) and pre-plan one simple solution for each scenario.",
  },
  feeling: {
    label: "Feeling",
    icon: "Heart",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    strength:
      "Your body is responding well to how you're eating — with stable energy, clear thinking, and good digestive comfort. This is a clear signal that your gut-brain axis is functioning well.",
    opportunity:
      "How you feel after eating — energy, digestion, and mental clarity — is one of the most direct windows into your gut health. When this score is low, it often reflects an imbalance that dietary changes can address in 2–4 weeks.",
    actionLow:
      "This week: note how you feel one hour after each meal for three days — just one word. This builds the data you need to identify which foods or patterns are and aren't working.",
    actionHigh:
      "Pay attention to what disrupts your feeling scores. Identify 2–3 foods or habits that reliably diminish your energy or comfort, and experiment with reducing them one at a time.",
  },
}

/* ── Insights generation ────────────────────────────────────────────── */

export function getInsights(sub: SubScores): PillarInsight[] {
  const keys: PillarKey[] = ["diversity", "feeding", "adding", "consistency", "feeling"]
  return keys
    .map((k): PillarInsight => {
      const score = sub[k]
      const meta = PILLAR_META[k]
      const isStrength = score >= 65
      return {
        pillar: k,
        label: meta.label,
        score,
        strength: isStrength ? meta.strength : undefined,
        opportunity: !isStrength ? meta.opportunity : undefined,
        action: isStrength ? meta.actionHigh : meta.actionLow,
        icon: meta.icon,
        color: meta.color,
        gradient: meta.gradient,
      }
    })
    .sort((a, b) => a.score - b.score) // weakest first
}

/* ── Main compute function ──────────────────────────────────────────── */

export function computeResult(
  answers: Record<string, number | string[]>
): AssessmentResult {
  const subScores = computeSubScores(answers)
  const overall = computeOverall(subScores)
  const profile = getProfile(overall, subScores)
  const insights = getInsights(subScores)
  const nextActions = insights.slice(0, 3).map((i) => i.action)

  return {
    subScores,
    overall,
    profile,
    insights,
    nextActions,
    completedAt: Date.now(),
  }
}
