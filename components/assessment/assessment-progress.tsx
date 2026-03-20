import { SECTION_COLORS } from "@/lib/assessment-data"

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
  const pct = ((currentIndex + 1) / total) * 100
  const sectionColor = SECTION_COLORS[sectionTitle] ?? "var(--icon-green)"

  return (
    <div className="sticky top-[57px] z-40 bg-background/95 backdrop-blur-sm">
      {/* Progress bar */}
      <div className="relative h-1 w-full bg-border/40">
        <div
          className="absolute inset-y-0 left-0 rounded-r-full brand-gradient transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Meta row */}
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
        <span className="text-xs text-muted-foreground">
          {currentIndex + 1} <span className="opacity-50">of {total}</span>
        </span>

        <div className="flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: sectionColor }}
          />
          <span className="text-xs font-medium text-muted-foreground">{sectionTitle}</span>
        </div>

        <span className="text-xs text-muted-foreground">{Math.round(pct)}%</span>
      </div>
    </div>
  )
}
