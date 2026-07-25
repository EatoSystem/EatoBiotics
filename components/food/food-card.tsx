import Link from "next/link"
import { FoodImage } from "@/components/food/food-image"
import { bioticMeta } from "@/lib/biotic-meta"
import { cn } from "@/lib/utils"
import type { Food } from "@/lib/foods"

/** Slim projection — never pass whole Food objects into client components. */
export type FoodCardData = Pick<
  Food,
  "slug" | "name" | "emoji" | "category" | "biotic" | "tagline"
> & { image?: string; county?: string }

interface FoodCardProps {
  food: FoodCardData
  /** `large` gives the image more presence for lead positions in a collection. */
  size?: "default" | "large"
  sizes?: string
  priority?: boolean
  className?: string
}

/**
 * The single food card used by the library, collections and goal pages.
 *
 * Deliberately borderless: whitespace separates cards, the photograph supplies the
 * colour, and biotic colour appears only as a small dot.
 */
export function FoodCard({
  food,
  size = "default",
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  priority = false,
  className,
}: FoodCardProps) {
  const meta = bioticMeta(food.biotic)
  const isLarge = size === "large"

  return (
    <Link href={`/food/${food.slug}`} className={cn("group block", className)}>
      <FoodImage
        food={food}
        sizes={sizes}
        priority={priority}
        emojiClassName={isLarge ? "text-7xl" : "text-5xl"}
        className={cn(
          "aspect-square rounded-2xl transition-transform duration-500 ease-out group-hover:scale-[1.02]",
          isLarge && "aspect-[4/5]"
        )}
      />

      <div className={cn("mt-4", isLarge && "mt-5")}>
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: meta.color }}
          />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {meta.label}
          </span>
        </div>

        <h3
          className={cn(
            "mt-1.5 font-serif font-semibold text-foreground",
            isLarge ? "text-2xl" : "text-lg"
          )}
        >
          {food.name}
        </h3>

        <p
          className={cn(
            "mt-1 font-serif italic leading-snug text-muted-foreground",
            isLarge ? "text-base" : "text-sm"
          )}
        >
          {food.tagline}
        </p>
      </div>
    </Link>
  )
}
