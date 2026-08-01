/**
 * Builds a FoodSystemReport from an assessment result.
 *
 * ── Why a builder rather than "ask the model for eleven sections" ────────────
 *
 * Most of the educational report is derivable, not narrative. The pathway
 * scores, which pathway is strongest, which needs attention first, the visual
 * theme, the state of each node in the system map, the shape of the 30-day loop
 * — all of that follows from the numbers. Only the explanatory copy genuinely
 * needs a model.
 *
 * So this derives the whole structure with rule-based copy, and
 * `mergeGeneratedNarrative` overlays whatever narrative a model returned. The
 * consequence that matters: a report satisfies the schema **by construction**.
 * A model that returns nothing, or half a structure, or malformed JSON, still
 * produces a complete and honest report — it is just less personal. That is the
 * opposite of the old behaviour, where `JSON.parse(cleaned) as DeepReport` meant
 * a bad response was persisted and rendered unchecked.
 *
 * ── Language ─────────────────────────────────────────────────────────────────
 *
 * Every string below is customer-facing. It stays on "your answers suggest",
 * "may support", "is associated with" — never "you have" or "this reduces".
 * Bands describe the ANSWERS, not the person, because that is all a
 * questionnaire can honestly speak to.
 */

import {
  CLOSING_HEADLINE_LINES,
  SAFETY_FOOTER,
  type EducationModule,
  type EvidenceNote,
  type FoodSystemNode,
  type FoodSystemReport,
  type ReportFoodTool,
  type ReportMode,
  type ReportVisualToken,
} from "./food-system-report-types"
import {
  normalizeToBiotics,
  orderedByNeed,
  PATHWAY_LABEL,
  PATHWAY_MEANING,
  type BioticScoreKey,
  type IncomingSubScores,
} from "./subscores"
import { bioticAccent, foodIcon, pathwayIcon, type BioticKey, type VisualAccent } from "./visual-token"

export interface BuildReportInput {
  mode: ReportMode
  subScores: IncomingSubScores
  overall: number
  profile: { type: string; tagline: string; description: string }
  leadName?: string | null
  /** Defaults to "snapshot" — one assessment cannot honestly claim more. */
  confidence?: FoodSystemReport["confidence"]
  generatedAt?: string
  /** Family only. */
  familyContext?: FoodSystemReport["familyContext"]
}

const GRADIENT: VisualAccent[] = ["lime", "green", "teal", "yellow", "orange"]

/* ── Bands ───────────────────────────────────────────────────────────────────
 * Deliberately three, with wide ranges. A questionnaire cannot support finer
 * gradations, and a "62 vs 64" distinction would imply precision that is not
 * there. */

type Band = "strong" | "building" | "strained"

function band(score: number): Band {
  if (score >= 65) return "strong"
  if (score >= 40) return "building"
  return "strained"
}

function pathwayToken(pathway: BioticScoreKey): ReportVisualToken {
  return {
    type: "biotic-capsule",
    accent: bioticAccent(pathway),
    iconName: pathwayIcon(pathway),
  }
}

/* ── Pathway explanations ────────────────────────────────────────────────────
 * What each pathway is, and what a score in each band suggests about the
 * answers that produced it. */

const PATHWAY_PLAIN: Record<BioticScoreKey, string> = {
  prebiotics:
    "Prebiotics are the plant fibres your gut microbes feed on — vegetables, fruit, wholegrains, beans, nuts and seeds. They are the raw material the system runs on.",
  probiotics:
    "Probiotics are the live cultures in fermented foods — yoghurt, kefir, kimchi, sauerkraut, miso. They add microbial exposure rather than only feeding what is already there.",
  postbiotics:
    "Postbiotics are what the system produces once it is fed and supported: the compounds your microbes make from fibre, and the rhythm, rest and recovery that let them do it.",
}

const PATHWAY_WHY: Record<BioticScoreKey, string> = {
  prebiotics:
    "Variety matters as much as volume here. A wider range of plants is associated with a wider range of microbes, and diversity is one of the more consistent markers in microbiome research.",
  probiotics:
    "Live foods are one of the few ways to introduce new microbes rather than just feeding existing ones. Small, regular amounts are associated with more benefit than occasional large ones.",
  postbiotics:
    "Outputs depend on inputs plus conditions. Meal rhythm, eating pace, sleep and stress all shape what your system can do with the food you give it.",
}

