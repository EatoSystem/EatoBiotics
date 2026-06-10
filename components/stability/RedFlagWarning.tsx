import { AlertTriangle } from "lucide-react"

const DEFAULT_FLAGS = [
  "blood in your stool",
  "black or tarry stools",
  "unexplained weight loss",
  "severe abdominal pain",
  "new or worsening symptoms",
  "persistent diarrhoea",
  "fever",
  "anaemia",
  "night-time bowel accidents",
  "a sudden change in bowel habits",
]

/**
 * Medically-responsible red-flag warning box. Pass `matched` to highlight the
 * specific symptoms a user reported.
 */
export function RedFlagWarning({ matched, compact = false }: { matched?: string[]; compact?: boolean }) {
  return (
    <div
      className="rounded-3xl border p-6 md:p-7"
      style={{ background: "color-mix(in srgb, #ef4444 6%, white)", borderColor: "color-mix(in srgb, #ef4444 35%, transparent)" }}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: "#ef4444" }}>
          <AlertTriangle size={20} />
        </span>
        <div>
          <h3 className="font-serif text-lg font-bold" style={{ color: "#b91c1c" }}>
            Please speak to your doctor
          </h3>
          {matched && matched.length > 0 ? (
            <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
              You mentioned <strong>{matched.join(", ").toLowerCase()}</strong>. These can have medical
              causes that need proper assessment. Please contact your GP or doctor as a priority — and
              seek urgent care if symptoms are severe.
            </p>
          ) : (
            <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
              Speak to your doctor urgently if you experience {DEFAULT_FLAGS.join(", ")}.
            </p>
          )}
          {!compact && (
            <p className="mt-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
              EatoBiotics Stability is for tracking and education only — it is not a substitute for medical care.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
