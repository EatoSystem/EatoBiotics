/* ── Family Assessment Scoring — native 5-pillar Food Culture model ─────────
 * The Family assessment is its OWN model: five household-specific sub-scores
 * (Exposure, Foundation, Live Foods, Rhythm, Food Culture), each 0–100, scored
 * directly from the 15 questions. It no longer borrows the You 3-Biotics insight
 * layer.
 *
 * A secondary 3-Biotics summary is derived for continuity with the rest of
 * EatoBiotics (and stored as the canonical `subScores` so the dashboard / consult
 * / nudge consumers keep working):
 *   Exposure + Foundation → Prebiotics · Live Foods → Probiotics ·
 *   Rhythm + Food Culture → Postbiotics.
 * Because Exposure+Foundation span q1–q6, Live Foods q7–q9, and Rhythm+Food
 * Culture q10–q15, that derivation is identical to computeSubScores(answers) —
 * so stored scores stay byte-compatible with the previous model.
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

export type FamilyPillarKey = "exposure" | "foundation" | "liveFoods" | "rhythm" | "foodCulture"

export interface FamilyPillarScores {
  exposure: number
  foundation: number
  liveFoods: number
  rhythm: number
  foodCulture: number
}

/** Non-scored context that shapes recommendations only. */
export interface FamilyContext {
  householdSize?: number
  ages?: number
  pickyEating?: number
  budget?: number
  cookingTime?: number
  schoolMeals?: number
  mainGoal?: number
}

/**
 * Maps the `ctx_*` answers from FAMILY_CONTEXT_QUESTIONS onto FamilyContext.
 *
 * These questions existed but were never asked — the client only ever rendered
 * FAMILY_QUESTIONS, so `computeResult` was always called without context and
 * `getContextTips` below could never fire. That is why family reports read as
 * generic: nothing knew the household's ages, budget, time or picky eaters.
 *
 * Context shapes advice only. It never touches the pillar scores — a tight
 * budget changes what we suggest, not how the family is doing.
 */
export function contextFromAnswers(
  answers: Record<string, number | string[]>,
): FamilyContext {
  const num = (id: string): number | undefined => {
    const v = answers[id]
    return typeof v === "number" ? v : undefined
  }
  return {
    householdSize: num("ctx_household"),
    ages: num("ctx_ages"),
    pickyEating: num("ctx_picky"),
    budget: num("ctx_budget"),
    cookingTime: num("ctx_time"),
    schoolMeals: num("ctx_schoolmeals"),
    mainGoal: num("ctx_goal"),
  }
}

export interface FamilyResult extends AssessmentResult {
  /** The primary, family-native pillar scores (0–100 each). */
  pillarScores: FamilyPillarScores
  /** Secondary 3-Biotics view of the same answers. */
  biotics: { prebiotics: number; probiotics: number; postbiotics: number }
  /** Context-aware tips (never affect the score). */
  contextTips: string[]
  context?: FamilyContext
}

/* ── Pillar question groups ─────────────────────────────────────────── */

export const FAMILY_PILLAR_IDS: Record<FamilyPillarKey, string[]> = {
  exposure: ["q1", "q2", "q3"],
  foundation: ["q4", "q5", "q6"],
  liveFoods: ["q7", "q8", "q9"],
  rhythm: ["q10", "q11", "q12"],
  foodCulture: ["q13", "q14", "q15"],
}

export const FAMILY_PILLAR_ORDER: FamilyPillarKey[] = [
  "exposure",
  "foundation",
  "liveFoods",
  "rhythm",
  "foodCulture",
]

function num(answers: Record<string, number | string[]>, id: string): number {
  const v = answers[id]
  return typeof v === "number" ? v : 0
}

/** Each pillar = its three 0–3 answers scaled to 0–100. */
export function computeFamilyPillarScores(
  answers: Record<string, number | string[]>,
): FamilyPillarScores {
  const out = {} as FamilyPillarScores
  for (const key of FAMILY_PILLAR_ORDER) {
    const ids = FAMILY_PILLAR_IDS[key]
    const raw = ids.reduce((sum, id) => sum + num(answers, id), 0)
    out[key] = Math.round((raw / (ids.length * 3)) * 100)
  }
  return out
}

/* ── Per-pillar insight copy (family Food Culture pillars) ───────────── */

