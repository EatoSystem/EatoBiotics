type BioticType = "prebiotic" | "probiotic" | "postbiotic" | "polyphenol"

interface ChapterFoodCardProps {
  emoji: string
  name: string
  type: BioticType
  benefit: string
  howToEat?: string
}

const typeConfig: Record<BioticType, {
  label: string
  gradient: string
  accentColor: string
  eyebrowClass: string
}> = {
  prebiotic:  {
    label: "Prebiotic",
    gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))",
    accentColor: "var(--icon-green)",
    eyebrowClass: "text-icon-green",
  },
  probiotic:  {
    label: "Probiotic",
    gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))",
    accentColor: "var(--icon-teal)",
    eyebrowClass: "text-icon-teal",
  },
  postbiotic: {
    label: "Postbiotic",
    gradient: "linear-gradient(90deg, var(--icon-teal), var(--icon-lime))",
    accentColor: "var(--icon-lime)",
    eyebrowClass: "text-icon-lime",
  },
  polyphenol: {
    label: "Polyphenol",
    gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))",
    accentColor: "var(--icon-orange)",
    eyebrowClass: "text-icon-orange",
  },
}

export function ChapterFoodCard({ emoji, name, type, benefit, howToEat }: ChapterFoodCardProps) {
  const cfg = typeConfig[type]
  return (
    <div className="relative my-8 overflow-hidden rounded-2xl border border-border bg-background">
      {/* Thin top gradient — same pattern as food page benefit cards */}
      <div className="h-0.5 w-full" style={{ background: cfg.gradient }} />

      <div className="flex items-start gap-4 p-5">
        {/* Emoji in a plain rounded box */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-secondary text-2xl" aria-hidden>
          {emoji}
        </div>

        <div className="flex-1 min-w-0">
          {/* Eyebrow + name */}
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-[11px] font-bold uppercase tracking-widest ${cfg.eyebrowClass}`}>
              {cfg.label}
            </p>
            <span className="text-border">·</span>
            <h4 className="font-serif text-base font-semibold text-foreground">{name}</h4>
          </div>

          {/* Benefit */}
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{benefit}</p>

          {/* How to eat */}
          {howToEat && (
            <div
              className="mt-3 rounded-xl border border-border bg-secondary/40 px-4 py-3"
              style={{ borderLeftWidth: "3px", borderLeftColor: cfg.accentColor }}
            >
              <p className="text-xs leading-relaxed text-foreground">
                <span className="font-semibold text-foreground">On your plate: </span>
                {howToEat}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
