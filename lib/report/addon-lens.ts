import type { AddonType } from "@/lib/addon-types"
import { SYSTEMS } from "@/lib/systems"
import { PATHWAY_LABEL, type BioticScoreKey } from "@/lib/report/subscores"
import type { FoodSystemLens, FoodSystemReport } from "@/lib/report/food-system-report-types"

/**
 * The deterministic lens chapter — what a purchased add-on actually produces.
 *
 * ── The two rules that shape everything here ─────────────────────────────────
 *
 * 1. THE LENS READS THE CORE, IT NEVER WRITES IT. Feed/Seed/Heal scores and the
 *    priority-pathway ranking are computed once, by buildFoodSystemReport, and
 *    this module only consumes them. Two customers with identical core answers
 *    and different add-ons must get byte-identical core scores; the lens is the
 *    only thing that differs.
 *
 * 2. NO INVENTED SCORE. There is no "Stability Score" here. Deriving a number
 *    from four questionnaire answers would make the chapter look more
 *    personalised while being less honest — nothing validates it, and once
 *    printed it reads as a measurement. The lens interprets a pattern.
 *
 * ── Why it varies on two axes ────────────────────────────────────────────────
 *
 * Every field below branches on BOTH the lens answers and the priority pathway.
 * Branching on answers alone would give every Glucose customer with a
 * mid-afternoon crash the same chapter regardless of whether their weak pathway
 * was fibre or fermented food. Branching on the pathway alone would make the
 * four lenses read as one template with the noun swapped — which is exactly the
 * failure this is written to avoid.
 */

/* ── Fixed safety wording ────────────────────────────────────────────────────
 *
 * Never generated, never paraphrased. The generation path re-derives these
 * strings after parsing Claude's response precisely so a model cannot soften
 * them. Each one is written for the specific way its lens could mislead:
 *
 *   glucose     — the single most important disclaimer in the product. A
 *                 questionnaire about energy and cravings must not be mistaken
 *                 for a blood-glucose measurement.
 *   mind        — must not diagnose, treat, or claim change in anxiety,
 *                 depression, cognition or sleep.
 *   stability   — digestive symptoms have red flags that belong with a GP, and
 *                 no timeline may be promised.
 *   performance — no guarantees, no measurable-result promises, no deadlines.
 */
export const ADDON_SAFETY: Record<AddonType, string> = {
  stability:
    "This lens is educational and based on your food-pattern answers. It is not a diagnosis " +
    "and does not identify a digestive condition. Digestive symptoms have many causes, and " +
    "changes in food can only ever be part of the picture. If you notice bleeding, unexplained " +
    "weight loss, persistent pain, or a change in your usual pattern that lasts more than a few " +
    "weeks, speak with your GP rather than adjusting food alone.",

  glucose:
    "This lens does not measure blood glucose. It reads what you reported noticing about energy, " +
    "cravings and meal timing, which are everyday observations rather than clinical readings. " +
    "Nothing here can tell you what your glucose is doing, and it is not a screening tool. If you " +
    "are concerned about blood sugar, are managing diabetes, or are taking any medication that " +
    "affects it, that belongs with your GP or diabetes team.",

  mind:
    "This lens is educational and looks only at food patterns. It does not diagnose, treat, cure, " +
    "or prevent any mental-health condition, and it makes no claim about effects on anxiety, low mood, " +
    "concentration or sleep. The relationship between diet and how people feel " +
    "is an active research area, not a settled one. If your mood, focus or sleep is affecting your " +
    "daily life, please speak with your GP or a qualified professional.",

  performance:
    "This lens is educational and describes food patterns, not a training or nutrition " +
    "prescription. It promises no particular result, and no result by any particular date — how " +
    "people respond varies, and food is one input among sleep, training load, stress and " +
    "recovery. If you have a medical condition, are pregnant, or are training at a level where " +
    "nutrition is a significant part of the picture, work with a qualified professional.",
}

