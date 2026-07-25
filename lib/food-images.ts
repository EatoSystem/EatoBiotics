import type { Food } from "@/lib/foods"

/**
 * Slugs that have a generated library photograph in `public/food-library/`.
 *
 * The array below is rewritten by `scripts/generate-food-images.ts` — do not edit
 * it by hand. Keeping it as a manifest means adding imagery never requires touching
 * all 48 entries in `lib/foods.ts`.
 */
export const FOOD_IMAGE_SLUGS: string[] = []

const IMAGE_SLUG_SET = new Set(FOOD_IMAGE_SLUGS)

/**
 * Resolve a food's image path.
 *
 * An explicit `Food.image` always wins, so a hand-picked photograph can override
 * the generated one. Returns undefined when neither exists, and the UI falls back
 * to the food's emoji.
 *
 * Note the directory is `/food-library/`, not `/food/` — the latter would sit under
 * the `/food/[slug]` route.
 */
export function foodImage(food: Pick<Food, "slug"> & { image?: string }): string | undefined {
  if (food.image) return food.image
  return IMAGE_SLUG_SET.has(food.slug) ? `/food-library/${food.slug}.webp` : undefined
}
