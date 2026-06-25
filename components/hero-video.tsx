"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

/**
 * Drop-in replacement for the static hero illustration: an autoplaying, muted,
 * looping brand video (the "food system inside you" figure) with a poster frame
 * for instant paint. Respects `prefers-reduced-motion` by falling back to the
 * static poster image (no autoplay).
 *
 * The video itself is rendered from the isolated Remotion workspace
 * (FoodSystemHeroLoop) and committed to /public/videos — no Remotion runtime
 * ships with the site.
 */
export function HeroVideo({
  posterSrc,
  mp4Src,
  webmSrc,
  alt,
  className = "",
}: {
  posterSrc: string
  mp4Src: string
  webmSrc?: string
  alt: string
  className?: string
}) {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduceMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  if (reduceMotion) {
    return (
      <Image
        src={posterSrc}
        alt={alt}
        width={900}
        height={900}
        priority
        className={className}
      />
    )
  }

  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      poster={posterSrc}
      preload="metadata"
      aria-label={alt}
      className={className}
    >
      {webmSrc && <source src={webmSrc} type="video/webm" />}
      <source src={mp4Src} type="video/mp4" />
    </video>
  )
}
