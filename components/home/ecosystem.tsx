import Image from "next/image"
import Link from "next/link"
import { User, Compass, Activity, Users, Brain, Dumbbell, ArrowUpRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

type Program = {
  name: string; kind: string; cta: string
  icon: typeof User; tagline: string; description: string; href: string
  accent: string; gradient: string; image: string; imageAlt: string
}

const FOUNDATIONS: Program[] = [
  { name: "You", kind: "Foundation", cta: "Start with You", icon: User, tagline: "The Food System Inside You", description: "Your personal Food System foundation, score, report, and improvement priorities.", href: "/assessment/you", accent: "var(--icon-green)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))", image: "/images/hero-gut.png", imageAlt: "The food system inside you — gut microbiome illustration" },
  { name: "Family", kind: "Foundation", cta: "Start with Family", icon: Users, tagline: "The Food System Inside Your Family", description: "Your household Food System foundation, routines, habits, and shared priorities.", href: "/assessment/family", accent: "var(--icon-lime)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))", image: "/images/family-hero.png", imageAlt: "The food system inside your family — family gut health illustration" },
]

const ADDONS: Program[] = [
  { name: "Stability", kind: "Add-on", cta: "Add Stability", icon: Compass, tagline: "The Stability System Inside You", description: "Add deeper support for digestive calm, consistency, and confidence.", href: "/assessment/add/stability", accent: "var(--icon-teal)", gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))", image: "/images/stability-hero.png", imageAlt: "The stability system inside you — digestive stability illustration" },
  { name: "Glucose", kind: "Add-on", cta: "Add Glucose", icon: Activity, tagline: "The Glucose System Inside You", description: "Add deeper support for steadier energy, cravings, and glucose rhythm.", href: "/assessment/add/glucose", accent: "var(--icon-orange)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))", image: "/images/eatobetics-hero.webp", imageAlt: "The glucose system inside you — blood-sugar balance illustration" },
  { name: "Mind", kind: "Add-on", cta: "Add Mind", icon: Brain, tagline: "The Food System Inside Your Mind", description: "Add deeper support for food, gut, mood, focus, and mental clarity.", href: "/assessment/add/mind", accent: "var(--icon-teal)", gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", image: "/images/mind-hero.png", imageAlt: "The food system inside your mind — gut-brain axis illustration" },
  { name: "Performance", kind: "Add-on", cta: "Add Performance", icon: Dumbbell, tagline: "The Performance System Inside You", description: "Add deeper support for energy, recovery, movement, and output.", href: "/assessment/add/performance", accent: "var(--icon-yellow)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))", image: "/images/eatosports-hero.webp", imageAlt: "The performance system inside you — athletes mid-stride illustration" },
]

/** One ecosystem card — `large` for the two foundations, `small` for the four add-ons. */
function ProgramCard({ p, size }: { p: Program; size: "large" | "small" }) {
  const large = size === "large"
  return (
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
        {/* Image area */}
        <div className={`relative w-full overflow-hidden ${large ? "aspect-[16/10]" : "aspect-[16/9]"}`}>
          <Image
            src={p.image}
            alt={p.imageAlt}
            fill
            sizes={large ? "(max-width: 640px) 100vw, 560px" : "(max-width: 640px) 50vw, 280px"}
            className={`object-contain transition-transform duration-300 group-hover:scale-105 ${large ? "p-4" : "p-3"}`}
          />
        </div>
        <div className={`flex flex-1 flex-col ${large ? "p-6 sm:p-7" : "p-4"}`}>
          <div className="flex items-center gap-2.5">
            <div
              className={`flex items-center justify-center rounded-xl shadow-sm ${large ? "h-10 w-10" : "h-8 w-8"}`}
              style={{ background: p.gradient }}
            >
              <p.icon size={large ? 20 : 16} className="text-white" />
            </div>
            <div>
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: p.kind === "Foundation" ? "var(--icon-green)" : "color-mix(in srgb, var(--muted-foreground) 90%, transparent)" }}
              >
                {p.kind}
              </span>
              <h3 className={`font-serif font-semibold leading-tight text-foreground transition-colors group-hover:text-[color:var(--accent)] ${large ? "text-2xl" : "text-lg"}`}>{p.name}</h3>
              <p className="text-xs text-muted-foreground">{p.tagline}</p>
            </div>
          </div>
          {large && <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">{p.description}</p>}
          <span className={`flex items-center gap-1 font-semibold opacity-80 transition-opacity group-hover:opacity-100 ${large ? "mt-5 text-sm" : "mt-3 text-xs"}`} style={{ color: p.accent }}>
            {p.cta} <ArrowUpRight size={large ? 14 : 12} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

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
            <span className="brand-gradient-text">Two foundations. Four add-ons.</span>
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            Every journey begins with a foundation assessment. Once we understand your personal or family
            Food System baseline, you can add a focused assessment for Stability, Glucose, Mind, or
            Performance when you want deeper support.
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
          {/* Two foundations — large cards */}
          <div className="relative grid gap-6 sm:grid-cols-2">
            {FOUNDATIONS.map((p, index) => (
              <ScrollReveal key={p.name} delay={index * 80}>
                <ProgramCard p={p} size="large" />
              </ScrollReveal>
            ))}
          </div>

          {/* Four add-ons — compact row beneath */}
          <ScrollReveal>
            <p className="relative mt-10 mb-4 text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Add deeper support
            </p>
          </ScrollReveal>
          <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-4">
            {ADDONS.map((p, index) => (
              <ScrollReveal key={p.name} delay={index * 70}>
                <ProgramCard p={p} size="small" />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
