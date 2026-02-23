interface ChapterPullQuoteProps {
  children: React.ReactNode
  attribution?: string
}

export function ChapterPullQuote({ children, attribution }: ChapterPullQuoteProps) {
  return (
    <div className="my-12">
      {/* Brand gradient rule above */}
      <div
        className="mb-6 h-0.5 rounded-full"
        style={{
          background:
            "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), transparent)",
          maxWidth: "8rem",
        }}
      />

      <blockquote
        className="font-serif text-2xl font-semibold italic leading-[1.4] sm:text-3xl md:text-[2rem]"
        style={{
          background:
            "linear-gradient(135deg, var(--icon-green) 0%, var(--icon-teal) 50%, var(--foreground) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {children}
      </blockquote>

      {attribution && (
        <div className="mt-5 flex items-center gap-3">
          <div
            className="h-px flex-shrink-0 w-8 rounded-full"
            style={{ backgroundColor: "var(--icon-green)" }}
          />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {attribution}
          </p>
        </div>
      )}
    </div>
  )
}
