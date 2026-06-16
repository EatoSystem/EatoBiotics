import Image from "next/image"
import Link from "next/link"
import { User, Compass, Activity, Users, Brain, Dumbbell, ArrowUpRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const PROGRAMS = [
  { name: "You", icon: User, tagline: "The Food System Inside You", description: "Your personal food system score.", href: "/you", accent: "var(--icon-green)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))", image: "/images/hero-gut.png", imageAlt: "The food system inside you — gut microbiome illustration" },
  { name: "Stability", icon: Compass, tagline: "The Stability System Inside You", description: "Calm digestion and daily consistency.", href: "/stability", accent: "var(--icon-teal)", gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))", image: "/images/stability-hero.png", imageAlt: "The stability system inside you — digestive stability illustration" },
  { name: "Glucose", icon: Activity, tagline: "The Glucose System Inside You", description: "Steadier energy, cravings, and blood sugar rhythm.", href: "/glucose", accent: "var(--icon-orange)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))", image: "/images/eatobetics-hero.webp", imageAlt: "The glucose system inside you — blood-sugar balance illustration" },
  { name: "Family", icon: Users, tagline: "The Food System Inside Your Family", description: "Better food habits for households and daily routines.", href: "/family", accent: "var(--icon-lime)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))", image: "/images/family-hero.png", imageAlt: "The food system inside your family — family gut health illustration" },
  { name: "Mind", icon: Brain, tagline: "The Food System Inside Your Mind", description: "Food, gut, mood, focus, and mental clarity.", href: "/mind", accent: "var(--icon-teal)", gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", image: "/images/mind-hero.png", imageAlt: "The food system inside your mind — gut-brain axis illustration" },
  { name: "Performance", icon: Dumbbell, tagline: "The Performance System Inside You", description: "Fuel energy, recovery, strength, and output.", href: "/performance", accent: "var(--icon-yellow)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))", image: "/images/eatosports-hero.webp", imageAlt: "The performance system inside you — athletes mid-stride illustration" },
]

export function Ecosystem() {
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
          <p className="text-xs font-bold uppercase tracking-widest text-icon-green">The Ecosystem</p>
          <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
            One philosophy.
            <br />
            <span className="brand-gradient-text">Six systems.</span>
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            Your food system does not work in isolation. EatoBiotics connects digestion, diversity,
            stability, recovery, longevity, and performance into one clear way to understand and
            improve your health.
          </p>
        </ScrollReveal>

        <div
          className="relative mt-16 overflow-hidden rounded-[2rem] border border-border/50 p-5 sm:p-8"
          style={{ background: "color-mix(in srgb, var(--icon-green) 3%, transparent)" }}
        >
          {/* connected-system glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{ background: "radial-gradient(45% 55% at 50% 40%, color-mix(in srgb, var(--icon-teal) 9%, transparent), transparent 72%)" }}
          />
          <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.map((p, index) => (
            <ScrollReveal key={p.name} delay={index * 80}>
              <Link
                href={p.href}
                className="group block h-full rounded-2xl transition-shadow duration-300 hover:shadow-[0_24px_48px_-18px_color-mix(in_srgb,var(--accent)_45%,transparent)]"
                style={{ ["--accent" as string]: p.accent }}
              >
                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-300 group-hover:-translate-y-1">
                  {/* Top gradient bar */}
                  <div className="absolute top-0 left-0 right-0 z-20 h-1.5" style={{ background: p.gradient }} />
                  {/* Gradient ring on hover */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-20 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${p.accent} 55%, transparent)` }}
                  />
                  {/* Clean white image area */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <Image
                      src={p.image}
                      alt={p.imageAlt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                      className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
                        style={{ background: p.gradient }}
                      >
                        <p.icon size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-semibold leading-tight text-foreground transition-colors group-hover:text-[color:var(--accent)]">{p.name}</h3>
                        <p className="text-xs text-muted-foreground">{p.tagline}</p>
                      </div>
                    </div>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                    <span className="mt-4 flex items-center gap-1 text-sm font-semibold opacity-80 transition-opacity group-hover:opacity-100" style={{ color: p.accent }}>
                      Explore <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
          </div>
        </div>
      </div>
    </section>
  )
}
