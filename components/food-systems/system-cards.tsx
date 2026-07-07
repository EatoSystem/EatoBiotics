import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import type { SystemDef } from "@/lib/systems"

/**
 * The /food-systems card kit — one shared chrome, three family variants, all
 * driven by SystemDef from the lib/systems.ts catalog. Foundation cards are the
 * biggest (everything begins here); Health cards are premium product cards;
 * Life cards are deliberately warmer and more human (soft wash, lifestyle tone).
 */

function CardShell({
  system,
  href,
  live,
  children,
  className = "",
  warm = false,
}: {
  system: SystemDef
  href: string
  live: boolean
  children: React.ReactNode
  className?: string
  warm?: boolean
}) {
  const inner = (
    <div
      className={`relative flex h-full flex-col overflow-hidden border border-border transition-transform duration-300 group-hover:-translate-y-1 ${warm ? "rounded-[2rem]" : "rounded-3xl bg-card"} ${className}`}
      style={warm ? { background: `linear-gradient(180deg, color-mix(in srgb, ${system.accent} 7%, #FDFBF7), #FFFFFF 70%)` } : undefined}
    >
      <div className="absolute top-0 left-0 right-0 z-20 h-1.5" style={{ background: system.gradient }} />
      {live && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${system.accent} 55%, transparent)` }}
        />
      )}
      {children}
    </div>
  )

  const shell = "group block h-full"
  if (!live) {
    return (
      <div className={shell} style={{ ["--accent" as string]: system.accent }}>
        {inner}
      </div>
    )
  }
  return (
    <Link
      href={href}
      className={`${shell} rounded-[inherit] transition-shadow duration-300 hover:shadow-[0_28px_56px_-20px_color-mix(in_srgb,var(--accent)_45%,transparent)]`}
      style={{ ["--accent" as string]: system.accent }}
    >
      {inner}
    </Link>
  )
}

function StatusLine({ system, live, large = false }: { system: SystemDef; live: boolean; large?: boolean }) {
  return (
    <span
      className={`flex items-center gap-1 font-semibold ${large ? "mt-6 text-sm" : "mt-4 text-xs"} ${live ? "opacity-80 transition-opacity group-hover:opacity-100" : "opacity-70"}`}
      style={{ color: live ? system.accent : "var(--muted-foreground)" }}
    >
      {live ? (
        <>
          Explore {system.label} <ArrowUpRight size={large ? 15 : 13} className="transition-transform group-hover:translate-x-0.5" />
        </>
      ) : (
        "Coming soon"
      )}
    </span>
  )
}

/** Foundation — the two big "everything begins here" cards. */
export function FoundationSystemCard({ system }: { system: SystemDef }) {
  const live = system.status === "live"
  const Icon = system.icon
  return (
    <CardShell system={system} href={system.href} live={live}>
      {system.image && (
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src={system.image}
            alt={`${system.productName} illustration`}
            fill
            sizes="(max-width: 1024px) 100vw, 560px"
            className="object-contain p-5 transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-7 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl shadow-sm" style={{ background: system.gradient }}>
            <Icon size={21} className="text-white" />
          </span>
          <div>
            <h3 className="font-serif text-2xl font-semibold leading-tight text-foreground transition-colors group-hover:text-[color:var(--accent)]">{system.label}</h3>
            <p className="text-sm text-muted-foreground">{system.tagline}</p>
          </div>
        </div>
        <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">{system.description}</p>
        <StatusLine system={system} live={live} large />
      </div>
    </CardShell>
  )
}

/** Health — premium product cards; icon-forward header when no artwork yet. */
export function HealthSystemCard({ system }: { system: SystemDef }) {
  const live = system.status === "live"
  const Icon = system.icon
  return (
    <CardShell system={system} href={system.href} live={live}>
      {system.image ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={system.image}
            alt={`${system.productName} illustration`}
            fill
            sizes="(max-width: 640px) 100vw, 380px"
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="relative flex aspect-[16/10] w-full items-center justify-center" style={{ background: `color-mix(in srgb, ${system.accent} 8%, transparent)` }}>
          <span className="eb-pulse-soft flex h-16 w-16 items-center justify-center rounded-2xl shadow-md" style={{ background: system.gradient }}>
            <Icon size={30} className="text-white" />
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-serif text-xl font-semibold text-foreground transition-colors group-hover:text-[color:var(--accent)]">{system.label}</h3>
        <p className="mt-0.5 text-xs font-semibold" style={{ color: system.accent }}>{system.productName}</p>
        <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">{system.description}</p>
        <StatusLine system={system} live={live} />
      </div>
    </CardShell>
  )
}

/** Life — warmer, more human: soft wash background, lifestyle tone. */
export function LifeSystemCard({ system }: { system: SystemDef }) {
  const live = system.status === "live"
  const Icon = system.icon
  return (
    <CardShell system={system} href={system.href} live={live} warm>
      {system.image && (
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={system.image}
            alt={`${system.productName} illustration`}
            fill
            sizes="(max-width: 640px) 100vw, 380px"
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-7">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm" style={{ background: system.gradient }}>
          <Icon size={26} className="text-white" />
        </span>
        <h3 className="mt-5 font-serif text-2xl font-semibold text-foreground transition-colors group-hover:text-[color:var(--accent)]">{system.label}</h3>
        <p className="mt-0.5 text-sm font-semibold" style={{ color: system.accent }}>{system.productName}</p>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{system.description}</p>
        <StatusLine system={system} live={live} large />
      </div>
    </CardShell>
  )
}

/** A family chapter header: eyebrow family label + serif headline + blurb. */
export function SystemGroup({
  id,
  label,
  headline,
  blurb,
  children,
}: {
  id?: string
  label: string
  headline: React.ReactNode
  blurb: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 px-6 py-16 md:py-20">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-icon-green">{label}</p>
          <h2 className="mt-3 max-w-2xl font-serif text-3xl font-semibold leading-tight text-foreground sm:text-4xl md:text-5xl text-balance">
            {headline}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">{blurb}</p>
        </ScrollReveal>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  )
}
