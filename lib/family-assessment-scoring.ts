/* ── Family Assessment Scoring ─────────────────────────────────────────── */
// Same math as lib/assessment-scoring.ts.
// Only profiles and pillar insight copy are reframed for family context.

import {
  computeSubScores,
  computeOverall,
} from "./assessment-scoring"
import type {
  SubScores,
  AssessmentProfile,
  PillarInsight,
  AssessmentResult,
} from "./assessment-scoring"

// Family assessment uses its own 5-pillar system (independent of gut Feed/Seed/Heal)
type FamilyPillarKey = "diversity" | "feeding" | "adding" | "consistency" | "feeling"

export { computeSubScores, computeOverall }
export type { SubScores, AssessmentProfile, PillarInsight, AssessmentResult }

/* ── Profile determination ──────────────────────────────────────────── */

function getWeakestPillar(sub: SubScores): FamilyPillarKey {
  const entries = Object.entries(sub) as [FamilyPillarKey, number][]
  return entries.reduce((min, cur) => (cur[1] < min[1] ? cur : min), entries[0])[0]
}

export function getProfile(overall: number, sub: SubScores): AssessmentProfile {
  const weakest = getWeakestPillar(sub)

  if (overall >= 75) {
    return {
      type: "Thriving System",
      tagline: "Your family's food culture is working hard in everyone's favour.",
      description:
        "You're doing something genuinely rare — feeding your family with intention, variety, and consistency in a way that meaningfully supports every gut in the house. Your scores reflect a system that is well-fed, well-timed, and well-balanced. The opportunity now is to refine the edges, explore new foods together, and deepen what's already working.",
      color: "var(--icon-green)",
    }
  }

  if (overall >= 58) {
    return {
      type: "Strong Foundation",
      tagline: "Your family has built something real — now it's time to sharpen it.",
      description:
        "Your family has solid eating habits and gut health is benefiting from your effort. There are one or two pillars where a targeted shift would unlock noticeably better results for everyone at the table. The good news: you don't need a transformation — just a refinement.",
      color: "var(--icon-teal)",
    }
  }

  if (overall >= 42) {
    return {
      type: "Emerging Balance",
      tagline: "The building blocks are there. Consistency is the family's next step.",
      description:
        "Your family has awareness and some strong habits, but they haven't fully integrated into a reliable daily pattern yet. Your family's gut health responds to consistency — even small, repeatable improvements compound quickly. You're closer to a strong family foundation than you might think.",
      color: "var(--icon-lime)",
    }
  }

  if (overall >= 28) {
    if ((weakest as string) === "consistency") {
      return {
        type: "Inconsistent System",
        tagline: "Good intention, interrupted by an unpredictable family rhythm.",
        description:
          "Your family has intention around food — it shows in some of your answers. What the microbiome is missing right now is predictability. When eating is erratic — rushed meals, skipped meals, irregular timing — even good food choices deliver less benefit. The fix isn't eating better; it's eating more consistently as a family.",
        color: "var(--icon-yellow)",
      }
    }
    if ((weakest as string) === "adding") {
      return {
        type: "Underfed System",
        tagline: "Your family's gut is waiting for the live foods it needs to thrive.",
        description:
          "Your family's eating habits have real strengths — fibre, whole foods, and variety are present. What the microbiome is missing is direct microbial input from live and fermented foods. This is the most targeted gap to address, and the fastest one to close. Adding even one fermented food daily for the family can shift things meaningfully within weeks.",
        color: "var(--icon-yellow)",
      }
    }
    return {
      type: "Emerging Balance",
      tagline: "Progress is underway — targeted effort will accelerate it.",
      description:
        "Your family has some good habits in place, but there are clear gaps where the food system isn't yet consistently supporting gut health. Focusing on the weakest areas first will create the fastest momentum for every family member.",
      color: "var(--icon-lime)",
    }
  }

  if (overall >= 15) {
    return {
      type: "Inconsistent System",
      tagline: "Your family's gut is waiting for a more stable foundation.",
      description:
        "Across most pillars, your family's current eating patterns aren't yet giving the microbiome what it needs to function well. This isn't a judgement — it's a starting point. Small, specific changes to the daily family food rhythm will compound faster than you expect.",
      color: "var(--icon-orange)",
    }
  }

  return {
    type: "Early Builder",
    tagline: "Your family is at the beginning of something important.",
    description:
      "Your family's food system health journey is just beginning, and that means every improvement from here creates a meaningful impact. The most effective place to start is building a simple, repeatable base — a handful of whole foods, eaten consistently together. Complexity comes later.",
    color: "var(--icon-orange)",
  }
}

