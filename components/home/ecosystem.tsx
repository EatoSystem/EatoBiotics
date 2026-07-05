import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import {
  foundationSystems,
  healthSystems,
  lifeSystems,
  FAMILY_META,
  type SystemDef,
} from "@/lib/systems"

/**
 * The homepage Systems section — one living Food System, supported through
 * three families of systems (Foundation / Health / Life). Catalog-driven from
 * `lib/systems.ts` so the taxonomy never drifts. Live systems link to their
 * landing; scaffold systems read as a calm "Coming soon". Life systems carry a
 * non-medical safety line (they are food-first education only).
 */

const LIFE_SAFETY_LINE =
  "Food-first education only. For pregnancy, birth, baby feeding or child health concerns, always speak with a qualified healthcare professional."

/** One system card — `large` for the two foundations, `small` for the rest. */
function SystemCard({ system, size }: { system: SystemDef; size: "large" | "small" }) {
  const large = size === "large"
  const live = system.status === "live"
  const Icon = system.icon

  const inner = (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-300 group-hover:-translate-y-1">
      {/* Top gradient bar */}
      <div className="absolute top-0 left-0 right-0 z-20 h-1.5" style={{ background: system.gradient }} />
      {/* Gradient ring on hover (live only) */}
      {live && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${system.accent} 55%, transparent)` }}
        />
      )}

      {/* Image area (only when the system has imagery) */}
      {system.image ? (
        <div className={`relative w-full overflow-hidden ${large ? "aspect-[16/10]" : "aspect-[16/9]"}`}>
          <Image
            src={system.image}
            alt={`${system.productName} illustration`}
            fill
            sizes={large ? "(max-width: 640px) 100vw, 560px" : "(max-width: 640px) 50vw, 280px"}
            className={`object-contain transition-transform duration-300 group-hover:scale-105 ${large ? "p-4" : "p-3"}`}
          />
        </div>
      ) : (
        // Icon-forward header for scaffold systems (no artwork yet)
        <div className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden" style={{ background: `color-mix(in srgb, ${system.accent} 8%, transparent)` }}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm" style={{ background: system.gradient }}>
            <Icon size={26} className="text-white" />
          </div>
        </div>
      )}

      <div className={`flex flex-1 flex-col ${large ? "p-6 sm:p-7" : "p-4"}`}>
        <div className="flex items-center gap-2.5">
          <div
            className={`flex items-center justify-center rounded-xl shadow-sm ${large ? "h-10 w-10" : "h-8 w-8"}`}
            style={{ background: system.gradient }}
          >
            <Icon size={large ? 20 : 16} className="text-white" />
          </div>
          <div className="min-w-0">
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: system.family === "foundation" ? "var(--icon-green)" : "color-mix(in srgb, var(--muted-foreground) 90%, transparent)" }}
            >
              {system.family === "foundation" ? "Foundation" : system.family === "health" ? "Health" : "Life"}
            </span>
            <h3 className={`font-serif font-semibold leading-tight text-foreground transition-colors group-hover:text-[color:var(--accent)] ${large ? "text-2xl" : "text-lg"}`}>{system.label}</h3>
            <p className="truncate text-xs text-muted-foreground">{system.tagline}</p>
          </div>
        </div>

        {large && <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">{system.description}</p>}

        <span
          className={`flex items-center gap-1 font-semibold transition-opacity ${large ? "mt-5 text-sm" : "mt-3 text-xs"} ${live ? "opacity-80 group-hover:opacity-100" : "opacity-70"}`}
          style={{ color: live ? system.accent : "var(--muted-foreground)" }}
        >
          {live ? (
            <>
              Explore {system.label} <ArrowUpRight size={large ? 14 : 12} className="transition-transform group-hover:translate-x-0.5" />
            </>
          ) : (
            "Coming soon"
          )}
        </span>
      </div>
    </div>
  )

  const shell = "group block h-full rounded-2xl"
  if (!live) {
    return (
      <div className={shell} style={{ ["--accent" as string]: system.accent }}>
        {inner}
      </div>
    )
  }
  return (
    <Link
      href={system.href}
      className={`${shell} transition-shadow duration-300 hover:shadow-[0_24px_48px_-18px_color-mix(in_srgb,var(--accent)_45%,transparent)]`}
      style={{ ["--accent" as string]: system.accent }}
    >
      {inner}
    </Link>
  )
}

function GroupHeader({ family }: { family: "foundation" | "health" | "life" }) {
  const meta = FAMILY_META[family]
  return (
    <div className="relative mb-6 flex flex-col gap-1.5 text-center">
      <p className="text-[11px] font-bold uppercase tracking-widest text-icon-green">{meta.label}</p>
      <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground">{meta.blurb}</p>
    </div>
  )
}

export function Ecosystem() {
  const foundations = foundationSystems()
  const health = healthSystems()
  const life = lifeSystems()

  return (
    <section className="relative overflow-hidden bg-background px-6 py-24 md:py-32">
      {/* Ambient brand wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/4 -z-0 mx-auto h-[480px] max-w-[1100px] opacity-60 blur-3xl"
        style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(168,224,99,0.10), rgba(45,170,110,0.07) 45%, transparent 75%)" }}
      />
      <div className="relative mx-auto max-w-[1200px]">
        <ScrollReveal>
          <p className="text-xs font-bold uppercase tracking-widest text-icon-green">The Systems</p>
          <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
            One Food System.
            <br />
            <span className="brand-gradient-text">Many ways to support it.</span>
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            Everything starts with a Foundation — your personal or family Food System. Health systems
            strengthen a specific area, and Life systems support the biggest transitions. Every system
            builds on your foundation; none stand alone.
          </p>
        </ScrollReveal>

        {/* ── Foundation ── */}
        <div
          className="relative mt-14 overflow-hidden rounded-[2rem] border border-border/50 p-5 sm:p-8"
          style={{ background: "color-mix(in srgb, var(--icon-green) 3%, transparent)" }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{ background: "radial-gradient(45% 55% at 50% 40%, color-mix(in srgb, var(--icon-teal) 9%, transparent), transparent 72%)" }}
          />
          <ScrollReveal><GroupHeader family="foundation" /></ScrollReveal>
          <div className="relative grid gap-6 sm:grid-cols-2">
            {foundations.map((s, index) => (
              <ScrollReveal key={s.key} delay={index * 80}>
                <SystemCard system={s} size="large" />
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* ── Health ── */}
        <div className="relative mt-14">
          <ScrollReveal><GroupHeader family="health" /></ScrollReveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {health.map((s, index) => (
              <ScrollReveal key={s.key} delay={index * 60}>
                <SystemCard system={s} size="small" />
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* ── Life ── */}
        <div className="relative mt-14">
          <ScrollReveal><GroupHeader family="life" /></ScrollReveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {life.map((s, index) => (
              <ScrollReveal key={s.key} delay={index * 60}>
                <SystemCard system={s} size="small" />
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal>
            <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground/80">
              {LIFE_SAFETY_LINE}
            </p>
          </ScrollReveal>
        </div>

        {/* Discovery: the flagship platform story */}
        <ScrollReveal>
          <div className="mt-12 text-center">
            <Link
              href="/food-systems"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-icon-green underline underline-offset-4 transition-colors hover:text-icon-teal"
            >
              Explore all Food Systems <ArrowUpRight size={15} />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
