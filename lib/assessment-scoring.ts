/* ── Assessment Scoring — 3 Biotics ──────────────────────────────────── */

import type { PillarKey } from "./assessment-data"

export interface SubScores {
  prebiotics: number   // Plant diversity, fibre, and whole foods (q1–q6)
  probiotics: number   // Fermented and live foods (q7–q9)
  postbiotics: number  // Recovery, rhythm, and resilience (q10–q15)
  // Feed/Seed/Heal aliases and older 5-pillar fields are kept for stored records.
  feed?: number
  seed?: number
  heal?: number
  diversity?: number
  feeding?: number
  adding?: number
  consistency?: number
  feeling?: number
}

export interface AssessmentProfile {
  type: string
  tagline: string
  description: string
  color: string
}

export interface PillarInsight {
  pillar: string // PillarKey for gut; family/mind assessments use their own keys
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

  // Prebiotics: q1–q6 (max 18 points across 6 questions × 3 max each)
  const prebioticRaw = n("q1") + n("q2") + n("q3") + n("q4") + n("q5") + n("q6")
  const prebiotics = Math.round((prebioticRaw / 18) * 100)

  // Probiotics: q7–q9 (max 9 points)
  const probioticRaw = n("q7") + n("q8") + n("q9")
  const probiotics = Math.round((probioticRaw / 9) * 100)

  // Postbiotics: q10–q15 (max 18 points)
  const postbioticRaw = n("q10") + n("q11") + n("q12") + n("q13") + n("q14") + n("q15")
  const postbiotics = Math.round((postbioticRaw / 18) * 100)

  return {
    prebiotics,
    probiotics,
    postbiotics,
    feed: prebiotics,
    seed: probiotics,
    heal: postbiotics,
  }
}

export function computeOverall(sub: SubScores): number {
  // Floor of 20 per pillar: prevents one absent habit from catastrophically
  // dragging the overall score
  const floor = (n: number) => Math.max(n, 20)
  const f = floor(sub.prebiotics ?? sub.feed ?? 0)
  const s = floor(sub.probiotics ?? sub.seed ?? 0)
  const h = floor(sub.postbiotics ?? sub.heal ?? 0)

  // Weighted: Prebiotics 40% (6 questions), Probiotics 20% (3 questions),
  // Postbiotics 40% (6 questions)
  return Math.round(f * 0.4 + s * 0.2 + h * 0.4)
}

/* ── Profile determination ──────────────────────────────────────────── */

function getWeakestPillar(sub: SubScores): PillarKey {
  const pillars: [PillarKey, number][] = [
    ["prebiotics", sub.prebiotics ?? sub.feed ?? 0],
    ["probiotics", sub.probiotics ?? sub.seed ?? 0],
    ["postbiotics", sub.postbiotics ?? sub.heal ?? 0],
  ]
  return pillars.reduce((min, cur) => (cur[1] < min[1] ? cur : min), pillars[0])[0]
}

export function getProfile(overall: number, sub: SubScores): AssessmentProfile {
  const weakest = getWeakestPillar(sub)

  if (overall >= 80) {
    return {
      type: "Thriving Food System",
      tagline: "Your inner food system is working hard in your favour.",
      description:
        "You're doing something genuinely rare — supporting your prebiotic, probiotic, and postbiotic systems with intention and consistency. Your scores reflect an inner food system that is well-nourished, diverse, and resilient. The opportunity now is to refine the edges and deepen what's already working.",
      color: "var(--icon-green)",
    }
  }

  if (overall >= 65) {
    return {
      type: "Strong Foundation",
      tagline: "You've built something real — now it's time to sharpen it.",
      description:
        "You have solid food habits and your gut health is benefiting from your effort. One or two biotic scores — often Probiotics or Postbiotics — are where a targeted shift would unlock noticeably better results. The good news: you don't need a transformation, just a refinement.",
      color: "var(--icon-teal)",
    }
  }

  if (overall >= 50) {
    return {
      type: "Emerging Balance",
      tagline: "The building blocks are there. Consistency is the next step.",
      description:
        "You have awareness and some strong habits, but they haven't fully integrated into a reliable daily rhythm yet. Your gut responds to consistency — even small, repeatable improvements in your Prebiotics, Probiotics, or Postbiotics scores compound quickly from here.",
      color: "var(--icon-lime)",
    }
  }

  if (overall >= 35) {
    if (weakest === "probiotics") {
      return {
        type: "Developing System",
        tagline: "Your gut is waiting for the live foods it needs to thrive.",
        description:
          "Your eating habits have real strengths in fibre and food rhythm. What your microbiome is missing is direct microbial input from fermented and live foods — your Probiotics score. This is the most targeted gap to close, and the fastest one to act on. Adding even one fermented food daily can shift things meaningfully within weeks.",
        color: "var(--icon-yellow)",
      }
    }
    if (weakest === "postbiotics") {
      return {
        type: "Developing System",
        tagline: "Your food rhythm and recovery need more attention.",
        description:
          "You have intention around food — it shows in your Prebiotics and Probiotics scores. What your gut is missing right now is consistency and recovery support. When meal timing is unpredictable and colourful, polyphenol-rich foods are absent, even good food choices deliver less benefit.",
        color: "var(--icon-yellow)",
      }
    }
    return {
      type: "Developing System",
      tagline: "Progress is underway — targeted effort will accelerate it.",
      description:
        "You have some good habits in place, but there are clear gaps where your food system isn't yet consistently supporting your gut. Focusing on your weakest pillar first will create the fastest momentum. Small changes, consistently applied, compound quickly.",
      color: "var(--icon-yellow)",
    }
  }

  return {
    type: "Early Builder",
    tagline: "You're at the beginning of something important.",
    description:
      "Your food system health journey is just beginning, and that means every improvement from here creates a meaningful impact. The most effective place to start is building a simple, repeatable base — whole plants, one fermented food, and a steady meal rhythm. Complexity comes later.",
    color: "var(--icon-orange)",
  }
}

