import { ArrowUpRight } from "lucide-react"

interface SubstackCardProps {
  title: string
  description: string
  date: string
  tag?: string
  link: string
}

export function SubstackCard({ title, description, date, tag, link }: SubstackCardProps) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:border-icon-lime/40 hover:shadow-lg hover:shadow-icon-lime/5"
    >
      <div className="flex items-center gap-3">
        {tag && (
          <span className="rounded-full bg-icon-green px-3 py-1 text-xs font-semibold text-background">
            {tag}
          </span>
        )}
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>

      <h3 className="mt-4 font-serif text-xl font-bold leading-snug text-foreground text-pretty">
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
