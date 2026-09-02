"use client"

import { useEffect, useState } from "react"

/**
 * Whether the visitor has asked for less motion.
 *
 * The result reveal is the one place on this journey where motion carries
 * meaning — a score counting up reads as "this is being worked out for you".
 * That is exactly why it has to be optional: nobody should have to sit through
 * an animation to find out their own number.
 *
 * Starts `false` and corrects after mount rather than reading during render, so
 * the server and the first client paint agree. Components using this must
 * therefore treat "animate" as the fallback and make the FINAL value available
 * to assistive technology immediately, not at the end of the animation.
 *
 * Same idiom as components/account/twin/use-count-up.ts and
 * components/digital-twin/count-up.tsx; the listener is added because someone
 * can change the preference while the page is open.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(media.matches)
    const onChange = () => setReduced(media.matches)
    media.addEventListener?.("change", onChange)
    return () => media.removeEventListener?.("change", onChange)
  }, [])

  return reduced
}
