import Image from "next/image"

export function BookCover() {
  return (
    <div className="relative mx-auto w-[260px] sm:w-[300px]">
      {/* Shadow glow using icon colours */}
      <div
        className="absolute -inset-6 rounded-3xl opacity-20 blur-3xl"
        style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal), var(--icon-orange))" }}
      />

      {/* Book */}
      <div className="relative flex aspect-[3/4] w-full flex-col items-center justify-center rounded-xl border-2 border-border bg-background p-8 shadow-xl">
        {/* Spine effect */}
        <div className="absolute bottom-0 left-0 top-0 w-3 rounded-l-xl brand-gradient" />

        {/* Top gradient accent line */}
        <div className="absolute left-3 right-0 top-0 h-1 rounded-tr-xl brand-gradient" />

        {/* Icon as logo */}
        <div className="mb-6">
          <Image
            src="/eatobiotics-icon.webp"
            alt="EatoBiotics icon"
            width={120}
            height={120}
            className="h-28 w-28 drop-shadow-lg"
          />
        </div>

        <h3 className="text-center font-serif text-3xl font-semibold text-foreground">
          EatoBiotics
        </h3>
        <p className="mt-2 text-center text-sm font-medium text-muted-foreground">
          The Food System Inside You
        </p>

        {/* Author & bottom line */}
        <div className="absolute bottom-8 left-8 right-8">
          <div className="h-px brand-gradient opacity-40" />
          <p className="mt-3 text-center text-xs font-medium text-muted-foreground">
            Jason Curry
          </p>
        </div>
      </div>
    </div>
  )
}
