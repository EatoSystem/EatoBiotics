import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const ASSESSMENT_HREF = "/eatobetics/assessment"

const PATHWAYS = [
  {
    label: "ENERGY",
    title: "Steady energy, fewer crashes",
    copy: "For people who feel foggy, tired, or hungry soon after meals — understand the patterns behind your afternoon slump and craving cycles.",
    image: "/images/hero-gut.png",
    alt: "The food system inside you — gut microbiome illustration",
    secondary: { label: "See how it works", href: "#how-it-works" },
    accent: "var(--icon-green)",
    gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))",
    borderColor: "color-mix(in srgb, var(--icon-green) 20%, transparent)",
    primary: true,
  },
  {
    label: "PREVENTION",
    title: "Get ahead of the curve",
    copy: "For people watching fasting glucose, HbA1c, or family risk who want to understand their metabolic health before a diagnosis ever appears.",
    image: "/images/family-hero.png",
    alt: "The food system inside your family — shared food culture illustration",
    secondary: { label: "See how it works", href: "#how-it-works" },
    accent: "var(--icon-teal)",
    gradient: "linear-gradient(90deg, var(--icon-teal), var(--icon-green))",
    borderColor: "color-mix(in srgb, var(--icon-teal) 20%, transparent)",
    primary: false,
  },
  {
    label: "GLP-1",
    title: "Make the most of your medication",
    copy: "On Ozempic, Wegovy, or Mounjaro? Use your appetite window to protect muscle and rebuild your relationship with food — not just eat less.",
    image: "/images/mind-hero.png",
    alt: "The food system inside your mind — gut-brain connection illustration",
    secondary: { label: "Explore the GLP-1 Companion", href: "/eatobetics/glp1" },
    accent: "var(--icon-orange)",
    gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))",
    borderColor: "color-mix(in srgb, var(--icon-orange) 20%, transparent)",
    primary: false,
  },
]

export function EbPathways() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="mb-14 text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Choose Your Path</p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Three ways to use{" "}
              <span className="brand-gradient-text">EatoBetics.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Whether you&apos;re chasing steadier energy, getting ahead of your numbers, or making the
              most of a GLP-1 — it starts with one free assessment.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PATHWAYS.map((p, i) => (
            <ScrollReveal key={p.label} delay={i * 100}>
              <div className="group block h-full">
                <div
                  className="relative flex h-full flex-col overflow-hidden rounded-3xl border bg-background transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
                  style={{ borderColor: p.primary ? p.borderColor : undefined, boxShadow: p.primary ? `0 0 0 1px ${p.borderColor}` : undefined }}
                >
                  <div className="h-1.5 w-full shrink-0" style={{ background: p.gradient }} />
                  <Link href={p.secondary.href} className="relative w-full overflow-hidden bg-secondary/20 p-5 block">
                    <div className="relative aspect-square w-full">
                      <Image src={p.image} alt={p.alt} fill className="object-contain transition-transform duration-500 group-hover:scale-[1.03]" sizes="(max-width: 768px) 100vw, 33vw" />
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: p.accent }}>{p.label}</p>
                    <h3 className="mt-2 font-serif text-xl font-semibold leading-snug text-foreground">{p.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{p.copy}</p>

                    <div className="mt-5 space-y-3">
                      <Link href={p.secondary.href} className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-75" style={{ color: p.accent }}>
                        {p.secondary.label}
                        <ArrowRight size={13} />
                      </Link>
                      <Link href={ASSESSMENT_HREF} className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 brand-gradient">
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
