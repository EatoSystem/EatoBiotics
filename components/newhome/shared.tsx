/*
 * Temporary /newhome concept primitives, composed strictly from the audited
 * production design system (see components/home/*):
 *   - Section wrapper:  <section class="px-6 py-24 md:py-32"> + max-w-[1200px]
 *   - Eyebrow:          text-xs font-semibold uppercase tracking-widest text-icon-green
 *   - H2:               font-serif text-4xl font-semibold sm:text-5xl text-balance
 *   - Status pills:     gradient pill (what-were-building.tsx status) and
 *                       color-mix tint pill (the-framework.tsx stat pill)
 * The whole components/newhome folder is deletable in one step.
 */
import type { ReactNode } from "react"

export type Availability =
  | "available"
  | "verify"
  | "in-development"
  | "direction"
  | "future"

export function StatusBadge({ status }: { status: Availability }) {
  // Gradient pill idiom (status pills in components/home/what-were-building.tsx)
  if (status === "available") {
    return (
      <span className="inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white"
        style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}>
        Available now
      </span>
    )
  }
  if (status === "in-development") {
    return (
      <span className="inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white"
        style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}>
        In development
      </span>
    )
  }
  // Tint pill idiom (stat pills in components/home/the-framework.tsx)
  const tint =
    status === "verify"
      ? { c: "var(--icon-orange)", label: "Needs manual production verification" }
      : status === "direction"
        ? { c: "var(--icon-teal)", label: "Our direction" }
        : { c: "var(--icon-teal)", label: "Future" }
  return (
    <span className="inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-bold"
      style={{
        background: `color-mix(in srgb, ${tint.c} 15%, transparent)`,
        color: `color-mix(in srgb, ${tint.c} 78%, var(--foreground))`,
      }}>
      {tint.label}
    </span>
  )
}

export function Section({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">{children}</div>
    </section>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">{children}</p>
  )
}

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
      {children}
    </h2>
  )
}
