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
  type FoodSystemReport,
  type ReportFoodTool,
  type ReportMode,
  type ReportVisualToken,
} from "./food-system-report-types"
import {
  PATHWAY_LABEL,
  PATHWAY_MEANING,
  type BioticScoreKey,
  type IncomingSubScores,
} from "./subscores"
import { bioticAccent, foodIcon, pathwayIcon, type BioticKey, type VisualAccent } from "./visual-token"
import type { PaidReportFoundation, PaidReportHealthSystem } from "@/lib/paid-report-session"

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

/**
 * Which report mode a paid deep assessment produced.
 *
 * The deep assessment always starts from a foundation (You or Family) and may
 * add one focused lens — Stability, Glucose, Mind or Performance. When an add-on
 * is present the report genuinely covers both, so it is "combined".
 *
 * "mind" is in ReportMode for the standalone Mind assessment surface, which
 * does not route through here. A Mind ADD-ON on a foundation is still a combined
 * report, not a Mind one — calling it "mind" would drop the foundation from the
 * report's own description of itself.
 */
export function resolveReportMode(input: {
  foundationType?: PaidReportFoundation | null
  selectedAddon?: PaidReportHealthSystem | null
}): ReportMode {
  if (input.selectedAddon) return "combined"
  if (input.foundationType === "family") return "family"
  return "you"
}

/**
 * Attaches a derived foodSystem block to a report that has none.
 *
 * Reports persisted before Phase 2 — and any reused report_json from a retry —
 * carry no educational block, and the reuse path returns them verbatim. Without
 * this they would never gain one, so a customer retrying delivery would keep
 * getting the older shape forever.
 *
 * Derived only: this never re-runs generation. A reused report keeps whatever
 * narrative it already had, and gains the structural block around it.
 */
export function ensureFoodSystem<T extends { foodSystem?: FoodSystemReport }>(
  report: T,
  input: BuildReportInput,
): T {
  if (report.foodSystem) return report
  return { ...report, foodSystem: buildFoodSystemReport(input) }
}

/* ── Bands ───────────────────────────────────────────────────────────────────
 * Deliberately three, with wide ranges. A questionnaire cannot support finer
 * gradations, and a "62 vs 64" distinction would imply precision that is not
 * there. */

export type Band = "strong" | "building" | "strained"

/** Exported so other report builders (the fallback report, notably) classify
 *  scores the same way this file does, rather than inventing a second set of
 *  thresholds that can drift from these. */
export function band(score: number): Band {
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
    "Probiotics are live microorganisms that, in adequate amounts, have a demonstrated benefit. Foods transformed by fermentation — yoghurt, kefir, kimchi, sauerkraut, miso — are the everyday route to them, though whether live microorganisms survive to be eaten depends on the food and how it is made.",
  postbiotics:
    "Postbiotics are what the system produces once it is fed and supported: the compounds your microbes make from fibre, and the rhythm, rest and recovery that let them do it.",
}

const PATHWAY_WHY: Record<BioticScoreKey, string> = {
  prebiotics:
    "Variety matters as much as volume here. A wider range of plants is associated with a wider range of microbes, and diversity is one of the more consistent markers in microbiome research.",
  probiotics:
    "Fermented foods are the one pathway that brings microbial material in from outside rather than only feeding what is already there. Small, regular amounts are associated with more benefit than occasional large ones.",
  postbiotics:
    "Outputs depend on inputs plus conditions. Meal rhythm, eating pace, sleep and stress all shape what your system can do with the food you give it.",
}

/* ══ 0R-6R · `BAND_SUGGESTS` AND `BAND_STATE` ARE DELETED ═══════════════════
 *
 * `BAND_SUGGESTS` was a 3 x 3 table of possessive sentences about this member's
 * state in one Biotic — "Your answers suggest plant fibre is currently the
 * thinnest part of your food system" — indexed by `[pathway][band(score)]`. It
 * fed four customer-facing fields: the node explanations, the education
 * modules' "What your answers suggest", `systemSnapshot.mainLever` and
 * `priorityLever.whyThisFirst`.
 *
 * `BAND_STATE` turned a per-Biotic score into the band word a reader saw as a
 * coloured badge, and `bodySignalMap` used it to band a BODY SIGNAL from its
 * driver Biotic's score.
 *
 * Both are gone with the construct rather than reworded, because a band of an
 * unmeasured per-Biotic score is the claim, not the sentence that carries it.
 * The reviewed general education in `PATHWAY_PLAIN` and `PATHWAY_WHY` above is
 * untouched: it describes the biology, not the reader.
 */

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
 * carries the mechanism that earns its place.
 *
 * Exported so lib/fallback-paid-report.ts's specificFoodList reads from the
 * same dataset rather than carrying a second, hand-authored one — the €49
 * audit's finding was that the legacy fallback's five foods never varied with
 * the customer's answers at all, because they were a static array unrelated
 * to this one. Every entry has a `swap`: the fallback's per-recommendation
 * requirement needs a realistic alternative on all five, not just some. */

