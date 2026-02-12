"use client"

import Image from "next/image"

export function BioticsPlate() {
  return (
    <div className="relative h-[320px] w-[320px] sm:h-[400px] sm:w-[400px]">
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-2 border-border" />

      {/* Three segments */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
        {/* Prebiotics segment — lime */}
        <path
          d="M100,100 L100,10 A90,90 0 0,1 177.94,145 Z"
          fill="var(--icon-lime)"
          fillOpacity={0.2}
          stroke="var(--icon-lime)"
          strokeWidth={1.5}
        />
        {/* Probiotics segment — teal */}
        <path
          d="M100,100 L177.94,145 A90,90 0 0,1 22.06,145 Z"
          fill="var(--icon-teal)"
          fillOpacity={0.2}
          stroke="var(--icon-teal)"
          strokeWidth={1.5}
        />
        {/* Postbiotics segment — orange */}
        <path
          d="M100,100 L22.06,145 A90,90 0 0,1 100,10 Z"
          fill="var(--icon-orange)"
          fillOpacity={0.2}
          stroke="var(--icon-orange)"
          strokeWidth={1.5}
        />

        {/* Center circle */}
        <circle cx="100" cy="100" r="30" fill="white" stroke="var(--border)" strokeWidth={1} />
      </svg>

      {/* Labels */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center sm:top-6">
        <p className="text-sm font-bold text-icon-lime">Prebiotics</p>
        <p className="text-xs text-muted-foreground">Feed</p>
      </div>

      <div className="absolute bottom-8 right-2 text-center sm:right-4 sm:bottom-10">
        <p className="text-sm font-bold text-icon-teal">Probiotics</p>
        <p className="text-xs text-muted-foreground">Add</p>
      </div>

      <div className="absolute bottom-8 left-2 text-center sm:left-4 sm:bottom-10">
        <p className="text-sm font-bold text-icon-orange">Postbiotics</p>
        <p className="text-xs text-muted-foreground">Produce</p>
      </div>

      {/* Center label with icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src="/eatobiotics-icon.webp"
          alt=""
          width={40}
          height={40}
          className="h-10 w-10"
        />
      </div>
    </div>
  )
}