/* ── Evidence: deliberately absent ──────────────────────────────────────────
 *
 * The lens chapter ships with NO citations, and that is a decision rather than
 * an omission.
 *
 * An earlier revision of this file carried two sources per lens. They could not
 * be verified: every candidate domain is blocked by this environment's egress
 * policy — pubmed.ncbi.nlm.nih.gov returns a 403 policy denial, and who.int,
 * nhs.uk, nccih.nih.gov, isappscience.org and nature.com do not connect. A
 * citation printed beside a health statement in a paid report is exactly the
 * thing that must not be published on remembered identifiers, so the block is
 * respected rather than worked around.
 *
 * Two of those pairings were also wrong on their merits, and would have had to
 * change even with full network access:
 *
 *   - Mind cited Wastyk et al. 2021, a microbiome and inflammation trial. It
 *     says nothing about mood, focus or cognition, so it cannot sit beside a
 *     gut–brain sentence.
 *   - Performance cited NHS physical-activity guidance, which is about how much
 *     to move, not about fuelling or recovery.
 *
 * WHAT THE FOLLOW-UP NEEDS. Each lens needs 2–3 sources that support its
 * specific adjacent sentence, from primary research, a recognised consensus
 * statement, or a public-health body. Candidates worth checking first — ALL
 * UNVERIFIED, none to be used until opened and read:
 *
 *   Stability   ISAPP prebiotics consensus (Gibson et al., Nat Rev Gastro
 *               Hepatol 2017) for the fibre-substrate line; an authoritative
 *               clinical source (NHS or NICE on IBS) for the red-flag wording,
 *               which is the one place this chapter points at urgent care.
 *   Glucose     A carbohydrate-quality/fibre source for the meal-composition
 *               line (Reynolds et al., Lancet 2019 was the candidate). Must NOT
 *               be a source about glucose measurement — the questionnaire does
 *               not measure it.
 *   Mind        A cautious diet-and-mental-health review, e.g. Firth et al.,
 *               "Food and mood", BMJ 2020. Microbiome evidence alone does not
 *               support a mental-health framing.
 *   Performance A sports-nutrition position stand covering fuelling and
 *               recovery, e.g. the ACSM / Academy of Nutrition and Dietetics /
 *               Dietitians of Canada joint stand on Nutrition and Athletic
 *               Performance.
 *
 * The core report's own EVIDENCE list in build-food-system-report.ts is
 * untouched: those four are already live in production and are not in scope.
 */

/* ── Per-lens metadata, reusing the site's own system definitions ─────────── */
function lensMeta(addon: AddonType) {
  const sys = SYSTEMS[addon]
  return { name: sys.productName, shortLabel: sys.label, examines: sys.focus, accent: sys.accent }
}

type Answers = Record<string, unknown>

/** Reads a single-choice answer as a string. */
function pick(answers: Answers, id: string): string {
  const v = answers[id]
  return typeof v === "string" ? v : ""
}

/** Reads a multi-choice answer as a set of values. */
function picks(answers: Answers, id: string): Set<string> {
  const v = answers[id]
  return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [])
}

export interface BuildLensInput {
  addon: AddonType
  /** The lens answers only — see lensAnswers() in lib/assessment/addon-questions.ts. */
  answers: Answers
  /** The already-built core report. Read-only here. */
  foodSystem: Pick<FoodSystemReport, "systemSnapshot" | "bioticScores">
  isFamily?: boolean
}

/* ── The four builders ───────────────────────────────────────────────────────
 *
 * Each returns the answer-dependent half of the chapter. The shared assembly
 * below adds the parts that are the same shape for every lens (metadata,
 * pathway connections, priority connection, evidence, safety).
 */

/**
 * Grammatical voice for the two foundations.
 *
 * Split into three fields rather than one because a single string cannot fill
 * every slot: an earlier version passed `whose = "you are" | "the household is"`
 * and used it in all of them, producing "something you are tracked closely yet"
 * and "most within you are control". Each slot needs its own form.
 */
interface Voice {
  /** "Your" / "Your household's" — sentence-initial possessive. */
  who: string
  /** "you are" / "the household is". */
  subjectIs: string
  /** "you have" / "the household has". */
  subjectHas: string
  /** "your" / "the household's" — mid-sentence possessive. */
  possessive: string
}

interface LensBody {
  patternSummary: string
  signals: FoodSystemLens["signals"]
  loopAdditions: FoodSystemLens["loopAdditions"]
  /** Lens-specific reason the priority pathway matters here. */
  priorityWhy: string
  /** One line per pathway, in the lens's own terms. */
  pathwayCopy: Record<BioticScoreKey, string>
}

