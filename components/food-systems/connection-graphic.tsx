import { ScrollReveal } from "@/components/scroll-reveal"
import { DigitalTwinFigure } from "@/components/digital-twin/parts"
import {
  foundationSystems,
  healthSystems,
  lifeSystems,
  FAMILY_META,
  type SystemDef,
  type SystemFamily,
} from "@/lib/systems"

/**
 * AnimatedConnectionGraphic — "Everything connects."
 * A living radial composition (not a flowchart): the Food System figure at the
 * centre, Foundation systems on the inner ring, Health systems on the middle
 * ring, Life systems on the outer arc — every node tethered to the centre by a
 * flowing connector. CSS-only motion (eb-* classes, reduced-motion gated).
 * Server component; node positions are precomputed at module scope.
 */

const FAMILY_STROKE: Record<SystemFamily, string> = {
  foundation: "rgba(76,182,72,0.45)",
  health: "rgba(45,170,110,0.35)",
  life: "rgba(245,166,35,0.40)",
}

type Node = { system: SystemDef; left: number; top: number }

function polar(r: number, deg: number): { left: number; top: number } {
  const rad = (deg * Math.PI) / 180
  return { left: 50 + r * Math.cos(rad), top: 50 + r * Math.sin(rad) }
}

function ringNodes(systems: SystemDef[], r: number, angles: number[]): Node[] {
  return systems.map((system, i) => ({ system, ...polar(r, angles[i]) }))
}

const FOUNDATION_NODES = ringNodes(foundationSystems(), 24, [180, 0])
const HEALTH_NODES = ringNodes(healthSystems(), 38, [-90, -30, 30, 90, 150, 210])
const LIFE_NODES = ringNodes(lifeSystems(), 50, [-142, -90, -38])
const ALL_NODES: Array<Node & { family: SystemFamily }> = [
  ...FOUNDATION_NODES.map((n) => ({ ...n, family: "foundation" as const })),
  ...HEALTH_NODES.map((n) => ({ ...n, family: "health" as const })),
  ...LIFE_NODES.map((n) => ({ ...n, family: "life" as const })),
]

function NodeChip({ system, left, top }: Node) {
  const Icon = system.icon
  return (
    <div
      className="absolute z-10 flex items-center gap-1.5 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-3 shadow-md"
      style={{ left: `${left}%`, top: `${top}%`, transform: "translate(-50%,-50%)" }}
    >
      <span
        aria-hidden
        className="eb-pulse-soft pointer-events-none absolute left-1/2 top-1/2 -z-10 h-12 w-12 rounded-full"
        style={{ transform: "translate(-50%,-50%)", background: `radial-gradient(circle, color-mix(in srgb, ${system.accent} 26%, transparent), transparent 70%)` }}
      />
      <span className="flex h-6 w-6 items-center justify-center rounded-full shadow-sm" style={{ background: system.gradient }}>
        <Icon size={12} className="text-white" />
      </span>
      <span className="whitespace-nowrap text-xs font-semibold text-foreground">{system.label}</span>
    </div>
  )
}

