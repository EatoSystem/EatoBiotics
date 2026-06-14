import { ChevronDown } from "lucide-react"

const INPUTS = [
  { label: "Food", accent: "var(--icon-lime)" },
  { label: "Rhythm", accent: "var(--icon-green)" },
  { label: "Comfort", accent: "var(--icon-teal)" },
  { label: "Confidence", accent: "var(--icon-yellow)" },
]

/* Product-framework diagram: the four Stability systems converge into the
   Stability Score™, which contributes to the overall Biotics Score™.
   Pure CSS/SVG — no image asset, fully responsive. */
export function StabilityFramework() {
  return (
    <div className="rounded-3xl border border-border bg-background p-6 shadow-sm sm:p-8">
      {/* Tier 1 — the four inputs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {INPUTS.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-3 text-center"
            style={{
              background: `color-mix(in srgb, ${s.accent} 12%, transparent)`,
              border: `1.5px solid color-mix(in srgb, ${s.accent} 35%, transparent)`,
            }}
          >
            <div className="mx-auto mb-2 h-1 w-8 rounded-full" style={{ background: s.accent }} />
            <p className="text-sm font-semibold text-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center py-2" aria-hidden>
        <ChevronDown size={22} style={{ color: "var(--icon-teal)" }} />
      </div>

      {/* Tier 2 — Stability Score™ */}
      <div
        className="rounded-2xl px-6 py-5 text-center text-white shadow-md"
        style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
      >
        <p className="font-serif text-xl font-bold">Stability Score™</p>
        <p className="mt-1 text-sm text-white/80">How reliably your Food System performs</p>
      </div>

      <div className="flex justify-center py-2" aria-hidden>
        <ChevronDown size={22} style={{ color: "var(--icon-teal)" }} />
      </div>

      {/* Tier 3 — Biotics Score™ */}
      <div className="rounded-2xl border border-border bg-secondary/40 px-6 py-5 text-center">
        <p className="brand-gradient-text font-serif text-xl font-bold">Biotics Score™</p>
        <p className="mt-1 text-sm text-muted-foreground">Your overall Food System health</p>
      </div>
    </div>
  )
}
