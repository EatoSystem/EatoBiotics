import { Leaf } from "lucide-react"
import { MISSION } from "@/lib/mission-content"

type MissionNoteVariant = "bridge" | "inline" | "quote"

interface MissionNoteProps {
  variant: MissionNoteVariant
}

/**
 * MissionNote — renders the EatoBiotics mission messaging in three visual styles.
 *
 * "bridge"  — rich section between content and pricing on results page
 * "inline"  — compact trust note beneath pricing grids
 * "quote"   — elegant centered blockquote for the assessment intro
 */
export function MissionNote({ variant }: MissionNoteProps) {
  if (variant === "bridge") {
    return (
      <div className="rounded-3xl border border-[var(--icon-green)]/20 bg-[var(--icon-green)]/5 p-6 sm:p-8">
        {/* Brand pills */}
        <div className="mb-5 flex items-center gap-1.5">
          <span className="biotic-pill bg-icon-lime" />
          <span className="biotic-pill bg-icon-green" />
          <span className="biotic-pill bg-icon-teal" />
          <span className="biotic-pill bg-icon-yellow" />
          <span className="biotic-pill bg-icon-orange" />
        </div>

        <p className="font-serif text-lg font-semibold leading-snug text-foreground sm:text-xl">
          {MISSION.headline}
        </p>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {MISSION.support}
        </p>

        <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[var(--icon-green)]">
          <Leaf size={12} />
          <a
            href="https://eatosystem.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:underline"
          >
            Learn about the EatoSystem →
          </a>
        </div>
      </div>
    )
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <Leaf size={11} className="text-[var(--icon-green)]/60" />
        <p className="text-center text-xs text-muted-foreground/60">
          {MISSION.shortLine}
        </p>
      </div>
    )
  }

  // variant === "quote"
  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="mb-3 flex justify-center gap-1.5">
        <span className="biotic-pill bg-icon-lime" />
        <span className="biotic-pill bg-icon-green" />
        <span className="biotic-pill bg-icon-teal" />
      </div>
      <p className="font-serif text-base italic leading-relaxed text-foreground/70 sm:text-lg">
        &ldquo;{MISSION.headline}&rdquo;
      </p>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground/60">
        {MISSION.intro}
      </p>
    </div>
  )
}
