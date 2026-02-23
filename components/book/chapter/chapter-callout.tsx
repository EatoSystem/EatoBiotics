import { FlaskConical, Lightbulb, Leaf, AlertTriangle } from "lucide-react"

type CalloutType = "science" | "note" | "food" | "warning"

const config: Record<CalloutType, {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  color: string
  bg: string
  border: string
}> = {
  science: {
    icon: FlaskConical,
    label: "The Science",
    color: "text-icon-teal",
    bg: "bg-[#E2F5EF]",
    border: "border-[#9ED9C3]",
  },
  note: {
    icon: Lightbulb,
    label: "Worth Knowing",
    color: "text-icon-green",
    bg: "bg-[#EBF7E1]",
    border: "border-[#C4E8A4]",
  },
  food: {
    icon: Leaf,
    label: "On Your Plate",
    color: "text-icon-lime",
    bg: "bg-[#F3FBE5]",
    border: "border-[#C4E8A4]",
  },
  warning: {
    icon: AlertTriangle,
    label: "Watch Out",
    color: "text-icon-orange",
    bg: "bg-[#FEF3E2]",
    border: "border-[#FACB88]",
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
    <div className={`my-8 rounded-2xl border ${c.border} ${c.bg} p-6 md:p-7`}>
      <div className={`flex items-center gap-2 ${c.color}`}>
        <Icon size={15} />
        <p className="text-xs font-semibold uppercase tracking-widest">{label ?? c.label}</p>
      </div>
      <div className="mt-3 space-y-2 text-base leading-relaxed text-foreground">
        {children}
      </div>
    </div>
  )
}