function stabilityBody(a: Answers, priority: BioticScoreKey, v: Voice): LensBody {
  const rhythm = pick(a, "lens1")
  const timing = pick(a, "lens2")
  const have = picks(a, "lens3")
  const mealTiming = pick(a, "lens4")

  const rhythmLine =
    rhythm === "predictable"
      ? `${v.who} answers describe digestion that is already predictable day to day, which is the harder half of this to build.`
      : rhythm === "mostly"
      ? `${v.who} answers describe digestion that is mostly predictable, with off days that stand out against the pattern.`
      : rhythm === "unpredictable"
      ? `${v.who} answers describe digestion that varies a lot, so the useful first move is a steadier baseline rather than a new food.`
      : `${v.who} answers suggest this has not been something ${v.subjectHas} tracked closely yet, which makes noticing the pattern the first step.`

  const timingLine =
    timing === "after-meals"
      ? "Discomfort clustering soon after eating points at meal composition and pace rather than at the day as a whole."
      : timing === "later"
      ? "Discomfort arriving later in the day is often easier to connect to the shape of the whole day than to one meal."
      : timing === "stress-linked"
      ? "Discomfort tracking busy days is a rhythm signal: what changes on those days is usually timing and pace, not ingredients."
      : timing === "none"
      ? "With little discomfort reported, this lens is about protecting what already works."
      : "Without a clear timing pattern, the most useful thing is a few weeks of noticing when it does and does not happen."

  const signals: FoodSystemLens["signals"] = [
    {
      label: "Timing relative to meals",
      whatToNotice:
        "Whether discomfort tends to follow eating within an hour or two, or sits independently of meals. Note it for a fortnight before drawing any conclusion.",
    },
    {
      label: "Day-to-day predictability",
      whatToNotice:
        "Whether the pattern is steady across a week or swings between good and bad days. Consistency is easier to act on than intensity.",
    },
  ]
  if (timing === "stress-linked") {
    signals.push({
      label: "Busy days versus calm days",
      whatToNotice:
        "Whether the difference on busy days is what you eat, or when and how quickly you eat it. They call for different changes.",
    })
  }

  const loopAdditions: FoodSystemLens["loopAdditions"] = []
  if (mealTiming === "rarely" || mealTiming === "weekly" || mealTiming === "unsure") {
    loopAdditions.push({
      week: 1,
      action: `Anchor one meal to roughly the same time each day — the one ${v.subjectIs} most in control of. Rhythm is the lever this lens keeps pointing at.`,
    })
  } else {
    loopAdditions.push({
      week: 1,
      action: `Keep the meal timing that is already steady, and note which days it slips. Protecting it is worth more here than adding anything new.`,
    })
  }
  if (!have.has("fermented")) {
    loopAdditions.push({
      week: 2,
      action: "Add one small serving of a live fermented food to a meal that already happens, and keep it there rather than rotating it.",
    })
  } else {
    loopAdditions.push({
      week: 2,
      action: "Vary which fermented food appears rather than increasing how much — range tends to matter more than volume.",
    })
  }
  loopAdditions.push({
    week: 4,
    action: "Review a fortnight of notes and keep only the change that survived a bad week.",
  })

  return {
    patternSummary: `${rhythmLine} ${timingLine}`,
    signals,
    loopAdditions,
    priorityWhy:
      priority === "probiotics"
        ? "Live-culture exposure is the thinnest part of the food system underneath this, so it is where a change is most likely to show up in comfort and regularity."
        : priority === "prebiotics"
        ? "Fibre variety is the thinnest part of the food system underneath this, and it is the substrate the whole pattern runs on."
        : "Rhythm and recovery are the thinnest part of the food system underneath this, which is the same lever this lens keeps returning to.",
    pathwayCopy: {
      prebiotics: "Fibre variety is the raw material digestion works with; range tends to matter more than any single high-fibre food.",
      probiotics: "Live cultures add microbial exposure rather than only feeding what is already present.",
      postbiotics: "Meal rhythm and recovery shape how the system handles what it is given, which is why timing shows up throughout this lens.",
    },
  }
}

