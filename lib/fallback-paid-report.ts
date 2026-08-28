import type { DeepQuestion } from "@/lib/deep-assessment"
import type {
  DeepFullReport,
  DeepPremiumReport,
  DeepReport,
  DeepStarterReport,
} from "@/lib/claude-report"
import type { PaidReportTier } from "@/lib/paid-report-session"
import { band, buildFoodSystemReport, type Band } from "@/lib/report/build-food-system-report"
import { normalizeToBiotics, orderedByNeed, PATHWAY_LABEL, type BioticScoreKey } from "@/lib/report/subscores"
// The framing rule is shared with the paid report's hero headline so the two
// cannot drift — see lib/report/framing.ts for why it is not `getProfile`.
import { framingFor, type Framing } from "@/lib/report/framing"
import type { FoodSystemReport, ReportMode } from "@/lib/report/food-system-report-types"

/* ── Why this file exists ──────────────────────────────────────────────────
 * When Claude generation fails or is skipped, this is what a paying customer
 * actually receives — a real production recovery path, not a placeholder.
 * The €49 acceptance audit found it was deterministic but score-blind: every
 * customer got the same opening shape ("some useful foundations and a few
 * clear pressure points"), the exact same five foods regardless of their
 * answers, and 30/90-day plans that never referenced their weakest pathway.
 * A 98/100 customer and a 20/100 customer received functionally the same
 * report with different numbers substituted in.
 *
 * This rewrite makes every derived field read from the SAME pathway ranking
 * and band classification `buildFoodSystemReport` already uses for the
 * educational Food System chapters (band() and TOOLS from
 * lib/report/build-food-system-report.ts, normalizeToBiotics/orderedByNeed
 * from lib/report/subscores.ts) — there is deliberately no second scoring or
 * food-selection system here. The `foodSystem` block is built FIRST and every
 * legacy field below reads its priority pathway, strongest pathway, and food
 * tools from it. */

type SubScores = {
  prebiotics?: number
  probiotics?: number
  postbiotics?: number
  feed?: number
  seed?: number
  heal?: number
  diversity?: number
  feeding?: number
  adding?: number
  consistency?: number
  feeling?: number
}