/* ── Per-pillar insight copy (family-framed) ────────────────────────── */

const FAMILY_PILLAR_META: Record<
  FamilyPillarKey,
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
      "Your family is regularly exposing everyone's microbiome to a wide variety of plant inputs — one of the strongest predictors of a healthy, resilient gut for every person at the table.",
    opportunity:
      "Variety is already part of your family's diet — the next step is expanding the range a little further. Adding 2–3 unfamiliar plants each week meaningfully increases microbial richness without overhauling your meals.",
    actionLow:
      "This week: introduce one unfamiliar plant food to a family meal — a new bean, a different leafy green, or a vegetable nobody has tried recently. One new plant per week adds up fast.",
    actionHigh:
      "Keep a loose mental note of the weekly plant count. If you dip below 20, add one new plant category — seeds, sea vegetables, or a new legume.",
  },
  feeding: {
    label: "Feeding",
    icon: "Wheat",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    strength:
      "Your family is consistently feeding everyone's gut bacteria the fibre-rich whole foods they need — the raw material your microbiomes convert into short-chain fatty acids.",
    opportunity:
      "Fibre from whole plants is the primary fuel for gut bacteria. A simple anchor at each family meal — legumes, wholegrains, or vegetables — creates the consistent supply every microbiome needs to do its best work.",
    actionLow:
      "This week: anchor every main family meal with one fibre source. Lentils, oats, vegetables, wholegrains, or beans all count — and even a small portion makes a difference for every family member.",
    actionHigh:
      "Diversify your family's fibre sources. Add resistant starch (cooled potato, green banana) or new legumes to hit different microbial populations across the household.",
  },
  adding: {
    label: "Adding",
    icon: "FlaskConical",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    strength:
      "Your family is regularly introducing live, fermented foods that directly seed the microbiome with beneficial bacteria — one of the most targeted dietary inputs available for every age.",
    opportunity:
      "Fermented foods are the most direct way to introduce new bacteria to the gut. Even one serving a day — yoghurt at breakfast, miso broth at lunch, or a tablespoon of sauerkraut at dinner — makes a measurable difference for the whole family within weeks.",
    actionLow:
      "This week: add one fermented food to at least one family meal each day — natural yoghurt with breakfast or kefir as an afternoon snack works for all ages.",
    actionHigh:
      "Rotate the family's fermented food sources. Each carries a different bacterial profile — alternate between at least three types across the week for broader microbiome coverage.",
  },
  consistency: {
    label: "Consistency",
    icon: "Clock",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    strength:
      "Your family's eating rhythm is one of your biggest assets. Consistent meal timing allows every microbiome in the household to anticipate and prepare — improving digestion, blood sugar stability, and nutrient absorption for everyone.",
    opportunity:
      "The family's gut microbiomes respond well to rhythm. Even rough consistency in meal timing — within a 30-minute window — improves how effectively every gut processes the food the family is already eating. The food choices don't need to change; the pattern does.",
    actionLow:
      "This week: set three family anchor meal times and protect them. Even rough consistency signals every gut in the house to prepare and respond.",
    actionHigh:
      "Identify the conditions that break the family's rhythm (school activities, late meetings, social eating) and pre-plan one simple solution for each scenario.",
  },
  feeling: {
    label: "Feeling",
    icon: "Heart",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    strength:
      "Your family is responding well to how you're eating together — with stable energy, clear focus, and good digestive comfort across the household. This is a clear signal that the gut-brain axis is functioning well for every family member.",
    opportunity:
      "How family members feel after eating is a direct signal from their gut. If energy or digestion is variable — especially in children — tracking one word per meal for a few days often reveals which foods or patterns are at play, and the fix is usually simpler than expected.",
    actionLow:
      "This week: ask each child to describe how they feel one hour after their main meal for three days — just one word. This builds the pattern awareness needed to identify what's working and what isn't.",
    actionHigh:
      "Pay attention to what disrupts feeling scores in the family. Identify 2–3 foods or habits that reliably diminish energy or comfort, and experiment with reducing them one at a time.",
  },
}

export function getInsights(sub: SubScores): PillarInsight[] {
  const keys: FamilyPillarKey[] = ["diversity", "feeding", "adding", "consistency", "feeling"]
  return keys
    .map((k): PillarInsight => {
      const score = (sub as unknown as Record<string, number>)[k] ?? 0
      const meta = FAMILY_PILLAR_META[k]
      const isStrength = score >= 58
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
