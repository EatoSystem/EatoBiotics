import type { FssDomain } from "@/lib/fss/questions/types"
import type { FoodSystemScore } from "@/lib/fss/engine/score"

/* ════════════════════════════════════════════════════════════════════════
   The reviewed copy for the five candidate domains.

   ── Why this is a data module and not strings in a component ──────────────

   Because the renderer must not be able to invent a customer-visible sentence.
   That is the rule the canonical Report renderer already runs under, and it
   exists because a component that writes its own prose is the place unreviewed
   claims appear — nobody reviews a template literal.

   ── The sentence-level rules every line here obeys ────────────────────────

   From docs/fss/FSS_V1_CLAIMS_BOUNDARY.md §5. Each sentence makes exactly ONE
   move and never blurs two:

     measured food behaviour      "Your answers described…"
     self-reported observation    "You reported…"
     scientific education          impersonal present
     biological inference          NOT AVAILABLE

   So: no sentence here says what a person's microbiome is doing, none predicts
   an outcome, none attaches a timeframe, and none promises that a change will
   raise a score. "What could I do" describes an action, not its result.

   ── And the three prohibited equivalences ─────────────────────────────────

   Fibre is not called a prebiotic. A fermented food is not called a probiotic
   and is never said to contain live microorganisms. No food is called a
   postbiotic. Those are the strict ISAPP definitions the product adopted, and
   this file is a place they would quietly come undone.
   ════════════════════════════════════════════════════════════════════════ */

export interface DomainPresentation {
  readonly label: string
  readonly color: string
  /** Where am I — a description of the reported behaviour, never a verdict. */
  readonly whereYouAre: (score: number) => string
  /** The same question, when the domain could not be characterised. */
  readonly whereYouAreUnknown: string
  readonly whatItMeans: string
  readonly whyItMatters: string
  readonly whatYouCouldDo: string
  /** The headline when this domain is the priority. */
  readonly priorityHeadline: string
}

/** Shared band wording, so five domains describe a number the same way. */
function band(score: number, high: string, middle: string, low: string): string {
  if (score >= 67) return high
  if (score >= 34) return middle
  return low
}