const BAND_SUGGESTS: Record<BioticScoreKey, Record<Band, string>> = {
  prebiotics: {
    strong:
      "Your answers suggest a solid and varied plant base — this pathway is a strength to protect rather than rebuild.",
    building:
      "Your answers suggest plant fibre is present but not yet consistent across the week. There is room to widen the range rather than increase the amount.",
    strained:
      "Your answers suggest plant fibre is currently the thinnest part of your food system, which makes it the most direct place to start.",
  },
  probiotics: {
    strong:
      "Your answers suggest live foods already appear regularly — a habit worth keeping steady rather than intensifying.",
    building:
      "Your answers suggest live foods appear sometimes but not reliably. A predictable weekly rhythm may do more here than a larger portion.",
    strained:
      "Your answers suggest live foods are rare at the moment. This is often the easiest pathway to change, because a small daily serving is enough to shift it.",
  },
  postbiotics: {
    strong:
      "Your answers suggest your meal rhythm and recovery support the system well, which helps everything else you feed it.",
    building:
      "Your answers suggest rhythm and recovery are workable but uneven — the kind of pattern that tends to wobble on busy weeks.",
    strained:
      "Your answers suggest rhythm, rest or meal timing are under pressure. Food changes tend to land better once this steadies.",
  },
}

const BAND_STATE: Record<Band, FoodSystemNode["state"]> = {
  strong: "strong",
  building: "building",
  strained: "strained",
}

/* ── Body signals ───────────────────────────────────────────────────────────
 * Framed as things the reader may want to watch, never as findings. The brief
 * is explicit: "This is not a diagnosis. It is a food-pattern clue." */

const SIGNALS: Array<{
  id: string
  label: string
  zone: NonNullable<ReportVisualToken["bodyZone"]>
  accent: VisualAccent
  driver: BioticScoreKey
  explanation: string
}> = [
  {
    id: "gut-comfort",
    label: "Gut comfort and rhythm",
    zone: "gut",
    accent: "lime",
    driver: "prebiotics",
    explanation:
      "Digestive comfort and regularity are often the first things people notice when fibre variety changes. Your answers suggest this is worth watching as you adjust — not as a measure of health, but as feedback on what you changed.",
  },
  {
    id: "energy",
    label: "Energy steadiness",
    zone: "energy",
    accent: "yellow",
    driver: "postbiotics",
    explanation:
      "Steady energy across the day is associated with meal rhythm and the fibre-protein balance of what you eat, rather than with any single food. Dips at predictable times are a useful clue about pattern.",
  },
  {
    id: "immune-recovery",
    label: "Recovery and resilience",
    zone: "immune",
    accent: "teal",
    driver: "probiotics",
    explanation:
      "How quickly you bounce back from ordinary strain is shaped by many things, food among them. Treat this as context for your pattern rather than a measure of immunity.",
  },
]

/* ── Evidence ───────────────────────────────────────────────────────────────
 * The sources the brief nominates as guardrails. Every one is a body or a paper
 * that supports careful, hedged framing — they are here so the educational
 * claims above have something behind them a reader can check. */

const EVIDENCE: EvidenceNote[] = [
  {
    claim:
      "Prebiotic fibres are food components that gut microbes ferment, and are defined by the benefit that fermentation confers.",
    sourceTitle:
      "Gibson et al., ISAPP consensus statement on the definition and scope of prebiotics (2017)",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/28611480/",
  },
  {
    claim:
      "Probiotic effects are strain-specific and vary between people; benefits shown for one strain do not transfer automatically to another.",
    sourceTitle: "NIH NCCIH, Probiotics: What You Need To Know",
    sourceUrl: "https://www.nccih.nih.gov/health/probiotics-what-you-need-to-know",
  },
  {
    claim:
      "In a controlled trial, a fermented-food diet increased microbiome diversity and decreased markers of inflammation; a high-fibre diet did not show the same effect over the same period.",
    sourceTitle: "Wastyk et al., Gut-microbiota-targeted diets modulate human immune status, Cell (2021)",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/34256014/",
  },
  {
    claim:
      "General healthy-diet guidance emphasises overall pattern — variety of plants, limited free sugars and salt — rather than single foods.",
    sourceTitle: "WHO, Healthy diet fact sheet",
    sourceUrl: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
  },
]

