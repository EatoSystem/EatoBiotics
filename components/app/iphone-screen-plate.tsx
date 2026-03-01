import Image from "next/image"

export function IPhoneScreenPlate() {
  const quadrants = [
    { label: "Fiber", color: "var(--icon-lime)", items: ["🧄", "🧅", "🥣"], pct: 75 },
    { label: "Fermented", color: "var(--icon-teal)", items: ["🥛", "🍶"], pct: 50 },
    { label: "Protein", color: "var(--icon-yellow)", items: ["🐟", "🥚", "🫘"], pct: 100 },
    { label: "Fats", color: "var(--icon-orange)", items: ["🫒", "🥑"], pct: 50 },
  ]

  return (
    <div className="flex flex-col items-center py-4">
      <Image src="/eatobiotics-icon.webp" alt="" width={28} height={28} className="mb-2 h-7 w-7" />
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        My Plate
      </p>

      {/* Plate circle */}
      <div className="relative mt-4 h-32 w-32">
        {/* Plate background */}
        <div className="absolute inset-0 rounded-full border-2 border-border" />

        {/* Quadrant lines */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border" />
        <div className="absolute top-1/2 right-0 left-0 h-px bg-border" />

        {/* Quadrant emojis */}
        <div className="absolute top-2 left-2 flex gap-0.5 text-sm">
          {quadrants[0].items.map((e, i) => (
            <span key={i}>{e}</span>
          ))}
        </div>
        <div className="absolute top-2 right-2 flex gap-0.5 text-sm">
          {quadrants[1].items.map((e, i) => (
            <span key={i}>{e}</span>
          ))}
        </div>
        <div className="absolute bottom-2 left-2 flex gap-0.5 text-sm">
          {quadrants[2].items.map((e, i) => (
            <span key={i}>{e}</span>
          ))}
        </div>
        <div className="absolute right-2 bottom-2 flex gap-0.5 text-sm">
          {quadrants[3].items.map((e, i) => (
            <span key={i}>{e}</span>
          ))}
        </div>
      </div>

      {/* Quadrant labels */}
      <div className="mt-4 grid w-full grid-cols-2 gap-2 px-2">
        {quadrants.map((q) => (
          <div key={q.label} className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: q.color }} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-medium text-foreground">{q.label}</span>
                <span className="text-[8px] text-muted-foreground">{q.pct}%</span>
              </div>
              <div className="mt-0.5 h-1 rounded-full bg-border">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${q.pct}%`,
                    backgroundColor: q.color,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 w-full">
        <div className="brand-gradient rounded-full py-2.5 text-center text-xs font-semibold text-background">
          Build Your Plate
        </div>
      </div>
    </div>
  )
}
