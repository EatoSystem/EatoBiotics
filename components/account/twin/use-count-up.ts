"use client"

/**
 * useCountUp — animates a number from 0 to `target` once on mount (eased),
 * for the Twin Stage score cockpit. Respects prefers-reduced-motion (jumps
 * straight to the target) and re-runs if the target itself changes.
 */

import { useEffect, useState } from "react"

export function useCountUp(target: number, durationMs = 1400): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return value
}
