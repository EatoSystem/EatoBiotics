/* ════════════════════════════════════════════════════════════════════════
   PRODUCT VOCABULARY — the names of the things EatoBiotics sells.

   Shared leaf for web and the React Native companion. Zero imports, no
   environment access, no Supabase, no Stripe, no server-only anything.

   Web re-exports this from lib/product-vocabulary.ts so existing import
   paths keep working. Do not copy these strings into apps/mobile.

   PRICES LIVE WITH THEIR PRODUCT, NOT HERE:
     - the €49 Consultation  → REPORT_PRICE_EUR in lib/report/offer.ts
     - the €24.99 Member     → MEMBER_PRICE_EUR in lib/membership-tiers.ts
   ════════════════════════════════════════════════════════════════════════ */

/**
 * The free product. NOT "Food System Snapshot" and NOT "Food System Score" —
 * the Assessment is the product, the score is what it produces.
 */
export const FOOD_SYSTEM_ASSESSMENT = "Food System Assessment"

/** The €49 one-time product. The thing the customer buys. */
export const PERSONAL_CONSULTATION = "Personal Food System Consultation"

/** What the Consultation produces. Not itself a SKU. */
export const PERSONAL_REPORT = "Personal Food System Report"

/** The practice period included with the Consultation. */
export const THIRTY_DAYS = "30 Days Inside Your Food System"

/** The subscription. */
export const MEMBER = "EatoBiotics Member"

/**
 * The person-level score, and the output of the Food System Assessment.
 *
 * Use this for a prominent first mention. Repeating ™ through a paragraph
 * reads badly, so continuing prose in the same context may use
 * BIOTICS_SCORE_PLAIN.
 */
export const BIOTICS_SCORE = "Biotics Score™"

/** The same score, for repeat mentions where the ™ becomes unnatural. */
export const BIOTICS_SCORE_PLAIN = "Biotics Score"

/**
 * The meal-level score. A single plate, not a person.
 *
 * Never substitute BIOTICS_SCORE here: the person's branded score is earned by
 * completing the Assessment, and describing one meal with it tells the customer
 * they have something they do not have.
 */
export const MEAL_BIOTICS_SCORE = "Meal Biotics Score"

/**
 * The scientific framework. These three name the pathways a score is broken
 * down by. They are labels, never a personal measurement.
 */
export const BIOTICS = ["Prebiotics", "Probiotics", "Postbiotics"] as const

/** "Prebiotics · Probiotics · Postbiotics" — the framework as one line. */
export const BIOTICS_LINE = BIOTICS.join(" · ")

/**
 * The action framework. Three things a person DOES.
 *
 * The third action is `Rejuvenate`. `Regenerate` is a retired pathway name.
 * These are never score names, and Rejuvenate is never Postbiotics renamed.
 */
export const ACTIONS = ["Feed", "Seed", "Rejuvenate"] as const

/** "Feed · Seed · Rejuvenate" — the action framework as one line. */
export const ACTIONS_LINE = ACTIONS.join(" · ")