/**
 * How many food tools a report shows. Exported because the legacy paid report
 * renders this list under a literal "5 Foods" heading in two places
 * (lib/pdf/report-pdf.tsx and components/assessment/paid-report-client.tsx),
 * so the count is a contract rather than a local slice length.
 */
export const FOOD_TOOL_COUNT = 5

export const TOOLS: Record<BioticScoreKey, ReportFoodTool[]> = {
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
      swap: "Frozen spinach or kale works the same way and keeps longer.",
    },
  ],
  probiotics: [
    {
      food: "Live yoghurt or kefir",
      biotic: "probiotics",
      visualToken: { type: "food-group", accent: "teal", iconName: foodIcon("kefir") },
      mechanism:
        "Made by fermentation. Whether microorganisms are still present by the time you eat it depends on how it was processed, which is why the label matters.",
      whyForThisCustomer:
        "The most repeatable fermented food for most households, and easy to attach to an existing breakfast.",
      howToUse: "A small serving daily. Check the label says live or active cultures.",
      swap: "Unsweetened plant-based versions labelled live or active if dairy does not suit you.",
      familyAdaptation: "Plain yoghurt with fruit avoids the sugar in flavoured pots.",
    },
    {
      food: "Sauerkraut or kimchi",
      biotic: "probiotics",
      visualToken: { type: "food-group", accent: "teal", iconName: foodIcon("kimchi") },
      mechanism:
        "Vegetables transformed by fermentation, carrying the fibre of the vegetable itself. Whether live microorganisms reach you depends on how the jar was made and stored.",
      whyForThisCustomer:
        "A forkful beside a meal you already eat is enough — this does not need to become a dish.",
      howToUse:
        "Start with a tablespoon beside lunch or dinner. Buy refrigerated and unpasteurised; shelf-stable jars are usually not live.",
      swap: "Live yoghurt or kefir if fermented vegetables do not suit you.",
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
      swap: "A packed lunch works the same way if mornings are not the constraint.",
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
      swap: "Avocado oil is a reasonable alternative if the flavour does not suit you.",
    },
  ],
}

/* ── The builder ─────────────────────────────────────────────────────────── */

/*
 * ══ 0R-6R · `nodeFor` IS GONE, AND CHAPTER 2 WENT WITH IT ══════════════════
 *
 * A pathway node was `{ label, state, score, explanation }` where `state` and
 * `score` were the per-Biotic band and number, and `explanation` was
 * `BAND_SUGGESTS[pathway][band]`. Strip the three prohibited fields and a
 * pathway node is a label and a token — which says nothing `moduleFor` below
 * does not already teach, generally and at more length.
 *
 * So `foodSystemMap` is now the body signals only, and the web/PDF chapter that
 * rendered the three pathways "part by part, where each pathway stands right
 * now" is retired. Keeping an emptied version of it would have left the chapter
 * heading making a claim its contents no longer supported — the same mistake
 * the "Starting with your areas of greatest opportunity" subtitle made when
 * 0R-6 removed the sort underneath it.
 */

function moduleFor(pathway: BioticScoreKey): EducationModule {
  return {
    title: `${PATHWAY_LABEL[pathway]}: ${PATHWAY_MEANING[pathway]}`,
    visualToken: pathwayToken(pathway),
    plainEnglish: PATHWAY_PLAIN[pathway],
    whyItMatters: PATHWAY_WHY[pathway],
    /*
     * 0R-6R · `whatYourAnswersSuggest` is gone from the contract. The three
     * fields that remain are reviewed general education — what the pathway is,
     * why it matters, and one non-ranked action — and none of them reads a
     * score. The module no longer takes one.
     */
    actionBridge:
      pathway === "postbiotics"
        ? "The lever here is rhythm rather than a food: pick one meal to keep predictable this week."
        : `The lever here is repetition: add one ${PATHWAY_LABEL[pathway].toLowerCase().replace(/s$/, "")} food to a meal you already eat, and keep it there.`,
  }
}

