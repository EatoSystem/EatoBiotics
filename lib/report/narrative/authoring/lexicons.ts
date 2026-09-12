/**
 * The token sets the validator works from — Phase 4A-S3.
 *
 * ══ WHAT THESE ARE, AND THE CLAIM THEY DO NOT SUPPORT ═══════════════════════
 *
 * A REJECTION corpus. They are how a rewrite is refused, never how one is
 * certified. No list here proves two sentences mean the same thing, and
 * nothing downstream may treat a clean pass as evidence of equivalence.
 *
 * That asymmetry is what makes incompleteness survivable. A concept nobody
 * thought to list degrades to "an awkward sentence ships" — never "a new claim
 * ships" — because the sentence being rewritten was already reviewed and
 * approved, and the fallback is that approved sentence.
 */

/** Words that assert one thing made another happen. */
export const CAUSAL_TOKENS: readonly string[] = [
  "because", "cause", "causes", "caused", "causing", "due to", "leads to",
  "leading to", "results in", "resulting in", "result of", "explains",
  "explained by", "driven by", "drives", "linked to", "linked with",
  "associated with", "affects", "affecting", "impacts", "impacting",
  "influences", "influencing", "triggers", "triggered by", "so that",
  "therefore", "thus", "hence", "which is why", "reason",
]

/** Words that tell somebody to do something. */
export const RECOMMENDATION_TOKENS: readonly string[] = [
  "you should", "you could", "you might want", "we recommend", "we suggest",
  "recommend", "recommended", "suggestion", "advice", "advise", "try to",
  "make sure", "be sure", "aim to", "consider", "start by", "focus on",
  "remember to", "it helps to", "it's worth", "worth trying", "ideally",
  "instead of", "rather than trying",
]

/** Clinical and biological vocabulary, keyed to the adjudicated inferences. */
export const MEDICAL_TOKENS: readonly string[] = [
  "diagnos", "condition", "symptom", "syndrome", "disorder", "disease",
  "deficien", "inflamm", "immune", "insulin", "glucose", "blood sugar",
  "metabolic", "metabolism", "hormone", "hormonal", "endocrine", "cortisol",
  "biomarker", "intoleran", "allergic", "clinical", "medical", "treat",
  "treatment", "therapy", "therapeutic", "cure", "heal", "healing", "remedy",
  "dose", "dosage", "protocol", "absorb", "digest",
]

/**
 * Named foods and food categories.
 *
 * Applied as a DELTA, never absolutely — the day the dietetic gate closes, a
 * legitimately gated food sentence must still be restylable. Today, when every
 * admitted proposition requires no capability and therefore names no food, the
 * delta rule degrades to exactly an absolute ban.
 */
export const FOOD_TOKENS: readonly string[] = [
  "dairy", "milk", "cheese", "yoghurt", "yogurt", "egg", "eggs", "fish",
  "shellfish", "nut", "nuts", "peanut", "wheat", "gluten", "bread", "soya",
  "soy", "sesame", "meat", "chicken", "beef", "pork", "vegetable", "veg",
  "fruit", "fibre", "fiber", "protein", "carb", "carbohydrate", "sugar",
  "salad", "rice", "pasta", "oats", "porridge", "banana", "broccoli",
  "yeast", "fermented", "kefir", "kimchi", "sauerkraut", "kombucha",
]

/** Customer-facing Biotics vocabulary, withheld while the claims gate is OPEN. */
export const BIOTICS_TOKENS: readonly string[] = [
  "prebiotic", "probiotic", "postbiotic", "biotic", "microbiome", "microbiota",
  "gut flora", "gut bacteria", "microbial", "strain", "feed", "seed",
  "regenerate",
]

/** Measurement and risk language. The Report has no score of any kind. */
export const SCORE_TOKENS: readonly string[] = [
  "score", "scored", "scoring", "rating", "rated", "level", "levels",
  "percentile", "percentage", "index", "grade", "band", "risk", "risky",
  "baseline", "benchmark", "measure", "measured", "measurement", "metric",
  "%",
]

