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
  color: string
  gradient: string
  bg: string
  border: string
}> = {
  prebiotic:  {
    label: "Prebiotic",
    color: "#4CB648",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    bg: "#EBF7E1",
    border: "#C4E8A4",
  },
  probiotic:  {
    label: "Probiotic",
    color: "#2DAA6E",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    bg: "#E2F5EF",
    border: "#9ED9C3",
  },
  postbiotic: {
    label: "Postbiotic",
    color: "#A8E063",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))",
    bg: "#F3FBE5",
    border: "#D4F0A4",
  },
  polyphenol: {
    label: "Polyphenol",
    color: "#F5A623",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    bg: "#FEF3E2",
    border: "#FACB88",
  },
}

export function ChapterFoodCard({ emoji, name, type, benefit, howToEat }: ChapterFoodCardProps) {
  const cfg = typeConfig[type]
  return (
    <div
      className="my-8 overflow-hidden rounded-2xl border"
      style={{ borderColor: cfg.border, backgroundColor: cfg.bg }}
    >
      {/* Top gradient line */}
      <div className="h-1 w-full" style={{ background: cfg.gradient }} />

      <div className="flex items-start gap-5 p-5">
        {/* Emoji */}
        <div
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-3xl text-white"
          style={{ background: cfg.gradient }}
          aria-hidden
        >
          {emoji}
        </div>

        <div className="flex-1">
          {/* Type badge + name */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white"
              style={{ background: cfg.gradient }}
            >
              {cfg.label}
            </span>
            <h4 className="font-serif text-base font-semibold text-foreground">{name}</h4>
          </div>

          {/* Benefit */}
          <p className="mt-2 text-sm leading-relaxed text-foreground">{benefit}</p>

          {/* How to eat */}
          {howToEat && (
            <div className="mt-3 flex items-start gap-2">
              <span
                className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: cfg.color }}
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
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
