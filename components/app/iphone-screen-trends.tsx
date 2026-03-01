import Image from "next/image"

export function IPhoneScreenTrends() {
  // Simplified bar chart data for 7 days
  const days = [
    { label: "Mon", score: 62, color: "var(--icon-teal)" },
    { label: "Tue", score: 78, color: "var(--icon-green)" },
    { label: "Wed", score: 45, color: "var(--icon-yellow)" },
    { label: "Thu", score: 71, color: "var(--icon-teal)" },
    { label: "Fri", score: 83, color: "var(--icon-green)" },
    { label: "Sat", score: 56, color: "var(--icon-yellow)" },
    { label: "Sun", score: 88, color: "var(--icon-green)" },
  ]

  const avgScore = Math.round(days.reduce((a, d) => a + d.score, 0) / days.length)

  return (
    <div className="flex flex-col items-center py-4">
      <Image src="/eatobiotics-icon.webp" alt="" width={28} height={28} className="mb-2 h-7 w-7" />
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Weekly Trends
      </p>

      {/* Average */}
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-serif text-3xl font-semibold text-foreground">{avgScore}</span>
        <span className="text-xs text-muted-foreground">avg</span>
      </div>
      <p className="text-[10px] text-icon-green">↑ 12% vs last week</p>

      {/* Bar chart */}
      <div className="mt-5 flex w-full items-end justify-between gap-1.5 px-2" style={{ height: 80 }}>
        {days.map((day) => (
          <div key={day.label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t"
              style={{
                height: `${(day.score / 100) * 60}px`,
                backgroundColor: day.color,
                minHeight: 4,
              }}
            />
            <span className="text-[8px] text-muted-foreground">{day.label}</span>
          </div>
        ))}
      </div>

      {/* Biotic balance mini */}
      <div className="mt-5 w-full space-y-1.5 px-2">
        <div className="flex items-center gap-2">
          <span className="w-8 text-[9px] text-muted-foreground">Pre</span>
          <div className="h-1.5 flex-1 rounded-full bg-border">
            <div className="h-full w-[72%] rounded-full bg-icon-lime" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-8 text-[9px] text-muted-foreground">Pro</span>
          <div className="h-1.5 flex-1 rounded-full bg-border">
            <div className="h-full w-[58%] rounded-full bg-icon-teal" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-8 text-[9px] text-muted-foreground">Post</span>
          <div className="h-1.5 flex-1 rounded-full bg-border">
            <div className="h-full w-[44%] rounded-full bg-icon-orange" />
          </div>
        </div>
      </div>
    </div>
  )
}
