/* ── Mind Assessment Scoring ────────────────────────────────────────── */
// Re-uses computeSubScores and computeOverall from assessment-scoring.ts
// unchanged — same pillar keys, same question IDs (q1–q15), same 0–3 values.
// Only profiles, PILLAR_META copy, and result framing are mind-specific.

import {
  computeSubScores,
  computeOverall,
  type SubScores,
  type AssessmentProfile,
  type PillarInsight,
  type AssessmentResult,
} from "./assessment-scoring"

// Mind assessment uses its own 5-pillar system (independent of gut Feed/Seed/Heal)
type MindPillarKey = "diversity" | "feeding" | "adding" | "consistency" | "feeling"

export { computeSubScores, computeOverall }
export type { SubScores, AssessmentProfile, PillarInsight, AssessmentResult }

/* ── Profile determination ──────────────────────────────────────────── */

function getWeakestPillar(sub: SubScores): MindPillarKey {
  const entries = Object.entries(sub) as [MindPillarKey, number][]
  return entries.reduce((min, cur) => (cur[1] < min[1] ? cur : min), entries[0])[0]
}

export function getMindProfile(overall: number, sub: SubScores): AssessmentProfile {
  const weakest = getWeakestPillar(sub)

  if (overall >= 75) {
    return {
      type: "Sharp Mind",
      tagline: "Your gut-brain axis is working hard in your favour.",
      description:
        "You're doing something genuinely rare — feeding your gut with the diversity, live foods, and consistency it needs to produce the neurotransmitters your brain runs on. Your mental clarity, mood stability, and focus are all benefiting from a gut-brain connection that is functioning the way it should. The opportunity now is refinement — deepening what's already working and protecting the habits that got you here.",
      color: "var(--icon-green)",
    }
  }

  if (overall >= 58) {
    return {
      type: "Clear Foundation",
      tagline: "Solid gut habits are supporting your mental clarity — now sharpen the edges.",
      description:
        "You have real gut-brain support in place. Your food habits are giving your microbiome most of what it needs to produce serotonin, regulate mood, and sustain focus. There are one or two pillars where a targeted shift would make a noticeable difference to how you feel mentally — not a transformation, just a refinement.",
      color: "var(--icon-teal)",
    }
  }

  if (overall >= 42) {
    return {
      type: "Emerging Clarity",
      tagline: "The building blocks are there — consistency will unlock the rest.",
      description:
        "You have awareness and some strong food habits, but they haven't fully integrated into the daily rhythm your gut-brain axis needs. The microbiome responds to consistency — small, repeatable changes compound quickly. Your mental clarity and mood stability are already being shaped by what you eat. Tightening the pattern will reveal how much further they can go.",
      color: "var(--icon-lime)",
    }
  }

  if (overall >= 28) {
    if ((weakest as string) === "consistency") {
      return {
        type: "Foggy System",
        tagline: "Good intention, disrupted by an irregular rhythm.",
        description:
          "You have real food knowledge — it shows in your answers. What your gut-brain axis is missing right now is predictability. When eating is erratic — skipped meals, late eating, irregular timing — your cortisol stays elevated, your serotonin production is disrupted, and mental clarity suffers. The fix isn't eating better food. It's eating more consistently.",
        color: "var(--icon-yellow)",
      }
    }
    if ((weakest as string) === "adding") {
      return {
        type: "Foggy System",
        tagline: "Your gut is waiting for the live foods it needs to talk to your brain.",
        description:
          "Your eating habits have real strengths — fibre, whole foods, and variety are present. What your gut-brain axis is missing is direct microbial input from live and fermented foods. These are the fastest way to increase the microbial diversity that produces serotonin, dopamine precursors, and short-chain fatty acids that reduce neuroinflammation.",
        color: "var(--icon-yellow)",
      }
    }
    return {
      type: "Foggy System",
      tagline: "Progress is underway — targeted effort will sharpen the picture.",
      description:
        "You have some good habits in place, but there are clear gaps in what your gut is receiving. Your microbiome's ability to support your brain depends on diversity, live foods, and consistent feeding. Focusing on your weakest pillars first will create the fastest momentum.",
      color: "var(--icon-yellow)",
    }
  }

  if (overall >= 15) {
    return {
      type: "Reactive Mind",
      tagline: "Your gut is waiting for a more stable foundation.",
      description:
        "Across most pillars, your current eating patterns aren't yet giving your microbiome what it needs to consistently support your brain. This isn't a judgment — it's a starting point. Your gut produces the vast majority of your body's serotonin. Giving it the right inputs — fibre, fermented foods, variety, rhythm — creates changes you'll feel mentally within weeks.",
      color: "var(--icon-orange)",
    }
  }

  return {
    type: "Early Mind Builder",
    tagline: "You're at the beginning of something important.",
    description:
      "Your gut-brain journey is just beginning, and that means every improvement from here creates real mental impact. The most effective place to start is building a simple, repeatable daily base — a handful of whole foods, eaten consistently, with one fermented food added daily. The gut-brain connection responds quickly to even modest changes.",
    color: "var(--icon-orange)",
  }
}

