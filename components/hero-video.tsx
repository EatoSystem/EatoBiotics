"use client"

import { useEffect, useRef, useState } from "react"
import { Pause, Play } from "lucide-react"

/**
 * Drop-in replacement for the static hero illustration: a muted, looping brand
 * video (the "food system inside you" figure). The poster paints instantly and
 * also covers the case where a browser blocks playback.
 *
 * The video is rendered from the isolated Remotion workspace (FoodSystemHeroLoop)
 * and committed to /public/videos — no Remotion runtime ships with the site.
 *
 * ── Motion ──
 * This used to carry a bare `autoPlay` and a comment saying it played
 * "regardless of prefers-reduced-motion" because it is the page's centrepiece.
 * MOTION_CONSTITUTION.md says reduced motion "is honoured everywhere,
 * automatically", and every other animation in the codebase complies, so the
 * exception was not one the constitution allows.
 *
 * Playback is now started from an effect rather than by the `autoPlay`
 * attribute, and only when the visitor has not asked for reduced motion. Two
 * consequences worth knowing:
 *   - Members who ask for reduced motion get the poster frame, which is the
 *     same composition, and can start the video themselves if they want it.
 *   - With JavaScript off nothing calls play(), so the poster is what renders.
 *     That is why the old <noscript> image is gone: it duplicated the poster,
 *     so no-JS visitors were shown the figure twice.
 * The OS setting is watched live, so toggling it pauses or resumes without a
 * reload.
 *
 * The play/pause control only appears after mount, so it is never painted as a
 * dead button for a visitor without JavaScript. It positions itself against the
 * nearest positioned ancestor; every call site provides one.
 *
 * `mix-blend-mode: multiply` makes the video's white background dissolve into the
 * pure-white page (white × white = white), so there's no visible off-white tile —
 * only the figure and its glow show. Same pattern as components/home/eatosystem-teaser.
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
  const [playing, setPlaying] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const media = window.matchMedia("(prefers-reduced-motion: reduce)")

    function apply() {
      const video = videoRef.current
      if (!video) return
      if (media.matches) {
        video.pause()
      } else {
        // Autoplay can still be refused (low power mode, browser policy). The
        // poster stays up and the control offers a manual start.
        void video.play().catch(() => {})
      }
    }

    apply()
    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [])

  function toggle() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play().catch(() => {})
    else video.pause()
  }

  return (
    <>
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        poster={posterSrc}
        preload="auto"
        aria-label={alt}
        className={className}
        style={{ mixBlendMode: "multiply" }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        {webmSrc && <source src={webmSrc} type="video/webm" />}
        <source src={mp4Src} type="video/mp4" />
      </video>

      {mounted && (
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `Pause animation: ${alt}` : `Play animation: ${alt}`}
          className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:bg-background hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-icon-green"
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
      )}
    </>
  )
}