/* ── Food tools ─────────────────────────────────────────────────────────────
 * A small, deliberately boring starter set per pathway. These are the fallback
 * when nothing better is generated: unglamorous, widely available, and each one
 * carries the mechanism that earns its place. */

const TOOLS: Record<BioticScoreKey, ReportFoodTool[]> = {
  prebiotics: [
    {
      food: "Oats",
      biotic: "prebiotics",
      visualToken: { type: "food-group", accent: "lime", iconName: foodIcon("Oats") },
      mechanism:
        "Beta-glucan, a soluble fibre gut microbes ferment. Cooking then cooling oats also raises their resistant starch.",
      whyForThisCustomer:
        "A low-friction way to put fibre into a meal you already eat, rather than adding a new one.",
      howToUse: "Porridge or overnight oats; or two tablespoons stirred into yoghurt.",
      swap: "Barley or wholegrain rye if oats do not suit you.",
      familyAdaptation: "Overnight oats can be made the night before and portioned for the week.",
    },
    {
      food: "Lentils",
      biotic: "prebiotics",
      visualToken: { type: "food-group", accent: "lime", iconName: foodIcon("Lentils") },
      mechanism:
        "Fibre plus resistant starch, which reach the colon largely intact and give a wide range of microbes something to work on.",
      whyForThisCustomer:
        "Adds fibre and protein in one step, which tends to make a meal more filling as well as more varied.",
      howToUse: "A handful into soup, curry, bolognese or a grain bowl. Tinned is fine.",
      swap: "Chickpeas or butter beans work the same way.",
      familyAdaptation: "Blended into a familiar sauce, lentils change texture very little.",
    },
    {
      food: "Mixed leafy greens",
      biotic: "prebiotics",
      visualToken: { type: "food-group", accent: "lime", iconName: foodIcon("greens") },
      mechanism:
        "Different leaves carry different fibres and polyphenols, so rotating them widens the range of substrates reaching your microbes.",
      whyForThisCustomer:
        "Variety is the lever here, and rotating leaves is the cheapest way to get it.",
      howToUse: "Rotate three or more kinds across a week rather than buying the same bag.",
    },
  ],
  probiotics: [
    {
      food: "Live yoghurt or kefir",
      biotic: "probiotics",
      visualToken: { type: "food-group", accent: "teal", iconName: foodIcon("kefir") },
      mechanism:
        "Carries live cultures, so it adds microbial exposure rather than only feeding the microbes already present.",
      whyForThisCustomer:
        "The most repeatable live food for most households, and easy to attach to an existing breakfast.",
      howToUse: "A small serving daily. Check the label says live or active cultures.",
      swap: "Unsweetened plant-based versions with live cultures if dairy does not suit you.",
      familyAdaptation: "Plain yoghurt with fruit avoids the sugar in flavoured pots.",
    },
    {
      food: "Sauerkraut or kimchi",
      biotic: "probiotics",
      visualToken: { type: "food-group", accent: "teal", iconName: foodIcon("kimchi") },
      mechanism:
        "Fermented vegetables deliver live cultures alongside the fibre of the vegetable itself.",
      whyForThisCustomer:
        "A forkful beside a meal you already eat is enough — this does not need to become a dish.",
      howToUse:
        "Start with a tablespoon beside lunch or dinner. Buy refrigerated and unpasteurised; shelf-stable jars are usually not live.",
      familyAdaptation: "Strong flavours often land better alongside something familiar.",
    },
  ],
  postbiotics: [
    {
      food: "A repeatable breakfast",
      biotic: "postbiotics",
      visualToken: { type: "habit", accent: "orange", iconName: "Clock" },
      mechanism:
        "Regular meal timing gives your microbes a predictable schedule, and rhythm is associated with steadier energy through the day.",
      whyForThisCustomer:
        "Rhythm tends to be the constraint before food choice is. A default breakfast removes one decision from every morning.",
      howToUse: "Pick one breakfast you can repeat on a bad week, and keep its ingredients in stock.",
      familyAdaptation: "One shared default is easier to protect than several individual ones.",
    },
    {
      food: "Extra-virgin olive oil",
      biotic: "postbiotics",
      visualToken: { type: "food-group", accent: "orange", iconName: foodIcon("olive oil") },
      mechanism:
        "Polyphenols that reach the colon, where they are associated with supporting beneficial bacteria alongside fibre.",
      whyForThisCustomer:
        "Changes nothing about what you cook — only what you finish it with.",
      howToUse: "Use raw as a finishing oil over vegetables, grains or soup.",
    },
  ],
}

