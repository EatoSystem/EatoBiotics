"use client"

import { useState, useEffect } from "react"

interface ScoreRingProps {
  score: number
  color: string // CSS var — profile color
  gradientId: string // unique SVG gradient id
  profileType?: string
}

export function ScoreRing({ score, color, gradientId, profileType }: ScoreRingProps) {
  const [animated, setAnimated] = useState(0)

  const r = 88
  const circumference = 2 * Math.PI * r
  const progress = (animated / 100) * circumference

  useEffect(() => {
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
  }, [score])

  return (
    <div className="relative mx-auto h-56 w-56 sm:h-64 sm:w-64">
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
          stroke="var(--border)"
          strokeWidth="8"
          strokeOpacity="0.6"
        />
        {/* Progress */}
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-6xl font-semibold leading-none text-foreground">
          {animated}
        </span>
        <span className="mt-1 text-sm text-muted-foreground">/ 100</span>
        {profileType && (
          <span
            className="mt-2 text-xs font-semibold"
            style={{ color }}
          >
            {profileType}
          </span>
        )}
      </div>
    </div>
  )
}
