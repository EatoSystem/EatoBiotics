/**
 * "One Twin. Many lenses." — premium product cards on /digital-twin. Each card has
 * a consistent structure (top gradient accent bar · fixed-aspect image area ·
 * title + line · footer row with a Twin-score pill and an Explore link) so all
 * four align regardless of their source image's aspect ratio. Each real system
 * illustration (white-bg, dissolved via multiply) gets a light CSS "alive" glow.
 * Data-driven; server component. Brand palette only.
 */

import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

type Dimension = {
  img: string
  alt: string
  title: string
  line: string
  href: string
  score: number
  from: string
  to: string
}

const DIMENSIONS: Dimension[] = [
  {
    img: "/images/stability-hero.png",
    alt: "Digestive stability",
    title: "Stability",
    line: "Steady digestion, day to day.",
    href: "/stability",
    score: 78,
    from: "#A8E063",
    to: "#4CB648",
  },
  {
    img: "/images/eatobetics-hero.webp",
    alt: "Glucose & energy",
    title: "Glucose",
    line: "Smoother energy, fewer spikes.",
    href: "/glucose",
    score: 72,
    from: "#F5C518",
    to: "#F5A623",
  },
  {
    img: "/images/mind-hero.png",
    alt: "The gut-brain axis",
    title: "Mind",
    line: "The gut–brain axis, in focus.",
    href: "/mind",
    score: 80,
    from: "#A8E063",
    to: "#2DAA6E",
  },
  {
    img: "/images/family-hero.png",
    alt: "Family food system",
    title: "Family",
    line: "One system, the whole household.",
    href: "/family",
    score: 75,
    from: "#2DAA6E",
    to: "#4CB648",
  },
]

export function SystemDimensions() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {DIMENSIONS.map((d) => (
        <Link
          key={d.title}
          href={d.href}
          className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_2px_10px_rgba(26,46,18,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-20px_rgba(26,46,18,0.30)]"
        >
          {/* top gradient accent bar */}
          <span
            aria-hidden
            className="h-1.5 w-full shrink-0"
            style={{ background: `linear-gradient(90deg, ${d.from}, ${d.to})` }}
          />

          {/* fixed-aspect image area — aligns every card regardless of source ratio */}
          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden px-6 pt-5">
            <div
              aria-hidden
              className="eb-aura pointer-events-none absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: `radial-gradient(circle, color-mix(in srgb,${d.to} 26%, transparent) 0%, transparent 70%)` }}
            />
            <Image
              src={d.img}
              alt={d.alt}
              width={320}
              height={320}
              sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 22vw"
              className="relative h-full w-auto max-w-full object-contain"
              style={{ mixBlendMode: "multiply" }}
            />
          </div>

          {/* content */}
          <div className="flex flex-1 flex-col px-6 pb-6 pt-1">
            <h3 className="font-serif text-xl font-semibold text-foreground">{d.title}</h3>
            <p className="mt-1 flex-1 text-sm leading-snug text-muted-foreground">{d.line}</p>

            {/* consistent footer row */}
            <div className="mt-4 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${d.from}, ${d.to})` }}
              >
                <span className="tabular-nums">{d.score}</span>
                <span className="font-semibold opacity-80">Twin score</span>
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: d.to }}>
                Explore
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
