/*
 * Temporary /newhome concept primitives — status badges + section shell.
 * The whole components/newhome folder is deletable in one step.
 */
import type { ReactNode } from "react"

export type Availability =
  | "available"
  | "verify"
  | "in-development"
  | "direction"
  | "future"

const BADGE_STYLES: Record<Availability, { label: string; bg: string; color: string; border: string }> = {
  "available":      { label: "Available now",                          bg: "rgba(76,182,72,0.10)",  color: "#2e7d32", border: "rgba(76,182,72,0.35)" },
  "verify":         { label: "Needs manual production verification",   bg: "rgba(245,166,35,0.10)", color: "#a06400", border: "rgba(245,166,35,0.40)" },
  "in-development": { label: "In development",                         bg: "rgba(245,197,24,0.12)", color: "#8a6d00", border: "rgba(245,197,24,0.45)" },
  "direction":      { label: "Our direction",                          bg: "rgba(45,170,110,0.08)", color: "#1b7a55", border: "rgba(45,170,110,0.30)" },
  "future":         { label: "Future",                                 bg: "rgba(26,46,18,0.05)",   color: "#5a6b54", border: "rgba(26,46,18,0.15)" },
}

export function StatusBadge({ status }: { status: Availability }) {
  const s = BADGE_STYLES[status]
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-4"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  )
}

export function Section({
  id,
  children,
  tinted = false,
}: {
  id?: string
  children: ReactNode
  tinted?: boolean
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 px-4 py-16 sm:px-6 md:py-24"
      style={tinted ? { background: "linear-gradient(180deg, rgba(168,224,99,0.06), rgba(45,170,110,0.04))" } : undefined}
    >
      <div className="mx-auto max-w-5xl">{children}</div>
    </section>
  )
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-icon-teal">{children}</p>
  )
}

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-2 font-serif text-3xl font-bold leading-tight text-foreground sm:text-4xl">
      {children}
    </h2>
  )
}
