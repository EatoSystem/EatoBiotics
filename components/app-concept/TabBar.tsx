/** Shared bottom tab bar for the app-concept screens (light). Concept-only. */
import { APP } from "./theme"

export function TabBar({ active }: { active: "today" | "meal" | "scores" }) {
  const tabs = [
    { key: "today", label: "Today", icon: "◎" },
    { key: "meal", label: "Log", icon: "＋" },
    { key: "scores", label: "Progress", icon: "▲" },
  ]
  return (
    <div
      className="flex shrink-0 items-center justify-around px-6 pb-6 pt-2.5"
      style={{ borderTop: `1px solid ${APP.border}`, background: APP.card }}
    >
      {tabs.map((t) => {
        const on = t.key === active
        return (
          <div key={t.key} className="flex flex-col items-center gap-1">
            <span style={{ fontSize: 17, color: on ? APP.green : APP.inkFaint }}>{t.icon}</span>
            <span className="text-[10px] font-semibold" style={{ fontFamily: APP.ui, color: on ? APP.green : APP.inkFaint }}>
              {t.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