/* ── Per-pillar insight copy ────────────────────────────────────────── */

const PILLAR_META: Record<
  string,
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
  prebiotics: {
    label: "Prebiotics",
    icon: "Leaf",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    strength:
      "You're consistently nourishing your gut bacteria with the plant diversity and fibre they need — one of the strongest predictors of a healthy, resilient microbiome.",
    opportunity:
      "Your gut bacteria are hungry for more plant variety and fibre. A simple anchor at each meal — legumes, wholegrains, or vegetables — creates the consistent fuel your microbiome needs to do its best work.",
    actionLow:
      "This week: anchor every main meal with one fibre source. Lentils, oats, vegetables, wholegrains, or beans all count — even a small portion makes a difference.",
    actionHigh:
      "Diversify your fibre sources. Add resistant starch (cooled potato, green banana) or new legumes to feed different microbial populations and push your Prebiotics score higher.",
  },
  probiotics: {
    label: "Probiotics",
    icon: "Droplets",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    strength:
      "You're regularly introducing live, fermented foods that directly seed your microbiome with beneficial bacteria — one of the most targeted and powerful dietary inputs available.",
    opportunity:
      "Fermented and live foods are the most direct way to introduce new bacteria to your gut. Even one serving a day — yoghurt, miso, or a tablespoon of sauerkraut — makes a measurable difference within weeks and doesn't require big changes to your existing meals.",
    actionLow:
      "This week: add one fermented food to at least one meal each day — live yoghurt with breakfast, miso broth with lunch, or a tablespoon of sauerkraut with dinner.",
    actionHigh:
      "Rotate your fermented food sources. Each carries a different bacterial profile — alternate between at least three types across the week for broader microbiome coverage.",
  },
  postbiotics: {
    label: "Postbiotics",
    icon: "Zap",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    strength:
      "Your food rhythm and recovery support are excellent — your gut has the consistency and polyphenol-rich foods it needs to produce beneficial compounds and maintain resilience.",
    opportunity:
      "Your gut's postbiotic system needs more consistent rhythm and colourful, polyphenol-rich foods. Even rough consistency in meal timing — within a 30-minute window — combined with two to three colourful plants per day can significantly improve your Postbiotics score.",
    actionLow:
      "This week: set three anchor meal times and protect them. Then add one colourful plant food per meal — berries, tomatoes, dark greens, or herbs. Small and consistent beats sporadic and perfect.",
    actionHigh:
      "Identify conditions that break your rhythm and pre-plan simple solutions. Add one polyphenol-rich food you don't currently eat — dark chocolate, walnuts, or extra-virgin olive oil — to push your Postbiotics score further.",
  },
}

/* ── Insights generation ────────────────────────────────────────────── */

export function getInsights(sub: SubScores): PillarInsight[] {
  const keys: PillarKey[] = ["prebiotics", "probiotics", "postbiotics"]
  return keys
    .map((k): PillarInsight => {
      const score = sub[k] ?? 0
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

/* ── Legacy score normaliser ────────────────────────────────────────── */
// Handles old sub_scores format {diversity, feeding, adding, consistency, feeling}
// stored in the database before the 3 Biotics rebuild.

export function normaliseSubScores(raw: Record<string, number>): SubScores {
  if ("prebiotics" in raw) {
    return {
      prebiotics: raw.prebiotics,
      probiotics: raw.probiotics,
      postbiotics: raw.postbiotics,
      feed: raw.prebiotics,
      seed: raw.probiotics,
      heal: raw.postbiotics,
    }
  }
  if ("feed" in raw) {
    return {
      prebiotics: raw.feed,
      probiotics: raw.seed,
      postbiotics: raw.heal,
      feed: raw.feed,
      seed: raw.seed,
      heal: raw.heal,
    }
  }
  // Convert legacy format using same pillar groupings
  const prebiotics = Math.round(((raw.diversity ?? 0) + (raw.feeding ?? 0)) / 2)
  const probiotics = raw.adding ?? 0
  const postbiotics = Math.round(((raw.consistency ?? 0) + (raw.feeling ?? 0)) / 2)
  return {
    prebiotics,
    probiotics,
    postbiotics,
    feed: prebiotics,
    seed: probiotics,
    heal: postbiotics,
  }
}
