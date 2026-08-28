/**
 * What the €49 Food System Report contains — defined once.
 *
 * ── Why this exists ──────────────────────────────────────────────────────────
 *
 * Six surfaces sold this report and each carried its own hand-written feature
 * list: the pricing grid, the pricing FAQ, the assessment results list, the
 * three "what your report includes" cards, the results-page CTA, and the
 * delivery email. Six lists drift, and they had: every one of them promised
 * "Top 10 food recommendations" and a "weekly shopping framework" against a
 * report that generates FIVE foods and has no shopping section at all — not in
 * the schema, not in components/assessment/paid-report-client.tsx, not in
 * lib/pdf/report-pdf.tsx. Two of them also promised an "avoid/reduce list"
 * that nothing renders.
 *
 * That is the same failure `lib/age-brackets.ts` was created for in #245 (six
 * components, six bracket lists, one of them wrong) and the same one `lib/nav.ts`
 * prevents for navigation. One definition, imported everywhere.
 *
 * ── The rule for editing this list ───────────────────────────────────────────
 *
 * Every line below names something the buyer actually receives, and the
 * right-hand column of the table in tests/unit/report-offer-accuracy.test.ts
 * says which field renders it. A line may be added here only once the report
 * renders it. Selling a section before it exists is what this file exists to
 * stop, and it is a misrepresentation rather than an aspiration once money has
 * changed hands.
 *
 * Two things deliberately NOT sold here, though the report has them:
 *
 *  - The "Rhythm & Energy" section (`rhythmInsight`, `energyBreakdown`). The
 *    old copy sold it as "meal timing and food rhythm GUIDANCE"; what renders
 *    is analysis, not guidance. Rather than reword it, the founder chose to
 *    drop the line and let the section be a thing the reader finds. Erring
 *    toward under-promising is the safe direction, and re-adding it is one line.
 *  - The Food System Map (`foodSystemMap` in food-system-report-types.ts).
 *    Held back for scope, NOT because it is missing. It is generated — the
 *    full-tier prompt asks for a `foodSystem` block
 *    (app/api/submit-deep-assessment/route.ts:175, :216) and
 *    ensureFoodSystem/buildFoodSystemReport
 *    (lib/report/build-food-system-report.ts:97, :428) derive one
 *    deterministically, so it is present whether or not the model returns it —
 *    and it is rendered, on the web at paid-report-client.tsx:615 and in the
 *    PDF at report-pdf.tsx:1100, with the map itself iterated at
 *    food-system-section.tsx:487 and food-system-pdf.tsx:545.
 *
 *    The reason to leave it out of the offer is that the Map is the centrepiece
 *    of the report redesign now being planned, and its shape is about to change.
 *    Committing sales copy to it today would mean rewriting that copy twice.
 *
 *    An earlier version of this comment claimed the Map "is not rendered on the
 *    live personal path". That was wrong, and it is worth recording why the
 *    error mattered rather than quietly deleting it: this file is where someone
 *    checks before adding a line to the offer, so a false statement in it is
 *    precisely the failure the file exists to prevent. Every claim above names
 *    a file and a line so the next reader can verify instead of trusting.
 */

/** One-time price, in euro. The report is not a subscription. */
export const REPORT_PRICE_EUR = 49

/**
 * How many foods the report recommends.
 *
 * Five, not ten — a deliberate product decision, and the number the generator
 * actually produces: `DeepFullReport.specificFoodList` is documented "5 foods
 * chosen specifically for this person" and the prompt literal in
 * app/api/submit-deep-assessment/route.ts asks for exactly that many.
 *
 * The guard derives the count from that prompt rather than trusting this
 * constant, so raising one without the other fails the build.
 */
export const REPORT_FOOD_COUNT = 5

/** The count as it appears in prose, so the copy and the number cannot drift. */
export const REPORT_FOOD_COUNT_WORD = "five"

/**
 * The feature list, as sold. Order is the order it renders in.
 */
export const REPORT_OFFER_FEATURES = [
  "Full Prebiotics · Probiotics · Postbiotics analysis",
  "Your key insight and top finding",
  "Your 7-day starter plan",
  `Your ${REPORT_FOOD_COUNT_WORD}-food strategy, with a swap for each`,
  "Your 30-day roadmap",
  "How your lifestyle connects to your scores",
  "Free 30-day EatoBiotics account",
] as const

/**
 * The same offer as a sentence, for prose contexts (the pricing FAQ, the
 * nurture and sequence emails). Kept here rather than written out per surface
 * for the same reason as the list: prose drifts from bullets otherwise, and it
 * did — the FAQ answer repeated all four unsupported claims.
 */
export const REPORT_OFFER_SENTENCE =
  `Your report is generated for you from your assessment and deep-dive answers. ` +
  `It includes your full Prebiotics · Probiotics · Postbiotics analysis, your key ` +
  `insight, a 7-day starter plan, your ${REPORT_FOOD_COUNT_WORD}-food strategy with a ` +
  `swap for each, a 30-day roadmap, and how your lifestyle connects to your scores.`
