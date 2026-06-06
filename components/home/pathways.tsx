import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const PATHWAYS = [
  {
    label: "CORE",
    title: "The Food System Inside You",
    copy: "Build your personal food system to support your health, energy, and daily performance.",
    cta: "Explore You",
    href: "/you",
    sampleHref: "/report-you",
    image: "/images/hero-gut.png",
    alt: "The food system inside you — gut microbiome illustration",
    accent: "var(--icon-green)",
    gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))",
    borderColor: "color-mix(in srgb, var(--icon-green) 20%, transparent)",
    primary: true,
  },
  {
    label: "FAMILY",
    title: "The Food System Inside Your Family",
    copy: "The habits you build at home shape how your family eats, grows, and lives — today and for generations.",
    cta: "Explore Family",
    href: "/family",
    sampleHref: "/report-family",
    image: "/images/family-hero.png",
    alt: "The food system inside your family — shared food culture illustration",
    accent: "var(--icon-yellow)",
    gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-yellow))",
    borderColor: "color-mix(in srgb, var(--icon-yellow) 20%, transparent)",
    primary: false,
  },
  {
    label: "MIND",
    title: "The Food System Inside Your Mind",
    copy: "Explore how the gut-brain connection may influence mood, focus, and mental clarity — and support common conditions.",
    cta: "Explore Mind",
    href: "/mind",
    sampleHref: "/report-mind",
    image: "/images/mind-hero.png",
    alt: "The food system inside your mind — gut-brain connection illustration",
    accent: "var(--icon-teal)",
    gradient: "linear-gradient(90deg, var(--icon-teal), var(--icon-green))",
    borderColor: "color-mix(in srgb, var(--icon-teal) 20%, transparent)",
    primary: false,
  },
]

export function Pathways() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[1200px]">

        {/* Heading */}
        <ScrollReveal>
          <div className="mb-14 text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Choose Your Path
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Three ways to use{" "}
              <span className="brand-gradient-text">EatoBiotics.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Start with yourself, extend to your family, and support your mind — the food system
              you build begins with your own habits, grows through your household, and can support
              how you think, feel, and function.
            </p>
          </div>
        </ScrollReveal>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PATHWAYS.map((pathway, i) => (
            <ScrollReveal key={pathway.href} delay={i * 100}>
              <div className="group block h-full">
                <div
                  className="relative flex h-full flex-col overflow-hidden rounded-3xl border bg-background transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
                  style={{
                    borderColor: pathway.primary ? pathway.borderColor : undefined,
                    boxShadow: pathway.primary
                      ? `0 0 0 1px ${pathway.borderColor}`
                      : undefined,
                  }}
                >
                  {/* Top accent bar */}
                  <div
                    className="h-1.5 w-full shrink-0"
                    style={{ background: pathway.gradient }}
                  />

                  {/* Image — links to sample report */}
                  <Link href={pathway.sampleHref} className="relative w-full overflow-hidden bg-secondary/20 p-5 block">
                    <div className="relative aspect-square w-full">
                      <Image
                        src={pathway.image}
                        alt={pathway.alt}
                        fill
                        className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-6">
                    <p
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: pathway.accent }}
                    >
                      {pathway.label}
                    </p>
                    {/* Title links to sample report */}
                    <Link href={pathway.sampleHref}>
                      <h3 className="mt-2 font-serif text-xl font-semibold leading-snug text-foreground hover:underline decoration-1 underline-offset-2">
                        {pathway.title}
                      </h3>
                    </Link>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {pathway.copy}
                    </p>

                    {/* CTA area */}
                    <div className="mt-5 space-y-3">
                      {/* Secondary: view sample */}
                      <Link
                        href={pathway.sampleHref}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-75"
                        style={{ color: pathway.accent }}
                      >
                        View sample report
                        <ArrowRight size={13} />
                      </Link>

                      {/* Primary: start assessment */}
                      <Link
                        href="/assessment"
                        className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 brand-gradient"
                      >
                        Start free assessment
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  )
}
