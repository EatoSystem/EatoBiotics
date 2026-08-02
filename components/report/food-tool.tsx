"use client"

import * as Icons from "lucide-react"
import {
  accentFill,
  accentText,
  accentTextOnTint,
  bioticAccent,
  bioticLabel,
  foodIcon,
  pathwayIcon,
  type BioticKey,
  type PillarAlias,
  bioticFromPillar,
} from "@/lib/report/visual-token"

/**
 * The food card used across every report and assessment-result surface.
 *
 * Replaces the emoji span that used to sit at the top of each food
 * (assessment-results, full-report, paid-report, family results, mind results).
 * A single component so the replacement is defined once and the six surfaces
 * cannot drift apart again.
 *
 * The pathway badge is the point. "Prebiotic" tells the reader which part of
 * their Food System this food feeds; an emoji told them nothing. Where a food
 * carries a mechanism, it renders under the name, because the brief's standard
 * is that the report teaches what a food does before recommending it.
 *
 * Colour: the icon capsule uses the raw brand hue as a tinted fill and the ring;
 * all text uses the -text variants, which are the AA-safe ones on white. Mixing
 * those up is what #184 got wrong and #187 fixed.
 */

export function BioticIcon({
  food,
  biotic,
  size = 22,
}: {
  food: string
  biotic: BioticKey
  size?: number
}) {
  const name = foodIcon(food)
  // lucide exports are PascalCase components; fall back rather than crash if a
  // name ever drifts out of the icon set.
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Utensils
  const accent = bioticAccent(biotic)
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-xl"
      style={{
        width: size + 20,
        height: size + 20,
        background: `color-mix(in srgb, ${accentFill(accent)} 16%, transparent)`,
        color: accentText(accent),
      }}
    >
      <Icon size={size} strokeWidth={2} aria-hidden />
    </span>
  )
}

/**
 * The pathway itself, rather than a food on it — for the 3-Biotics explainer
 * cards and supplement cards, which sit on a filled gradient tile and so render
 * white rather than on the -text token.
 */
export function PathwayIcon({
  biotic,
  size = 20,
  className = "",
}: {
  biotic: BioticKey
  size?: number
  className?: string
}) {
  const Icon =
    (Icons as unknown as Record<string, Icons.LucideIcon>)[pathwayIcon(biotic)] ?? Icons.Sprout
  return <Icon size={size} strokeWidth={2} aria-hidden className={className} />
}

export function BioticBadge({ biotic }: { biotic: BioticKey }) {
  const accent = bioticAccent(biotic)
  return (
    <span
      className="inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-bold"
      style={{
        background: `color-mix(in srgb, ${accentFill(accent)} 15%, transparent)`,
        // On a tinted ground, not white — see accentTextOnTint. axe measured the
        // -text variant here at 4.3:1 against the capsule's own background.
        color: accentTextOnTint(accent),
      }}
    >
      {bioticLabel(biotic)}
    </span>
  )
}

export function FoodTool({
  food,
  biotic,
  pillar,
  mechanism,
  why,
  howToUse,
  headingLevel = "h4",
  className = "",
}: {
  food: string
  biotic?: BioticKey
  /** Legacy feed/seed/heal callers; resolved to a biotic. */
  pillar?: PillarAlias
  /** What the food does inside the system. */
  mechanism?: string
  /** Why it suits this reader. */
  why?: string
  howToUse?: string
  /**
   * The food name is a heading. Callers place these under different section
   * levels, and skipping one (h2 -> h4) is a real heading-order failure that
   * axe flags, so the level is the caller's to set. Defaults to the level every
   * existing caller already renders at.
   */
  headingLevel?: "h3" | "h4"
  className?: string
}) {
  const key: BioticKey = biotic ?? (pillar ? bioticFromPillar(pillar) : "prebiotics")
  const Heading = headingLevel
  return (
    <div className={`flex gap-4 ${className}`}>
      <BioticIcon food={food} biotic={key} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <Heading className="font-serif text-base font-semibold text-foreground">
            {food}
          </Heading>
          <BioticBadge biotic={key} />
        </div>
        {mechanism && (
          <p className="mt-1.5 text-sm leading-relaxed text-foreground">{mechanism}</p>
        )}
        {why && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{why}</p>}
        {howToUse && (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{howToUse}</p>
        )}
      </div>
    </div>
  )
}