export const DOMAIN_PRESENTATION: Record<FssDomain, DomainPresentation> = {
  diversity: {
    label: "Diversity",
    color: "var(--icon-green)",
    whereYouAre: (s) =>
      band(
        s,
        "Your answers described a wide range of plant foods across a typical week.",
        "Your answers described a moderate range of plant foods, returning to familiar ones.",
        "Your answers described a narrow range of plant foods across a typical week.",
      ),
    whereYouAreUnknown: "Not enough answered to describe your plant range.",
    whatItMeans:
      "How many different plant foods reach you, and how often that set changes — the range rather than the amount.",
    whyItMatters:
      "A wider range of plants is associated with a wider range of gut microbes, and diversity is one of the more consistent findings in microbiome research.",
    whatYouCouldDo:
      "Add plant foods you do not currently eat regularly, rather than more of the ones you already eat. Herbs, seeds and tinned pulses all count.",
    priorityHeadline: "Widen the range, not the amount",
  },

  plantsAndFibre: {
    label: "Plants & Fibre",
    color: "var(--icon-lime)",
    whereYouAre: (s) =>
      band(
        s,
        "Your answers described fibre-rich plant food arriving consistently.",
        "Your answers described fibre-rich plant food arriving some days but not others.",
        "Your answers described little fibre-rich plant food in a typical week.",
      ),
    whereYouAreUnknown: "Not enough answered to describe your fibre intake.",
    whatItMeans:
      "How much fibre-rich whole plant food you eat — the quantity, as distinct from the range.",
    whyItMatters:
      "Fibre is the substrate your gut microbes ferment. It is not itself a prebiotic — a prebiotic is a substrate selectively used with a demonstrated benefit — but it is the raw material the system runs on.",
    whatYouCouldDo:
      "Anchor one fibre source to a meal you already eat: oats at breakfast, pulses in one dinner, a handful of nuts with lunch.",
    priorityHeadline: "Give the system more to work with",
  },

  fermentedFoods: {
    label: "Fermented Foods",
    color: "var(--icon-teal)",
    whereYouAre: (s) =>
      band(
        s,
        "Your answers described fermented foods appearing regularly and by choice.",
        "Your answers described fermented foods appearing sometimes, without a pattern.",
        "Your answers described fermented foods rarely appearing.",
      ),
    whereYouAreUnknown: "Not enough answered to describe how often fermented foods appear.",
    whatItMeans:
      "How often foods transformed by fermentation appear in your week — yoghurt, kefir, kimchi, sauerkraut, miso.",
    whyItMatters:
      "Fermentation is the one pathway that brings microbial material in from outside rather than only feeding what is already there. Whether live microorganisms survive to be eaten depends on the food and how it was made, which is why the label matters.",
    whatYouCouldDo:
      "A small daily amount beats an occasional large one. A spoonful beside a meal you already eat is enough to change the pattern.",
    priorityHeadline: "Make it regular rather than large",
  },

  foodQuality: {
    label: "Food Quality",
    color: "var(--icon-yellow)",
    whereYouAre: (s) =>
      band(
        s,
        "Your answers described most of your food starting from whole ingredients.",
        "Your answers described a mix of home-prepared and ready-made food.",
        "Your answers described mostly ready-made food in a typical week.",
      ),
    whereYouAreUnknown: "Not enough answered to describe how your food is prepared.",
    whatItMeans:
      "How much of what you eat is prepared from whole ingredients rather than arriving ready-made.",
    whyItMatters:
      "This measures what displaces whole food rather than what feeds microbes — which is why it sits beside the plant domains rather than inside them.",
    whatYouCouldDo:
      "Change the meal that is easiest to change, not the hardest. One reliably home-prepared meal beats an intention to cook everything.",
    priorityHeadline: "Start from ingredients more often",
  },

  mealRhythm: {
    label: "Meal Rhythm",
    color: "var(--icon-orange)",
    whereYouAre: (s) =>
      band(
        s,
        "Your answers described a steady rhythm across the week.",
        "Your answers described a rhythm that holds some days and slips on others.",
        "Your answers described an irregular rhythm, with meals often skipped, late or rushed.",
      ),
    whereYouAreUnknown: "Not enough answered to describe your eating rhythm.",
    whatItMeans: "When you eat, how regularly, and what a typical main meal is made of.",
    whyItMatters:
      "The gut keeps a daily rhythm, and regular meal timing is associated with better-anticipated digestion. This is a pattern in what you reported — it is not a measurement of what your microbes produce.",
    whatYouCouldDo:
      "Protect the one meal that slips most often. Rhythm is easier to rebuild from a fixed point than from a schedule.",
    priorityHeadline: "Protect the meal that slips",
  },
}

export interface Priority {
  readonly domain: FssDomain
  readonly why: string
}

/**
 * One to three priorities — never forty.
 *
 * ── How they are chosen, and what is deliberately absent ──────────────────
 *
 * The lowest-scoring domains, and nothing cleverer. Specifically there is NO
 * "close enough" tolerance: a tolerance is a number nobody chose, and the
 * existing result component records that same refusal for the same reason.
 *
 * Ties are broken by the domain order in the scored set, which is stable — so
 * the same answers always produce the same priorities. A priority that moved
 * between two identical walks would be worse than an arbitrary one.
 *
 * `insufficient` domains are excluded: a domain we could not characterise
 * cannot be the thing we are most confident about.
 *
 * The `why` names the reported behaviour, never a Biotic. "Your biggest
 * opportunity is Postbiotics" is a personal Biotic state in words, which
 * POSTBIOTICS_INFERENCE_BOUNDARY prohibits — the same correction made across
 * every other surface in Phase 1.
 */
export function priorityFor(score: FoodSystemScore): readonly Priority[] {
  const scored = score.domains
    .filter((d): d is Extract<typeof d, { state: "scored" }> => d.state === "scored")
    .slice()
    .sort((a, b) => a.score - b.score)

  if (scored.length === 0) return []

  const lowest = scored[0].score
  const chosen = scored.filter((d) => d.score === lowest).slice(0, 3)
  const picked = chosen.length > 0 ? chosen : scored.slice(0, 1)

  return picked.slice(0, 3).map((d) => ({
    domain: d.domain,
    why: `Of the five, this is where your answers described the least — which usually makes it the most direct place to start rather than the most important one.`,
  }))
}
