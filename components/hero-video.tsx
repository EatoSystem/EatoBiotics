import Image from "next/image"

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
  return (
    <>
      <video
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