function FamilyBand({ family, systems }: { family: SystemFamily; systems: SystemDef[] }) {
  return (
    <div className="flex flex-col items-center">
      <p className="text-[11px] font-bold uppercase tracking-widest text-icon-green">{FAMILY_META[family].label}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {systems.map((s) => {
          const Icon = s.icon
          return (
            <span key={s.key} className="flex items-center gap-1.5 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-3 shadow-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: s.gradient }}>
                <Icon size={12} className="text-white" />
              </span>
              <span className="text-xs font-semibold text-foreground">{s.label}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

/** Vertical flowing connector for the stacked mobile fallback. */
function FlowConnector() {
  return (
    <div aria-hidden className="relative mx-auto my-4 h-10 w-[3px] overflow-hidden rounded-full">
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, var(--icon-lime), var(--icon-green), var(--icon-teal))", opacity: 0.5 }} />
      <div
        className="eb-spine-flow absolute inset-0"
        style={{
          background: "repeating-linear-gradient(180deg, rgba(255,255,255,0) 0 8px, rgba(255,255,255,0.9) 8px 14px, rgba(255,255,255,0) 14px 40px)",
          backgroundSize: "100% 240px",
        }}
      />
    </div>
  )
}

export function AnimatedConnectionGraphic() {
  return (
    <section className="relative overflow-hidden px-6 py-20 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/4 -z-0 mx-auto h-[520px] max-w-[1000px] opacity-60 blur-3xl"
        style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(168,224,99,0.12), rgba(245,166,35,0.06) 55%, transparent 78%)" }}
      />
      <div className="relative mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-icon-green">One connected philosophy</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-foreground sm:text-4xl md:text-5xl text-balance">
              Everything <span className="brand-gradient-text">connects.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              One Food System. Three families. Foundation systems create the baseline, Health
              systems strengthen it, and Life systems carry it through every transition — all
              lenses on the same living whole.
            </p>
          </div>
        </ScrollReveal>

        {/* ── Desktop: living radial ecosystem ── */}
        <ScrollReveal delay={120}>
          <div className="relative mx-auto mt-14 hidden aspect-square w-[min(680px,88vw)] md:block">
            {/* family rings */}
            <div aria-hidden className="eb-ring-spin pointer-events-none absolute inset-[26%] rounded-full" style={{ border: "1.5px dashed rgba(76,182,72,0.35)" }} />
            <div aria-hidden className="eb-ring-spin-rev pointer-events-none absolute inset-[12%] rounded-full" style={{ border: "1.5px dashed rgba(45,170,110,0.28)" }} />
            <div aria-hidden className="eb-ring-spin pointer-events-none absolute inset-0 rounded-full" style={{ border: "1px dashed rgba(245,166,35,0.30)" }} />

            {/* flowing tethers from every system into the one Food System */}
            <svg aria-hidden viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full">
              {ALL_NODES.map((n) => (
                <line
                  key={n.system.key}
                  x1="50"
                  y1="50"
                  x2={n.left}
                  y2={n.top}
                  stroke={FAMILY_STROKE[n.family]}
                  strokeWidth="0.45"
                  strokeLinecap="round"
                  strokeDasharray="1 3.4"
                  className="eb-flow"
                />
              ))}
            </svg>

            {/* the one Food System at the centre */}
            <div className="absolute left-1/2 top-1/2" style={{ transform: "translate(-50%,-50%)" }}>
              <DigitalTwinFigure size={230} src="/images/couple-hero.png" alt="One Food System" showParticles={false} />
              <p className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-card px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-icon-green shadow-sm">
                One Food System
              </p>
            </div>

            {/* system nodes */}
            {ALL_NODES.map((n) => (
              <NodeChip key={n.system.key} system={n.system} left={n.left} top={n.top} />
            ))}
          </div>
        </ScrollReveal>

        {/* ── Mobile: three connected family bands ── */}
        <ScrollReveal delay={120}>
          <div className="mt-12 md:hidden">
            <div className="flex flex-col items-center">
              <DigitalTwinFigure size={210} src="/images/couple-hero.png" alt="One Food System" />
              <p className="rounded-full border border-border bg-card px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-icon-green shadow-sm">
                One Food System
              </p>
            </div>
            <FlowConnector />
            <FamilyBand family="foundation" systems={foundationSystems()} />
            <FlowConnector />
            <FamilyBand family="health" systems={healthSystems()} />
            <FlowConnector />
            <FamilyBand family="life" systems={lifeSystems()} />
          </div>
        </ScrollReveal>

        {/* family legend (desktop) */}
        <ScrollReveal delay={200}>
          <div className="mt-10 hidden items-center justify-center gap-8 md:flex">
            {(["foundation", "health", "life"] as SystemFamily[]).map((f) => (
              <span key={f} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: f === "foundation" ? "var(--icon-green)" : f === "health" ? "var(--icon-teal)" : "var(--icon-orange)" }} />
                {FAMILY_META[f].label}
              </span>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