type FallbackInput = {
  tier: PaidReportTier
  overall: number
  subScores: SubScores
  profile: { type: string; tagline: string; description: string }
  questions: DeepQuestion[]
  answers: Record<string, unknown>
  /** Which assessment produced this. Defaults to "you". */
  mode?: ReportMode
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function formatAnswer(question: DeepQuestion, raw: unknown): string | null {
  if (raw === undefined || raw === null || raw === "") return null
  if (Array.isArray(raw)) {
    if (raw.length === 0) return null
    return raw.join(", ")
  }
  if (question.type === "slider") return `${raw}/10`
  return String(raw)
}

function findAnswerText(questions: DeepQuestion[], answers: Record<string, unknown>, matcher: RegExp): string | null {
  const question = questions.find((q) => matcher.test(q.text))
  return question ? formatAnswer(question, answers[question.id]) : null
}

/**
 * The shared context every section below reads from — computed once so the
 * opening, the food list, the plans and the priority map cannot disagree
 * about which pathway is the priority or how "good" the overall score is.
 */
interface FallbackContext {
  input: FallbackInput
  foodSystem: FoodSystemReport
  overallBand: Band
  /** Band of the weakest pathway — the guard against `protect` copy on a gap. */
  priorityBand: Band
  framing: Framing
  priority: BioticScoreKey
  strongest: BioticScoreKey
  priorityLabel: string
  strongestLabel: string
  priorityScore: number
  strongestScore: number
  isFamily: boolean
  goal: string | null
  symptoms: string | null
  stress: string | null
  sleep: string | null
  energy: string | null
}

function buildContext(input: FallbackInput): FallbackContext {
  const foodSystem = buildFoodSystemReport({
    mode: input.mode ?? "you",
    subScores: input.subScores,
    overall: input.overall,
    profile: input.profile,
  })

  const biotics = normalizeToBiotics(input.subScores) ?? { prebiotics: 0, probiotics: 0, postbiotics: 0 }
  const ranked = orderedByNeed(biotics)
  const priority = ranked[0][0]
  const strongest = ranked[ranked.length - 1][0]
  const overallBand = band(input.overall)
  const priorityBand = band(ranked[0][1])

  return {
    input,
    foodSystem,
    overallBand,
    priorityBand,
    framing: framingFor(overallBand, priorityBand),
    priority,
    strongest,
    priorityLabel: PATHWAY_LABEL[priority],
    strongestLabel: PATHWAY_LABEL[strongest],
    priorityScore: ranked[0][1],
    strongestScore: ranked[ranked.length - 1][1],
    isFamily: input.mode === "family",
    goal: findAnswerText(input.questions, input.answers, /success|goal|important goal/i),
    symptoms: findAnswerText(input.questions, input.answers, /experience regularly|symptoms/i),
    stress: findAnswerText(input.questions, input.answers, /stress/i),
    sleep: findAnswerText(input.questions, input.answers, /sleep/i),
    energy: findAnswerText(input.questions, input.answers, /energy/i),
  }
}

/* ── Opening ──────────────────────────────────────────────────────────────
 * Framing-aware by construction (see Framing above): the lead sentence reads
 * the OVERALL band and the PRIORITY pathway's band together, so a strong
 * profile can never be told it has "clear pressure points", a strained one is
 * never praised as "a strong foundation", and a strong-overall profile with one
 * strained pathway is told about BOTH rather than being told everything is fine.
 *
 * The hero does not render any part of this. paid-report-client.tsx's <h1> uses
 * freeScores.profile.tagline (a different string from a different source), and
 * this opening appears once, in full, in the "Your Pattern" card. */
function openingFor(ctx: FallbackContext): string {
  const who = ctx.isFamily ? "your household's" : "your"
  const scoreLead = `Your ${ctx.input.profile.type} score of ${ctx.input.overall}/100 suggests ${who} food system`

  switch (ctx.framing) {
    case "protect":
      return (
        `${scoreLead} is well supported across the board. ` +
        `${ctx.strongestLabel} and ${ctx.priorityLabel} both look well supported in your answers — ` +
        `the useful work now is protecting what already holds rather than rebuilding it.`
      )
    case "mixed":
      // Strong overall, one strained pathway. Both facts, in that order, with
      // the weak pathway named and its score stated so the sentence cannot be
      // read as "everything is fine".
      return (
        `${scoreLead} has a strong overall foundation, with one pathway clearly under-supported. ` +
        `${ctx.strongestLabel} is well supported in your answers at ${ctx.strongestScore}/100, ` +
        `while ${ctx.priorityLabel} sits well below the rest at ${ctx.priorityScore}/100 — ` +
        `that gap is worth prioritising before anything else.`
      )
    case "building":
      return (
        `${scoreLead} has real strengths and one area still settling. ` +
        (ctx.priority === ctx.strongest
          ? `Your answers suggest ${ctx.priorityLabel} is the pathway with the most room to grow.`
          : `The strongest signal is that ${ctx.strongestLabel} is already working for you, while ${ctx.priorityLabel} is where your answers point to the clearest first step.`)
      )
    case "early":
      return (
        `${scoreLead} is early in its development. ` +
        (ctx.priority === ctx.strongest
          ? `Your answers suggest ${ctx.priorityLabel} is the pathway with the most room to grow.`
          : `The strongest signal is that ${ctx.strongestLabel} is already working for you, while ${ctx.priorityLabel} is where your answers point to the clearest first step.`)
      )
  }
}

function scoreInterpretationFor(ctx: FallbackContext): string {
  const who = ctx.isFamily ? "your household's" : "your"
  return `This score is not a diagnosis. It is an educational snapshot of how ${who} daily meals, gut-supporting habits, and lived symptoms appear to be lining up right now. ${ctx.foodSystem.systemSnapshot.mainLever}`
}

function strengthsFor(ctx: FallbackContext): { strengths: string[]; strengthExplanations: string[] } {
  return {
    strengths: [
      `${ctx.strongestLabel} foundation`,
      "Useful self-awareness",
      ctx.framing === "protect"
        ? "A pattern worth protecting"
        : ctx.framing === "mixed"
        ? "A strong base to build from"
        : "Clear improvement target",
    ],
    strengthExplanations: [
      `Your ${ctx.strongestLabel} score of ${ctx.strongestScore}/100 suggests there is already something in your food system worth protecting and repeating.`,
      ctx.goal
        ? `Your answer about success gives the plan a practical direction: ${ctx.goal}.`
        : "Completing the deeper questions gives the plan more context than a simple score alone.",
      ctx.framing === "protect"
        ? "With all three pathways well supported, the priority is consistency — keeping what already works rather than searching for something to fix."
        : ctx.framing === "mixed"
        ? `Two pathways are already carrying real weight, so the work on ${ctx.priorityLabel} starts from a strong base rather than from nothing.`
        : `Because ${ctx.priorityLabel} is the lowest signal, your first changes can be focused instead of scattered.`,
    ],
  }
}

/**
 * High-scoring profiles do not get invented weaknesses (audit requirement #5):
 * the "opportunities" reframe as maintenance watch-points rather than gaps.
 * Everyone else keeps the priority-pathway-led framing.
 */
function opportunitiesFor(ctx: FallbackContext): { opportunities: string[]; opportunityExplanations: string[] } {
  if (ctx.framing === "mixed") {
    // Strong overall, one strained pathway: this is a real gap, so it is named
    // as one. None of the "watch-point rather than a weakness" copy below is
    // reachable from here.
    return {
      opportunities: [`${ctx.priorityLabel} support`, "Keeping the rest steady", "Symptom feedback"],
      opportunityExplanations: [
        `${ctx.priorityLabel} at ${ctx.priorityScore}/100 is the clear gap in an otherwise well-supported system, and closing it is the highest-value change available to you.`,
        `Your other two pathways are already doing real work — the aim is to add ${ctx.priorityLabel.toLowerCase()} support without disturbing what is working.`,
        ctx.symptoms
          ? `You flagged ${ctx.symptoms}, so build the new pathway in gradually and watch how your body responds.`
          : "Add the new pathway gradually and let your own comfort set the pace.",
      ],
    }
  }

  if (ctx.framing === "protect") {
    return {
      opportunities: ["Protecting variety", "Steady rhythm", "Noticing early"],
      opportunityExplanations: [
        `${ctx.priorityLabel} has the most room of the three in your answers, so keeping its variety going is the main watch-point rather than a weakness to fix.`,
        "A system that is already working well can still drift on busy weeks — the aim here is to keep the pattern, not intensify it.",
        "Because everything is already working, small early signals — energy, comfort, regularity — are more useful to notice than a dramatic change would be.",
      ],
    }
  }

  return {
    opportunities: [`${ctx.priorityLabel} support`, "Meal rhythm", "Symptom feedback"],
    opportunityExplanations: [
      `A lower ${ctx.priorityLabel} score usually points to a need for steadier food inputs and more consistency over time.`,
      ctx.stress || ctx.sleep
        ? `Your lifestyle answers, including ${ctx.stress ? `stress at ${ctx.stress}` : `sleep at ${ctx.sleep}`}, suggest rhythm may matter as much as food choice.`
        : "Your weekly pattern matters as much as any single ingredient.",
      ctx.symptoms
        ? `You flagged ${ctx.symptoms}, so the plan should watch how your body responds rather than chasing generic advice.`
        : "Your body feedback should guide the pace of change.",
    ],
  }
}

/**
 * The single most impactful lever — the field early-stage profiles lean on
 * most, since audit requirement #5 asks for ONE manageable action, explained,
 * rather than a list. Strong profiles get the same field reframed as
 * maintenance rather than a "fix this" pitch.
 */
function topTriggerFor(ctx: FallbackContext): { topTrigger: string; topTriggerExplanation: string } {
  if (ctx.framing === "protect") {
    return {
      topTrigger: `Keep ${ctx.priorityLabel.toLowerCase()} steady — the pattern is working, so protect it.`,
      topTriggerExplanation: `Your score pattern suggests every pathway is already working. The highest-value move from here is consistency, not correction: repeat what is already working rather than adding intensity it does not need.`,
    }
  }
  if (ctx.framing === "mixed") {
    return {
      topTrigger: `${ctx.priorityLabel} is the one pathway holding the rest back.`,
      topTriggerExplanation: `Your overall score is strong, but ${ctx.priorityLabel.toLowerCase()} at ${ctx.priorityScore}/100 sits well below your other two pathways. That single gap is the clearest place to start, and it is worth prioritising ahead of anything else in this report.`,
    }
  }
  return {
    topTrigger: `${ctx.priorityLabel} looks like the highest-impact place to begin.`,
    topTriggerExplanation:
      ctx.framing === "early"
        ? `Your answers point clearly to ${ctx.priorityLabel.toLowerCase()} as the one place to focus for now. One small, repeatable change here is worth more than several partial changes elsewhere — start with this and let the rest wait.`
        : `Your score pattern suggests that improving ${ctx.priorityLabel.toLowerCase()} should create the clearest early progress. Start with consistency before intensity: small daily inputs are more valuable than an ambitious reset that only lasts a few days.`,
  }
}

/** Seven days, hierarchy: what to start THIS week. At least four of the seven
 *  days reference the priority pathway's actual top food tool, so the plan
 *  visibly differs between a prebiotics-priority and a postbiotics-priority
 *  profile rather than reciting the same generic week for everyone. */
function sevenDayPlanFor(ctx: FallbackContext): DeepStarterReport["sevenDayPlan"] {
  const tool = ctx.foodSystem.foodTools[0]
  const tool2 = ctx.foodSystem.foodTools[1] ?? tool
  const label = ctx.priorityLabel.toLowerCase()
  const isEarly = ctx.framing === "early"

  return [
    { day: "Monday", action: `Add ${tool.food.toLowerCase()} to a meal you already eat. ${tool.howToUse}` },
    {
      day: "Tuesday",
      action: isEarly
        ? "Repeat Monday's change again today — one habit repeated beats several new ones started at once."
        : `Include ${tool2.food.toLowerCase()} once today the same way: ${tool2.howToUse}`,
    },
    { day: "Wednesday", action: "Build a simple plate with protein, colourful plants, slow carbohydrates, and healthy fats." },
    { day: "Thursday", action: `Keep your ${label} change steady and notice energy, digestion, and focus for the next four hours.` },
    { day: "Friday", action: "Repeat the meal that felt best this week instead of adding a new rule." },
    { day: "Saturday", action: `Prepare enough ${tool.food.toLowerCase()} for the next two days, so ${label} support does not depend on decision-making.` },
    { day: "Sunday", action: "Review what changed in energy, bloating, mood, and regularity, then choose one habit to repeat next week." },
  ]
}

function buildStarterReport(ctx: FallbackContext): DeepStarterReport {
  const { strengths, strengthExplanations } = strengthsFor(ctx)
  const { opportunities, opportunityExplanations } = opportunitiesFor(ctx)
  const { topTrigger, topTriggerExplanation } = topTriggerFor(ctx)

  // ScoreProjection is unrendered since the paid-report access/trust batch,
  // but it is still parsed from stored reports — so it stays honest rather
  // than degenerate. A high score must never produce a 100-100 range, and the
  // timeline is phrased as a cycle rather than a "weeks" deadline so it
  // cannot resurface the exact wording that batch removed if this field is
  // ever read again.
  const low = clampScore(Math.min(ctx.input.overall + 8, 92))
  const high = clampScore(Math.min(ctx.input.overall + 15, 97))

  return {
    opening: openingFor(ctx),
    scoreInterpretation: scoreInterpretationFor(ctx),
    strengths,
    strengthExplanations,
    opportunities,
    opportunityExplanations,
    sevenDayPlan: sevenDayPlanFor(ctx),
    closing: "The aim is not a perfect food system. It is a food system you can understand, repeat, and improve without losing the pleasure and practicality of eating.",
    deepInsight: `Your deeper answers show that the most useful plan is a practical one: work with the meals and rhythms you already have, then improve the parts that create the most friction.\n\nThe biggest opportunity is to connect your symptoms, energy, and daily routine to a few repeatable food actions${ctx.framing === "protect" ? ", and protect the ones that already work" : ""}. That creates a stronger internal food system without turning every meal into a project.`,
    topTrigger,
    topTriggerExplanation,
    scoreProjection: {
      low: Math.min(low, high - 1),
      high,
      timeline: "your next 30-day cycle",
      keyDrivers: [
        `Steady support for ${ctx.priorityLabel.toLowerCase()}`,
        "A steadier meal rhythm across the week",
        "Tracking symptoms and energy after key meals",
      ],
    },
    membershipBridge: "A simple 30-day account can help turn these first changes into visible patterns you can keep improving.",
  }
}

/** Foods drawn directly from the same TOOLS dataset the Food System chapter
 *  uses — foodTools is already [priority pathway, strongest pathway] sliced
 *  to 5, so two contrasting profiles with different priority pathways
 *  genuinely receive different foods, not the same five with new numbers. */
function specificFoodListFor(ctx: FallbackContext): DeepFullReport["specificFoodList"] {
  return ctx.foodSystem.foodTools.map((tool, i) => ({
    food: tool.food,
    biotic: tool.biotic,
    mechanism: tool.mechanism,
    // Body-signal context, where the deep-assessment answers actually offer
    // it: the first card names the reported symptom rather than staying
    // generic. No dietary-exclusion question exists in the deep assessment
    // today, so there is nothing to filter foods against yet — TOOLS' own
    // swap text already offers a dairy-free alternative by default on the
    // one food that needs it, which is the honest limit of what can be
    // personalised without that answer existing.
    whyForThem:
      i === 0 && ctx.symptoms
        ? `${tool.whyForThisCustomer} Given what you shared about ${ctx.symptoms}, start with a smaller amount and build up.`
        : tool.whyForThisCustomer,
    howToUse: tool.howToUse,
    swap: tool.swap,
  }))
}

function buildFullReport(ctx: FallbackContext): DeepFullReport {
  const starter = buildStarterReport(ctx)
  const label = ctx.priorityLabel.toLowerCase()

  return {
    ...starter,
    habitAnalysis:
      ctx.framing === "protect"
        ? `Your current pattern looks well established across all three pathways. ${ctx.priorityLabel} has the most room of the three, but "most room" here means fine-tuning, not rebuilding.\n\nThe strongest practical move is to keep your best meals as easy to repeat as they are now — a reliable breakfast, a plant-rich base, and a live-food habit are worth protecting exactly as they are.`
        : ctx.framing === "mixed"
        ? `Your current pattern is two-thirds established: ${ctx.strongestLabel} is carrying real weight, while ${ctx.priorityLabel} at ${ctx.priorityScore}/100 is thin enough to be the limiting factor.\n\nThe strongest practical move is to add one repeatable ${label} habit and leave everything else alone. The pathways that already work do not need changing, and changing them would only make the new habit harder to keep.`
        : `Your current pattern looks less like a need for a dramatic reset and more like a need for better weekly structure. The lowest signal is ${ctx.priorityLabel}, so your plan should prioritise foods and habits that feed and stabilise the gut environment over time.\n\nThe strongest practical move is to make your best meals easier to repeat. A reliable breakfast, one prepared plant-rich base, and one fermented or live food option can do more than a complicated list of rules.`,
    // "responds", not "will respond": the fallback claims guard runs the real
    // CLAIMS rules over this copy, and `\bwill \w+` is the promise rule.
    rhythmInsight: "Your food system responds best to rhythm. Aim for regular meals, enough protein, and repeated plant variety before chasing novelty.",
    energyBreakdown: ctx.energy
      ? `You rated or described your energy as ${ctx.energy}. That makes steady blood sugar, fibre, hydration, and meal timing especially important, because gut comfort and energy often move together across the day.`
      : "Energy is one of the clearest feedback signals for this plan. Notice whether meals leave you steady, heavy, bloated, hungry, or clear-headed.",
    thirtyDayRoadmap: [
      {
        week: 1,
        focus: "Install the smallest habit",
        theme: `Start with ${label}`,
        actions: [
          `Add ${ctx.foodSystem.foodTools[0].food.toLowerCase()} to a meal you already eat, most days this week.`,
          "Track energy and digestion after your largest meal.",
          "Keep everything else the same — this week is about repetition, not addition.",
        ],
      },
      {
        week: 2,
        focus: "Widen the range",
        theme: `Rotate more ${label}`,
        actions: [
          `Rotate a second ${label} food in alongside the first.`,
          "Use beans, lentils, oats, berries, greens, seeds, or root vegetables as default builders.",
          "Keep portions gentle if symptoms are active.",
        ],
      },
      {
        week: 3,
        focus: "Combine feeding and seeding",
        theme: "Pair fibre with live foods",
        actions: [
          "Try one small serving of a live or fermented food if tolerated.",
          "Pair fermented foods with fibre-rich meals.",
          "Note any changes in bloating, regularity, or energy.",
        ],
      },
      {
        week: 4,
        focus: "Lock in your pattern",
        theme: "Make it repeatable, then retake",
        actions: [
          "Build a weekly plate template you can reuse.",
          "Keep the habits that gave the clearest benefit.",
          "Retake the assessment at the end of your 30-day cycle to see what moved.",
        ],
      },
    ],
    lifestyleConnection:
      ctx.stress || ctx.sleep
        ? `Your lifestyle answers matter because the gut is not separate from stress, sleep, and recovery. ${ctx.stress ? `A stress answer of ${ctx.stress} suggests your plan should stay simple enough to follow on busy days. ` : ""}${ctx.sleep ? `A sleep answer of ${ctx.sleep} means evening rhythm and caffeine timing may influence digestion as well as food choice.` : ""}`
        : "Sleep, stress, movement, and eating rhythm all affect how well your food system uses the food you give it. Keep the plan simple enough that it survives ordinary weeks.",
    specificFoodList: specificFoodListFor(ctx),
  }
}

function buildPremiumReport(ctx: FallbackContext): DeepPremiumReport {
  const full = buildFullReport(ctx)
  const label = ctx.priorityLabel.toLowerCase()

  return {
    ...full,
    priorityMap: {
      biggestBlocker:
        ctx.framing === "protect"
          ? `Drift on busy weeks, not a missing pathway`
          : `Inconsistent support for ${ctx.priorityLabel}`,
      blockerExplanation:
        ctx.framing === "protect"
          ? "With every pathway already supported, the realistic risk is drift — on a busy week you lose the pattern, rather than being short of any particular food."
          : ctx.framing === "mixed"
          ? `The blocker is specific rather than general: ${ctx.priorityLabel.toLowerCase()} is the one pathway your answers leave thin, and the rest of the system cannot compensate for it indefinitely.`
          : "The main blocker is not a lack of effort. It is that the gut gets mixed signals when supportive meals, rhythm, fibre, and recovery vary too much across the week.",
      biggestBuilder: `Your ${ctx.strongestLabel} habits`,
      builderExplanation: `${ctx.strongestLabel} is already working in your answers. Building the rest of the plan around what is already reliable makes the whole system easier to sustain than starting from nothing.`,
    },
    phasedStrategy: [
      {
        phase: "Stabilise",
        duration: "Weeks 1-2",
        milestone: `Fewer random meals and a steadier ${label} habit`,
        actions: ["Repeat one breakfast", `Add one ${label} food daily`, "Track symptoms after main meals"],
      },
      {
        phase: "Build",
        duration: "Weeks 3-6",
        milestone: "More plant variety and better meal confidence",
        actions: ["Use 20+ plant foods per week", "Test fermented foods slowly", "Prepare one weekly staple"],
      },
      {
        phase: "Sustain",
        duration: "Weeks 7+",
        milestone: "A pattern that survives ordinary weeks without much thought",
        actions: ["Keep the meals that work", "Reduce the triggers that repeat", "Retake the assessment at each 30-day cycle to see what moved"],
      },
    ],
    systemInterpretation:
      "Your food system is best understood as a living pattern, not a fixed score. The assessment points to a system that can improve through regular inputs, gentler experimentation, and better feedback.\n\nThe practical priority is to build meals that are varied enough for the microbiome but familiar enough for real life. When that balance is right, improvement becomes easier to sustain.\n\nThis report should be treated as educational guidance, not medical advice. If symptoms are severe, persistent, unexplained, or worsening, it is important to speak with a qualified health professional.",
    systemStory:
      ctx.framing === "protect"
        ? "You are protecting a food system that is already giving your body clear, consistent signals. The next step is simply to keep it that way through ordinary weeks."
        : ctx.framing === "mixed"
        ? `Most of your food system is already working, with one pathway still to fill in. The next step is to give ${label} the same steady attention the rest already gets.`
        : "You are building a food system that gives your body clearer signals. The next step is to make the helpful choices visible, repeatable, and calm enough to last.",
    gutDiagnosticSummary:
      "Your diagnostic answers add context to the score by showing how symptoms, history, and lifestyle may be interacting. The pattern is most useful when tracked over time rather than judged from one day.",
    symptomPattern: `The symptom pattern should be interpreted alongside the ${ctx.framing === "protect" ? `${ctx.priorityLabel} signal, which has the most room of the three` : `lower ${ctx.priorityLabel} signal`}. Watch for meals that repeatedly create bloating, energy dips, irregularity, or brain fog, then adjust one variable at a time.`,
  }
}

export function buildFallbackPaidReport(input: FallbackInput): DeepReport {
  const effectiveTier = input.tier === "personal" ? "full" : input.tier
  const ctx = buildContext(input)

  const base =
    effectiveTier === "premium"
      ? buildPremiumReport(ctx)
      : effectiveTier === "full"
      ? buildFullReport(ctx)
      : buildStarterReport(ctx)

  // The educational report is derived, so the fallback carries a complete one
  // too — a customer whose generation failed still gets the full structure,
  // just with rule-based copy instead of personalised narrative. Reused from
  // the context rather than rebuilt, so it is guaranteed to agree with every
  // legacy field above about which pathway is the priority.
  return {
    ...base,
    foodSystem: ctx.foodSystem,
  }
}
