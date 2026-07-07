import { Sprout, Leaf, TreeDeciduous, Trees, type LucideIcon } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { FUTURE_LIFE_SYSTEMS, type FutureLifeSystemKey } from "@/lib/systems"

/**
 * FutureSystems — "Where Food Systems go next."
 * Four quiet, clearly-future cards (Child / Teen / Adult / Healthy Ageing) from
 * the catalog's FUTURE_LIFE_SYSTEMS. Architecture only: dashed borders, muted
 * tone, a "Future" chip, and deliberately no links or CTAs — nothing here
 * implies availability.
 */

const FUTURE_ICONS: Record<FutureLifeSystemKey, LucideIcon> = {
  child: Sprout,
  teen: Leaf,
  adult: TreeDeciduous,
  "healthy-ageing": Trees,
}

const FUTURE_ORDER: FutureLifeSystemKey[] = ["child", "teen", "adult", "healthy-ageing"]

export function FutureSystems() {
  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-icon-green">The future</p>
          <h2 className="mt-3 max-w-2xl font-serif text-3xl font-semibold leading-tight text-foreground sm:text-4xl md:text-5xl text-balance">
            Where Food Systems <span className="brand-gradient-text">go next.</span>
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            The architecture is built for a whole life. These Life Systems are part of the roadmap —
            not available yet, and shown here only so you can see where the platform is heading.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FUTURE_ORDER.map((key, i) => {
            const meta = FUTURE_LIFE_SYSTEMS[key]
            const Icon = FUTURE_ICONS[key]
            return (
              <ScrollReveal key={key} delay={i * 70}>
                <div className="flex h-full flex-col rounded-2xl border border-dashed border-border bg-card/50 p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "color-mix(in srgb, var(--icon-green) 10%, transparent)" }}>
                      <Icon size={19} className="text-icon-green/80" />
                    </span>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      Future
                    </span>
                  </div>
                  <h3 className="mt-4 font-serif text-lg font-semibold text-foreground/80">{meta.label}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground/80">{meta.blurb}</p>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
