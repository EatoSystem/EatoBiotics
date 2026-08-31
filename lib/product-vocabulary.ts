/* ════════════════════════════════════════════════════════════════════════
   PRODUCT VOCABULARY — the names of the things EatoBiotics sells.

   Distinct from lib/pillars.ts, which is the vocabulary of the SCIENCE (the
   three biotics, their aliases, colours and nudges). This module is the
   vocabulary of the COMMERCIAL MODEL: what the customer buys, in what order,
   and what each step produces.

   ── Why this exists ─────────────────────────────────────────────────────
   Before Phase 1 the free product had three competing names across the site —
   "Food System Score" on /start and the homepage metadata, "Biotics Score" in
   the assessment itself, "Gut Health Score" on the share card — and the €49
   product was variously a "Food System Report", a "Full Report" and a
   "30-Day Plan". None of them were wrong locally; together they described a
   product nobody sells.

   ── Dependency direction (deliberate, do not invert) ────────────────────
   This module is a LEAF. Zero imports, no environment access, no Supabase, no
   Stripe, no server-only anything — so a "use client" component can import it
   without dragging a service-role client into the browser bundle, which is the
   mistake lib/membership-tiers.ts was split out to fix.

       lib/product-vocabulary.ts        ← here (leaf)
             ↑              ↑
       lib/report/offer.ts  lib/membership-tiers.ts
                                  ↑
                            lib/membership.ts

   PRICES LIVE WITH THEIR PRODUCT, NOT HERE:
     - the €49 Consultation  → REPORT_PRICE_EUR in lib/report/offer.ts
     - the €24.99 Member     → MEMBER_PRICE_EUR in lib/membership-tiers.ts

   RETIRED NAMES DO NOT LIVE HERE EITHER. The patterns that catch "Food System
   Snapshot", "Full Report" and the rest are test-only, in
   tests/unit/retired-vocabulary.test.ts. Shipping a list of names we no longer
   use inside the runtime bundle would be shipping the problem.
   ════════════════════════════════════════════════════════════════════════ */

/* ── The journey, in order ──────────────────────────────────────────────── */

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

/* ── Scores ─────────────────────────────────────────────────────────────── */

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
 * they have something they do not have. The database field backing this stays
 * `analyses.biotics_score` — the column name is not this label.
 */
export const MEAL_BIOTICS_SCORE = "Meal Biotics Score"

/* ── Understand vs act ──────────────────────────────────────────────────── */

/**
 * The scientific framework. These three name the pathways a score is broken
 * down by. Labels, colours and per-pillar copy live in lib/pillars.ts — this is
 * only the vocabulary the commercial surfaces quote.
 */
export const BIOTICS = ["Prebiotics", "Probiotics", "Postbiotics"] as const

/** "Prebiotics · Probiotics · Postbiotics" — the framework as one line. */
export const BIOTICS_LINE = BIOTICS.join(" · ")

/**
 * The action framework. Three things a person DOES.
 *
 * These are never score names, and Regenerate is never Postbiotics renamed —
 * postbiotics are what bacteria produce, Regenerate is what a person chooses to
 * do. Copy may say the actions are inspired by the science; it may not equate
 * one to one. The singular "Regenerate" is the label; "Regenerates" is not a
 * form this word takes here.
 */
export const ACTIONS = ["Feed", "Seed", "Regenerate"] as const

/** "Feed · Seed · Regenerate" — the action framework as one line. */
export const ACTIONS_LINE = ACTIONS.join(" · ")
