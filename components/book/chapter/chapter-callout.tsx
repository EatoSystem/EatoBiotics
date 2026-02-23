import { FlaskConical, Lightbulb, Leaf, AlertTriangle } from "lucide-react"

type CalloutType = "science" | "note" | "food" | "warning"

const config: Record<CalloutType, {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>
  label: string
  accentColor: string
  iconBg: string
  eyebrowClass: string
}> = {
  science: {
    icon: FlaskConical,
    label: "The Science",
    accentColor: "var(--icon-teal)",
    iconBg: "rgba(45,170,110,0.12)",
    eyebrowClass: "text-icon-teal",
  },
  note: {
    icon: Lightbulb,
    label: "Worth Knowing",
    accentColor: "var(--icon-green)",
    iconBg: "rgba(76,182,72,0.1)",
    eyebrowClass: "text-icon-green",
  },
  food: {
    icon: Leaf,
    label: "On Your Plate",
    accentColor: "var(--icon-lime)",
    iconBg: "rgba(168,224,99,0.15)",
    eyebrowClass: "text-icon-lime",
  },
  warning: {
    icon: AlertTriangle,
    label: "Watch Out",
    accentColor: "var(--icon-orange)",
    iconBg: "rgba(245,166,35,0.1)",
    eyebrowClass: "text-icon-orange",
  },
}

interface ChapterCalloutProps {
  type?: CalloutType
  label?: string
  children: React.ReactNode
}

export function ChapterCallout({ type = "science", label, children }: ChapterCalloutProps) {
  const c = config[type]
  const Icon = c.icon

  return (
    <div
      className="my-10 overflow-hidden rounded-2xl border border-border bg-secondary/40"
      style={{ borderLeftWidth: "4px", borderLeftColor: c.accentColor }}
    >
      <div className="px-6 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: c.iconBg }}
          >
            <Icon size={12} style={{ color: c.accentColor }} />
          </div>
          <p
            className={`text-[11px] font-bold uppercase tracking-widest ${c.eyebrowClass}`}
          >
            {label ?? c.label}
          </p>
        </div>
      </div>
      <div className="space-y-2 px-6 pb-5 text-[0.9375rem] leading-[1.8] text-foreground">
        {children}
      </div>
    </div>
  )
}
