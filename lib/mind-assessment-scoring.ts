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
      tagline: "Your food patterns are working in your mind's favour.",
      description:
        "Your eating patterns line up well with steady mental energy and clarity — variety, reliable fuel, live foods, a good rhythm, and a mind that responds well. This is a snapshot of patterns that are serving you; the opportunity now is to protect them.",
      color: "var(--icon-green)",
    }
  }
  if (overall >= 58) {
    return {
      type: "Clear Foundation",
      tagline: "Solid food patterns — a small tweak or two could sharpen things further.",
      description:
        "Your patterns give your mind a good base. One or two areas, tightened up, may support even steadier energy and focus. This is a starting point, not a verdict — small changes tend to compound.",
      color: "var(--icon-teal)",
    }
  }
  if (overall >= 42) {
    return {
      type: "Emerging Clarity",
      tagline: "The building blocks are there — consistency is the next step.",
      description:
        "You have real strengths and some areas still finding their rhythm. Steady, repeatable changes may support how clear and even you feel. You're closer than it might seem.",
      color: "var(--icon-lime)",
    }
  }
  if (overall >= 28) {
    return {
      type: "Finding Your Rhythm",
      tagline: "A few steady anchors could make a real difference.",
      description:
        "Some current patterns may be working against steady energy and focus. This is a kind starting point — choosing one or two anchors (a reliable breakfast, a steadier rhythm) often lifts several areas at once.",
      color: "var(--icon-yellow)",
    }
  }
  return {
    type: "Early Builder",
    tagline: "You're at the start of something worthwhile.",
    description:
      "Every small change from here can help. The easiest place to begin is a simple, repeatable base — a steady breakfast, regular meals, and a little more variety — and to notice how you feel as you go.",
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
