"use client"

import { useEffect, useState } from "react"

interface PillarRadarProps {
  subScores: {
    diversity: number
    feeding: number
    adding: number
    consistency: number
    feeling: number
  }
  size?: number
}

// Order: Diversity (top), Feeding (top-right), Adding (bottom-right), Consistency (bottom-left), Feeling (top-left)
const PILLARS = [
  { key: "diversity",    label: "Diversity",    color: "var(--icon-lime)" },
  { key: "feeding",      label: "Feeding",      color: "var(--icon-green)" },
  { key: "adding",       label: "Live Foods",   color: "var(--icon-teal)" },
  { key: "consistency",  label: "Consistency",  color: "var(--icon-yellow)" },
  { key: "feeling",      label: "Feeling",      color: "var(--icon-orange)" },
] as const

function pentagonPoint(cx: number, cy: number, r: number, index: number): [number, number] {
  // Start from top (-90°), go clockwise
  const angle = (Math.PI / 180) * (-90 + index * 72)
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
}

function polygonPoints(cx: number, cy: number, scores: number[], maxR: number): string {
  return scores
    .map((score, i) => {
      const r = (score / 100) * maxR
      const [x, y] = pentagonPoint(cx, cy, r, i)
      return `${x},${y}`
    })
    .join(" ")
}

function pentagonPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 5 }, (_, i) => {
    const [x, y] = pentagonPoint(cx, cy, r, i)
    return `${x},${y}`
  }).join(" ")
}

export function PillarRadar({ subScores, size = 280 }: PillarRadarProps) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  const cx = size / 2
  const cy = size / 2
  const maxR = size * 0.33  // main pentagon radius
  const labelR = size * 0.46 // label ring radius
  const dotR = size * 0.34   // dot radius (slightly outside pentagon)

  const scores = PILLARS.map((p) => subScores[p.key])

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        {/* Background pentagons at 33%, 66%, 100% */}
        {[0.33, 0.66, 1].map((pct) => (
          <polygon
            key={pct}
            points={pentagonPoints(cx, cy, maxR * pct)}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-border"
            strokeDasharray={pct === 1 ? "none" : "3,3"}
            opacity={0.5}
          />
        ))}

        {/* Axis lines from center to vertices */}
        {PILLARS.map((_, i) => {
          const [x, y] = pentagonPoint(cx, cy, maxR, i)
          return (
            <line
              key={i}
              x1={cx} y1={cy} x2={x} y2={y}
              stroke="currentColor"
              strokeWidth="1"
              className="text-border"
              opacity={0.4}
            />
          )
        })}

        {/* Score polygon — animated */}
        <polygon
          points={polygonPoints(cx, cy, animated ? scores : scores.map(() => 0), maxR)}
          fill="url(#radarFill)"
          fillOpacity={0.25}
          stroke="url(#radarStroke)"
          strokeWidth="2"
          strokeLinejoin="round"
          style={{ transition: "all 900ms cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />

        {/* Gradient definitions */}
        <defs>
          <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--icon-lime)" />
            <stop offset="50%" stopColor="var(--icon-teal)" />
            <stop offset="100%" stopColor="var(--icon-orange)" />
          </linearGradient>
          <linearGradient id="radarStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--icon-green)" />
            <stop offset="100%" stopColor="var(--icon-teal)" />
          </linearGradient>
        </defs>

        {/* Colored dots at each score vertex */}
        {PILLARS.map((pillar, i) => {
          const r = animated ? (scores[i] / 100) * maxR : 0
          const [x, y] = pentagonPoint(cx, cy, r, i)
          return (
            <circle
              key={pillar.key}
              cx={x} cy={y} r={4}
              fill={pillar.color}
              stroke="white"
              strokeWidth="1.5"
              style={{ transition: `all 900ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 50}ms` }}
            />
          )
        })}

        {/* Score labels at vertex tips */}
        {PILLARS.map((pillar, i) => {
          const [lx, ly] = pentagonPoint(cx, cy, labelR, i)
          // Adjust text anchor based on position
          const angle = -90 + i * 72
          const anchor = angle > -10 && angle < 170 ? "middle" : angle >= 170 ? "end" : "middle"
          const textAnchor = i === 0 ? "middle" : i === 1 ? "start" : i === 4 ? "end" : i === 2 ? "start" : "end"

          return (
            <g key={pillar.key}>
              <text
                x={lx} y={ly - 5}
                textAnchor={textAnchor}
                fontSize={size * 0.045}
                fontWeight="700"
                fill={pillar.color}
                className="font-sans"
              >
                {animated ? scores[i] : "—"}
              </text>
              <text
                x={lx} y={ly + size * 0.045}
                textAnchor={textAnchor}
                fontSize={size * 0.038}
                fill="currentColor"
                className="text-muted-foreground font-sans"
                opacity={0.6}
              >
                {pillar.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
