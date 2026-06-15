import { ChevronDown } from "lucide-react"

const NEUROTRANSMITTERS = [
  { label: "Serotonin", accent: "var(--icon-lime)" },
  { label: "GABA", accent: "var(--icon-teal)" },
  { label: "Dopamine", accent: "var(--icon-orange)" },
]

/* Product-framework diagram: the gut-brain axis. Food feeds your gut
   microbiome, which produces the neurotransmitters that shape your mind.
   Pure CSS/SVG — no image asset, fully responsive. */
export function MindFramework() {
  return (
    <div className="rounded-3xl border border-border bg-background p-6 shadow-sm sm:p-8">
      {/* Tier 1 — Food */}
      <div className="rounded-2xl border border-border bg-secondary/40 px-6 py-4 text-center">
        <p className="font-serif text-lg font-bold text-foreground">What you eat</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Fibre · polyphenols · fermented foods</p>
      </div>

      <div className="flex justify-center py-2" aria-hidden>
        <ChevronDown size={22} style={{ color: "var(--icon-teal)" }} />
      </div>

      {/* Tier 2 — Gut microbiome */}
      <div
        className="rounded-2xl px-6 py-4 text-center text-white shadow-md"
        style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
      >
        <p className="font-serif text-lg font-bold">Your gut microbiome</p>
        <p className="mt-0.5 text-sm text-white/85">100 trillion microbes, fed by your food</p>
      </div>

      <div className="flex justify-center py-2" aria-hidden>
        <ChevronDown size={22} style={{ color: "var(--icon-teal)" }} />
      </div>

      {/* Tier 3 — Neurotransmitters */}
      <div className="grid grid-cols-3 gap-3">
        {NEUROTRANSMITTERS.map((n) => (
          <div
            key={n.label}
            className="rounded-2xl p-3 text-center"
            style={{
              background: `color-mix(in srgb, ${n.accent} 12%, transparent)`,
              border: `1.5px solid color-mix(in srgb, ${n.accent} 35%, transparent)`,
            }}
          >
            <div className="mx-auto mb-2 h-1 w-8 rounded-full" style={{ background: n.accent }} />
            <p className="text-sm font-semibold text-foreground">{n.label}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center py-2" aria-hidden>
        <ChevronDown size={22} style={{ color: "var(--icon-teal)" }} />
      </div>

      {/* Tier 4 — Your mind */}
      <div className="rounded-2xl border border-border bg-secondary/40 px-6 py-4 text-center">
        <p className="brand-gradient-text font-serif text-xl font-bold">Your mind</p>
        <p className="mt-0.5 text-sm text-muted-foreground">Mood · focus · clarity · resilience</p>
      </div>
    </div>
  )
}
