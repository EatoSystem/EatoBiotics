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
    href: "/assessment",
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
              The Ecosystem
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Start with yourself.{" "}
              <span className="text-muted-foreground font-normal">Extend to your family.</span>
              <br className="hidden sm:block" />
              {" "}Support your mind.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
              The food system you build begins with your own habits, grows through your household,
              and can support how you think, feel, and function.
            </p>
          </div>
        </ScrollReveal>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PATHWAYS.map((pathway, i) => (
            <ScrollReveal key={pathway.href} delay={i * 100}>
              <Link href={pathway.href} className="group block h-full">
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

                  {/* Image */}
                  <div className="relative w-full overflow-hidden bg-secondary/20 p-5">
                    <div className="relative aspect-square w-full">
                      <Image
                        src={pathway.image}
                        alt={pathway.alt}
                        fill
                        className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-6">
                    <p
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: pathway.accent }}
                    >
                      {pathway.label}
                    </p>
                    <h3 className="mt-2 font-serif text-xl font-semibold leading-snug text-foreground">
                      {pathway.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {pathway.copy}
                    </p>
                    <div
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold"
                      style={{ color: pathway.accent }}
                    >
                      {pathway.cta}
                      <ArrowRight
                        size={14}
                        className="transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  )
}
