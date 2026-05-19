import type { DeepQuestion } from "@/lib/deep-assessment"
import type {
  DeepFullReport,
  DeepPremiumReport,
  DeepReport,
  DeepStarterReport,
} from "@/lib/claude-report"
import type { PaidReportTier } from "@/lib/paid-report-session"

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
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function getBioticScores(sub: SubScores): Record<"prebiotics" | "probiotics" | "postbiotics", number> {
  return {
    prebiotics: clampScore(
      sub.prebiotics ?? sub.feed ?? Math.round(((sub.diversity ?? 0) + (sub.feeding ?? 0)) / 2)
    ),
    probiotics: clampScore(sub.probiotics ?? sub.seed ?? sub.adding ?? 0),
    postbiotics: clampScore(
      sub.postbiotics ?? sub.heal ?? Math.round(((sub.consistency ?? 0) + (sub.feeling ?? 0)) / 2)
    ),
  }
}

function labelForScore(score: number): string {
  if (score >= 70) return "already a useful foundation"
  if (score >= 45) return "ready to improve with a few consistent changes"
  return "the clearest place to start rebuilding gently"
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

function findLowestBiotic(scores: Record<"prebiotics" | "probiotics" | "postbiotics", number>) {
  return (Object.entries(scores) as Array<["prebiotics" | "probiotics" | "postbiotics", number]>).sort(
    (a, b) => a[1] - b[1]
  )[0]
}

function findHighestBiotic(scores: Record<"prebiotics" | "probiotics" | "postbiotics", number>) {
  return (Object.entries(scores) as Array<["prebiotics" | "probiotics" | "postbiotics", number]>).sort(
    (a, b) => b[1] - a[1]
  )[0]
}

function displayBiotic(name: string): string {
  if (name === "prebiotics") return "Prebiotics"
  if (name === "probiotics") return "Probiotics"
  return "Postbiotics"
}

function buildStarterReport(input: FallbackInput): DeepStarterReport {
  const scores = getBioticScores(input.subScores)
  const [lowestName, lowestScore] = findLowestBiotic(scores)
  const [highestName, highestScore] = findHighestBiotic(scores)
  const goal = findAnswerText(input.questions, input.answers, /success|goal|important goal/i)
  const symptoms = findAnswerText(input.questions, input.answers, /experience regularly|symptoms/i)
  const stress = findAnswerText(input.questions, input.answers, /stress/i)
  const sleep = findAnswerText(input.questions, input.answers, /sleep/i)
  const lowest = displayBiotic(lowestName)
  const highest = displayBiotic(highestName)

  return {
    opening: `Your ${input.profile.type} score of ${input.overall}/100 suggests a food system with some useful foundations and a few clear pressure points. The strongest signal is that ${lowest} is ${labelForScore(lowestScore)}, while ${highest} gives you something to build from.`,
    scoreInterpretation: `This score is not a diagnosis. It is an educational snapshot of how your daily meals, gut-supporting habits, and lived symptoms appear to be lining up right now. The most valuable next step is to make small, repeatable changes that support ${lowest.toLowerCase()} without overwhelming the rest of your routine.`,
    strengths: [
      `${highest} foundation`,
      "Useful self-awareness",
      "Clear improvement target",
    ],
    strengthExplanations: [
      `Your ${highest} score of ${highestScore}/100 suggests there is already something in your food system worth protecting and repeating.`,
      goal
        ? `Your answer about success gives the plan a practical direction: ${goal}.`
        : "Completing the deeper questions gives the plan more context than a simple score alone.",
      `Because ${lowest} is the lowest signal, your first changes can be focused instead of scattered.`,
    ],
    opportunities: [
      `${lowest} support`,
      "Meal rhythm",
      "Symptom feedback",
    ],
    opportunityExplanations: [
      `A lower ${lowest} score usually points to a need for steadier food inputs and more consistency over time.`,
      stress || sleep
        ? `Your lifestyle answers, including ${stress ? `stress at ${stress}` : `sleep at ${sleep}`}, suggest rhythm may matter as much as food choice.`
        : "Your weekly pattern matters as much as any single ingredient.",
      symptoms
        ? `You flagged ${symptoms}, so the plan should watch how your body responds rather than chasing generic advice.`
        : "Your body feedback should guide the pace of change.",
    ],
    sevenDayPlan: [
      { day: "Monday", action: "Add one fibre-rich plant food to a meal you already eat, such as oats, beans, lentils, berries, or greens." },
      { day: "Tuesday", action: "Include one fermented food serving if tolerated, such as live yogurt, kefir, sauerkraut, kimchi, or miso." },
      { day: "Wednesday", action: "Build a simple plate with protein, colourful plants, slow carbohydrates, and healthy fats." },
      { day: "Thursday", action: "Keep your first meal steady and notice energy, digestion, and focus for the next four hours." },
      { day: "Friday", action: "Repeat the meal that felt best this week instead of adding a new rule." },
      { day: "Saturday", action: "Prepare one gut-supportive base for the next two days, such as soup, beans, roasted vegetables, or overnight oats." },
      { day: "Sunday", action: "Review what changed in energy, bloating, mood, and regularity, then choose one habit to repeat next week." },
    ],
    closing: "The aim is not a perfect food system. It is a food system you can understand, repeat, and improve without losing the pleasure and practicality of eating.",
    deepInsight: `Your deeper answers show that the most useful plan is a practical one: work with the meals and rhythms you already have, then improve the parts that create the most friction.\n\nThe biggest opportunity is to connect your symptoms, energy, and daily routine to a few repeatable food actions. That creates a stronger internal food system without turning every meal into a project.`,
    topTrigger: `${lowest} looks like the highest-impact place to begin.`,
    topTriggerExplanation: `Your score pattern suggests that improving ${lowest.toLowerCase()} should create the clearest early progress. Start with consistency before intensity: small daily inputs are more valuable than an ambitious reset that only lasts a few days.`,
    scoreProjection: {
      low: clampScore(input.overall + 8),
      high: clampScore(input.overall + 18),
      timeline: "8-10 weeks",
      keyDrivers: [
        `Daily support for ${lowest.toLowerCase()}`,
        "A steadier meal rhythm across the week",
        "Tracking symptoms and energy after key meals",
      ],
    },
    membershipBridge: "A simple 30-day account can help turn these first changes into visible patterns you can keep improving.",
  }
}

function buildFullReport(input: FallbackInput): DeepFullReport {
  const starter = buildStarterReport(input)
  const scores = getBioticScores(input.subScores)
  const [lowestName] = findLowestBiotic(scores)
  const lowest = displayBiotic(lowestName)
  const stress = findAnswerText(input.questions, input.answers, /stress/i)
  const sleep = findAnswerText(input.questions, input.answers, /sleep/i)
  const energy = findAnswerText(input.questions, input.answers, /energy/i)

  return {
    ...starter,
    habitAnalysis: `Your current pattern looks less like a need for a dramatic reset and more like a need for better weekly structure. The lowest signal is ${lowest}, so your plan should prioritise foods and habits that feed and stabilise the gut environment over time.\n\nThe strongest practical move is to make your best meals easier to repeat. A reliable breakfast, one prepared plant-rich base, and one fermented or live food option can do more than a complicated list of rules.`,
    rhythmInsight: `Your food system will respond best to rhythm. Aim for regular meals, enough protein, and repeated plant variety before chasing novelty.`,
    energyBreakdown: energy
      ? `You rated or described your energy as ${energy}. That makes steady blood sugar, fibre, hydration, and meal timing especially important, because gut comfort and energy often move together across the day.`
      : "Energy is one of the clearest feedback signals for this plan. Notice whether meals leave you steady, heavy, bloated, hungry, or clear-headed.",
    thirtyDayRoadmap: [
      {
        week: 1,
        focus: "Stabilise the basics",
        theme: "Repeat what works",
        actions: [
          "Choose one gut-supportive breakfast and repeat it three times.",
          "Add one extra plant food to lunch or dinner each day.",
          "Track energy and digestion after your largest meal.",
        ],
      },
      {
        week: 2,
        focus: "Feed the system",
        theme: "Increase plant variety",
        actions: [
          "Add two new plant foods across the week.",
          "Use beans, lentils, oats, berries, greens, seeds, or root vegetables as default builders.",
          "Keep portions gentle if symptoms are active.",
        ],
      },
      {
        week: 3,
        focus: "Add supportive microbes",
        theme: "Use fermented foods carefully",
        actions: [
          "Try one small serving of a live or fermented food if tolerated.",
          "Pair fermented foods with fibre-rich meals.",
          "Note any changes in bloating, regularity, or energy.",
        ],
      },
      {
        week: 4,
        focus: "Lock in your pattern",
        theme: "Make it repeatable",
        actions: [
          "Build a weekly plate template you can reuse.",
          "Prepare one staple ingredient ahead of time.",
          "Choose the three habits that gave the clearest benefit.",
        ],
      },
    ],
    lifestyleConnection:
      stress || sleep
        ? `Your lifestyle answers matter because the gut is not separate from stress, sleep, and recovery. ${stress ? `A stress answer of ${stress} suggests your plan should stay simple enough to follow on busy days. ` : ""}${sleep ? `A sleep answer of ${sleep} means evening rhythm and caffeine timing may influence digestion as well as food choice.` : ""}`
        : "Sleep, stress, movement, and eating rhythm all affect how well your food system uses the food you give it. Keep the plan simple enough that it survives ordinary weeks.",
    specificFoodList: [
      {
        food: "Oats",
        emoji: "oats",
        whyForThem: "A practical prebiotic base that can support steadier energy and gut-feeding fibre.",
        howToUse: "Use as porridge or overnight oats with berries, seeds, and yogurt if tolerated.",
      },
      {
        food: "Lentils",
        emoji: "lentils",
        whyForThem: "A high-fibre plant protein that supports microbial diversity and meal satisfaction.",
        howToUse: "Add a small portion to soup, curry, salad, or a grain bowl.",
      },
      {
        food: "Live yogurt or kefir",
        emoji: "yogurt",
        whyForThem: "A simple probiotic option if dairy is tolerated.",
        howToUse: "Start with a small serving alongside breakfast or fruit.",
      },
      {
        food: "Leafy greens",
        emoji: "greens",
        whyForThem: "Helpful for plant variety, minerals, and a more colourful weekly plate.",
        howToUse: "Add to eggs, soup, pasta, bowls, or sandwiches.",
      },
      {
        food: "Berries",
        emoji: "berries",
        whyForThem: "A gentle fibre and polyphenol source that is easy to repeat.",
        howToUse: "Use with oats, yogurt, smoothies, or as a simple snack.",
      },
    ],
  }
}

function buildPremiumReport(input: FallbackInput): DeepPremiumReport {
  const full = buildFullReport(input)
  const scores = getBioticScores(input.subScores)
  const [lowestName] = findLowestBiotic(scores)
  const lowest = displayBiotic(lowestName)

  return {
    ...full,
    priorityMap: {
      biggestBlocker: `Inconsistent support for ${lowest}`,
      blockerExplanation:
        "The main blocker is not a lack of effort. It is that the gut gets mixed signals when supportive meals, rhythm, fibre, and recovery vary too much across the week.",
      biggestBuilder: "A repeatable weekly plate rhythm",
      builderExplanation:
        "Your biggest builder is a small set of meals you can repeat, adjust, and learn from. This makes your food system easier to understand and improve.",
    },
    phasedStrategy: [
      {
        phase: "Stabilise",
        duration: "Weeks 1-2",
        milestone: "Fewer random meals and clearer body feedback",
        actions: ["Repeat one breakfast", "Add one daily plant food", "Track symptoms after main meals"],
      },
      {
        phase: "Build",
        duration: "Weeks 3-6",
        milestone: "More plant variety and better meal confidence",
        actions: ["Use 20+ plant foods per week", "Test fermented foods slowly", "Prepare one weekly staple"],
      },
      {
        phase: "Personalise",
        duration: "Weeks 7-10",
        milestone: "A clear personal food system pattern",
        actions: ["Keep the meals that work", "Reduce the triggers that repeat", "Review score movement monthly"],
      },
    ],
    systemInterpretation:
      "Your food system is best understood as a living pattern, not a fixed score. The assessment points to a system that can improve through regular inputs, gentler experimentation, and better feedback.\n\nThe practical priority is to build meals that are varied enough for the microbiome but familiar enough for real life. When that balance is right, improvement becomes easier to sustain.\n\nThis report should be treated as educational guidance, not medical advice. If symptoms are severe, persistent, unexplained, or worsening, it is important to speak with a qualified health professional.",
    systemStory:
      "You are building a food system that gives your body clearer signals. The next step is to make the helpful choices visible, repeatable, and calm enough to last.",
    gutDiagnosticSummary:
      "Your diagnostic answers add context to the score by showing how symptoms, history, and lifestyle may be interacting. The pattern is most useful when tracked over time rather than judged from one day.",
    symptomPattern:
      `The symptom pattern should be interpreted alongside the lower ${lowest} signal. Watch for meals that repeatedly create bloating, energy dips, irregularity, or brain fog, then adjust one variable at a time.`,
  }
}

export function buildFallbackPaidReport(input: FallbackInput): DeepReport {
  const effectiveTier = input.tier === "personal" ? "full" : input.tier

  if (effectiveTier === "premium") return buildPremiumReport(input)
  if (effectiveTier === "full") return buildFullReport(input)
  return buildStarterReport(input)
}
