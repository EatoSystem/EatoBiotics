import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import {
  foundationSystems,
  healthSystems,
  lifeSystems,
  FAMILY_META,
  type SystemDef,
  type SystemFamily,
} from "@/lib/systems"

/**
 * "Explore Your Food System" — the account lenses.
 *
 * Catalog-driven from `lib/systems.ts`. Every system here is a *lens* into the
 * same living Food System (Foundation / Health / Life), not a separate
 * dashboard. Live systems link to their home; scaffold systems read "Coming
 * soon"; the Life group carries a non-medical safety line.
 */

const LIFE_SAFETY_LINE =
  "Food-first education only. For pregnancy, birth, baby feeding or child health concerns, always speak with a qualified healthcare professional."

function LensCard({ system }: { system: SystemDef }) {
  const live = system.status === "live"
  const Icon = system.icon

  const inner = (
    <div className="relative flex h-full flex-col rounded-2xl border border-border bg-card p-4 transition-transform duration-300 group-hover:-translate-y-0.5">
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: system.gradient }} />
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm" style={{ background: system.gradient }}>
          <Icon size={17} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-serif text-base font-semibold leading-tight text-foreground transition-colors group-hover:text-[color:var(--accent)]">{system.label}</h4>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{system.focus}</p>
        </div>
      </div>
      <span
        className={`mt-3 flex items-center gap-1 text-xs font-semibold ${live ? "opacity-80 group-hover:opacity-100" : "opacity-70"}`}
        style={{ color: live ? system.accent : "var(--muted-foreground)" }}
      >
        {live ? (
          <>
            Open {system.label} <ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5" />
          </>
        ) : (
          "Coming soon"
        )}
      </span>
    </div>
  )

  if (!live) {
    return (
      <div className="group block h-full" style={{ ["--accent" as string]: system.accent }}>
        {inner}
      </div>
    )
  }
  return (
    <Link href={system.href} className="group block h-full" style={{ ["--accent" as string]: system.accent }}>
      {inner}
    </Link>
  )
}

function LensGroup({ family, systems }: { family: SystemFamily; systems: SystemDef[] }) {
  const meta = FAMILY_META[family]
  return (
    <div className="mt-6">
      <p className="text-[11px] font-bold uppercase tracking-widest text-icon-green">{meta.label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{meta.blurb}</p>
      <div className={`mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 ${family === "foundation" ? "" : "md:grid-cols-3"}`}>
        {systems.map((s) => (
          <LensCard key={s.key} system={s} />
        ))}
      </div>
      {family === "life" && (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground/80">{LIFE_SAFETY_LINE}</p>
      )}
    </div>
  )
}

/** The "Explore Your Food System" chapter for the account overview. */
export function SystemsExplorer() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-4 md:px-8">
      <LensGroup family="foundation" systems={foundationSystems()} />
      <LensGroup family="health" systems={healthSystems()} />
      <LensGroup family="life" systems={lifeSystems()} />
    </div>
  )
}