/* ── Per-pillar insight copy (mind-framed) ──────────────────────────── */

const MIND_PILLAR_META: Record<
  MindPillarKey,
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
    label: "Brain Nutrition",
    icon: "Leaf",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    strength:
      "You're exposing your gut microbiome to a wide variety of plant polyphenols — the compounds that directly feed serotonin-producing bacteria and support cognitive resilience.",
    opportunity:
      "Polyphenol-rich plant diversity is the foundation of a gut that talks clearly to your brain. Adding 2–3 new plants each week meaningfully increases the microbial populations responsible for neurotransmitter production.",
    actionLow:
      "This week: introduce one new plant food — a new berry, leafy green, or legume. One new plant per week adds up to 50+ new microbiome inputs per year.",
    actionHigh:
      "Keep your weekly plant count above 20. If it dips, add one new category — seeds, sea vegetables, or a new legume — to maintain the polyphenol diversity your brain depends on.",
  },
  feeding: {
    label: "Brain Fuel",
    icon: "Wheat",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    strength:
      "You're consistently feeding your gut the fibre-rich whole foods that produce short-chain fatty acids — the molecules that reduce neuroinflammation and support the blood-brain barrier.",
    opportunity:
      "Fibre from whole plants is the primary fuel for bacteria that produce butyrate — a short-chain fatty acid that protects the brain from inflammation. One fibre anchor per meal gives your microbiome consistent, predictable fuel.",
    actionLow:
      "This week: anchor every main meal with one fibre source. Oats, lentils, sweet potato, or vegetables all count — even small portions make a meaningful difference.",
    actionHigh:
      "Diversify your fibre sources to hit different microbial populations. Add resistant starch (cooled rice, green banana) or new legumes alongside your usual whole foods.",
  },
  adding: {
    label: "Live Mind Foods",
    icon: "FlaskConical",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    strength:
      "You're regularly introducing live, fermented foods that directly seed your gut with the bacteria most linked to serotonin production, mood regulation, and cognitive clarity.",
    opportunity:
      "Fermented foods are the most direct way to increase the gut-brain active microbial populations. Even one serving a day — kefir, miso, kimchi, or natural yoghurt — makes a measurable difference to mood and focus within 2–3 weeks.",
    actionLow:
      "This week: add one fermented food to at least one meal each day — kefir with breakfast, miso broth with lunch, or kimchi with dinner. The brain impact is faster than most people expect.",
    actionHigh:
      "Rotate your fermented food sources. Each carries a different bacterial profile — alternate between at least three types across the week for broader gut-brain axis coverage.",
  },
  consistency: {
    label: "Mind Rhythm",
    icon: "Clock",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    strength:
      "Your eating rhythm is one of your biggest mental health assets. Consistent meal timing supports your circadian clock, regulates cortisol, and gives your gut the predictability it needs to produce mood-stabilising neurotransmitters on schedule.",
    opportunity:
      "Your gut-brain axis runs on circadian rhythm. Consistent meal timing — even rough consistency within a 30-minute window — synchronises cortisol patterns, improves serotonin production timing, and reduces the mid-afternoon mental crashes that often signal rhythm disruption.",
    actionLow:
      "This week: set three anchor meal times and protect them. The gut-brain axis responds to predictability — even rough consistency sends a powerful stabilising signal.",
    actionHigh:
      "Identify what disrupts your rhythm (late nights, travel, skipped meals) and pre-plan one simple solution for each. Protecting the rhythm protects the mental output.",
  },
  feeling: {
    label: "Mind Response",
    icon: "Heart",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    strength:
      "Your mind is responding well to how you're eating — with stable mood, clear thinking, and consistent focus. This is a direct signal that your gut-brain axis is functioning as it should.",
    opportunity:
      "Mental fog, mood dips, and afternoon crashes are often gut signals, not brain signals. Tracking one word per meal for three days frequently reveals which foods or patterns are disrupting your gut-brain communication — and the fix is usually simpler than expected.",
    actionLow:
      "This week: note your mental clarity one hour after each meal for three days — just one word. This builds the pattern awareness you need to identify what's helping and what's holding you back.",
    actionHigh:
      "Pay attention to what disrupts your focus or mood scores. Identify 2–3 foods or habits that reliably diminish your clarity, and experiment with reducing them one at a time.",
  },
}

/* ── Insights generation ────────────────────────────────────────────── */

export function getMindInsights(sub: SubScores): PillarInsight[] {
  const keys: MindPillarKey[] = ["diversity", "feeding", "adding", "consistency", "feeling"]
  return keys
    .map((k): PillarInsight => {
      const score = (sub as unknown as Record<string, number>)[k] ?? 0
      const meta = MIND_PILLAR_META[k]
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

export function computeMindResult(
  answers: Record<string, number | string[]>
): AssessmentResult {
  const subScores = computeSubScores(answers)
  const overall = computeOverall(subScores)
  const profile = getMindProfile(overall, subScores)
  const insights = getMindInsights(subScores)
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
