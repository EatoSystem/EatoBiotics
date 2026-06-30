/**
 * "One Twin. Many lenses." — the premium dimension gallery on /digital-twin.
 * Each card is a real system illustration (white-bg, dissolved via multiply) given
 * a lightweight CSS "alive" treatment (LivingImage), tying each add-on system back
 * to the same Digital Twin. Data-driven; server component. Brand palette only.
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
  webp?: boolean
}

const DIMENSIONS: Dimension[] = [
  {
    img: "/images/stability-hero.png",
    alt: "Digestive stability",
    title: "Stability",
    line: "Steady digestion, day to day.",
    href: "/stability",
  },
  {
    img: "/images/eatobetics-hero.webp",
    alt: "Glucose & energy",
    title: "Glucose",
    line: "Smoother energy, fewer spikes.",
    href: "/glucose",
  },
  {
    img: "/images/mind-hero.png",
    alt: "The gut-brain axis",
    title: "Mind",
    line: "The gut–brain axis, in focus.",
    href: "/mind",
  },
  {
    img: "/images/family-hero.png",
    alt: "Family food system",
    title: "Family",
    line: "One system, the whole household.",
    href: "/family",
  },
]

export function SystemDimensions() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {DIMENSIONS.map((d) => (
        <Link
          key={d.title}
          href={d.href}
          className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-5 text-center shadow-[0_2px_10px_rgba(26,46,18,0.05)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(26,46,18,0.28)]"
        >
          <div className="mx-auto w-[78%] py-2">
            <LivingImage
              src={d.img}
              alt={d.alt}
              width={320}
              height={320}
              sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 22vw"
            />
          </div>
          <div className="mt-2 text-lg font-semibold text-foreground">{d.title}</div>
          <p className="mt-1 text-sm leading-snug text-muted-foreground">{d.line}</p>
          <span className="mt-3 inline-flex items-center justify-center gap-1 text-xs font-semibold text-icon-green">
            Explore
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </div>
  )
}
