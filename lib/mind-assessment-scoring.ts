/* ── Mind Assessment Scoring — native 5-pillar food-pattern model ───────────
 * The Mind assessment is a food-pattern REFLECTION tool for mental energy,
 * clarity, and focus — never a mental-health screening or diagnosis. It has its
 * own five sub-scores (Plant & Polyphenol Diversity, Brain Fuel, Live Foods,
 * Rhythm, Mind Response), each 0–100, scored directly from the 15 questions.
 *
 * A secondary 3-Biotics summary is derived for continuity and stored as the
 * canonical `subScores` (back-compat with the dashboard / consult / nudge).
 * All copy is careful and non-deterministic ("may support", "is associated with").
 */

import { computeSubScores, computeOverall } from "./assessment-scoring"
import type {
  SubScores,
  AssessmentProfile,
  PillarInsight,
  AssessmentResult,
} from "./assessment-scoring"

export { computeSubScores, computeOverall }
export type { SubScores, AssessmentProfile, PillarInsight, AssessmentResult }

export type MindPillarKey =
  | "plantDiversity"
  | "brainFuel"
  | "liveFoods"
  | "rhythm"
  | "mindResponse"

export interface MindPillarScores {
  plantDiversity: number
  brainFuel: number
  liveFoods: number
  rhythm: number
  mindResponse: number
}

export interface MindResult extends AssessmentResult {
  pillarScores: MindPillarScores
  biotics: { prebiotics: number; probiotics: number; postbiotics: number }
  /** Shown when responses suggest persistent low mood/focus — points to a professional. */
  safetyNote?: string
}

export const MIND_PILLAR_IDS: Record<MindPillarKey, string[]> = {
  plantDiversity: ["q1", "q2", "q3"],
  brainFuel: ["q4", "q5", "q6"],
  liveFoods: ["q7", "q8", "q9"],
  rhythm: ["q10", "q11", "q12"],
  mindResponse: ["q13", "q14", "q15"],
}

export const MIND_PILLAR_ORDER: MindPillarKey[] = [
  "plantDiversity",
  "brainFuel",
  "liveFoods",
  "rhythm",
  "mindResponse",
]

/** Non-diagnostic guidance shown if mental clarity/mood responses are low. */
export const MIND_PROFESSIONAL_NOTE =
  "If low mood, anxiety, or focus difficulties are persistent, severe, or getting worse, please speak with a qualified health professional. This is a food-pattern reflection tool and does not assess mental health."

function num(answers: Record<string, number | string[]>, id: string): number {
  const v = answers[id]
  return typeof v === "number" ? v : 0
}

export function computeMindPillarScores(
  answers: Record<string, number | string[]>,
): MindPillarScores {
  const out = {} as MindPillarScores
  for (const key of MIND_PILLAR_ORDER) {
    const ids = MIND_PILLAR_IDS[key]
    const raw = ids.reduce((sum, id) => sum + num(answers, id), 0)
    out[key] = Math.round((raw / (ids.length * 3)) * 100)
  }
  return out
}

interface MindPillarMeta {
  label: string
  icon: string
  color: string
  gradient: string
  strength: string
  opportunity: string
  actionLow: string
  actionHigh: string
}

const MIND_PILLAR_META: Record<MindPillarKey, MindPillarMeta> = {
  plantDiversity: {
    label: "Plant & Polyphenol Diversity",
    icon: "Leaf",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    strength:
      "You meet a wide range of plants and colourful, polyphenol-rich foods — a pattern associated with a varied gut microbiome, which may support mood and clarity for some people.",
    opportunity:
      "Plant variety and colour may support the gut bacteria involved in mood and focus. Adding 2–3 new or colourful plants a week is a gentle way to widen that base.",
    actionLow:
      "This week: add one new colourful plant — berries, leafy greens, or a vegetable you don't usually buy. Variety matters more than perfection.",
    actionHigh:
      "Keep your weekly plant count high and rotate colours so you keep meeting a broad range of polyphenols.",
  },
  brainFuel: {
    label: "Brain Fuel",
    icon: "Wheat",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    strength:
      "You regularly anchor meals with fibre-rich whole foods and a steady breakfast — a pattern that may support more even energy through the day.",
    opportunity:
      "Regular nourishment with protein and fibre — especially at breakfast — may help steady energy and focus. One reliable anchor meal is a good place to start.",
    actionLow:
      "This week: build one dependable breakfast with some protein and fibre (eggs and oats, yoghurt and fruit, beans on wholegrain toast).",
    actionHigh:
      "Diversify your fibre sources across the week so your everyday meals keep doing the heavy lifting.",
  },
  liveFoods: {
    label: "Live Foods",
    icon: "FlaskConical",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    strength:
      "You regularly include live and fermented foods — a simple habit associated with greater microbial diversity, which may support steadier mood for some people.",
    opportunity:
      "Live and fermented foods are an easy daily addition that may support a more varied microbiome. Even one serving a day is a fine starting point.",
    actionLow:
      "This week: add one fermented food you enjoy to a daily meal — kefir, natural yoghurt, kimchi, or miso.",
    actionHigh:
      "Rotate your fermented foods across the week so you meet a wider range of cultures.",
  },
  rhythm: {
    label: "Rhythm",
    icon: "Clock",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    strength:
      "Your eating rhythm is steady, with regular timing and caffeine, late meals, and alcohol kept in check — a pattern associated with more stable energy and mood.",
    opportunity:
      "Regular timing — and keeping caffeine, late eating, and alcohol in check — may support steadier energy and fewer mid-afternoon dips.",
    actionLow:
      "This week: set three anchor meal times and protect them, and notice how caffeine timing affects your afternoon.",
    actionHigh:
      "Spot what most disrupts your rhythm (late nights, skipped meals, extra coffee) and pre-plan one simple fix for each.",
  },
  mindResponse: {
    label: "Mind Response",
    icon: "Heart",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    strength:
      "You generally feel clear and even after eating, with steady focus through the day — a good sign that your current patterns are working for you.",
    opportunity:
      "Post-meal fog, cravings, and afternoon crashes can sometimes track with food patterns. Noticing them is the first step — for some people, small changes may support mood, energy, or focus.",
    actionLow:
      "This week: jot one word on your clarity an hour after meals for a few days. Patterns often point to a simple, kind next step.",
    actionHigh:
      "Notice which foods or habits reliably dent your focus, and experiment with adjusting them one at a time.",
  },
}

