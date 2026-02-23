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
  const c2 = colorMap[color === "green" ? "teal" : color === "lime" ? "green" : "teal"]

  return (
    <div className="my-10 overflow-hidden rounded-2xl border border-border bg-background">
      {/* Top accent line */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${c}, ${c2}, transparent)`,
        }}
      />
      <div className="flex flex-col items-center gap-3 px-8 py-10 text-center">
        {/* Big gradient number */}
        <div
          className="font-serif text-7xl font-bold leading-none sm:text-8xl"
          style={{
            background: `linear-gradient(135deg, ${c} 0%, ${c2} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {value}
        </div>
        <p className="max-w-sm text-base font-semibold text-foreground">{label}</p>
        {sublabel && (
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{sublabel}</p>
        )}
      </div>
    </div>
  )
}
