/**
 * Food swaps for the free full report, keyed by pathway.
 *
 * ── The bug this fixes ───────────────────────────────────────────────────────
 *
 * These swap sets are authored under the five legacy pillar names, but the
 * report's deep dives are keyed feed | seed | heal (PILLAR_DEEP_DIVES in
 * lib/assessment-report.ts). `buildFoodSwaps` looked the deep-dive key up in a
 * legacy-keyed map, so the lookup NEVER matched and the `?? FOOD_SWAPS.feeding`
 * fallback fired on every single request.
 *
 * That meant every customer saw the same five "feeding" swaps regardless of
 * which pathway was actually weakest, and 20 of the 25 authored swaps were
 * unreachable. Not an edge case — 100% of reports.
 *
 * Rather than discard the legacy sets, each pathway now maps to the sets that
 * genuinely belong to it, so all 25 stay in play:
 *
 *   feed  (prebiotics)  <- diversity + feeding      (plant variety, fibre)
 *   seed  (probiotics)  <- adding                   (live foods)
 *   heal  (postbiotics) <- consistency + feeling    (rhythm, recovery)
 *
 * This is the same root cause as the /api/generate-report "undefined/100" bug
 * and the paid PDF's unlabelled score rows: code keyed on pillars the You
 * assessment stopped producing. See lib/report/subscores.ts.
 */

export interface FoodSwap {
  out: string
  in: string
  reason: string
}

type LegacySwapSet = "diversity" | "feeding" | "adding" | "consistency" | "feeling"

/** Accepts either the canonical pathway names or the feed/seed/heal aliases. */
export type SwapPathway =
  | "feed"
  | "seed"
  | "heal"
  | "prebiotics"
  | "probiotics"
  | "postbiotics"

