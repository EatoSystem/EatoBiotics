"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"

/**
 * Drop-in replacement for the static hero illustration: an autoplaying, muted,
 * looping brand video (the "food system inside you" figure). The poster paints
 * instantly and also covers the case where a browser blocks autoplay.
 *
 * The video is rendered from the isolated Remotion workspace (FoodSystemHeroLoop)
 * and committed to /public/videos — no Remotion runtime ships with the site.
 *
 * Note: this intentionally autoplays regardless of `prefers-reduced-motion` — it
 * is the page's hero centrepiece. A `<noscript>` static-image fallback is kept
 * for no-JS clients.
 *
 * `mix-blend-mode: multiply` makes the video's white background dissolve into the
 * pure-white page (white × white = white), so there's no visible off-white tile —
 * only the figure and its glow show. Same pattern as components/home/eatosystem-teaser.
 *
 * React doesn't reliably reflect the `muted` JSX prop into the server-rendered
 * HTML's `muted` attribute, so on a cold SSR load the browser can evaluate
 * autoplay against markup that looks unmuted and silently block it — the video
 * then sits frozen on the poster frame until something else nudges it. Setting
 * `.muted` imperatively and re-requesting playback once mounted fixes that.
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
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    video.play().catch(() => {
      // Autoplay still blocked (e.g. a data-saver mode) — the poster stays visible.
    })
  }, [])

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        poster={posterSrc}
        preload="auto"
        aria-label={alt}
        className={className}
        style={{ mixBlendMode: "multiply" }}
      >
        {webmSrc && <source src={webmSrc} type="video/webm" />}
        <source src={mp4Src} type="video/mp4" />
      </video>
      <noscript>
        <Image src={posterSrc} alt={alt} width={900} height={900} priority className={className} />
      </noscript>
    </>
  )
}
