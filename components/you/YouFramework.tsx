import { ChevronDown } from "lucide-react"

const BIOTICS = [
  { label: "Prebiotics", verb: "Feed", accent: "var(--icon-lime)" },
  { label: "Probiotics", verb: "Seed", accent: "var(--icon-teal)" },
  { label: "Postbiotics", verb: "Regenerate", accent: "var(--icon-orange)" },
]

const OUTPUTS = ["Energy", "Immunity", "Mood", "Longevity"]

/* Product-framework diagram: the three Biotics build your EatoBiotics Score™ —
   the measurable output that shapes energy, immunity, mood, and long-term
   health. Pure CSS/SVG — no image asset, fully responsive. */
export function YouFramework() {
  return (
    <div className="rounded-3xl border border-border bg-background p-6 shadow-sm sm:p-8">
      {/* Tier 1 — the three biotics */}
      <div className="grid grid-cols-3 gap-3">
        {BIOTICS.map((b) => (
          <div
            key={b.label}
            className="rounded-2xl p-3 text-center"
            style={{
              background: `color-mix(in srgb, ${b.accent} 12%, transparent)`,
              border: `1.5px solid color-mix(in srgb, ${b.accent} 35%, transparent)`,
            }}
          >
            <div className="mx-auto mb-2 h-1 w-8 rounded-full" style={{ background: b.accent }} />
            <p className="text-sm font-semibold text-foreground">{b.label}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: b.accent }}>{b.verb}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center py-2" aria-hidden>
        <ChevronDown size={22} style={{ color: "var(--icon-green)" }} />
      </div>

      {/* Tier 2 — EatoBiotics / Biotics Score™ */}
      <div
        className="rounded-2xl px-6 py-5 text-center text-white shadow-md"
        style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
      >
        <p className="font-serif text-xl font-bold">Biotics Score™</p>
        <p className="mt-1 text-sm text-white/85">How well-fed your food system is</p>
      </div>

      <div className="flex justify-center py-2" aria-hidden>
        <ChevronDown size={22} style={{ color: "var(--icon-green)" }} />
      </div>

      {/* Tier 3 — what it shapes */}
      <div className="rounded-2xl border border-border bg-secondary/40 px-6 py-5 text-center">
        <p className="brand-gradient-text font-serif text-xl font-bold">Energy · Immunity · Mood</p>
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {OUTPUTS.map((o) => (
            <span key={o} className="rounded-full bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{o}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
