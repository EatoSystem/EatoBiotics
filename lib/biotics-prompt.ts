/* ════════════════════════════════════════════════════════════════════════
   BIOTICS PROMPT VOCABULARY — the shared blocks every AI route pastes in.

   Before this module existed the same three-biotics explanation was written
   out by hand in eight prompts across seven routes (two of them in the same
   file). They drifted, and the drift was not cosmetic: the public chat agent
   ended up asserting that olive oil, dark chocolate and berries *are*
   postbiotics, which contradicts /biotics, the book, and lib/pillars.ts.

   Anything describing the three biotics to a model belongs here.

   ── THE RULE THESE BLOCKS ENFORCE ──────────────────────────────────────
   Postbiotics are OUTPUTS. Bacteria make them; you do not eat them. Foods can
   SUPPORT postbiotic production — by supplying fibre, resistant starch or
   polyphenols — but no food is "a postbiotic". See the house rule in
   lib/pillars.ts.

   `"postbiotic"` nonetheless remains a scoring bucket and a persisted value
   (lib/foods.ts `BioticType`, the `postbiotic_score` column), so these blocks
   keep classifying foods into it — they just describe it honestly, as the
   postbiotic-SUPPORTING bucket.

   Food classifications match lib/foods.ts, which is the classifier of record.
   Notably sourdough (:383) and aged cheese (:931) are `probiotic` there, not
   postbiotic, and olive oil (:126) is `prebiotic`.
   ════════════════════════════════════════════════════════════════════════ */

/**
 * How to sort a food into one of the four scoring buckets. Used by the meal
 * analysers, which must return one bucket per identified food.
 */
export const BIOTIC_CLASSIFICATION = `For each food, classify it as ONE of:
- prebiotic: fibrous plant foods that feed good gut bacteria (ALL vegetables, fruits, wholegrains, legumes, garlic, onion, leeks, asparagus, peas, oats, bananas, seeds like hemp/flax/chia, avocado, olive oil, etc.)
- probiotic: live cultures / fermented foods (yogurt, kefir, kimchi, sauerkraut, miso, tempeh, kombucha, sourdough, live-culture and aged cheese, etc.)
- postbiotic: the postbiotic-SUPPORTING bucket — foods that give bacteria what they need to PRODUCE postbiotics: polyphenol-rich foods (turmeric, ginger, green tea, dark chocolate 70%+, cocoa, berries, pomegranate, walnuts), resistant starch (cooked-and-cooled potato or rice), fermentation-derived acids (apple cider vinegar), and bone broth
- protein: meat, fish, eggs, or legumes when serving as the primary protein source

IMPORTANT — postbiotics are outputs, not ingredients. Bacteria produce them (short-chain fatty acids like butyrate, plus vitamins and neurotransmitter precursors) by fermenting what you eat. The bucket is named "postbiotic" for scoring purposes only; it means "supports postbiotic production". In any prose you write for the user, never say a food "is a postbiotic" or is "postbiotic-rich" — say it supports postbiotic production, or that it feeds the bacteria that make them.

Classification notes:
- Avocado = prebiotic (excellent fibre)
- Asparagus, peas, edamame = prebiotic (high in FOSs and resistant starch)
- Seeds (hemp, flax, sesame, pumpkin, sunflower) = prebiotic
- Legumes like lentils/chickpeas = prebiotic (if a side dish) or protein (if the main protein)
- Greek yogurt = probiotic (live cultures)
- Aged cheddar/parmesan and sourdough = probiotic (live and fermentation-derived cultures)
- Extra-virgin olive oil = prebiotic (its polyphenols also support postbiotic production)`

/**
 * The educational description of the three biotics, for conversational agents
 * (public chat, consultations) rather than classifiers.
 */
export const BIOTICS_FRAMEWORK = `THE 3 BIOTICS FRAMEWORK (developed by Jason Curry):
- Prebiotics — plant fibres that feed beneficial gut bacteria. Foods: garlic, onion, leek, asparagus, Jerusalem artichoke, oats, barley, slightly-underripe banana, flaxseed, apples, chicory root, extra-virgin olive oil.
- Probiotics — live cultures from fermented foods that diversify the microbiome. Foods: live yoghurt, kefir, kimchi, sauerkraut, miso, tempeh, kombucha, sourdough, aged cheese.
- Postbiotics — the beneficial compounds your bacteria PRODUCE (short-chain fatty acids like butyrate, plus vitamins B12/K2 and serotonin precursors) when they ferment what you have eaten. You do not eat postbiotics — you earn them. Foods that support their production: polyphenol-rich foods (dark chocolate 70%+, green tea, berries, pomegranate, turmeric, ginger, walnuts, cocoa), resistant starch (cooked-and-cooled potato or rice), and apple cider vinegar.

Never describe a food as "a postbiotic" or "postbiotic-rich". Postbiotics are what a well-fed, well-seeded system makes. If someone asks which foods are postbiotics, correct the premise warmly and explain what to eat to produce more of them.`

/**
 * The 0–100 meal rubric. The `postbiotic` line scores whether the meal gives
 * bacteria the substrate to produce postbiotics — hence "support", not presence.
 */
export const BIOTICS_RUBRIC = `THE BIOTICS SCORING RUBRIC (used for every meal 0–100):
• Prebiotic richness — up to 45 pts: 4+ different plant/fibre foods=45 | 3=40 | 2=32 | 1=20 | 0=0
• Probiotic presence — up to 25 pts: 2+ fermented foods=25 | 1=20 | none=10
• Postbiotic support — up to 15 pts: 1+ food that supports postbiotic production=15 | none=5
• Protein quality — up to 15 pts: high-quality protein=15 | some=12 | none=0
Max possible: 100. A score of 70+ is excellent. 50–69 is solid. Below 50 needs attention.`

/**
 * Meal-planning shorthand, for the plate builder. Same rule, shorter form.
 */
export const BIOTICS_FOR_PLANNING = `THE 3 BIOTICS (EatoBiotics framework):
- PREBIOTIC foods: garlic, onion, leeks, asparagus, oats, bananas (slightly underripe), chicory, Jerusalem artichoke, flaxseeds, apples, legumes, barley, extra-virgin olive oil
- PROBIOTIC foods: natural yogurt, kefir, sauerkraut, kimchi, miso, tempeh, kombucha, sourdough, live and aged cheese
- POSTBIOTIC-SUPPORTING foods (these help bacteria PRODUCE postbiotics — no food is itself a postbiotic): wholegrains, resistant starch (cooled potato/rice), pulses, high-fibre vegetables, dark chocolate (70%+), berries, green tea, turmeric`
