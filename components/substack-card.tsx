import { ArrowUpRight } from "lucide-react"

interface SubstackCardProps {
  title: string
  description: string
  date: string
  tag?: string
  link: string
}

const tagColors: Record<string, string> = {
  Prebiotics: "var(--icon-lime)",
  Probiotics: "var(--icon-teal)",
  Postbiotics: "var(--icon-orange)",
  Science: "var(--icon-green)",
  Lifestyle: "var(--icon-yellow)",
}

export function SubstackCard({ title, description, date, tag, link }: SubstackCardProps) {
  const tagColor = tag ? tagColors[tag] || "var(--icon-green)" : "var(--icon-green)"

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background p-6 transition-all hover:shadow-lg"
    >
      {/* Top gradient accent */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${tagColor}, var(--icon-orange))` }}
      />

      <div className="flex items-center gap-3">
        {tag && (
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: tagColor }}
          >
            {tag}
          </span>
        )}
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>

      <h3 className="mt-4 font-serif text-xl font-semibold leading-snug text-foreground text-pretty">
        {title}
      </h3>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
        {description}
      </p>

      <div className="mt-6 flex items-center gap-1 text-sm font-medium text-icon-green transition-colors group-hover:text-icon-orange">
        Read on Substack
        <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </a>
  )
}
