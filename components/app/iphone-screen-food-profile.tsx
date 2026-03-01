import Image from "next/image"

export function IPhoneScreenFoodProfile() {
  return (
    <div className="flex flex-col items-center py-4">
      <Image src="/eatobiotics-icon.webp" alt="" width={28} height={28} className="mb-2 h-7 w-7" />
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Food Profile
      </p>

      {/* Food hero */}
      <div className="mt-4 text-center">
        <span className="text-4xl">🧄</span>
        <h3 className="mt-2 font-serif text-base font-semibold text-foreground">Garlic</h3>
        <span className="mt-1 inline-block rounded-full bg-icon-lime/20 px-2 py-0.5 text-[9px] font-medium text-icon-lime">
          Prebiotic
        </span>
      </div>

      {/* Biotic bars */}
      <div className="mt-4 w-full space-y-2 px-3">
        <div>
          <div className="flex justify-between text-[9px]">
            <span className="text-muted-foreground">Prebiotic power</span>
            <span className="font-semibold text-icon-lime">High</span>
          </div>
          <div className="mt-0.5 h-1.5 rounded-full bg-border">
            <div className="h-full w-[90%] rounded-full bg-icon-lime" />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[9px]">
            <span className="text-muted-foreground">Postbiotic support</span>
            <span className="font-semibold text-icon-orange">Medium</span>
          </div>
          <div className="mt-0.5 h-1.5 rounded-full bg-border">
            <div className="h-full w-[55%] rounded-full bg-icon-orange" />
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="mt-4 w-full px-3">
        <p className="text-[9px] font-semibold text-foreground">Key Benefits</p>
        <div className="mt-1.5 space-y-1">
          {["Rich in inulin fiber", "Supports immune function", "Natural antimicrobial"].map(
            (b) => (
              <div key={b} className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-icon-green" />
                <span className="text-[9px] text-muted-foreground">{b}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Pairs with */}
      <div className="mt-4 w-full px-3">
        <p className="text-[9px] font-semibold text-foreground">Pairs With</p>
        <div className="mt-1.5 flex gap-1">
          {["🫒 EVOO", "🧅 Onions", "🍚 Rice"].map((p) => (
            <span
              key={p}
              className="rounded-full border border-border px-1.5 py-0.5 text-[8px] text-muted-foreground"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
