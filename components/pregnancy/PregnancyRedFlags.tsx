import { AlertTriangle } from "lucide-react"
import { PREGNANCY_SAFETY_QUESTIONS } from "@/lib/pregnancy/questions"

/**
 * Non-diagnostic red-flag box for the Pregnancy Food System. Lists symptoms that
 * always warrant contacting a professional. When `flagged` is passed (from a
 * completed assessment) it names what the user reported; otherwise it shows the
 * general "if you notice any of these" guidance. Never a diagnosis.
 */
export function PregnancyRedFlags({ flagged, className = "" }: { flagged?: string[]; className?: string }) {
  const items = flagged?.length ? flagged : PREGNANCY_SAFETY_QUESTIONS.map((q) => q.label)
  const reported = Boolean(flagged?.length)
  return (
    <div
      className={`rounded-2xl border p-5 ${className}`}
      style={{ borderColor: "color-mix(in srgb, var(--icon-orange) 45%, transparent)", background: "color-mix(in srgb, var(--icon-orange) 8%, transparent)" }}
    >
      <p className="flex items-center gap-2 text-sm font-bold text-foreground">
        <AlertTriangle size={16} style={{ color: "var(--icon-orange)" }} />
        {reported ? "Please speak with a professional" : "When to seek help straight away"}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {reported
          ? "You told us about the following. Please contact your midwife, GP, or maternity unit about these before changing anything else — this tool is food-first and cannot assess them:"
          : "This is food-first education, not medical care. Contact your midwife, GP, or maternity unit straight away if you notice any of these:"}
      </p>
      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2 text-sm text-foreground/80">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--icon-orange)" }} />
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}
