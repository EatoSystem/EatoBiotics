import { ShieldCheck } from "lucide-react"
import { SYSTEM_SUPPORT_DISCLAIMER, LIFE_SYSTEM_DISCLAIMER } from "@/lib/assessment-disclaimers"
import type { SafetyLevel } from "@/lib/systems"

/**
 * Non-negotiable safety copy for the Systems landing pages. Standard systems
 * show the food-first support framing; `sensitive` (Life) systems add the
 * professional-signposting line. Reuses the Stability MedicalDisclaimer visual.
 * Both strings live in `lib/assessment-disclaimers.ts` and are asserted by tests.
 *
 * `note` appends one further line, in the same shape as the `sensitive` line
 * above it. It exists so the /you marketing page can add GLOBAL_DISCLAIMER —
 * that page needed the professional-advice signposting that
 * SYSTEM_SUPPORT_DISCLAIMER alone does not carry, and a fourth hand-rolled copy
 * of this section's markup was the alternative. Optional and defaulted, so the
 * pages already rendering this component are unchanged.
 *
 * Pass a constant from lib/assessment-disclaimers.ts, not new prose: this
 * component is the safety surface, and its strings are asserted by tests.
 */
export function SystemDisclaimer({
  level,
  className = "",
  note,
}: {
  level: SafetyLevel
  className?: string
  note?: string
}) {
  const sensitive = level === "sensitive"
  return (
    <section className={`px-6 py-10 ${className}`} style={{ background: "#f7f7f5" }}>
      <div className="mx-auto flex max-w-3xl items-start gap-3">
        <ShieldCheck size={18} className="mt-0.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />
        <div className="flex flex-col gap-2">
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            {SYSTEM_SUPPORT_DISCLAIMER}
          </p>
          {sensitive && (
            <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              {LIFE_SYSTEM_DISCLAIMER}
            </p>
          )}
          {note && (
            <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              {note}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
