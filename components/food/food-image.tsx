import Image from "next/image"
import { cn } from "@/lib/utils"
import { foodImage } from "@/lib/food-images"
import type { Food } from "@/lib/foods"

/** The subset of a Food this component needs — keeps client payloads slim. */
export type FoodImageData = Pick<Food, "slug" | "name" | "emoji"> & { image?: string }

interface FoodImageProps {
  food: FoodImageData
  /** Sizing hint for next/image. Match the layout the image sits in. */
  sizes?: string
  /** Aspect + radius live here, e.g. "aspect-square rounded-2xl". */
  className?: string
  /** Tailwind size for the emoji fallback. */
  emojiClassName?: string
  priority?: boolean
}

/**
 * Single source of truth for how a food is pictured.
 *
 * Renders the library photograph when one exists, and a quiet emoji tile when it
 * doesn't — so the pages work identically before and after the images are generated.
 */
export function FoodImage({
  food,
  sizes = "(max-width: 640px) 50vw, 25vw",
  className,
  emojiClassName = "text-5xl",
  priority = false,
}: FoodImageProps) {
  // Resolved here, not by callers, so imagery behaviour lives in exactly one place.
  const src = foodImage(food)

  return (
    <div className={cn("relative overflow-hidden bg-secondary", className)}>
      {src ? (
        <Image
          src={src}
          alt={food.name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-0 flex select-none items-center justify-center",
            emojiClassName
          )}
        >
          {food.emoji}
        </span>
      )}
    </div>
  )
}
