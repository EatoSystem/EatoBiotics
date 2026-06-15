import Link from "next/link"
import { User, Compass, Activity, Users, Brain, Dumbbell, ArrowUpRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const PROGRAMS = [
  { name: "You", icon: User, tagline: "The Food System Inside You", href: "/you", accent: "var(--icon-green)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" },
  { name: "Stability™", icon: Compass, tagline: "The Stability System Inside You", href: "/stability", accent: "var(--icon-teal)", gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" },
  { name: "EatoBetics", icon: Activity, tagline: "The Glucose System Inside You", href: "/eatobetics", accent: "var(--icon-orange)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" },
  { name: "Family", icon: Users, tagline: "The Food System Inside Your Family", href: "/family", accent: "var(--icon-lime)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" },
  { name: "Mind", icon: Brain, tagline: "The Food System Inside Your Mind", href: "/mind", accent: "var(--icon-teal)", gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" },
  { name: "Sports", icon: Dumbbell, tagline: "The Performance System Inside You", href: "/eatosports", accent: "var(--icon-yellow)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" },
]

export function Ecosystem() {
  return (
    <section className="bg-secondary/40 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <p className="text-xs font-bold uppercase tracking-widest text-icon-green">The Ecosystem</p>
          <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
            One philosophy.
            <br />
            <span className="brand-gradient-text">Six systems.</span>
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            The Food System Inside You is the core. Each program applies the same three biotics to a
            different part of your life — your gut, your glucose, your family, your mind, your sport.
          </p>
        </ScrollReveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.map((p, index) => (
            <ScrollReveal key={p.name} delay={index * 80}>
              <Link href={p.href} className="block h-full">
                <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-6 transition-all hover:shadow-lg">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: p.gradient }} />
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${p.accent} 15%, transparent)` }}>
                      <p.icon size={20} style={{ color: p.accent }} />
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-foreground">{p.name}</h3>
                  </div>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">{p.tagline}</p>
                  <span className="mt-4 flex items-center gap-1 text-sm font-semibold opacity-70 transition-opacity group-hover:opacity-100" style={{ color: p.accent }}>
                    Explore <ArrowUpRight size={14} />
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
