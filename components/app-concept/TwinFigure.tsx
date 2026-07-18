/**
 * TwinFigure — a stylised living-body silhouette for the concept home screen,
 * echoing the app's "living Food System" figure. Ritual signals light up as
 * glowing nodes at the same body positions the real RITUAL_CHECKS use.
 * Pure SVG, no dependencies. Concept-only.
 */

import { RITUAL_CHECKS, APP } from "./theme"

export function TwinFigure({
  lit = ["fermented", "plants", "moved"],
  scale = 1,
}: {
  /** Which ritual keys are "on" — those nodes glow. */
  lit?: string[]
  scale?: number
}) {
  const litSet = new Set(lit)
  return (
    <svg viewBox="0 0 100 130" width={180 * scale} height={234 * scale} aria-hidden>
      <defs>
        <radialGradient id="twin-aura" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="rgba(46,91,63,0.14)" />
          <stop offset="60%" stopColor="rgba(46,91,63,0.05)" />
          <stop offset="100%" stopColor="rgba(46,91,63,0)" />
        </radialGradient>
        <linearGradient id="twin-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(27,42,32,0.10)" />
          <stop offset="100%" stopColor="rgba(27,42,32,0.04)" />
        </linearGradient>
      </defs>

      {/* Ambient aura */}
      <ellipse cx="50" cy="55" rx="46" ry="60" fill="url(#twin-aura)" />

      {/* Body: head + torso + limbs, simple rounded forms */}
      <g fill="url(#twin-body)" stroke="rgba(27,42,32,0.18)" strokeWidth="0.6">
        <circle cx="50" cy="18" r="9" />
        <rect x="41" y="27" width="18" height="34" rx="9" />
        {/* arms */}
        <rect x="30" y="30" width="8" height="30" rx="4" />
        <rect x="62" y="30" width="8" height="30" rx="4" />
        {/* legs */}
        <rect x="43" y="58" width="7" height="40" rx="3.5" />
        <rect x="50" y="58" width="7" height="40" rx="3.5" />
      </g>

      {/* Ritual signal nodes */}
      {RITUAL_CHECKS.map((c) => {
        const on = litSet.has(c.key)
        return (
          <g key={c.key}>
            {on && (
              <circle cx={c.node.x} cy={c.node.y * 1.0} r="6" fill={c.color} opacity="0.22">
                <animate attributeName="r" values="4;7;4" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.28;0.1;0.28" dur="2.4s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={c.node.x}
              cy={c.node.y}
              r={on ? 2.4 : 1.4}
              fill={on ? c.color : "rgba(27,42,32,0.2)"}
              stroke={on ? "rgba(255,255,255,0.7)" : "none"}
              strokeWidth="0.4"
            />
          </g>
        )
      })}

      {/* Ground shadow */}
      <ellipse cx="50" cy="102" rx="20" ry="3" fill={APP.green} opacity="0.12" />
    </svg>
  )
}
