import Image from "next/image"

/**
 * Styled book cover for "EatoBiotics — The Food System Inside Your Mind"
 * Uses a CSS/JSX approach (no external image required) that matches the
 * proportion and shadow treatment of the original BookCover component.
 */
export function BookCoverMind() {
  return (
    <div className="relative mx-auto w-[260px] sm:w-[300px]">
      <div
        className="relative w-full overflow-hidden rounded-xl shadow-xl"
        style={{ aspectRatio: "3/4" }}
      >
        {/* Dark base */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(160deg, #0a1a1f 0%, #0d2028 50%, #081520 100%)" }}
        />

        {/* Teal-green wash — top-left */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 110% 70% at 15% 0%, color-mix(in srgb, var(--icon-teal) 30%, transparent) 0%, transparent 65%)",
          }}
        />

        {/* Subtle second glow — bottom-right */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 90% 95%, color-mix(in srgb, var(--icon-green) 12%, transparent) 0%, transparent 70%)",
          }}
        />

        {/* Accent strip — bottom edge */}
        <div
          className="absolute inset-x-0 bottom-0 h-1.5"
          style={{
            background: "linear-gradient(90deg, var(--icon-teal), var(--icon-green), var(--icon-lime))",
          }}
        />

        {/* ── Content ── */}
        <div className="absolute inset-0 flex flex-col justify-between p-6">

          {/* Top row: icon + series label */}
          <div className="flex items-start justify-between">
            <Image
              src="/eatobiotics-icon.webp"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 opacity-90"
            />
            <span
              className="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
              style={{
                background: "color-mix(in srgb, var(--icon-teal) 20%, transparent)",
                color: "var(--icon-teal)",
                border: "1px solid color-mix(in srgb, var(--icon-teal) 30%, transparent)",
              }}
            >
              Book 03
            </span>
          </div>

          {/* Middle: biotic pills + decorative dots */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <span
                className="h-1.5 w-10 rounded-full"
                style={{ background: "var(--icon-teal)" }}
              />
              <span
                className="h-1.5 w-7 rounded-full opacity-70"
                style={{ background: "var(--icon-green)" }}
              />
              <span
                className="h-1.5 w-5 rounded-full opacity-50"
                style={{ background: "var(--icon-lime)" }}
              />
            </div>
            {/* Subtle texture lines */}
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-px rounded-full"
                style={{
                  background: `color-mix(in srgb, var(--icon-teal) ${8 - i}%, transparent)`,
                  width: `${70 - i * 8}%`,
                }}
              />
            ))}
          </div>

          {/* Bottom: title block */}
          <div>
            <p
              className="font-serif text-2xl font-bold leading-tight"
              style={{ color: "var(--icon-teal)" }}
            >
              EatoBiotics
            </p>
            <p
              className="mt-1 text-xs font-medium leading-snug"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              The Food System Inside
              <br />
              <span className="font-semibold text-white">Your Mind</span>
            </p>
            <div
              className="mt-3 h-px w-12"
              style={{ background: "color-mix(in srgb, var(--icon-teal) 50%, transparent)" }}
            />
            <p className="mt-2 text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
              Jason Curry
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
