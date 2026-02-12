import Image from "next/image"

export function BookCover() {
  return (
    <div className="relative mx-auto w-[260px] sm:w-[300px]">
      {/* Shadow glow using icon colours */}
      <div
        className="absolute -inset-6 rounded-3xl blur-3xl opacity-30"
        style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal), var(--icon-orange))" }}
      />

      {/* Book */}
      <div className="brand-gradient relative flex aspect-[3/4] w-full flex-col items-center justify-center rounded-xl p-8 shadow-xl">
        {/* Spine effect */}
        <div className="absolute left-0 top-0 bottom-0 w-3 rounded-l-xl bg-foreground/10" />

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

        <h3 className="text-center font-serif text-3xl font-extrabold text-white">
          EatoBiotics
        </h3>
        <p className="mt-2 text-center text-sm font-medium text-white/80">
          The Food System Inside You
        </p>

        {/* Bottom line */}
        <div className="absolute bottom-8 left-8 right-8">
          <div className="h-px bg-background/30" />
          <p className="mt-3 text-center text-xs text-background/60">
            EatoSystem
          </p>
        </div>
      </div>
    </div>
  )
}
