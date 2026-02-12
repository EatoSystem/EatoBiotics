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
      className="group flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:shadow-lg hover:shadow-[var(--primary)]/5"
    >
      <div className="flex items-center gap-3">
        {tag && (
          <span className="rounded-full brand-gradient px-3 py-1 text-xs font-semibold text-[var(--background)]">
            {tag}
          </span>
        )}
        <span className="text-xs text-[var(--muted-foreground)]">{date}</span>
      </div>

      <h3 className="mt-4 font-serif text-xl text-[var(--foreground)] leading-snug text-pretty">
        {title}
      </h3>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--muted-foreground)] line-clamp-3">
        {description}
      </p>

      <div className="mt-6 flex items-center gap-1 text-sm font-medium text-[var(--primary)] transition-colors group-hover:text-[var(--accent)]">
        Read on Substack
        <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </a>
  )
}
