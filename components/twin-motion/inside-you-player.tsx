"use client"

/**
 * InsideYouPlayer — the interactive chrome around the "Inside You" Remotion
 * composition: an embedded @remotion/player (loop + muted autoplay) with
 * chapter pills that seek the story, play/pause, and a per-chapter takeaway.
 * Loaded only via next/dynamic (ssr:false) so Remotion stays out of the server
 * bundle and off non-account pages.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { Player, type PlayerRef } from "@remotion/player"
import { Pause, Play } from "lucide-react"
import { InsideYouComposition } from "./inside-you-composition"
import {
  INSIDE_YOU_DURATION_FRAMES,
  INSIDE_YOU_FPS,
  chapterIndexAtFrame,
  type InsideYouChapter,
} from "@/lib/account/inside-you"

const CHAPTER_COLORS = ["#4CB648", "#A8E063", "#2DAA6E", "#F5A623"]

export default function InsideYouPlayer({ chapters }: { chapters: InsideYouChapter[] }) {
  const playerRef = useRef<PlayerRef>(null)
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(true)

  /* Track the playhead → highlight the active chapter pill. */
  useEffect(() => {
    const p = playerRef.current
    if (!p) return
    const onFrame = (e: { detail: { frame: number } }) => {
      const idx = chapterIndexAtFrame(e.detail.frame)
      setActive((cur) => (cur === idx ? cur : idx))
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    p.addEventListener("frameupdate", onFrame)
    p.addEventListener("play", onPlay)
    p.addEventListener("pause", onPause)
    return () => {
      p.removeEventListener("frameupdate", onFrame)
      p.removeEventListener("play", onPlay)
      p.removeEventListener("pause", onPause)
    }
  }, [])

  const seekChapter = useCallback((ch: InsideYouChapter, idx: number) => {
    const p = playerRef.current
    if (!p) return
    p.seekTo(ch.fromFrame)
    p.play()
    setActive(idx)
  }, [])

  const togglePlay = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    if (p.isPlaying()) p.pause()
    else p.play()
  }, [])

  const activeChapter = chapters[active]

  return (
    <div>
      {/* stage — cinema frame on the dark band */}
      <div className="relative overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(253,251,247,0.14)", boxShadow: "0 18px 60px rgba(0,0,0,0.45)" }}>
        <Player
          ref={playerRef}
          component={InsideYouComposition}
          inputProps={{ chapters }}
          durationInFrames={INSIDE_YOU_DURATION_FRAMES}
          fps={INSIDE_YOU_FPS}
          compositionWidth={1280}
          compositionHeight={720}
          style={{ width: "100%" }}
          autoPlay
          loop
          initiallyMuted
          clickToPlay={false}
          controls={false}
          acknowledgeRemotionLicense
        />
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md transition-transform hover:scale-105"
          style={{ color: "var(--icon-green)", border: "1px solid var(--border)" }}
        >
          {playing ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
        </button>
      </div>

      {/* chapter pills */}
      <div className="mt-3 flex flex-wrap gap-2">
        {chapters.map((ch, i) => {
          const isActive = i === active
          const c = CHAPTER_COLORS[i] ?? "#4CB648"
          return (
            <button
              key={ch.key}
              type="button"
              onClick={() => seekChapter(ch, i)}
              className="flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold backdrop-blur transition-all"
              style={{
                background: isActive ? c : "rgba(253,251,247,0.07)",
                color: isActive ? "#0B1607" : "rgba(253,251,247,0.75)",
                border: `1px solid ${isActive ? c : "rgba(253,251,247,0.18)"}`,
                boxShadow: isActive ? `0 4px 20px ${c}55` : "none",
              }}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full text-[9px]" style={{ background: isActive ? "rgba(11,22,7,0.18)" : `${c}26`, color: isActive ? "#0B1607" : c }}>
                {i + 1}
              </span>
              {ch.label}
              {ch.value != null && (
                <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: isActive ? "rgba(11,22,7,0.16)" : `${c}1f`, color: isActive ? "#0B1607" : c }}>
                  {ch.value}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* takeaway for the active chapter */}
      {activeChapter && (
        <p className="mt-2.5 rounded-xl px-4 py-3 text-sm leading-relaxed backdrop-blur" style={{ background: "rgba(253,251,247,0.06)", border: "1px solid rgba(253,251,247,0.14)", color: "rgba(253,251,247,0.88)" }}>
          {activeChapter.takeaway}
        </p>
      )}
    </div>
  )
}
