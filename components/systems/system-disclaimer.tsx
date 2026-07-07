import { ShieldCheck } from "lucide-react"
import { SYSTEM_SUPPORT_DISCLAIMER, LIFE_SYSTEM_DISCLAIMER } from "@/lib/assessment-disclaimers"
import type { SafetyLevel } from "@/lib/systems"

/**
 * Non-negotiable safety copy for the Systems landing pages. Standard systems
 * show the food-first support framing; `sensitive` (Life) systems add the
 * professional-signposting line. Reuses the Stability MedicalDisclaimer visual.
 * Both strings live in `lib/assessment-disclaimers.ts` and are asserted by tests.
 */
export function SystemDisclaimer({ level, className = "" }: { level: SafetyLevel; className?: string }) {
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
        </div>
      </div>
    </section>
  )
}