/** Safety-netting wording, withheld while its own gate is OPEN. */
export const SAFETY_NETTING_TOKENS: readonly string[] = [
  "gp", "doctor", "clinician", "dietitian", "nutritionist", "pharmacist",
  "medical advice", "seek medical", "speak to", "see your", "consult",
  "emergency", "urgent",
]

/** Words that soften a claim. Losing one strengthens the sentence. */
export const HEDGE_TOKENS: readonly string[] = [
  "may", "might", "could", "can", "tends", "tend", "often", "sometimes",
  "usually", "generally", "typically", "occasionally", "seems", "appears",
  "likely", "about", "around", "roughly", "some", "more", "less",
]

/** Words that harden a claim. Gaining one strengthens the sentence. */
export const ABSOLUTE_TOKENS: readonly string[] = [
  "always", "never", "every", "all", "definitely", "certainly", "clearly",
  "must", "will", "guaranteed", "proven", "shows", "proves", "confirms",
  "means", "indicates", "demonstrates",
]

/** Negation. Dropping or adding one flips the meaning outright. */
export const NEGATION_TOKENS: readonly string[] = [
  "not", "no", "never", "none", "nothing", "neither", "nor", "without",
  "rarely", "seldom", "hardly", "cannot", "can't", "don't", "doesn't",
  "isn't", "aren't", "wasn't", "weren't", "won't", "unable", "lack",
]

/**
 * Quantities and the relations between them, drawn from the real corpus.
 *
 * ══ WHY THIS LIST EXISTS ════════════════════════════════════════════════════
 *
 * The numeric check matches digits, and the reviewed corpus contains none:
 * every quantity in it is spelled. "your longest gap between eating is usually
 * under four hours" · "more than eight hours" · "almost all of your meals" ·
 * "about half" · "you do most of the preparing". The digit rule therefore had
 * no coverage at all over the sentences this layer actually handles — a gap
 * found by review, not by the tests, because the only test that exercised it
 * used a sentence marked "not from the pack".
 *
 * Compared as an EXACT MULTISET, because these are facts rather than style.
 * `under` for `over`, `most` for `least`, `almost all` for `few` are all
 * reversals a reader would act on.
 *
 * ══ WHAT IT DOES NOT DO ═════════════════════════════════════════════════════
 *
 * It catches `most`→`least`. It does not catch `hardest`→`easiest`,
 * `relaxed`→`rushed` or `looser`→`tighter`, and it never will: antonyms are
 * not a closed set. This is a screen, not a proof, and the tests keep those
 * three as documented examples of what only a human catches.
 */
export const QUANTITY_TOKENS: readonly string[] = [
  // spelled numerals as they appear in the corpus
  "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "dozen",
  // fractions and portions
  "half", "quarter", "third", "double", "twice",
  // comparatives and superlatives of amount
  "most", "least", "few", "fewer", "fewest", "little", "many", "much",
  "more", "less", "lesser", "all", "none", "some", "any", "every", "each",
  // relations and bounds
  "under", "over", "above", "below", "within", "between", "than",
  "almost", "nearly", "about", "around", "roughly", "approximately",
  "up", "at", "exactly", "only", "hardly", "barely",
]

/** References to when something happens. */
export const TEMPORAL_TOKENS: readonly string[] = [
  "morning", "mornings", "afternoon", "afternoons", "evening", "evenings",
  "night", "nights", "day", "days", "daily", "week", "weeks", "weekly",
  "weekend", "weekends", "weekday", "weekdays", "month", "months", "hour",
  "hours", "minute", "minutes", "today", "tomorrow", "recently", "lately",
  "early", "late", "later", "before", "after", "during", "overnight",
  "breakfast", "lunch", "dinner", "mealtime", "mealtimes", "bedtime",
]

/** First-person-plural claim language — the product speaking as an analyst. */
export const FIRST_PERSON_CLAIM_TOKENS: readonly string[] = [
  "we found", "we see", "we can see", "we know", "we think", "we believe",
  "we noticed", "our analysis", "our data", "our assessment", "our review",
  "this suggests", "this means", "this indicates", "this tells us",
]