function glucoseBody(a: Answers, priority: BioticScoreKey, v: Voice): LensBody {
  const energy = pick(a, "lens1")
  const breakfast = pick(a, "lens2")
  const craving = pick(a, "lens3")
  const alongside = picks(a, "lens4")

  const energyLine =
    energy === "steady"
      ? `${v.who} answers describe energy that stays fairly level after meals, which is the pattern this lens exists to help protect.`
      : energy === "dip"
      ? `${v.who} answers describe a noticeable dip after eating — a pattern worth watching alongside what the meal contained.`
      : energy === "lift-then-dip"
      ? `${v.who} answers describe a lift followed by a dip, which is the pattern most often linked to how a meal is put together rather than to its size.`
      : energy === "varies"
      ? `${v.who} answers describe energy that depends on the meal, which is useful: it suggests composition, not the act of eating, is doing the work.`
      : `${v.who} answers suggest this has not been something ${v.subjectHas} watched yet, so the first step is simply noticing.`

  const breakfastLine =
    breakfast === "carb-led"
      ? "Breakfast is currently carbohydrate-led, which is the most repeatable place to try a change."
      : breakfast === "skipped"
      ? "Breakfast is usually skipped, so the first meal of the day is the one to build rather than adjust."
      : breakfast === "protein-led"
      ? "Breakfast is already protein-led, so the useful work is later in the day rather than at the start of it."
      : "Breakfast already mixes carbohydrate with protein or fat, which is the shape most of this lens's advice would otherwise be aiming at."

  const signals: FoodSystemLens["signals"] = [
    {
      label: "The two hours after a main meal",
      whatToNotice:
        "Whether energy holds, dips, or lifts and then falls. This is an observation about how you feel, not a measurement of anything.",
    },
    {
      label:
        craving === "mid-morning"
          ? "Mid-morning cravings"
          : craving === "mid-afternoon"
          ? "Mid-afternoon cravings"
          : craving === "evening"
          ? "Evening cravings"
          : "When cravings turn up",
      whatToNotice:
        "Whether the timing shifts when the preceding meal changes shape. Craving timing often tracks meal spacing rather than willpower.",
    },
  ]

  const loopAdditions: FoodSystemLens["loopAdditions"] = []
  if (breakfast === "carb-led" || breakfast === "skipped") {
    loopAdditions.push({
      week: 1,
      action:
        breakfast === "skipped"
          ? "Build one repeatable breakfast that includes a protein, and keep the ingredients in stock so a busy morning does not remove it."
          : "Add a protein or a healthy fat to the breakfast already eaten, without changing anything else about it.",
    })
  } else {
    loopAdditions.push({
      week: 1,
      action: "Keep breakfast as it is and apply the same shape — carbohydrate plus protein or fat — to the meal before the usual craving window.",
    })
  }
  if (!alongside.has("veg") || alongside.has("alone")) {
    loopAdditions.push({
      week: 2,
      action: "Put vegetables or salad alongside the carbohydrate at one main meal a day, chosen from what is already bought.",
    })
  } else {
    loopAdditions.push({
      week: 2,
      action: "Widen the range of vegetables that appear alongside carbohydrates rather than increasing the amount.",
    })
  }
  loopAdditions.push({
    week: 3,
    action: `Notice whether the ${craving === "no-pattern" ? "craving" : craving.replace("-", " ")} window moves after two weeks of the change above.`,
  })

  return {
    patternSummary: `${energyLine} ${breakfastLine}`,
    signals,
    loopAdditions,
    priorityWhy:
      priority === "prebiotics"
        ? "Fibre is the thinnest pathway underneath this lens, and fibre alongside carbohydrate is the change most often linked to how a meal is experienced."
        : priority === "probiotics"
        ? "Live-culture exposure is the thinnest pathway underneath this lens; it works on the same system from a different direction than meal composition."
        : "Rhythm is the thinnest pathway underneath this lens, and meal spacing is exactly what craving timing tends to track.",
    pathwayCopy: {
      prebiotics: "Fibre alongside a carbohydrate changes how the meal is experienced, which is the practical centre of this lens.",
      probiotics: "Live cultures are a different lever on the same system, and are worth keeping steady rather than adding in bursts.",
      postbiotics: "Meal rhythm and spacing shape when energy and cravings turn up, independently of what is on the plate.",
    },
  }
}

