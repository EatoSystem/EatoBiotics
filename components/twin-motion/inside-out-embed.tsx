"use client"

/**
 * InsideOutEmbed — client boundary that lazy-loads the inside-out EatoSystem
 * animation player (ssr:false keeps Remotion out of the server bundle and off
 * the critical path).
 */

import dynamic from "next/dynamic"

const InsideOutPlayer = dynamic(() => import("./inside-out-player"), {
  ssr: false,
  loading: () => (
    <div
      className="flex aspect-video w-full items-center justify-center rounded-2xl"
      style={{ background: "linear-gradient(175deg, #0B1607 0%, #16290F 100%)", border: "1px solid rgba(253,251,247,0.14)" }}
    >
      <p className="text-xs font-semibold" style={{ color: "rgba(253,251,247,0.6)" }}>Loading the Food System…</p>
    </div>
  ),
})

export function InsideOutEmbed() {
  return <InsideOutPlayer />
}
