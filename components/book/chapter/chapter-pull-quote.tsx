interface ChapterPullQuoteProps {
  children: React.ReactNode
  attribution?: string
}

export function ChapterPullQuote({ children, attribution }: ChapterPullQuoteProps) {
  return (
    <div
      className="my-10 rounded-2xl border border-border bg-secondary/40 px-8 py-8 md:px-10"
      style={{ borderLeftWidth: "4px", borderLeftColor: "var(--icon-green)" }}
    >
      <blockquote className="font-serif text-xl font-semibold italic leading-[1.5] text-foreground sm:text-2xl">
        {children}
      </blockquote>
      {attribution && (
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          — {attribution}
        </p>
      )}
    </div>
  )
}