function mindBody(a: Answers, priority: BioticScoreKey, v: Voice): LensBody {
  const rhythm = pick(a, "lens1")
  const focusDip = pick(a, "lens2")
  const have = picks(a, "lens3")
  const lateMeal = pick(a, "lens4")

  const rhythmLine =
    rhythm === "steady"
      ? `${v.who} answers describe an eating rhythm that holds up on a busy day, which is the part of this pattern most within ${v.possessive} control.`
      : rhythm === "delayed"
      ? `${v.who} answers describe meals that slip later under pressure but still happen — the rhythm bends rather than breaks.`
      : rhythm === "skipped"
      ? `${v.who} answers describe meals being skipped or replaced by snacks on busy days, which is the clearest food-side pattern in this lens.`
      : `${v.who} answers describe a rhythm that varies a lot, so the useful first step is noticing which days it holds.`

  const focusLine =
    focusDip === "no-pattern"
      ? "With no consistent time for focus dropping, a few weeks of noting when it happens is more informative than any change made now."
      : `Focus most often dips ${focusDip.replace("-", " ")}, which gives a specific window to watch against the meal before it.`

  const signals: FoodSystemLens["signals"] = [
    {
      label: "The meal before the dip",
      whatToNotice:
        "What was eaten, and when, before the time of day focus usually drops. This is about noticing a pattern, not about judging a meal.",
    },
    {
      label: "Busy days versus calm days",
      whatToNotice:
        "Whether the eating rhythm changes when the day gets full. That difference is usually the most actionable thing in this lens.",
    },
  ]
  if (lateMeal === "daily" || lateMeal === "often") {
    signals.push({
      label: "How late the last meal lands",
      whatToNotice:
        "Whether the evening meal sits close to bedtime, and whether that varies with how the next morning feels. Notice it; do not expect it to explain everything.",
    })
  }

  const loopAdditions: FoodSystemLens["loopAdditions"] = []
  loopAdditions.push(
    rhythm === "skipped" || rhythm === "varies"
      ? {
          week: 1,
          action: "Protect one meal on the busiest day of the week — the same meal each week — rather than trying to hold the whole day's rhythm.",
        }
      : {
          week: 1,
          action: "Keep the rhythm that already survives a busy day, and note what makes it slip when it does.",
        },
  )
  if (!have.has("fermented") && !have.has("oily-fish")) {
    loopAdditions.push({
      week: 2,
      action: "Add one of either a live fermented food or oily fish to a meal that already happens, once or twice in the week.",
    })
  } else {
    loopAdditions.push({
      week: 2,
      action: "Keep the fermented food or oily fish that already appears, and rotate which one rather than adding more.",
    })
  }
  loopAdditions.push({
    week: 4,
    action: "Review what held through an ordinary week, and keep only that. What survives a bad week is the part that has actually changed.",
  })

  return {
    patternSummary: `${rhythmLine} ${focusLine}`,
    signals,
    loopAdditions,
    priorityWhy:
      priority === "probiotics"
        ? "Live-culture exposure is the thinnest pathway underneath this lens, and fermented foods are the most studied dietary factor in gut–brain research — which is an area of association, not established cause."
        : priority === "prebiotics"
        ? "Fibre variety is the thinnest pathway underneath this lens, and it is the substrate the rest of the system depends on."
        : "Rhythm and recovery are the thinnest pathway underneath this lens, which is the same thing the busy-day pattern keeps pointing at.",
    pathwayCopy: {
      prebiotics: "Plant variety is the base the rest runs on, and it is the least dependent on any single ingredient.",
      probiotics: "Fermented foods are the most studied dietary factor here, in research that describes associations rather than effects you should expect.",
      postbiotics: "Meal rhythm and rest are the part of this pattern that food can genuinely support, which is why timing appears in every action above.",
    },
  }
}