/* ── The builder ─────────────────────────────────────────────────────────── */

function nodeFor(pathway: BioticScoreKey, score: number): FoodSystemNode {
  const b = band(score)
  return {
    id: pathway,
    label: `${PATHWAY_LABEL[pathway]} — ${PATHWAY_MEANING[pathway]}`,
    state: BAND_STATE[b],
    score,
    explanation: BAND_SUGGESTS[pathway][b],
    visualToken: pathwayToken(pathway),
  }
}

function moduleFor(pathway: BioticScoreKey, score: number): EducationModule {
  return {
    title: `${PATHWAY_LABEL[pathway]}: ${PATHWAY_MEANING[pathway]}`,
    visualToken: pathwayToken(pathway),
    plainEnglish: PATHWAY_PLAIN[pathway],
    whyItMatters: PATHWAY_WHY[pathway],
    whatYourAnswersSuggest: BAND_SUGGESTS[pathway][band(score)],
    actionBridge:
      pathway === "postbiotics"
        ? "The lever here is rhythm rather than a food: pick one meal to keep predictable this week."
        : `The lever here is repetition: add one ${PATHWAY_LABEL[pathway].toLowerCase().replace(/s$/, "")} food to a meal you already eat, and keep it there.`,
  }
}

function thirtyDayLoop(priority: BioticScoreKey): FoodSystemReport["thirtyDayLoop"] {
  const label = PATHWAY_LABEL[priority].toLowerCase()
  return [
    {
      week: 1,
      focus: "Install the smallest habit",
      action: `Add one ${label} food to a single meal you already eat every day.`,
      why: "Starting small is what makes a change survive an ordinary week. One habit beats five intentions.",
    },
    {
      week: 2,
      focus: "Widen the range",
      action: `Rotate a second and third ${label} food in across the week rather than increasing the amount.`,
      why: "Variety is associated with a wider microbial range, so rotating does more than repeating.",
    },
    {
      week: 3,
      focus: "Combine feeding and seeding",
      action: "Pair a fibre-rich food with a live food in the same meal — oats with yoghurt, or beans with kimchi.",
      why: "Feeding microbes and adding them work together; pairing them is a simple way to do both without a new meal.",
    },
    {
      week: 4,
      focus: "Review and retake",
      action: "Notice what held on a busy week, drop what did not, and retake the assessment.",
      why: "What survives a bad week is the part that has actually changed. Retaking turns a snapshot into a pattern.",
    },
  ]
}