const STRENGTH_THRESHOLD = 58

export function getMindInsights(pillarScores: MindPillarScores): PillarInsight[] {
  return MIND_PILLAR_ORDER.map((key): PillarInsight => {
    const score = pillarScores[key]
    const meta = MIND_PILLAR_META[key]
    const isStrength = score >= STRENGTH_THRESHOLD
    return {
      pillar: key,
      label: meta.label,
      score,
      strength: isStrength ? meta.strength : undefined,
      opportunity: !isStrength ? meta.opportunity : undefined,
      action: isStrength ? meta.actionHigh : meta.actionLow,
      icon: meta.icon,
      color: meta.color,
      gradient: meta.gradient,
    }
  }).sort((a, b) => a.score - b.score) // weakest first
}

export function getMindProfile(overall: number): AssessmentProfile {
  if (overall >= 75) {
    return {
      type: "Sharp & Steady",
      tagline: "Your answers point to patterns that support steady focus.",
      description:
        "Your answers describe patterns that are associated with steady mental energy — variety, reliable fuel, live foods and a good rhythm. This is a snapshot of what you reported, not a measure of how your mind works; from here the useful work is protecting what already holds.",
      color: "var(--icon-green)",
    }
  }
  if (overall >= 58) {
    return {
      type: "Clear Foundation",
      tagline: "Your answers point to solid patterns, with room to sharpen one or two.",
      description:
        "Your answers suggest a good base. One or two areas, tightened up, may support steadier energy and focus. This is a starting point, not a verdict — small changes tend to add up.",
      color: "var(--icon-teal)",
    }
  }
  if (overall >= 42) {
    return {
      type: "Emerging Clarity",
      tagline: "Your answers show the building blocks; consistency is the next step.",
      description:
        "Your answers suggest real strengths alongside areas still finding their rhythm. Steady, repeatable changes may support how clear and even you feel — this pattern is a useful place to start rather than a problem.",
      color: "var(--icon-lime)",
    }
  }
  if (overall >= 28) {
    return {
      type: "Finding Your Rhythm",
      tagline: "Your answers suggest a few steady anchors would help most.",
      description:
        "Your answers suggest some current patterns may be pulling against steady energy and focus. This is a kind starting point — choosing one or two anchors, such as a reliable breakfast or a steadier rhythm, is a useful place to begin and often lifts several areas at once.",
      color: "var(--icon-yellow)",
    }
  }
  return {
    type: "Early Builder",
    tagline: "Your answers suggest an early starting point.",
    description:
      "Your answers suggest an early starting point, which is a useful position to build from. A simple, repeatable base is a good place to begin — a steady breakfast, regular meals, a little more variety — noticing how you feel as you go.",
    color: "var(--icon-orange)",
  }
}

export function computeMindResult(
  answers: Record<string, number | string[]>,
): MindResult {
  const pillarScores = computeMindPillarScores(answers)
  const biotics = computeSubScores(answers)
  const overall = computeOverall(biotics)
  const profile = getMindProfile(overall)
  const insights = getMindInsights(pillarScores)
  const nextActions = insights.slice(0, 3).map((i) => i.action)

  // Low self-reported mental response → surface the professional-help note.
  const safetyNote = pillarScores.mindResponse <= 33 ? MIND_PROFESSIONAL_NOTE : undefined

  const subScores: SubScores = {
    prebiotics: biotics.prebiotics,
    probiotics: biotics.probiotics,
    postbiotics: biotics.postbiotics,
    feed: biotics.prebiotics,
    seed: biotics.probiotics,
    heal: biotics.postbiotics,
    diversity: pillarScores.plantDiversity,
    feeding: pillarScores.brainFuel,
    adding: pillarScores.liveFoods,
    consistency: pillarScores.rhythm,
    feeling: pillarScores.mindResponse,
  }

  return {
    subScores,
    overall,
    profile,
    insights,
    nextActions,
    pillarScores,
    biotics: {
      prebiotics: biotics.prebiotics,
      probiotics: biotics.probiotics,
      postbiotics: biotics.postbiotics,
    },
    ...(safetyNote ? { safetyNote } : {}),
    completedAt: Date.now(),
  }
}
