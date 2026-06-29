/**
 * Shared building blocks for the flagship /digital-twin page.
 * Server components (CSS-only motion). Brand palette: green/lime/teal + yellow/orange.
 */

import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

export const CTA_GRADIENT =
  "linear-gradient(135deg,#A8E063 0%,#4CB648 30%,#2DAA6E 55%,#F5C518 80%,#F5A623 100%)"

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-icon-green">
      {children}
    </p>
  )
}

export function CtaButton({
  children,
  href = "/assessment",
}: {
  children: React.ReactNode
  href?: string
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
      style={{ background: CTA_GRADIENT, boxShadow: "0 12px 34px rgba(76,182,72,0.28)" }}
    >
      {children}
      <ArrowRight className="h-5 w-5" />
    </Link>
  )
}

/** Rising-particle field used inside the glowing figure. */
const PARTICLES = [
  { l: "44%", b: "26%", s: 7, c: "#A8E063", g: "rgba(168,224,99,0.7)", d: 4.4, de: 0 },
  { l: "52%", b: "20%", s: 5, c: "#F5C518", g: "rgba(245,197,24,0.7)", d: 5.2, de: 0.6 },
  { l: "49%", b: "30%", s: 6, c: "#F5A623", g: "rgba(245,166,35,0.7)", d: 4.8, de: 1.1 },
  { l: "56%", b: "24%", s: 5, c: "#4CB648", g: "rgba(76,182,72,0.7)", d: 5.0, de: 1.7 },
  { l: "47%", b: "22%", s: 8, c: "#F5C518", g: "rgba(245,197,24,0.75)", d: 6.0, de: 2.3 },
  { l: "53%", b: "28%", s: 4, c: "#2DAA6E", g: "rgba(45,170,110,0.7)", d: 4.6, de: 2.0 },
  { l: "50%", b: "18%", s: 6, c: "#A8E063", g: "rgba(168,224,99,0.7)", d: 5.6, de: 3.2 },
]

/**
 * The signature glowing Digital Twin figure: the couple illustration (white bg
 * dissolved via multiply) over a pulsing aura + energy beam + rising particles.
 * `size` is the square stage in px.
 */
export function DigitalTwinFigure({
  size = 360,
  className = "",
  showParticles = true,
}: {
  size?: number
  className?: string
  showParticles?: boolean
}) {
  const fig = Math.round(size * 0.66)
  return (
    <div className={`relative mx-auto ${className}`} style={{ width: size, height: size, maxWidth: "100%" }}>
      <div
        className="eb-aura absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: size * 0.95,
          height: size * 0.95,
          transform: "translate(-50%,-50%)",
          background:
            "radial-gradient(circle, rgba(168,224,99,0.55) 0%, rgba(245,197,24,0.42) 44%, rgba(245,166,35,0.20) 64%, rgba(255,255,255,0) 74%)",
        }}
      />
      <div
        className="eb-beam absolute left-1/2 top-1/2"
        style={{
          width: 40,
          height: size * 0.7,
          transform: "translate(-50%,-50%)",
          borderRadius: 9999,
          filter: "blur(7px)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(245,197,24,0.55) 30%, rgba(255,255,255,0.9) 50%, rgba(168,224,99,0.55) 70%, rgba(255,255,255,0) 100%)",
        }}
      />
      <Image
        src="/images/couple-hero.png"
        alt="Your Food System Digital Twin"
        width={fig}
        height={Math.round(fig * 1.25)}
        priority
        className="absolute left-1/2 top-1/2"
        style={{ width: fig, height: "auto", transform: "translate(-50%,-50%)", mixBlendMode: "multiply" }}
      />
      {showParticles &&
        PARTICLES.map((p, i) => (
          <span
            key={i}
            className="eb-rise absolute"
            style={{
              left: p.l,
              bottom: p.b,
              width: p.s,
              height: p.s,
              borderRadius: "50%",
              background: p.c,
              boxShadow: `0 0 ${p.s + 3}px 2px ${p.g}`,
              animationDuration: `${p.d}s`,
              animationDelay: `${p.de}s`,
            }}
          />
        ))}
    </div>
  )
}
