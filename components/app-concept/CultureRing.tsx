/**
 * CultureRing — the real app's signature centrepiece: five arc segments (one
 * per ritual check) filling a circle, with the count in the middle. Checked
 * segments render in their check colour; unchecked show a faint track.
 * Concept-only.
 */
import { RITUAL_CHECKS, APP } from "./theme"

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const [x0, y0] = polar(cx, cy, r, a0)
  const [x1, y1] = polar(cx, cy, r, a1)
  const large = a1 - a0 > 180 ? 1 : 0
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

export function CultureRing({ lit, scale = 1 }: { lit: string[]; scale?: number }) {
  const size = 200
  const cx = size / 2
  const cy = size / 2
  const r = 82
  const gap = 7 // degrees between segments
  const seg = 360 / RITUAL_CHECKS.length
  const litSet = new Set(lit)
  const count = lit.length

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size * scale} height={size * scale} aria-hidden>
      {RITUAL_CHECKS.map((c, i) => {
        const a0 = i * seg + gap / 2
        const a1 = (i + 1) * seg - gap / 2
        const on = litSet.has(c.key)
        return (
          <path
            key={c.key}
            d={arc(cx, cy, r, a0, a1)}
            fill="none"
            stroke={on ? c.color : APP.border}
            strokeWidth={on ? 13 : 11}
            strokeLinecap="round"
            style={{ transition: "stroke 240ms ease, stroke-width 240ms ease" }}
          />
        )
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: APP.display, fontWeight: 600, fontSize: 46, fill: APP.green }}>
        {count}
      </text>
      <text x={cx} y={cy + 26} textAnchor="middle"
        style={{ fontFamily: APP.ui, fontWeight: 700, fontSize: 11, letterSpacing: 1.5, fill: APP.inkFaint }}>
        OF 5 TODAY
      </text>
    </svg>
  )
}