const FOOD_SWAPS: Record<LegacySwapSet, FoodSwap[]> = {
  diversity: [
    { out: "Same salad greens every week", in: "Rotate 3+ different leafy greens", reason: "Each leaf variety feeds different microbial strains — variety is the mechanism, not just the outcome." },
    { out: "White rice as a staple", in: "Mixed grains (farro, barley, or quinoa)", reason: "Swapping white rice for diverse whole grains increases the fibre types reaching your colon bacteria." },
    { out: "Standard crisps or crackers", in: "Seedy crackers (flax, sesame, poppy)", reason: "Seeds are compact plant diversity — each type carries a different fibre and polyphenol profile." },
    { out: "Bottled juice with your meal", in: "Whole fruit or a fruit + seed combo", reason: "Juice removes the fibre matrix. Whole fruit delivers both the sugar and the prebiotic fibre together." },
    { out: "Single-veg side dishes", in: "Roasted 3-veg medleys", reason: "Mixing vegetables at every meal is the simplest way to expand your weekly plant count." },
  ],
  feeding: [
    { out: "White bread at breakfast", in: "Whole grain rye or seeded sourdough", reason: "Rye arabinoxylans outperform wheat fibre in studies measuring microbial diversity gain." },
    { out: "Pasta as a quick dinner base", in: "Lentil pasta or wholewheat pasta", reason: "Lentil pasta adds 8g+ protein and soluble fibre per serving — the substrate your gut bacteria need." },
    { out: "Crisps or crackers as a snack", in: "Hummus with raw vegetable sticks", reason: "Chickpeas deliver both protein and prebiotic fibre; raw veg preserves the fibre structure." },
    { out: "Instant porridge sachets", in: "Rolled or steel-cut oats", reason: "Instant oats are pre-digested — you lose the intact beta-glucan that drives Bifidobacterium growth." },
    { out: "Skipping the side vegetable", in: "Frozen veg added to every main meal", reason: "Frozen veg is nutritionally equivalent to fresh. Removing the prep barrier is the single biggest fibre lever." },
  ],
  adding: [
    { out: "Flavoured yoghurt", in: "Plain live yoghurt + fresh fruit", reason: "Flavoured yoghurts typically have added sugar and lower live bacteria counts. Plain, full-fat live yoghurt delivers the cultures." },
    { out: "Standard table salt on food", in: "Miso paste in soups and dressings", reason: "Miso adds umami and live cultures. Replacing salt with miso is the simplest daily fermented food upgrade." },
    { out: "Vinegar-based pickles (pasteurised)", in: "Lacto-fermented pickles or sauerkraut", reason: "Vinegar pickles have no live cultures. Lacto-fermented versions provide hundreds of millions of bacteria per serving." },
    { out: "Fizzy soft drink with meals", in: "Kombucha (low sugar, <5g/100ml)", reason: "Kombucha provides organic acids and live cultures. Choose unflavoured or low-sugar varieties." },
    { out: "Cheese spread or processed cheese", in: "Kefir-based dressings or dips", reason: "Kefir contains 30+ live strains. Blending with herbs makes a creamy, probiotic-rich alternative." },
  ],
  consistency: [
    { out: "Skipping breakfast when busy", in: "Overnight oats prepared the night before", reason: "Overnight oats take 2 minutes to prepare. Removing the morning decision barrier protects your gut's feeding rhythm." },
    { out: "Takeaway when no plan exists", in: "A default 'fallback meal' from pantry staples", reason: "Having one simple pantry meal (e.g. lentil soup from canned lentils) removes the decision that breaks consistency." },
    { out: "Eating at different times each day", in: "Anchored meal windows (30-min tolerance)", reason: "Even rough consistency in meal timing synchronises your gut microbiome's circadian rhythm." },
    { out: "Grazing and snacking between meals", in: "Planned snack at 10:30 and 3:30", reason: "Scheduled snacks reduce hunger-driven food decisions and give gut bacteria predictable substrate timing." },
    { out: "Rushed meals at the desk", in: "One sit-down, screen-free meal per day", reason: "Distraction-free eating activates the parasympathetic nervous system, improving digestive enzyme output." },
  ],
  feeling: [
    { out: "Eating straight after exercise", in: "15-minute rest window before eating", reason: "Exercise redirects blood flow away from the gut. A short rest window allows motility to normalise before a meal." },
    { out: "Large evening meal as the biggest meal", in: "Larger lunch, lighter dinner", reason: "Digestive enzyme output peaks midday. A lighter evening meal works with your gut's circadian schedule." },
    { out: "Coffee on an empty stomach", in: "Coffee after a fibre-rich breakfast", reason: "Coffee stimulates gastric acid production. Eating first buffers this and reduces post-coffee digestive discomfort." },
    { out: "Eating quickly under stress", in: "Three deep breaths before eating", reason: "The gut-brain axis is directly affected by stress state. Even a brief pause activates rest-and-digest mode." },
    { out: "High-FODMAP foods during flares", in: "Low-FODMAP alternatives during sensitive periods", reason: "Onion, garlic, and wheat ferment rapidly in the gut. Temporary reduction during flares identifies your personal threshold." },
  ],
}

/** Which authored sets belong to each pathway. Every set must appear here. */
export const FOOD_SWAP_KEYS_FOR_PATHWAY: Record<"feed" | "seed" | "heal", LegacySwapSet[]> = {
  feed: ["diversity", "feeding"],
  seed: ["adding"],
  heal: ["consistency", "feeling"],
}

function toAlias(pathway: SwapPathway): "feed" | "seed" | "heal" {
  if (pathway === "prebiotics") return "feed"
  if (pathway === "probiotics") return "seed"
  if (pathway === "postbiotics") return "heal"
  return pathway
}

/** All swaps for a pathway, in authored order. Callers slice as needed. */
export function swapsForPathway(pathway: SwapPathway): FoodSwap[] {
  return FOOD_SWAP_KEYS_FOR_PATHWAY[toAlias(pathway)].flatMap((key) => FOOD_SWAPS[key])
}
