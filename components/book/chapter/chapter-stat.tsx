interface ChapterStatProps {
  value: string
  label: string
  sublabel?: string
  color?: "lime" | "green" | "teal" | "yellow" | "orange"
}

const colorMap: Record<string, string> = {
  lime:   "var(--icon-lime)",
  green:  "var(--icon-green)",
  teal:   "var(--icon-teal)",
  yellow: "var(--icon-yellow)",
  orange: "var(--icon-orange)",
}

export function ChapterStat({ value, label, sublabel, color = "green" }: ChapterStatProps) {
  const c = colorMap[color]
  return (
    <div className="my-10 flex flex-col items-center gap-3 rounded-2xl border border-border bg-secondary/30 px-8 py-10 text-center">
      <div
        className="font-serif text-6xl font-bold sm:text-7xl"
        style={{
          background: `linear-gradient(135deg, ${c}, ${colorMap.teal})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {value}
      </div>
      <p className="max-w-xs text-base font-medium text-foreground">{label}</p>
      {sublabel && (
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{sublabel}</p>
      )}
    </div>
  )
}
