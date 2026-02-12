import Image from "next/image"

export function BookCover() {
  return (
    <div className="relative mx-auto w-[260px] sm:w-[300px]">
      {/* Shadow */}
      <div className="absolute -inset-4 rounded-2xl bg-[var(--foreground)]/5 blur-2xl" />

      {/* Book */}
      <div className="brand-gradient relative flex aspect-[3/4] w-full flex-col items-center justify-center rounded-xl p-8 shadow-lg">
        {/* Spine effect */}
        <div className="absolute left-0 top-0 bottom-0 w-3 rounded-l-xl bg-[var(--foreground)]/10" />

        {/* Logo */}
        <div className="mb-6">
          <Image
            src="/background-graphic.webp"
            alt="EatoBiotics logo"
            width={120}
            height={120}
            className="opacity-90"
          />
        </div>

        <h3 className="text-center font-serif text-3xl text-[var(--background)]">
          EatoBiotics
        </h3>
        <p className="mt-2 text-center text-sm font-medium text-[var(--background)]/80">
          The Food System Inside You
        </p>

        {/* Bottom line */}
        <div className="absolute bottom-8 left-8 right-8">
          <div className="h-px bg-[var(--background)]/30" />
          <p className="mt-3 text-center text-xs text-[var(--background)]/60">
            EatoSystem
          </p>
        </div>
      </div>
    </div>
  )
}
