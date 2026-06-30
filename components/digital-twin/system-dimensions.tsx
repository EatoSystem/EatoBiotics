/**
 * "One Twin. Many lenses." — premium product cards on /digital-twin. Each card is
 * a real system illustration (white-bg, dissolved via multiply) given a light CSS
 * "alive" treatment (LivingImage), a UNIQUE brand accent, a mini score ring and a
 * short explanation — tying each add-on system back to the same Digital Twin.
 * Data-driven; server component. Brand palette only (green/lime/teal/yellow/orange).
 */

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { LivingImage } from "./parts"

type Dimension = {
  img: string
  alt: string
  title: string
  line: string
  href: string
  score: number
  accent: string
}

const DIMENSIONS: Dimension[] = [
  {
    img: "/images/stability-hero.png",
    alt: "Digestive stability",
    title: "Stability",
    line: "Steady digestion, day to day.",
    href: "/stability",
    score: 78,
    accent: "#4CB648",
  },
  {
    img: "/images/eatobetics-hero.webp",
    alt: "Glucose & energy",
    title: "Glucose",
    line: "Smoother energy, fewer spikes.",
    href: "/glucose",
    score: 72,
    accent: "#F5A623",
  },
  {
    img: "/images/mind-hero.png",
    alt: "The gut-brain axis",
    title: "Mind",
    line: "The gut–brain axis, in focus.",
    href: "/mind",
    score: 80,
    accent: "#A8E063",
  },
  {
    img: "/images/family-hero.png",
    alt: "Family food system",
    title: "Family",
    line: "One system, the whole household.",
    href: "/family",
    score: 75,
    accent: "#2DAA6E",
  },
]

function MiniScore({ score, accent }: { score: number; accent: string }) {
  const C = 2 * Math.PI * 16
  return (
    <div className="relative h-12 w-12">
      <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
        <circle cx="20" cy="20" r="16" fill="none" stroke="color-mix(in srgb, #4CB648 12%, #fff)" strokeWidth="4" />
        <circle cx="20" cy="20" r="16" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${C * (score / 100)} ${C}`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums text-foreground">{score}</span>
    </div>
  )
}

export function SystemDimensions() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {DIMENSIONS.map((d) => (
        <Link
          key={d.title}
          href={d.href}
          className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-[0_2px_10px_rgba(26,46,18,0.05)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(26,46,18,0.28)]"
        >
          {/* accent wash on hover */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1.5"
            style={{ background: `linear-gradient(90deg, ${d.accent}, color-mix(in srgb, ${d.accent} 50%, #F5A623))` }}
          />
          <div className="mx-auto w-[76%] py-2">
            <LivingImage
              src={d.img}
              alt={d.alt}
              width={320}
              height={320}
              sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 22vw"
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-left">
              <div className="text-lg font-semibold text-foreground">{d.title}</div>
              <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{d.line}</p>
            </div>
            <MiniScore score={d.score} accent={d.accent} />
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: d.accent }}>
            Explore
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </div>
  )
}
