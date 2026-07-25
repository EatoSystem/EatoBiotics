import { Plus } from "lucide-react"
import { FOOD_MYTHS } from "@/lib/food-education"

/**
 * Myth-busting list.
 *
 * Built on native <details>/<summary> so it expands without JavaScript and stays
 * keyboard-accessible for free.
 */
export function FoodMyths() {
  return (
    <div className="divide-y divide-border border-y border-border">
      {FOOD_MYTHS.map(({ myth, truth }) => (
        <details key={myth} className="group">
          <summary className="flex cursor-pointer list-none items-start gap-4 py-5 [&::-webkit-details-marker]:hidden">
            <span className="mt-1 shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-icon-orange">
              Myth
            </span>
            <span className="flex-1 font-serif text-lg font-semibold text-foreground">
              {myth}
            </span>
            <Plus
              size={18}
              className="mt-0.5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-45"
            />
          </summary>
          <p className="pb-5 text-[15px] leading-relaxed text-muted-foreground sm:pl-[4.5rem]">
            <span className="font-semibold text-icon-green">Actually — </span>
            {truth}
          </p>
        </details>
      ))}
    </div>
  )
}
