/** Concept mock: progress — score trend, streak, weekly rhythm, ritual
    consistency (light). */
import { APP, RITUAL_CHECKS } from "../theme"
import { TabBar } from "../TabBar"

const TREND = [52, 55, 51, 60, 63, 61, 68, 72, 70, 75, 78]
const WEEK = [
  { d: "M", v: 71 }, { d: "T", v: 64 }, { d: "W", v: 80 }, { d: "T", v: 76 },
  { d: "F", v: 68 }, { d: "S", v: 84 }, { d: "S", v: 78 },
]

function Sparkline() {
  const w = 320, h = 96, min = 45, max = 85
  const pts = TREND.map((v, i) => {
    const x = (i / (TREND.length - 1)) * w
    const y = h - ((v - min) / (max - min)) * h
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const area = `${line} L${w},${h} L0,${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="sc-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(46,91,63,0.22)" />
          <stop offset="100%" stopColor="rgba(46,91,63,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sc-area)" />
      <path d={line} fill="none" stroke={APP.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill={APP.green} stroke={APP.card} strokeWidth="2" />
    </svg>
  )
}

export function ScoresScreen() {
  return (
    <div className="flex h-full flex-col" style={{ color: APP.ink, fontFamily: APP.ui }}>
      <div className="flex-1 overflow-y-auto px-6 pt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: APP.green }}>Progress</p>

        <div className="mt-2 flex items-end justify-between">
          <div>
            <p className="font-bold leading-none" style={{ fontFamily: APP.display, fontSize: 46, color: APP.green }}>78</p>
            <p className="mt-1 text-[11px] font-semibold" style={{ color: APP.green }}>▲ +26 in 75 days</p>
          </div>
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{ background: "rgba(232,160,85,0.14)", border: `1px solid ${APP.apricot}` }}>
            <span style={{ fontSize: 16 }}>🔥</span>
            <div>
              <p className="text-sm font-bold leading-none" style={{ color: APP.apricot }}>12</p>
              <p className="text-[8px] font-semibold uppercase tracking-widest" style={{ color: APP.inkFaint }}>day streak</p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl p-4" style={{ background: APP.card, border: `1px solid ${APP.border}` }}>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: APP.inkDim }}>Score · last 11 weeks</p>
          <Sparkline />
        </div>

        <div className="mt-4 rounded-2xl p-4" style={{ background: APP.card, border: `1px solid ${APP.border}` }}>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: APP.inkDim }}>This week&apos;s shape</p>
          <div className="flex items-end justify-between" style={{ height: 84 }}>
            {WEEK.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="w-5 rounded-full" style={{ height: `${d.v}%`, background: APP.green, opacity: 0.85 }} />
                <span className="text-[9px] font-semibold" style={{ color: APP.inkFaint }}>{d.d}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-2xl p-4" style={{ background: APP.card, border: `1px solid ${APP.border}` }}>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: APP.inkDim }}>Ritual consistency</p>
          <div className="space-y-2">
            {RITUAL_CHECKS.map((c, i) => {
              const v = [90, 85, 70, 55, 80][i]
              return (
                <div key={c.key} className="flex items-center gap-2">
                  <span className="w-16 text-[10px] font-semibold" style={{ color: APP.inkDim }}>{c.short}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: APP.fill }}>
                    <div className="h-full rounded-full" style={{ width: `${v}%`, background: c.color }} />
                  </div>
                  <span className="w-7 text-right text-[10px] font-bold" style={{ color: c.color }}>{v}%</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="h-4" />
      </div>
      <TabBar active="scores" />
    </div>
  )
}
