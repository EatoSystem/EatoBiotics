/** Concept mock: the app home — the living Food System. */
import { APP, RITUAL_CHECKS, BIOTICS } from "../theme"
import { TwinFigure } from "../TwinFigure"

export function HomeScreen() {
  const litToday = ["fermented", "plants", "moved"]
  return (
    <div className="flex h-full flex-col" style={{ color: APP.ink }}>
      <div className="h-[3px] w-full shrink-0" style={{ background: APP.hairline }} />
      <div className="flex-1 overflow-hidden px-6 pt-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: APP.lime }}>
          Good morning, Jason
        </p>
        <p className="mt-1 text-sm" style={{ color: APP.inkDim }}>
          Your Food System is awake and thriving.
        </p>

        {/* The living figure with the score */}
        <div className="relative mt-2 flex items-center justify-center">
          <TwinFigure lit={litToday} scale={1.05} />
          <div className="absolute right-2 top-4 text-right">
            <p className="font-serif text-5xl font-bold leading-none" style={{ color: APP.lime }}>
              78
            </p>
            <p className="text-[10px] font-semibold" style={{ color: APP.inkFaint }}>
              / 100 today
            </p>
          </div>
        </div>

        {/* Three biotics */}
        <div className="mt-1 space-y-2">
          {BIOTICS.map((b, i) => {
            const v = [72, 68, 55][i]
            return (
              <div key={b.label}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: APP.inkDim }}>
                    {b.label}
                  </span>
                  <span className="text-xs font-bold" style={{ color: b.color }}>{v}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: APP.fill }}>
                  <div className="h-full rounded-full" style={{ width: `${v}%`, background: b.color }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Today's ritual glance */}
        <div className="mt-4 rounded-2xl p-3.5" style={{ background: APP.fill, border: `1px solid ${APP.line}` }}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: APP.inkDim }}>
              Today&apos;s ritual
            </span>
            <span className="text-[11px] font-bold" style={{ color: APP.lime }}>3 / 5</span>
          </div>
          <div className="mt-3 flex justify-between">
            {RITUAL_CHECKS.map((c, i) => {
              const done = i < 3
              return (
                <div key={c.key} className="flex flex-col items-center gap-1.5">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      background: done ? c.color : "transparent",
                      border: `1.5px solid ${done ? c.color : APP.line}`,
                      color: done ? "#0B1607" : APP.inkFaint,
                    }}
                  >
                    {done ? "✓" : ""}
                  </div>
                  <span className="text-[8px] font-semibold" style={{ color: APP.inkFaint }}>{c.short}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom action + tab bar */}
      <div className="shrink-0 px-6 pb-2">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold"
          style={{ background: "linear-gradient(135deg, #4CB648, #2DAA6E)", color: "white" }}
        >
          + Log a meal
        </button>
      </div>
      <TabBar active="home" />
    </div>
  )
}

export function TabBar({ active }: { active: "home" | "ritual" | "meal" | "scores" }) {
  const tabs = [
    { key: "home", label: "Home", icon: "◉" },
    { key: "ritual", label: "Ritual", icon: "✦" },
    { key: "meal", label: "Log", icon: "＋" },
    { key: "scores", label: "Progress", icon: "▲" },
  ]
  return (
    <div
      className="flex shrink-0 items-center justify-around px-4 pb-6 pt-2"
      style={{ borderTop: `1px solid ${APP.line}`, background: "rgba(5,10,3,0.4)" }}
    >
      {tabs.map((t) => {
        const on = t.key === active
        return (
          <div key={t.key} className="flex flex-col items-center gap-1">
            <span style={{ fontSize: 16, color: on ? APP.lime : APP.inkFaint }}>{t.icon}</span>
            <span className="text-[9px] font-semibold" style={{ color: on ? APP.lime : APP.inkFaint }}>
              {t.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