interface FamilyPillarMeta {
  label: string
  icon: string
  color: string
  gradient: string
  strength: string
  opportunity: string
  actionLow: string
  actionHigh: string
}

const FAMILY_PILLAR_META: Record<FamilyPillarKey, FamilyPillarMeta> = {
  exposure: {
    label: "Exposure",
    icon: "Leaf",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    strength:
      "Your family meets a good range of foods, and new tastes are offered in a relaxed, low-pressure way — exactly how willingness to try grows over time.",
    opportunity:
      "Tastes change with gentle, repeated exposure. Offering one new food to look at, smell, or taste — with zero pressure to finish — can slowly widen what the whole family enjoys.",
    actionLow:
      "This week: put one new plant food on the table to try, no pressure to eat it. Re-offer foods calmly over time — it can take many low-key tries.",
    actionHigh:
      "Keep variety growing: rotate in an unfamiliar vegetable, bean, or grain each week and let everyone explore it at their own pace.",
  },
  foundation: {
    label: "Foundation",
    icon: "Wheat",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    strength:
      "Your family's everyday defaults — meals and snacks built on fibre-rich whole foods — give every gut in the house a steady, supportive base.",
    opportunity:
      "Reliable defaults do the heavy lifting. Anchoring everyday breakfasts, lunches, and snacks with some protein and fibre may support steadier energy across the household.",
    actionLow:
      "This week: upgrade one repeated default — add a fibre source (oats, beans, wholegrain, or veg) to a breakfast, lunch, or snack the family already eats.",
    actionHigh:
      "Broaden the base: rotate in different legumes, wholegrains, and prebiotic foods so the family's staples cover more ground.",
  },
  liveFoods: {
    label: "Live Foods",
    icon: "FlaskConical",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    strength:
      "Your family regularly includes live and fermented foods where they suit each person — an easy, age-appropriate way to support a varied microbiome.",
    opportunity:
      "Live and fermented foods can be a simple, family-friendly addition. Even one suitable option a few days a week — natural yoghurt or kefir for younger ones — is a gentle place to start.",
    actionLow:
      "This week: add one age-appropriate live food the family already likes — natural yoghurt or kefir works well for most ages.",
    actionHigh:
      "Rotate the family's live foods across the week so everyone meets a wider range of cultures.",
  },
  rhythm: {
    label: "Rhythm",
    icon: "Clock",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    strength:
      "Your family's mealtimes are predictable, shared, and easy to repeat — a rhythm like this takes pressure off the day and helps everyone eat well without thinking about it.",
    opportunity:
      "A repeatable rhythm makes healthy eating easier for everyone. A few reliable meals, roughly consistent times, and one shared meal can do more than any single 'perfect' dinner.",
    actionLow:
      "This week: lock in a couple of reliable go-to meals and one shared family meal you can repeat — predictability beats perfection.",
    actionHigh:
      "Smooth the routine: a loose weekly plan and a short shopping list for your go-to meals keeps the rhythm easy to protect.",
  },
  foodCulture: {
    label: "Food Culture",
    icon: "Heart",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    strength:
      "Mealtimes in your home are calm and shared, with food handled without pressure — a positive food culture like this is one of the strongest things a family can build.",
    opportunity:
      "How food feels matters as much as what's on the plate. Keeping mealtimes low-pressure, involving children in choosing and cooking, and sharing the load can make eating well feel lighter for everyone.",
    actionLow:
      "This week: pick one mealtime to keep completely pressure-free, and invite a child to help choose or prepare part of it.",
    actionHigh:
      "Keep protecting the calm: share the cooking load and let everyone have a say — a relaxed table is what makes the rest stick.",
  },
}

const STRENGTH_THRESHOLD = 58

