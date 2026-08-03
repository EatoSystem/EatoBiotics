/* ── Assessment Scoring — 3 Biotics ──────────────────────────────────── */

import type { PillarKey } from "./assessment-data"
import type { ConfidenceLabel } from "@/lib/assessment-types"

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
      tagline: "Your answers point to all three pathways being well supported.",
      description:
        "Your answers suggest all three pathways — prebiotic, probiotic and postbiotic — are being supported with real consistency. That pattern is associated with a varied, well-fed microbiome. From here the useful work is protecting what already holds rather than rebuilding.",
      color: "var(--icon-green)",
    }
  }

  if (overall >= 65) {
    return {
      type: "Strong Foundation",
      tagline: "A solid base in your answers, with one pathway thinner than the rest.",
      description:
        "Your answers suggest a solid base, with one or two pathways — often Probiotics or Postbiotics — thinner than the rest. That is a useful place to start: an uneven pattern is easier to work with than a uniformly low one, because the stronger pathway is already doing work the weaker one can build on.",
      color: "var(--icon-teal)",
    }
  }

  if (overall >= 50) {
    return {
      type: "Emerging Balance",
      tagline: "The pieces show up in your answers; the pattern is not yet steady.",
      description:
        "Your answers suggest the pieces are present but not yet settled into a daily rhythm. This pattern may indicate that repetition, rather than knowledge, is the gap. Small repeatable changes to any of the three pathways are a useful place to begin.",
      color: "var(--icon-lime)",
    }
  }

  if (overall >= 35) {
    if (weakest === "probiotics") {
      return {
        type: "Developing System",
        tagline: "Live and fermented foods are the thinnest part of your answers.",
        description:
          "Your answers suggest real strengths in fibre and meal rhythm, with live and fermented foods appearing less often — your Probiotics score. That makes this pathway the most focused place to start. Adding one fermented food to a meal you already eat is a small, repeatable change; notice how it settles before adding more.",
        color: "var(--icon-yellow)",
      }
    }
    if (weakest === "postbiotics") {
      return {
        type: "Developing System",
        tagline: "Meal rhythm and recovery are the thinnest part of your answers.",
        description:
          "Your answers suggest care around food, reflected in your Prebiotics and Probiotics scores, with rhythm and recovery thinner. Irregular meal timing and few colourful, polyphenol-rich foods are associated with a system that gets less from the same ingredients. Rhythm is a useful place to start here.",
        color: "var(--icon-yellow)",
      }
    }
    return {
      type: "Developing System",
      tagline: "Some habits are in place, with clear gaps between them.",
      description:
        "Your answers suggest some habits are in place, with clear gaps where support is not yet consistent. Starting with the thinnest pathway is a useful way to focus the effort, and small changes that survive an ordinary week tend to matter more than ambitious ones that do not.",
      color: "var(--icon-yellow)",
    }
  }

  return {
    type: "Early Builder",
    tagline: "An early starting point — a useful place to build from.",
    description:
      "Your answers suggest this is an early starting point, which is a useful position rather than a problem — one repeatable habit tends to move several scores at once. A simple base is a good place to begin: whole plants, one fermented food, and a steadier meal rhythm. Complexity can come later.",
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
      "Your answers suggest plant variety and fibre appear consistently. A wider range of plants is associated with a wider range of microbes, which is one of the more consistent findings in microbiome research.",
    opportunity:
      "Your answers suggest there is room for more plant variety and fibre. Anchoring each meal with one fibre source — legumes, wholegrains or vegetables — is a useful place to start, because it adds to meals you already eat rather than replacing them.",
    actionLow:
      "This week: anchor every main meal with one fibre source. Lentils, oats, vegetables, wholegrains or beans all count, and a small portion kept up across the week does more than an occasional large one.",
    actionHigh:
      "Rotate your fibre sources. Resistant starch (cooled potato, green banana) or a legume you do not usually eat gives different microbial populations something to work on — variety is the lever here rather than volume.",
  },
  probiotics: {
    label: "Probiotics",
    icon: "Droplets",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    strength:
      "Your answers suggest live and fermented foods appear regularly. These add microbial exposure rather than only feeding what is already there, which is a distinct contribution — and worth keeping steady rather than intensifying.",
    opportunity:
      "Fermented and live foods are the most direct way to introduce new microbes rather than only feeding existing ones. Small, regular amounts — yoghurt, miso, or a tablespoon of sauerkraut — are associated with more benefit than occasional large ones, and need no change to the rest of the meal.",
    actionLow:
      "This week: add one fermented food to a meal you already eat — live yoghurt with breakfast, miso broth with lunch, or a tablespoon of sauerkraut with dinner. Start small if these are new to you.",
    actionHigh:
      "Rotate your fermented food sources. Each carries a different bacterial profile, and probiotic effects are strain-specific, so alternating between three or more types across the week widens what you are exposed to.",
  },
  postbiotics: {
    label: "Postbiotics",
    icon: "Zap",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    strength:
      "Your answers suggest meal rhythm and recovery are well supported. Regular timing and polyphenol-rich foods are associated with the conditions your microbes need to produce beneficial compounds from what you eat.",
    opportunity:
      "Your answers suggest rhythm and colourful, polyphenol-rich foods are the thinner part here. Rough consistency in meal timing, plus two or three colourful plants a day, is a useful place to start — the lever is predictability rather than any single food.",
    actionLow:
      "This week: pick three anchor meal times and protect them. Then add one colourful plant food per meal — berries, tomatoes, dark greens or herbs. Small and repeatable tends to hold better than ambitious and occasional.",
    actionHigh:
      "Notice what breaks your rhythm on a busy week and plan around it. Adding one polyphenol-rich food you do not currently eat — dark chocolate, walnuts, or extra-virgin olive oil — is a small way to widen what reaches your gut.",
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

/* ── Result sections (presentation helper) ──────────────────────────────
 * Derives the standard, constructive result sections every foundation result
 * shows: What this means · Why it matters · What to do this week · Strongest
 * area · Biggest opportunity · a Snapshot/Pattern/Tracked confidence label. */

export interface FoundationSections {
  whatThisMeans: string
  whyItMatters: string
  whatToDoThisWeek: string
  strongestArea: string
  biggestOpportunity: string
  confidenceLabel: ConfidenceLabel
}

export function resultSections(
  result: AssessmentResult,
  confidenceLabel: ConfidenceLabel = "Snapshot",
): FoundationSections {
  const insights = result.insights // already sorted weakest-first
  const strongest = insights.length ? insights[insights.length - 1] : null
  const weakest = insights.length ? insights[0] : null
  return {
    whatThisMeans: result.profile.description,
    whyItMatters:
      "What you eat is associated with how the rest of your body is supported — energy, digestion, immunity and resilience are all shaped by many things, food among them. Treat this as a snapshot of a pattern you can change, not a fixed trait or a finding about your health.",
    whatToDoThisWeek:
      result.nextActions[0] ?? weakest?.action ?? "Pick one small, repeatable change for this week.",
    strongestArea: strongest?.label ?? "—",
    biggestOpportunity: weakest?.label ?? "—",
    confidenceLabel,
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
