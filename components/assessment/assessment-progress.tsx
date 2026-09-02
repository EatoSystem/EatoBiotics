import { SECTION_COLORS } from "@/lib/assessment-data"
import { bioticOf } from "@/lib/assessment/biotics"

interface AssessmentProgressProps {
  currentIndex: number // 0-based
  total: number
  sectionTitle: string
}

export function AssessmentProgress({
  currentIndex,
  total,
  sectionTitle,
}: AssessmentProgressProps) {
  const position = currentIndex + 1
  const pct = (position / total) * 100
  const sectionColor = SECTION_COLORS[sectionTitle] ?? "var(--icon-green)"

  /* On a Biotic journey the row names the Biotic — "Probiotics" — rather than
   * the finer section title, because the Biotic is the thing the customer is
   * being told they are moving through. Assessments with non-Biotic sections
   * (Mind, Family) keep showing their own section title. */
  const label = bioticOf(sectionTitle) ?? sectionTitle

  return (
    <div className="sticky top-[57px] z-40 bg-background/95 backdrop-blur-sm">
      {/* One progressbar for the whole control.
       *
       * There was no role and no aria-* here at all, so the only thing a
       * screen reader could perceive was the loose text. The bar and the
       * colour dot are decoration for the same fact, so they are hidden
       * rather than announced twice, and neither is focusable. */}
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={position}
        aria-valuetext={`Question ${position} of ${total} — ${label}`}
        aria-label="Assessment progress"
      >
        <div className="relative h-1 w-full bg-border/40" aria-hidden>
          <div
            className="absolute inset-y-0 left-0 rounded-r-full brand-gradient transition-all duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Two facts, not three. A rounded percentage used to sit here saying
          * what the bar already says; §5 asks for restraint and for position
          * only, and at 390px a third readout is what makes this row wrap. */}
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-6 py-3">
          <span className="text-xs text-muted-foreground">
            Question {position} <span className="opacity-50">of {total}</span>
          </span>

          <div className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: sectionColor }}
              aria-hidden
            />
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
