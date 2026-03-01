import Image from "next/image"

export function IPhoneScreenFoodLog() {
  const meals = [
    { time: "Breakfast", items: ["🫐 Blueberries", "🥣 Oats", "🥛 Kefir"], score: "+18" },
    { time: "Lunch", items: ["🥗 Kimchi", "🍚 Brown Rice", "🥑 Avocado"], score: "+22" },
    { time: "Snack", items: ["🍫 Dark Chocolate", "🥜 Walnuts"], score: "+8" },
  ]

  return (
    <div className="flex flex-col items-center py-4">
      <Image src="/eatobiotics-icon.webp" alt="" width={28} height={28} className="mb-2 h-7 w-7" />
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Food Log
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground">Tuesday, Today</p>

      <div className="mt-4 w-full space-y-2.5 px-1">
        {meals.map((meal) => (
          <div
            key={meal.time}
            className="rounded-lg border border-border bg-muted/30 p-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-foreground">{meal.time}</span>
              <span className="text-[10px] font-semibold text-icon-green">{meal.score}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {meal.items.map((item) => (
                <span key={item} className="text-[9px] text-muted-foreground">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 w-full">
        <div className="brand-gradient rounded-full py-2.5 text-center text-xs font-semibold text-background">
          + Log a Meal
        </div>
      </div>
    </div>
  )
}