function performanceBody(a: Answers, priority: BioticScoreKey, v: Voice): LensBody {
  const fuelling = pick(a, "lens1")
  const recovery = pick(a, "lens2")
  const meals = picks(a, "lens3")
  const sleepRoutine = pick(a, "lens4")

  const fuellingLine =
    fuelling === "both"
      ? `${v.who} answers describe eating on both sides of activity, which is the pattern this lens would otherwise be building toward.`
      : fuelling === "after-only"
      ? `${v.who} answers describe eating mainly after activity, so the question worth exploring is what happens beforehand.`
      : fuelling === "before-only"
      ? `${v.who} answers describe eating mainly beforehand, which leaves the hours after activity as the gap.`
      : `${v.who} answers describe fitting food in where it lands, so timing rather than content is the first thing to look at.`

  const recoveryLine =
    recovery === "recovered"
      ? "Recovery after a demanding day is reported as good, which is worth protecting rather than optimising."
      : recovery === "flat"
      ? "Feeling flat but functional the day after is a pattern worth watching against sleep and the evening meal."
      : recovery === "depleted"
      ? "Feeling noticeably depleted the day after is the clearest signal in this lens, and it points at rest as much as at food."
      : "Recovery that varies a lot is most usefully tracked across a few weeks before changing anything."

  const signals: FoodSystemLens["signals"] = [
    {
      label: "The day after a demanding day",
      whatToNotice:
        "Whether the following day feels normal, flat or depleted, and what the evening before looked like. Track it over weeks, not once.",
    },
    {
      label: "The gap around activity",
      whatToNotice:
        "How long sits between activity and the meal on either side of it. Timing is usually easier to change than content.",
    },
  ]
  if (sleepRoutine === "rarely" || sleepRoutine === "weekly") {
    signals.push({
      label: "Consistency of wind-down",
      whatToNotice:
        "Whether sleep and wind-down land at similar times across the week. Recovery depends on rest as much as on food.",
    })
  }

  const loopAdditions: FoodSystemLens["loopAdditions"] = []
  loopAdditions.push(
    fuelling === "both"
      ? { week: 1, action: "Keep the pattern of eating on both sides of activity, and note the days it slips rather than adding anything." }
      : {
          week: 1,
          action:
            fuelling === "after-only"
              ? "Add something small and familiar before activity on two days this week, chosen from food already in the house."
              : "Bring one meal into the couple of hours after activity on two days this week.",
        },
  )
  if (!meals.has("protein")) {
    loopAdditions.push({
      week: 2,
      action: "Make sure one clear protein source appears at the main meal most days, without changing the rest of the plate.",
    })
  } else if (!meals.has("colour")) {
    loopAdditions.push({
      week: 2,
      action: "Add colour to the main meal most days — the protein is already there, so this is the part that is missing.",
    })
  } else {
    loopAdditions.push({
      week: 2,
      action: "Widen the range of plants across the week rather than changing the shape of the plate, which is already sound.",
    })
  }
  loopAdditions.push({
    week: 4,
    action: "Look back over the month and keep the one change that held on the busiest week.",
  })

  return {
    patternSummary: `${fuellingLine} ${recoveryLine}`,
    signals,
    loopAdditions,
    priorityWhy:
      priority === "postbiotics"
        ? "Rhythm and recovery are the thinnest pathway underneath this lens, and they are what the day-after pattern keeps pointing at."
        : priority === "prebiotics"
        ? "Fibre variety is the thinnest pathway underneath this lens, and it is what the rest of the plate is built around."
        : "Live-culture exposure is the thinnest pathway underneath this lens, and it is the one least affected by training load.",
    pathwayCopy: {
      prebiotics: "Plant range across the week is the part of the plate most often thin when protein is the focus.",
      probiotics: "Live cultures are a small, steady addition rather than something to load around activity.",
      postbiotics: "Rhythm, rest and recovery are where food meets everything else this lens touches.",
    },
  }
}

const BUILDERS: Record<AddonType, (a: Answers, p: BioticScoreKey, v: Voice) => LensBody> = {
  stability: stabilityBody,
  glucose: glucoseBody,
  mind: mindBody,
  performance: performanceBody,
}

/**
 * Build the lens chapter.
 *
 * Reads the core report's pathway ranking; never modifies it. Returns a fully
 * formed chapter for any known add-on, so the fallback path is never a
 * placeholder.
 */