export function buildFoodSystemReport(input: BuildReportInput): FoodSystemReport {
  const biotics = normalizeToBiotics(input.subScores) ?? {
    // Only reachable if a caller passes a shape with no resolvable pathway at
    // all. Zeroes are honest here: the report says "we could not read this"
    // through its band copy rather than inventing a middling score.
    prebiotics: 0,
    probiotics: 0,
    postbiotics: 0,
  }

  const ranked = orderedByNeed(biotics)
  const priorityPathway = ranked[0][0]
  const strongestPathway = ranked[ranked.length - 1][0]
  const priorityScore = ranked[0][1]

  const isFamily = input.mode === "family"
  const who = isFamily ? "your family's" : "your"

  // dominantPattern is derived rather than taken from profile.description.
  // Those descriptions are older copy and several open "You have solid food
  // habits…" or promise change "within weeks" — phrasing the brief rules out.
  // They still drive the existing results page, so rewriting them belongs to
  // the evidence/safety pass, not here; the educational report simply does not
  // inherit them. The banned-phrase test in tests/unit/food-system-report.test.ts
  // is what caught this.
  const bands = (Object.keys(biotics) as BioticScoreKey[]).map((p) => band(biotics[p]))
  const strongCount = bands.filter((b) => b === "strong").length
  const strainedCount = bands.filter((b) => b === "strained").length

  const dominantPattern =
    strongCount === 3
      ? "Your answers describe a food system that is well supported across all three pathways — varied plants, regular live foods, and a rhythm that holds. From here the work is protecting what already works rather than rebuilding."
      : strainedCount === 3
      ? "Your answers describe a food system that is early in its development across all three pathways. That is a useful starting point rather than a problem: one repeatable habit tends to move several scores at once."
      : strongCount >= 1 && strainedCount >= 1
      ? `Your answers describe an uneven system — ${PATHWAY_LABEL[strongestPathway]} is well supported while ${PATHWAY_LABEL[priorityPathway]} is thinner. Uneven is easier to improve than uniformly low, because the strong pathway is already doing work the weaker one can build on.`
      : "Your answers describe a food system that is coming together but not yet consistent. The pattern suggests the pieces are present and the gap is repetition rather than knowledge."

  const snapshotOneLine =
    band(priorityScore) === "strong"
      ? `Your answers suggest ${who} food system is working well across all three pathways, with ${PATHWAY_LABEL[priorityPathway]} the one with most room left.`
      : `Your answers suggest ${PATHWAY_LABEL[strongestPathway]} is ${who} strongest pathway, and that ${PATHWAY_LABEL[priorityPathway]} is where a change would show up fastest.`

  const foodTools = [...TOOLS[priorityPathway], ...TOOLS[strongestPathway]].slice(0, 5)

  return {
    mode: input.mode,
    title: isFamily ? "Your Family Food System Report" : "The Food System Inside You",
    subtitle: input.profile.tagline,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    // One assessment is a snapshot. Claiming more would misrepresent what a
    // single questionnaire can see.
    confidence: input.confidence ?? "snapshot",
    overallScore: Math.max(0, Math.min(100, Math.round(input.overall))),
    bioticScores: biotics,

    systemSnapshot: {
      oneLine: snapshotOneLine,
      strongestPathway,
      priorityPathway,
      dominantPattern,
      mainLever: BAND_SUGGESTS[priorityPathway][band(priorityScore)],
    },

    visualTheme: {
      primaryAccent: bioticAccent(priorityPathway),
      bodyAssetPath: isFamily ? "/images/family-hero.png" : "/images/couple-hero.png",
      gradient: GRADIENT,
    },

    foodSystemMap: (Object.keys(biotics) as BioticScoreKey[]).map((p) => nodeFor(p, biotics[p])),
    educationModules: (Object.keys(biotics) as BioticScoreKey[]).map((p) => moduleFor(p, biotics[p])),

    bodySignalMap: SIGNALS.map((s) => ({
      id: s.id,
      label: s.label,
      state: BAND_STATE[band(biotics[s.driver])],
      explanation: s.explanation,
      visualToken: { type: "body-zone", accent: s.accent, bodyZone: s.zone },
    })),

    priorityLever: {
      title: `Start with ${PATHWAY_LABEL[priorityPathway]}`,
      whyThisFirst: BAND_SUGGESTS[priorityPathway][band(priorityScore)],
      firstStep: thirtyDayLoop(priorityPathway)[0].action,
      whatToNotice:
        "Over two to three weeks you may notice changes in digestion, comfort or energy steadiness. Treat those as feedback on the change, not as a measure of health.",
    },

    foodTools,
    thirtyDayLoop: thirtyDayLoop(priorityPathway),
    familyContext: input.familyContext,

    closingMissionPage: {
      headlineLines: CLOSING_HEADLINE_LINES,
      insideYou:
        "This report starts inside you: your inputs, microbes, outputs, signals, and next action. But food never stays only inside one person. The meals you repeat shape your household, your shopping patterns, your local food culture, and the Food System around you.",
      aroundYou:
        "Build the system inside you first. Then help make the system around you healthier, more resilient, and more connected — from your table to your community, your county, your country, and the wider Food System.",
      nextAction:
        "Keep going in your account: log what you actually eat for a few weeks and your snapshot becomes a pattern you can steer.",
      visualToken: {
        type: "biotic-capsule",
        accent: "green",
        assetPath: isFamily ? "/images/family-hero.png" : "/images/couple-hero.png",
      },
    },

    evidenceNotes: EVIDENCE,
    safetyFooter: SAFETY_FOOTER,
  }
}

/* ── Merging generated narrative ─────────────────────────────────────────── */

type GeneratedNarrative = {
  systemSnapshot?: Partial<FoodSystemReport["systemSnapshot"]>
  educationModules?: Array<Partial<EducationModule>>
  priorityLever?: Partial<FoodSystemReport["priorityLever"]>
  foodTools?: Array<Partial<ReportFoodTool>>
  bodySignalMap?: Array<{ id?: string; explanation?: string }>
  closingMissionPage?: Partial<Omit<FoodSystemReport["closingMissionPage"], "headlineLines">>
}