/*
 * ══ 0R-6R · THE 30-DAY LOOP IS NO LONGER CHOSEN FOR THE READER ═════════════
 *
 * Every week interpolated `PATHWAY_LABEL[priority].toLowerCase()` — the argmin
 * over three unmeasured scores — so the loop a paying customer followed for a
 * month was selected by a ranking the product is not entitled to make.
 *
 * Weeks 3 and 4 were already pathway-free and are unchanged. Weeks 1 and 2 are
 * the same reviewed sentences with the ranked variable replaced by the
 * fibre-plus-fermented pair the product already teaches everywhere — Feed and
 * Seed, which week 3 names in exactly those words. That is DE-PERSONALISING
 * REVIEWED COPY, not new copy, and no week now claims one of the three is this
 * member's priority.
 */
function thirtyDayLoop(): FoodSystemReport["thirtyDayLoop"] {
  return [
    {
      week: 1,
      focus: "Install the smallest habit",
      action: "Add one fibre-rich food and one fermented food to meals you already eat every day.",
      why: "Starting small is what makes a change survive an ordinary week. One habit beats five intentions.",
    },
    {
      week: 2,
      focus: "Widen the range",
      action: "Rotate a second and third of each in across the week rather than increasing the amount.",
      why: "Variety is associated with a wider microbial range, so rotating does more than repeating.",
    },
    {
      week: 3,
      focus: "Combine feeding and seeding",
      action: "Pair a fibre-rich food with a fermented food in the same meal — oats with yoghurt, or beans with kimchi.",
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
  /*
   * ══ 0R-6R · THE BUILDER READS NO PER-BIOTIC SCORE ═════════════════════════
   *
   * `normalizeToBiotics(input.subScores)` and `orderedByNeed` are both gone
   * from this function, and `orderedByNeed` is deleted from
   * `lib/report/subscores.ts` entirely. That is what makes "Report construction
   * cannot recreate the ranking" structural rather than asserted: the three
   * numbers never enter, so no field downstream can be keyed on which of them
   * is highest or lowest.
   *
   * What entered, and what it chose:
   *
   *   const ranked = orderedByNeed(biotics)
   *   priorityPathway  = ranked[0][0]              the argmin
   *   strongestPathway = ranked[ranked.length-1][0] the argmax
   *
   *   → systemSnapshot.oneLine        "Prebiotics is your strongest pathway,
   *                                    and Probiotics is where your answers
   *                                    point to the clearest first step"
   *   → systemSnapshot.dominantPattern the uneven branch, naming both
   *   → systemSnapshot.mainLever       BAND_SUGGESTS[priority][band]
   *   → visualTheme.primaryAccent      bioticAccent(priorityPathway)
   *   → foodTools                      toolOrder = [priority, strongest, …],
   *                                    which chose the FIVE FOODS a paying
   *                                    customer sees
   *   → priorityLever.title            "Start with <Biotic>"
   *   → thirtyDayLoop(priorityPathway) all four weeks
   *
   * Eight customer-facing outputs from one argmin over three numbers a
   * questionnaire cannot measure.
   *
   * ── WHY NOTHING REPLACED IT ───────────────────────────────────────────────
   *
   * No authorised selector exists. `lib/fss/action/priority.ts` is the right
   * shape but its weights refuse to score outside a DEV_ONLY fixture context;
   * `lib/report/deterministic/priority.ts` is pre-activation. And the obvious
   * move — keep the argmin, relabel its output through `PILLAR_BEHAVIOUR` so it
   * reads "fermented foods" instead of "Probiotics" — was refused:
   *
   *     A SAFER LABEL DOES NOT LEGITIMISE AN UNSUPPORTED SELECTOR.
   *
   * So the Report is non-ranked. `overallScore` — the Biotics Score™, the thing
   * EatoBiotics sells — still reaches every surface, and the three sub-scores
   * reach none.
   */
  const isFamily = input.mode === "family"
  const who = isFamily ? "your family's" : "your"

  /*
   * `dominantPattern` keeps the reviewed sentence it already had for the case
   * where nothing is uneven, generalised so it holds for every reader. The
   * uneven branch — "Prebiotics is well supported while Probiotics is thinner"
   * — is the one that named the ranking, and sabotage 1521 proved that removing
   * exactly this sentence is what flips the permutation assertion green.
   */
  const dominantPattern =
    "Your answers describe a food system with its stronger and thinner parts, which is the ordinary shape. Uneven is easier to improve than uniformly low, because the parts that are working are already doing work the thinner ones can build on."

  const snapshotOneLine = `Your answers give ${who} food system a Biotics Score, and the chapters below explain what the three pathways are and what feeds each one.`

  /*
   * Five unique tools, in CATALOGUE order.
   *
   * 0R-6R · `toolOrder` was `[priorityPathway, strongestPathway, …]`, so the
   * five foods a paying customer is shown — and which five of the seven they
   * never see — were chosen by the argmin and argmax over three unmeasured
   * scores. That is the clearest case in the Report of a hidden ranking making
   * a personal recommendation, and it was found by tracing the selector rather
   * than by reading any sentence.
   *
   * The historical note is kept because the count bug it records is still a
   * live hazard: the legacy report renders this list under a hard-coded
   * "5 Foods" heading, and `[...TOOLS[a], ...TOOLS[b]].slice(0, 5)` returned
   * FOUR whenever `a` and `b` were the two 2-item pathways. The catalogue holds
   * 3 + 2 + 2 = 7, so iterating all three in a fixed order always reaches five.
   */
  const toolOrder = Object.keys(TOOLS) as BioticScoreKey[]
  const foodTools: ReportFoodTool[] = []
  const seenFood = new Set<string>()
  for (const pathway of toolOrder) {
    for (const tool of TOOLS[pathway]) {
      if (seenFood.has(tool.food)) continue
      seenFood.add(tool.food)
      foodTools.push(tool)
      if (foodTools.length === FOOD_TOOL_COUNT) break
    }
    if (foodTools.length === FOOD_TOOL_COUNT) break
  }

  return {
    mode: input.mode,
    title: isFamily ? "Your Family Food System Report" : "The Food System Inside You",
    subtitle: input.profile.tagline,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    // One assessment is a snapshot. Claiming more would misrepresent what a
    // single questionnaire can see.
    confidence: input.confidence ?? "snapshot",
    overallScore: Math.max(0, Math.min(100, Math.round(input.overall))),

    systemSnapshot: {
      oneLine: snapshotOneLine,
      dominantPattern,
      /*
       * 0R-6R · `mainLever` was `BAND_SUGGESTS[priorityPathway][band]` — the
       * ranked pathway's band sentence. It is now the one non-ranked lever the
       * product teaches for every reader, and the same sentence week 3 of the
       * loop already carries.
       */
      mainLever:
        "The lever that applies to every food system is repetition: pair a fibre-rich food with a fermented food in a meal you already eat, and keep it there.",
    },

    visualTheme: {
      /*
       * 0R-6R · `bioticAccent(priorityPathway)` encoded the ranking as the
       * Report's accent COLOUR — the Report analogue of `P0-SCIENCE-04`, which
       * 0R-5 closed on the Twin. A claim is still a claim when it is encoded
       * visually, so the accent is now the brand's, identical for every reader.
       */
      primaryAccent: GRADIENT[0],
      bodyAssetPath: isFamily ? "/images/family-hero.png" : "/images/couple-hero.png",
      gradient: GRADIENT,
    },

    /*
     * 0R-6R · `foodSystemMap` is gone from the contract, not emptied here.
     * See `food-system-report-types.ts`. `bodySignalMap` below is unaffected —
     * it was always a separate list, and it keeps its reviewed explanations.
     */
    educationModules: (Object.keys(TOOLS) as BioticScoreKey[]).map((p) => moduleFor(p)),

    /*
     * 0R-6R · a body signal no longer carries a `state`, and its `driver` no
     * longer reaches anything.
     *
     * `state` was `BAND_STATE[band(biotics[s.driver])]`, so "Energy steadiness:
     * Room to grow" was a BODY STATE asserted from an unmeasured Biotic score
     * — and four signals exposing four driver bands let a reader reconstruct
     * the triple. The reviewed `explanation` is a static literal and is
     * unchanged: it says what to notice and why, and explicitly "not as a
     * measure of health".
     */
    bodySignalMap: SIGNALS.map((sig) => ({
      id: sig.id,
      label: sig.label,
      explanation: sig.explanation,
      visualToken: { type: "body-zone", accent: sig.accent, bodyZone: sig.zone },
    })),

    /*
     * 0R-6R · `priorityLever` is a NEXT STEP, not a nomination.
     *
     * `title` was literally `Start with ${PATHWAY_LABEL[priorityPathway]}` —
     * "Start with Probiotics" — which is the ranking printed as a chapter
     * heading, and `whyThisFirst` was that pathway's band sentence. The
     * chapter stays, because "here is where to begin" is a legitimate thing a
     * report does; what it may not do is claim one of the three is personally
     * primary. So the title is general and the first step is the loop's own
     * week 1, which no longer names a pathway either.
     */
    priorityLever: {
      title: "Start Here",
      whyThisFirst:
        "One repeated change does more than several intended ones, and the two that apply to every food system are fibre variety and regular fermented food.",
      firstStep: thirtyDayLoop()[0].action,
      whatToNotice:
        "Over two to three weeks you may notice changes in digestion, comfort or energy steadiness. Treat those as feedback on the change, not as a measure of health.",
    },

    foodTools,
    thirtyDayLoop: thirtyDayLoop(),
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
        /*
         * 0R-6R · `whatYourAnswersSuggest` is gone from `EducationModule`, so
         * the model cannot write one either. This is the AI-merge half of the
         * close: a generated report could previously supply a possessive
         * per-Biotic sentence for a field the deterministic builder had stopped
         * filling, which is exactly how a removed construct comes back.
         */
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

/**
 * The exact customer-visible strings `mergeGeneratedNarrative` above is allowed
 * to take from a model response — and nothing else.
 *
 * This is a canonical PROJECTION, not a serialisation of the report. Comparing
 * whole objects would make provenance depend on scores, evidence notes, the
 * safety footer, visual tokens, derived ids, property order and every field
 * added in future — none of which a model can influence, all of which would
 * make the answer wrong for reasons that have nothing to do with authorship.
 *
 * Entries are tagged with a derived, model-unwritable key (`title` for a module,
 * `id` for a signal node) and then sorted, so array order cannot change the
 * result either.
 *
 * Lives here, immediately below the merge, so the two are read and changed
 * together. A test in tests/unit/generation-provenance.test.ts extracts the
 * property names this file's merge actually accepts and asserts each one is
 * named below, so the projection cannot silently drift from the allow-list.
 */
export function foodSystemNarrativeProjection(report: FoodSystemReport): string[] {
  const out: string[] = [
    `systemSnapshot.oneLine=${report.systemSnapshot.oneLine}`,
    `systemSnapshot.dominantPattern=${report.systemSnapshot.dominantPattern}`,
    `systemSnapshot.mainLever=${report.systemSnapshot.mainLever}`,
    `priorityLever.title=${report.priorityLever.title}`,
    `priorityLever.whyThisFirst=${report.priorityLever.whyThisFirst}`,
    `priorityLever.firstStep=${report.priorityLever.firstStep}`,
    `priorityLever.whatToNotice=${report.priorityLever.whatToNotice}`,
    `closingMissionPage.insideYou=${report.closingMissionPage.insideYou}`,
    `closingMissionPage.aroundYou=${report.closingMissionPage.aroundYou}`,
    `closingMissionPage.nextAction=${report.closingMissionPage.nextAction}`,
  ]

  for (const mod of report.educationModules) {
    out.push(
      `educationModules[${mod.title}].plainEnglish=${mod.plainEnglish}`,
      `educationModules[${mod.title}].whyItMatters=${mod.whyItMatters}`,
      `educationModules[${mod.title}].actionBridge=${mod.actionBridge}`,
    )
  }

  for (const node of report.bodySignalMap) {
    out.push(`bodySignalMap[${node.id}].explanation=${node.explanation}`)
  }

  // The whole array is replaced when a model supplies usable tools, so each tool
  // is projected as one entry. `visualToken` is excluded: it is derived from
  // `food` and `biotic`, both of which are already here.
  for (const tool of report.foodTools) {
    out.push(
      [
        "foodTools",
        tool.food,
        tool.biotic,
        tool.mechanism,
        tool.whyForThisCustomer,
        tool.howToUse,
        tool.swap ?? "",
        tool.familyAdaptation ?? "",
      ].join("|"),
    )
  }

  return out.sort()
}

/**
 * Did any permitted Food System narrative field end up different from the
 * deterministic base?
 *
 * Under-claims by design: a model that returns text byte-identical to the
 * derived copy reads as `deterministic`. Claiming authorship we cannot see is
 * the failure that matters here; the reverse is harmless.
 */
export function claudeContributedToFoodSystem(
  base: FoodSystemReport,
  merged: FoodSystemReport,
): boolean {
  const a = foodSystemNarrativeProjection(base)
  const b = foodSystemNarrativeProjection(merged)
  return a.length !== b.length || a.some((value, i) => value !== b[i])
}