/**
 * Attach a lens to a report that is entitled to one but does not have it.
 *
 * Mirrors `ensureFoodSystem`, and exists for the same reason: the reuse path
 * returns a stored `report_json` verbatim, so a report generated before the
 * lens shipped — or one whose generation predated the customer's entitlement
 * being readable — would never gain a chapter the customer paid for. Derived
 * only; no regeneration, so a retry costs nothing.
 *
 * A report that already has a lens keeps it. No add-on means no change at all,
 * which is what keeps legacy and no-add-on reports byte-identical.
 */
export function ensureAddonLens<T extends { foodSystem?: FoodSystemReport }>(
  report: T,
  input: { addon: AddonType | null; answers: Answers; isFamily?: boolean },
): T {
  if (!input.addon) return report
  if (!report.foodSystem) return report
  if (report.foodSystem.lens) return report

  return {
    ...report,
    foodSystem: {
      ...report.foodSystem,
      lens: buildAddonLens({
        addon: input.addon,
        answers: input.answers,
        foodSystem: report.foodSystem,
        isFamily: input.isFamily,
      }),
    },
  }
}

/**
 * Overlay generated prose onto a derived lens.
 *
 * The model may rewrite only three things — the pattern summary, the pathway
 * explanations and what to notice for each signal. Everything else is taken
 * from the derived chapter, whatever the response says:
 *
 *   key, name, shortLabel, examines   lens identity — a model renaming the
 *                                     purchased lens is a billing problem
 *   priorityConnection                derived from the core score ranking
 *   loopAdditions                     the actions, derived from answers
 *   safetyNote                        fixed, per-lens, non-negotiable
 *   evidenceNotes                     never model-supplied
 *   accent                            a brand token, not a colour to invent
 *
 * Signals are matched by label and count is capped by the derived list, so a
 * model cannot add a fifth signal or drop one.
 */
export function mergeGeneratedLens(base: FoodSystemLens, generated: unknown): FoodSystemLens {
  if (!generated || typeof generated !== "object") return base
  const g = generated as {
    patternSummary?: unknown
    pathwayConnections?: Array<{ pathway?: unknown; connection?: unknown }>
    signals?: Array<{ label?: unknown; whatToNotice?: unknown }>
  }

  const text = (v: unknown, min = 20): string | null =>
    typeof v === "string" && v.trim().length >= min ? v.trim() : null

  return {
    ...base,
    patternSummary: text(g.patternSummary, 40) ?? base.patternSummary,
    pathwayConnections: base.pathwayConnections.map((pc) => {
      const gen = Array.isArray(g.pathwayConnections)
        ? g.pathwayConnections.find((x) => x?.pathway === pc.pathway)
        : undefined
      return { ...pc, connection: text(gen?.connection) ?? pc.connection }
    }),
    signals: base.signals.map((s) => {
      const gen = Array.isArray(g.signals) ? g.signals.find((x) => x?.label === s.label) : undefined
      return { ...s, whatToNotice: text(gen?.whatToNotice) ?? s.whatToNotice }
    }),
  }
}

export function buildAddonLens(input: BuildLensInput): FoodSystemLens {
  const { addon, answers, foodSystem, isFamily = false } = input
  const priority = foodSystem.systemSnapshot.priorityPathway

  const voice: Voice = isFamily
    ? { who: "Your household's", subjectIs: "the household is", subjectHas: "the household has", possessive: "the household's" }
    : { who: "Your", subjectIs: "you are", subjectHas: "you have", possessive: "your" }

  const body = BUILDERS[addon](answers, priority, voice)
  const meta = lensMeta(addon)

  const pathways: BioticScoreKey[] = ["prebiotics", "probiotics", "postbiotics"]

  return {
    key: addon,
    name: meta.name,
    shortLabel: meta.shortLabel,
    examines: meta.examines,
    patternSummary: body.patternSummary,
    pathwayConnections: pathways.map((p) => ({ pathway: p, connection: body.pathwayCopy[p] })),
    signals: body.signals.slice(0, 3),
    priorityConnection: {
      // Derived from the core report, not from the lens answers — the lens
      // cannot nominate its own priority.
      pathway: priority,
      why: `${PATHWAY_LABEL[priority]} is where this lens meets your Food System score. ${body.priorityWhy}`,
    },
    loopAdditions: body.loopAdditions.slice(0, 3),
    safetyNote: ADDON_SAFETY[addon],
    accent: meta.accent,
  }
}
