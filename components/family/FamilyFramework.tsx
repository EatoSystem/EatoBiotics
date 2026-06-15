import { ChevronDown } from "lucide-react"

const MEMBERS = [
  { label: "You", accent: "var(--icon-green)" },
  { label: "Partner", accent: "var(--icon-teal)" },
  { label: "Teen", accent: "var(--icon-yellow)" },
  { label: "Child", accent: "var(--icon-orange)" },
]

/* Product-framework diagram: each family member's gut health score rolls up
   into one Family Food System Score, which contributes to your overall Biotics
   Score™. Pure CSS/SVG — no image asset, fully responsive. */
export function FamilyFramework() {
  return (
    <div className="rounded-3xl border border-border bg-background p-6 shadow-sm sm:p-8">
      {/* Tier 1 — each member */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MEMBERS.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl p-3 text-center"
            style={{
              background: `color-mix(in srgb, ${m.accent} 12%, transparent)`,
              border: `1.5px solid color-mix(in srgb, ${m.accent} 35%, transparent)`,
            }}
          >
            <div className="mx-auto mb-2 h-1 w-8 rounded-full" style={{ background: m.accent }} />
            <p className="text-sm font-semibold text-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center py-2" aria-hidden>
        <ChevronDown size={22} style={{ color: "var(--icon-green)" }} />
      </div>

      {/* Tier 2 — Family Food System Score */}
      <div
        className="rounded-2xl px-6 py-5 text-center text-white shadow-md"
        style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
      >
        <p className="font-serif text-xl font-bold">Family Food System Score</p>
        <p className="mt-1 text-sm text-white/85">How well your whole household eats together</p>
      </div>

      <div className="flex justify-center py-2" aria-hidden>
        <ChevronDown size={22} style={{ color: "var(--icon-green)" }} />
      </div>

      {/* Tier 3 — Biotics Score™ */}
      <div className="rounded-2xl border border-border bg-secondary/40 px-6 py-5 text-center">
        <p className="brand-gradient-text font-serif text-xl font-bold">Biotics Score™</p>
        <p className="mt-1 text-sm text-muted-foreground">Your overall Food System health</p>
      </div>
    </div>
  )
}
