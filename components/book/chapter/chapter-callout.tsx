import { FlaskConical, Lightbulb, Leaf, AlertTriangle } from "lucide-react"

type CalloutType = "science" | "note" | "food" | "warning"

const config: Record<CalloutType, {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  dark: boolean
  iconColor: string
  iconBg: string
  accentColor: string
  borderColor: string
  bg: string
}> = {
  science: {
    icon: FlaskConical,
    label: "The Science",
    dark: true,
    iconColor: "var(--icon-teal)",
    iconBg: "rgba(45,170,110,0.18)",
    accentColor: "var(--icon-teal)",
    borderColor: "transparent",
    bg: "var(--foreground)",
  },
  note: {
    icon: Lightbulb,
    label: "Worth Knowing",
    dark: false,
    iconColor: "var(--icon-green)",
    iconBg: "rgba(76,182,72,0.14)",
    accentColor: "var(--icon-green)",
    borderColor: "#C4E8A4",
    bg: "#EBF7E1",
  },
  food: {
    icon: Leaf,
    label: "On Your Plate",
    dark: false,
    iconColor: "var(--icon-lime)",
    iconBg: "rgba(168,224,99,0.2)",
    accentColor: "var(--icon-lime)",
    borderColor: "#D4F0A4",
    bg: "#F3FBE5",
  },
  warning: {
    icon: AlertTriangle,
    label: "Watch Out",
    dark: false,
    iconColor: "var(--icon-orange)",
    iconBg: "rgba(245,166,35,0.14)",
    accentColor: "var(--icon-orange)",
    borderColor: "#FACB88",
    bg: "#FEF3E2",
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

  // Dark variant (science) — matches the site's bg-foreground sections
  if (c.dark) {
    return (
      <div
        className="my-10 overflow-hidden rounded-2xl"
        style={{ backgroundColor: c.bg }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: c.iconBg }}
          >
            <Icon size={14} style={{ color: c.iconColor }} />
          </div>
          <p
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: c.iconColor }}
          >
            {label ?? c.label}
          </p>
        </div>
        {/* Gradient rule */}
        <div
          className="h-px"
          style={{
            background:
              "linear-gradient(90deg, var(--icon-teal) 0%, var(--icon-lime) 50%, transparent 100%)",
          }}
        />
        {/* Body */}
        <div className="space-y-3 px-6 py-5 text-[0.9375rem] leading-[1.8] text-white/80">
          {children}
        </div>
      </div>
    )
  }

  // Light variant — left accent bar card
  return (
    <div
      className="my-10 overflow-hidden rounded-2xl border"
      style={{ borderColor: c.borderColor, backgroundColor: c.bg }}
    >
      <div className="flex">
        <div
          className="w-1 flex-shrink-0"
          style={{ backgroundColor: c.accentColor }}
        />
        <div className="flex-1 px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: c.iconBg }}
            >
              <Icon size={13} style={{ color: c.iconColor }} />
            </div>
            <p
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: c.iconColor }}
            >
              {label ?? c.label}
            </p>
          </div>
          <div className="mt-3 space-y-2 text-[0.9375rem] leading-[1.8] text-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
