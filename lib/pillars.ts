/* ════════════════════════════════════════════════════════════════════════
   FOOD SYSTEM CORE — the canonical vocabulary of the EatoBiotics model.

   The whole product is one idea expressed many ways: your gut is a food system
   you feed with three biotics. This module is the single source of truth for
   those three pillars — their labels, aliases, colours, and the copy used to
   describe and nudge each one.

   Everything downstream (assessment results, emails, the dashboard, habit
   nudges, and — soon — translations) should read pillar vocabulary from here
   rather than redefining it. Historically the pillar label map was copy-pasted
   in ~9 places with subtle drift; this is the canonical replacement.

   ── HOUSE RULE ON POSTBIOTIC LANGUAGE ──────────────────────────────────
   Postbiotics are OUTPUTS, not ingredients. They are what your bacteria make
   when they ferment what you eat. No food is "a postbiotic" and no food is
   "postbiotic-rich", however convenient the shorthand.

   Copy may say a food SUPPORTS postbiotic production, or that it provides the
   fibre, resistant starch or polyphenols bacteria turn into postbiotics.
   Copy must never call a food a postbiotic. `/biotics` already states this
   correctly ("Postbiotics are not eaten — they are earned"); this module and
   everything reading from it must not contradict that page.

   Note the split this creates: `"postbiotic"` remains a scoring bucket and a
   persisted value (lib/foods.ts `BioticType`, the `postbiotic_score` column),
   so the KEY stays while the PROSE changes. Renaming the key would silently
   zero historical scores — see the alias-key note below.
   ════════════════════════════════════════════════════════════════════════ */

/** The three biotics — the canonical pillar keys of the current model. */
export type PillarKey = "prebiotics" | "probiotics" | "postbiotics"

/**
 * The brand-facing alias keys for the same three pillars.
 *
 * NOTE the split between key and label: the brand words are Feed / Seed /
 * **Regenerate**, but the third *key* stays `"heal"` because it is written into
 * stored assessment records and shared score-card URLs (`?heal=67`). Renaming
 * the key would silently zero historical scores. Rename `aliasLabel`, never this.
 */
export type PillarAliasKey = "feed" | "seed" | "heal"

export interface Pillar {
  /** Canonical key used in scoring and storage. */
  key: PillarKey
  /** Brand alias key for the same pillar. Legacy — `"heal"` is displayed as "Regenerate". */
  aliasKey: PillarAliasKey
  /** Canonical display label, e.g. "Prebiotics". */
  label: string
  /** Brand alias label, e.g. "Feed". */
  aliasLabel: string
  /** CSS custom property used for this pillar's accent colour. */
  color: string
  /** One-line "what it is". */
  tagline: string
  /** Short plain-language description of what this pillar does for the gut. */
  whatItDoes: string
  /** Default habit nudge shown when this pillar is the weakest. */
  nudge: string
  /** Representative foods for this pillar. */
  foodExamples: string[]
}

/** Canonical ordering of the three pillars. */
export const PILLAR_ORDER: PillarKey[] = ["prebiotics", "probiotics", "postbiotics"]

export const PILLARS: Record<PillarKey, Pillar> = {
  prebiotics: {
    key: "prebiotics",
    aliasKey: "feed",
    label: "Prebiotics",
    aliasLabel: "Feed",
    color: "var(--icon-green)",
    tagline: "Feed your good bacteria.",
    whatItDoes:
      "Fibre-rich plant foods that feed the beneficial bacteria already living in your gut.",
    nudge: "Add a prebiotic food like garlic, onions, or oats to feed your good bacteria.",
    foodExamples: ["garlic", "onions", "oats", "asparagus", "bananas", "lentils"],
  },
  probiotics: {
    key: "probiotics",
    aliasKey: "seed",
    label: "Probiotics",
    aliasLabel: "Seed",
    color: "var(--icon-teal)",
    tagline: "Seed new life.",
    whatItDoes:
      "Live-culture and fermented foods that introduce beneficial bacteria into your gut.",
    nudge: "Try a fermented food like yoghurt, kimchi, or kombucha for live probiotics.",
    foodExamples: ["yoghurt", "kefir", "kimchi", "sauerkraut", "miso", "kombucha"],
  },
  postbiotics: {
    key: "postbiotics",
    aliasKey: "heal",
    label: "Postbiotics",
    aliasLabel: "Regenerate",
    color: "var(--icon-yellow)",
    tagline: "Regenerate and renew.",
    whatItDoes:
      "The beneficial compounds your gut bacteria produce when they ferment prebiotic fibre — they calm inflammation and strengthen the gut lining.",
    // Postbiotics are produced, never eaten — so this nudge names foods that give
    // your bacteria the polyphenols and resistant starch they need, rather than
    // calling any food "a postbiotic". See the note above PILLARS.
    nudge: "Support postbiotic production with polyphenol-rich foods like turmeric, dark chocolate, or green tea.",
    // Aligned with lib/foods.ts, the classifier of record: sourdough (:383) and
    // aged cheese (:931) are classified `probiotic` there, so they were dropped
    // from this list rather than contradicting it.
    foodExamples: ["turmeric", "green tea", "dark chocolate", "cooled potato", "walnuts"],
  },
}

/**
 * Maps every pillar key ever used in the codebase — canonical keys and the
 * feed/seed/heal alias keys — to its canonical pillar. Returns `null` for keys
 * that don't belong to the current 3-biotic model (e.g. legacy 5-pillar keys).
 */
export function resolvePillar(key: string): Pillar | null {
  if (key in PILLARS) return PILLARS[key as PillarKey]
  for (const pillar of Object.values(PILLARS)) {
    if (pillar.aliasKey === key) return pillar
  }
  return null
}

/**
 * Canonical label map for the current 3-biotic model, including the
 * feed/seed/heal alias keys. Drop-in replacement for the duplicated `PILLAR_LABELS` constants
 * that used the prebiotics/probiotics/postbiotics scheme.
 */
export const PILLAR_LABELS: Record<string, string> = {
  prebiotics: PILLARS.prebiotics.label,
  probiotics: PILLARS.probiotics.label,
  postbiotics: PILLARS.postbiotics.label,
  feed: PILLARS.prebiotics.label,
  seed: PILLARS.probiotics.label,
  heal: PILLARS.postbiotics.label,
}

/** Resolves a pillar key (canonical or alias) to its display label, falling back to the key. */
export function pillarLabel(key: string): string {
  return resolvePillar(key)?.label ?? key
}
