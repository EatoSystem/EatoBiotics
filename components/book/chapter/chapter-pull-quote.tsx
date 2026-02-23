interface ChapterPullQuoteProps {
  children: React.ReactNode
  attribution?: string
}

export function ChapterPullQuote({ children, attribution }: ChapterPullQuoteProps) {
  return (
    <div className="my-10">
      <div className="relative rounded-2xl px-8 py-8 md:px-10">
        {/* Brand gradient left bar */}
        <div
          className="absolute left-0 top-4 bottom-4 w-1 rounded-full"
          style={{ background: "linear-gradient(180deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }}
        />
        <blockquote className="font-serif text-xl font-medium italic leading-relaxed text-foreground sm:text-2xl md:text-[1.65rem]">
          {children}
        </blockquote>
        {attribution && (
          <p className="mt-4 text-sm font-medium text-muted-foreground">{attribution}</p>
        )}
      </div>
    </div>
  )
}
