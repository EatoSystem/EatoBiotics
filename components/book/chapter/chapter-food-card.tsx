type BioticType = "prebiotic" | "probiotic" | "postbiotic" | "polyphenol"

interface ChapterFoodCardProps {
  emoji: string
  name: string
  type: BioticType
  benefit: string
  howToEat?: string
}

const typeConfig: Record<BioticType, { label: string; color: string; bg: string; border: string }> = {
  prebiotic:  { label: "Prebiotic",  color: "#4CB648", bg: "#EBF7E1", border: "#C4E8A4" },
  probiotic:  { label: "Probiotic",  color: "#2DAA6E", bg: "#E2F5EF", border: "#9ED9C3" },
  postbiotic: { label: "Postbiotic", color: "#A8E063", bg: "#F3FBE5", border: "#D4F0A4" },
  polyphenol: { label: "Polyphenol", color: "#F5A623", bg: "#FEF3E2", border: "#FACB88" },
}

export function ChapterFoodCard({ emoji, name, type, benefit, howToEat }: ChapterFoodCardProps) {
  const cfg = typeConfig[type]
  return (
    <div
      className="my-6 flex items-start gap-5 rounded-2xl border p-5"
      style={{ borderColor: cfg.border, backgroundColor: cfg.bg }}
    >
      {/* Emoji circle */}
      <div
        className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-3xl"
        style={{ backgroundColor: cfg.color + "22" }}
        aria-hidden
      >
        {emoji}
      </div>

      <div className="flex-1">
        {/* Type badge + name */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
            style={{ backgroundColor: cfg.color + "22", color: cfg.color }}
          >
            {cfg.label}
          </span>
          <h4 className="font-serif text-base font-semibold text-foreground">{name}</h4>
        </div>

        {/* Benefit */}
        <p className="mt-2 text-sm leading-relaxed text-foreground">{benefit}</p>

        {/* How to eat */}
        {howToEat && (
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold">On your plate: </span>
            {howToEat}
          </p>
        )}
      </div>
    </div>
  )
}
