/*
 * Shared primitives for homepage sections composed from the existing design
 * system idioms (see how-it-works.tsx, the-framework.tsx):
 *   - Section wrapper:  <section class="px-6 py-24 md:py-32"> + max-w-[1200px]
 *   - Eyebrow:          text-xs font-semibold uppercase tracking-widest text-icon-green
 *   - H2:               font-serif text-4xl font-semibold sm:text-5xl text-balance
 *   - Status pills:     gradient pill and color-mix tint pill, matching the
 *                       existing stat-pill idiom in the-framework.tsx
 */
import type { ReactNode } from "react"

export type Availability = "available" | "in-development" | "direction"

export function StatusBadge({ status }: { status: Availability }) {
  if (status === "available") {
    return (
      <span
        className="inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white"
        style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
      >
        Available now
      </span>
    )
  }
  if (status === "in-development") {
    return (
      <span
        className="inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white"
        style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}
      >
        In development
      </span>
    )
  }
  return (
    <span
      className="inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-bold"
      style={{
        background: "color-mix(in srgb, var(--icon-teal) 15%, transparent)",
        color: "color-mix(in srgb, var(--icon-teal) 78%, var(--foreground))",
      }}
    >
      Our direction
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
  return <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">{children}</p>
}

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
      {children}
    </h2>
  )
}