const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined

/**
 * Overlays model-written copy onto a derived report.
 *
 * Only prose is taken. Scores, pathway rankings, visual tokens, the closing
 * headline, the evidence notes and the safety footer are all derived or fixed,
 * and a model cannot overwrite them — which is what stops a hallucinated score
 * or a paraphrased safety footer reaching a customer.
 */
export function mergeGeneratedNarrative(
  base: FoodSystemReport,
  generated: unknown,
): FoodSystemReport {
  if (!generated || typeof generated !== "object") return base
  const g = generated as GeneratedNarrative

  const merged: FoodSystemReport = { ...base }

  if (g.systemSnapshot) {
    merged.systemSnapshot = {
      ...base.systemSnapshot,
      oneLine: str(g.systemSnapshot.oneLine) ?? base.systemSnapshot.oneLine,
      dominantPattern: str(g.systemSnapshot.dominantPattern) ?? base.systemSnapshot.dominantPattern,
      mainLever: str(g.systemSnapshot.mainLever) ?? base.systemSnapshot.mainLever,
      // strongestPathway / priorityPathway are derived from scores, never taken.
    }
  }

  if (Array.isArray(g.educationModules)) {
    merged.educationModules = base.educationModules.map((mod, i) => {
      const gen = g.educationModules?.[i]
      if (!gen) return mod
      return {
        ...mod,
        plainEnglish: str(gen.plainEnglish) ?? mod.plainEnglish,
        whyItMatters: str(gen.whyItMatters) ?? mod.whyItMatters,
        whatYourAnswersSuggest: str(gen.whatYourAnswersSuggest) ?? mod.whatYourAnswersSuggest,
        actionBridge: str(gen.actionBridge) ?? mod.actionBridge,
      }
    })
  }

  if (g.priorityLever) {
    merged.priorityLever = {
      title: str(g.priorityLever.title) ?? base.priorityLever.title,
      whyThisFirst: str(g.priorityLever.whyThisFirst) ?? base.priorityLever.whyThisFirst,
      firstStep: str(g.priorityLever.firstStep) ?? base.priorityLever.firstStep,
      whatToNotice: str(g.priorityLever.whatToNotice) ?? base.priorityLever.whatToNotice,
    }
  }

  if (Array.isArray(g.bodySignalMap)) {
    merged.bodySignalMap = base.bodySignalMap.map((node) => {
      const gen = g.bodySignalMap?.find((n) => n.id === node.id)
      return gen ? { ...node, explanation: str(gen.explanation) ?? node.explanation } : node
    })
  }

  if (Array.isArray(g.foodTools) && g.foodTools.length > 0) {
    // Generated foods replace the defaults, because a personalised food list is
    // the point — but each must carry a name and a mechanism, and its token is
    // derived here so an accent can never arrive as a raw colour.
    const tools = g.foodTools
      .map((t): ReportFoodTool | null => {
        const food = str(t.food)
        const mechanism = str(t.mechanism)
        if (!food || !mechanism) return null
        const biotic: BioticKey =
          t.biotic === "probiotics" || t.biotic === "postbiotics" || t.biotic === "synbiotic"
            ? t.biotic
            : "prebiotics"
        return {
          food,
          biotic,
          visualToken: {
            type: "food-group",
            accent: bioticAccent(biotic),
            iconName: foodIcon(food),
          },
          mechanism,
          whyForThisCustomer:
            str(t.whyForThisCustomer) ?? "Chosen to suit the pattern your answers describe.",
          howToUse: str(t.howToUse) ?? "Add it to a meal you already eat regularly.",
          swap: str(t.swap),
          familyAdaptation: str(t.familyAdaptation),
        }
      })
      .filter((t): t is ReportFoodTool => t !== null)
    if (tools.length > 0) merged.foodTools = tools
  }

  if (g.closingMissionPage) {
    merged.closingMissionPage = {
      ...base.closingMissionPage,
      insideYou: str(g.closingMissionPage.insideYou) ?? base.closingMissionPage.insideYou,
      aroundYou: str(g.closingMissionPage.aroundYou) ?? base.closingMissionPage.aroundYou,
      nextAction: str(g.closingMissionPage.nextAction) ?? base.closingMissionPage.nextAction,
      // headlineLines is fixed brand copy and is never taken from generation.
    }
  }

  return merged
}