export function getFamilyInsights(pillarScores: FamilyPillarScores): PillarInsight[] {
  return FAMILY_PILLAR_ORDER.map((key): PillarInsight => {
    const score = pillarScores[key]
    const meta = FAMILY_PILLAR_META[key]
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

/* ── Profile (band) — reuses the family 3-Biotics overall for continuity ── */

export function getFamilyProfile(overall: number, _biotics?: SubScores): AssessmentProfile {
  // The band copy is the family-framed wrapper around the shared overall bands.
  if (overall >= 75) {
    return {
      type: "Thriving Food Culture",
      tagline: "Your answers point to a food culture that is working well.",
      description:
        "Your answers describe variety, rhythm and a calm shared table. That combination — what is eaten and how it feels — is associated with a household that supports everyone eating well. From here the useful work is protecting what already holds, and exploring new foods together.",
      color: "var(--icon-green)",
    }
  }
  if (overall >= 58) {
    return {
      type: "Strong Foundation",
      tagline: "Your answers point to a solid base, with one or two thinner areas.",
      description:
        "Your answers suggest solid habits across the table, with one or two pillars thinner than the rest. A small, kind change in those is a useful place to start — a refinement rather than a rebuild.",
      color: "var(--icon-teal)",
    }
  }
  if (overall >= 42) {
    return {
      type: "Emerging Balance",
      tagline: "Your answers show the building blocks; consistency is the next step.",
      description:
        "Your answers suggest real strengths alongside areas still finding their rhythm. Small, repeatable changes — protected mealtimes, reliable defaults, a calmer table — tend to add up, and this pattern is a useful place to start.",
      color: "var(--icon-lime)",
    }
  }
  if (overall >= 28) {
    return {
      type: "Finding Your Rhythm",
      tagline: "Your answers suggest a few steady anchors would help most.",
      description:
        "Feeding a family is genuinely hard, and your answers are a starting point rather than a verdict. Choosing one or two anchors — a reliable meal, a calmer mealtime — is a useful place to begin and tends to lift several areas at once.",
      color: "var(--icon-yellow)",
    }
  }
  return {
    type: "Early Builder",
    tagline: "Your answers suggest an early starting point for the household.",
    description:
      "Your answers suggest an early starting point, which is a useful position rather than a problem. A simple, repeatable base is a good place to begin — a couple of reliable meals, eaten together when you can, with the pressure turned down. Complexity can come later.",
    color: "var(--icon-orange)",
  }
}

/* ── Context-aware tips (never change the score) ─────────────────────── */

function buildContextTips(ctx: FamilyContext): string[] {
  const tips: string[] = []
  if (ctx.pickyEating != null && ctx.pickyEating <= 1) {
    tips.push("With selective eaters, lean on calm repeated exposure — keep offering small tastes without pressure, and pair new foods with familiar favourites.")
  }
  if (ctx.budget != null && ctx.budget <= 0) {
    tips.push("On a tight budget, frozen and tinned vegetables, beans, lentils, and own-brand oats are cheap, reliable ways to lift the Foundation pillar.")
  }
  if (ctx.cookingTime != null && ctx.cookingTime <= 1) {
    tips.push("With little cooking time, batch a couple of go-to meals and lean on quick assembly (wholegrain wrap, beans, yoghurt) to protect Rhythm.")
  }
  if (ctx.schoolMeals != null && ctx.schoolMeals <= 1) {
    tips.push("If lunchboxes do a lot of the work, a simple repeatable formula — wholegrain base, protein, fruit or veg, a live food — keeps weekday lunches solid.")
  }
  return tips
}

/* ── Main compute ───────────────────────────────────────────────────── */

export function computeResult(
  answers: Record<string, number | string[]>,
  context?: FamilyContext,
): FamilyResult {
  const pillarScores = computeFamilyPillarScores(answers)
  const biotics = computeSubScores(answers)
  const overall = computeOverall(biotics)
  const profile = getFamilyProfile(overall, biotics)
  const insights = getFamilyInsights(pillarScores)
  const nextActions = insights.slice(0, 3).map((i) => i.action)

  // Canonical sub_scores: 3-Biotics (back-compat) + the 5 native pillars under
  // the legacy 5-key names so the dashboard's sub-score extractor keeps working.
  const subScores: SubScores = {
    prebiotics: biotics.prebiotics,
    probiotics: biotics.probiotics,
    postbiotics: biotics.postbiotics,
    feed: biotics.prebiotics,
    seed: biotics.probiotics,
    heal: biotics.postbiotics,
    diversity: pillarScores.exposure,
    feeding: pillarScores.foundation,
    adding: pillarScores.liveFoods,
    consistency: pillarScores.rhythm,
    feeling: pillarScores.foodCulture,
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
    contextTips: context ? buildContextTips(context) : [],
    context,
    completedAt: Date.now(),
  }
}
