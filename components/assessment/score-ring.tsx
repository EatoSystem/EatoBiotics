"use client"

import { useState, useEffect } from "react"
import { usePrefersReducedMotion } from "./result/use-reduced-motion"

interface ScoreRingProps {
  score: number
  color: string // CSS var — profile color
  gradientId: string // unique SVG gradient id
  profileType?: string
  className?: string // override default sizing
  textColor?: string // override center text color (e.g. "white" for dark bg)
}

/*
 * The `percentile` prop and its "Top {100 - percentile}%" badge are gone.
 *
 * It rendered a rank derived from lib/percentile.ts — a normal CDF against an
 * ASSUMED mean of 55 and std of 17, with no observed population behind it at
 * any score. "Top 28%" reads as a fact about other people and was not one.
 *
 * Removed at the component rather than at the two call sites, so a third
 * caller cannot reintroduce it by passing a prop that still exists.
 */
export function ScoreRing({ score, color, gradientId, profileType, className, textColor }: ScoreRingProps) {
  const reducedMotion = usePrefersReducedMotion()
  const [animated, setAnimated] = useState(0)

  const r = 88
  const circumference = 2 * Math.PI * r
  const progress = (animated / 100) * circumference

  /* The ring sweeps to the score, or arrives at it.
   *
   * This used to run unconditionally: fifty setInterval ticks over a
   * second, with no reduced-motion check anywhere. Someone who has asked
   * their system for less motion still had to watch the arc travel before
   * the ring showed their result. */
  useEffect(() => {
    if (reducedMotion) {
      setAnimated(score)
      return
    }
    const target = score
    const duration = 1000
    const steps = 50
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setAnimated(target)
        clearInterval(timer)
      } else {
        setAnimated(Math.round(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [score, reducedMotion])

  return (
    <div className={className ?? "relative mx-auto h-56 w-56 sm:h-64 sm:w-64"}>
      {/* Radial glow */}
      <div
        className="absolute inset-0 rounded-full opacity-10"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 70%)`,
        }}
      />

      <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--icon-lime)" />
            <stop offset="25%" stopColor="var(--icon-green)" />
            <stop offset="60%" stopColor="var(--icon-teal)" />
            <stop offset="80%" stopColor="var(--icon-yellow)" />
            <stop offset="100%" stopColor="var(--icon-orange)" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke={textColor === "white" ? "rgba(255,255,255,0.12)" : "var(--border)"}
          strokeWidth="11"
          strokeOpacity="1"
        />
        {/* Progress */}
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-baseline gap-0.5">
          <span
            className="font-serif text-5xl font-bold leading-none"
            style={{ color: textColor ?? "var(--foreground)" }}
          >
            {animated}
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: textColor ? `${textColor === "white" ? "rgba(255,255,255,0.5)" : textColor}` : "var(--muted-foreground)" }}
          >
            /100
          </span>
        </div>
        {profileType && (
          <span
            className="mt-1.5 max-w-[80%] text-center text-[10px] font-semibold leading-tight"
            style={{ color: textColor === "white" ? `color-mix(in srgb, ${color} 90%, white)` : color }}
          >
            {profileType}
          </span>
        )}
      </div>
    </div>
  )
}
