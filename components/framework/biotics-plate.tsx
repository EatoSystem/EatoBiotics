"use client"

export function BioticsPlate() {
  return (
    <div className="relative h-[320px] w-[320px] sm:h-[400px] sm:w-[400px]">
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-2 border-[var(--border)]" />

      {/* Three segments using conic-gradient */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
        {/* Prebiotics segment - green */}
        <path
          d="M100,100 L100,10 A90,90 0 0,1 177.94,145 Z"
          fill="#A8E063"
          fillOpacity={0.25}
          stroke="#A8E063"
          strokeWidth={1.5}
        />
        {/* Probiotics segment - lime/yellow */}
        <path
          d="M100,100 L177.94,145 A90,90 0 0,1 22.06,145 Z"
          fill="#C8E620"
          fillOpacity={0.25}
          stroke="#C8E620"
          strokeWidth={1.5}
        />
        {/* Postbiotics segment - orange */}
        <path
          d="M100,100 L22.06,145 A90,90 0 0,1 100,10 Z"
          fill="#F0921A"
          fillOpacity={0.25}
          stroke="#F0921A"
          strokeWidth={1.5}
        />

        {/* Center circle */}
        <circle cx="100" cy="100" r="30" fill="white" stroke="var(--border)" strokeWidth={1} />
      </svg>

      {/* Labels */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center sm:top-6">
        <p className="text-sm font-semibold text-[#56C135]">Prebiotics</p>
        <p className="text-xs text-[var(--muted-foreground)]">Feed</p>
      </div>

      <div className="absolute bottom-8 right-2 text-center sm:right-4 sm:bottom-10">
        <p className="text-sm font-semibold text-[#C8A620]">Probiotics</p>
        <p className="text-xs text-[var(--muted-foreground)]">Add</p>
      </div>

      <div className="absolute bottom-8 left-2 text-center sm:left-4 sm:bottom-10">
        <p className="text-sm font-semibold text-[#F0921A]">Postbiotics</p>
        <p className="text-xs text-[var(--muted-foreground)]">Produce</p>
      </div>

      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="font-serif text-sm text-[var(--foreground)]">You</p>
      </div>
    </div>
  )
}
