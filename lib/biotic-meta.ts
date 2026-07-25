import type { BioticType } from "@/lib/foods"

/**
 * Presentation metadata for the food library's four biotic categories.
 *
 * Verbs mirror the brand's canonical 3 Biotics framing in `lib/biotics.ts`
 * (Feed / Add / Produce), with Rebuild added for the library's fourth category,
 * Protein — which is a food-library category rather than one of the 3 Biotics.
 *
 * NOTE: colour is keyed to the *biotic*, deliberately not to `Food.accentColor`.
 * Each food carries its own accent independent of its biotic (garlic lime, oats
 * yellow, blueberries teal), so using the food's accent for a biotic label renders
 * "Prebiotic" in three different colours in the same grid. Biotic colour must mean
 * one thing; the food's own accent is not a reliable carrier of it.
 */
export interface BioticMeta {
  label: string
  /** CSS colour token for dots, hairlines and labels. */
  color: string
  verb: string
  /** One sentence on what this stage does. */
  body: string
}

export const BIOTIC_META: Record<Exclude<BioticType, "all">, BioticMeta> = {
  prebiotic: {
    label: "Prebiotic",
    color: "var(--icon-lime)",
    verb: "Feed",
    body: "Fermentable fibres you can't digest — inulin, beta-glucan, resistant starch. They pass through intact and arrive in the colon as bacterial fuel.",
  },
  probiotic: {
    label: "Probiotic",
    color: "var(--icon-teal)",
    verb: "Add",
    body: "Live cultures from fermented food. Mostly transient by design — they work as they pass through, which is why regularity beats any single dose.",
  },
  postbiotic: {
    label: "Postbiotic",
    color: "var(--icon-orange)",
    verb: "Produce",
    body: "What the bacteria make once fed — short-chain fatty acids like butyrate. This is the end product, and the reason the first two stages matter.",
  },
  protein: {
    label: "Protein",
    color: "var(--icon-yellow)",
    verb: "Rebuild",
    body: "Amino acids for the gut lining itself. Without the stages before it the wall gets built but never maintained.",
  },
}

/** Display order — the stages in sequence, not alphabetical. */
export const BIOTIC_ORDER = ["prebiotic", "probiotic", "postbiotic", "protein"] as const

export function bioticMeta(biotic: BioticType): BioticMeta {
  return (
    BIOTIC_META[biotic as Exclude<BioticType, "all">] ?? {
      label: "All biotics",
      color: "var(--icon-green)",
      verb: "",
      body: "",
    }
  )
}
