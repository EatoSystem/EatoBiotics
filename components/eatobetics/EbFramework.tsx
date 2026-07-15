import { ChevronDown } from "lucide-react"

const INPUTS = [
  { label: "Stability", accent: "var(--icon-orange)" },
  { label: "Energy", accent: "var(--icon-green)" },
  { label: "Rhythm", accent: "var(--icon-teal)" },
]

/* Pathway-framework diagram: the three Glucose pillars converge into the
   Glucose Score, which contributes to the overall Biotics Score™.
   Pure CSS/SVG — no image asset, fully responsive. */
export function EbFramework() {
  return (
    <div className="rounded-3xl border border-border bg-background p-6 shadow-sm sm:p-8">
      {/* Tier 1 — the three pillars */}
      <div className="grid grid-cols-3 gap-3">
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
        <ChevronDown size={22} style={{ color: "var(--icon-orange)" }} />
      </div>

      {/* Tier 2 — Glucose Score */}
      <div
        className="rounded-2xl px-6 py-5 text-center text-white shadow-md"
        style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}
      >
        <p className="font-serif text-xl font-bold">Glucose Score</p>
        <p className="mt-1 text-sm text-white/85">How steady your glucose system runs</p>
      </div>

      <div className="flex justify-center py-2" aria-hidden>
        <ChevronDown size={22} style={{ color: "var(--icon-orange)" }} />
      </div>

      {/* Tier 3 — Biotics Score™ */}
      <div className="rounded-2xl border border-border bg-secondary/40 px-6 py-5 text-center">
        <p className="brand-gradient-text font-serif text-xl font-bold">Biotics Score™</p>
        <p className="mt-1 text-sm text-muted-foreground">Your overall Food System health</p>
      </div>
    </div>
  )
}
