import Image from "next/image"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ArrowUpRight } from "lucide-react"

const ASSESSMENT_HREF = "/eatobetics/assessment"

const quadrants = [
  {
    label: "Fibre First",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    examples: ["Leafy greens", "Legumes", "Non-starchy veg", "Whole grains"],
    role: "SLOW THE CURVE",
  },
  {
    label: "Protein Anchor",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    examples: ["Eggs", "Fish", "Beans", "Chicken"],
    role: "STEADY & FULL",
  },
  {
    label: "Smart Carbs",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    examples: ["Oats", "Quinoa", "Sweet potato", "Whole fruit"],
    role: "QUALITY FUEL",
  },
  {
    label: "Healthy Fats",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    examples: ["Olive oil", "Avocado", "Nuts", "Seeds"],
    role: "BALANCE",
  },
]

export function EbThePlate() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-20">

          {/* Left: text */}
          <div className="lg:w-[420px] lg:shrink-0">
            <ScrollReveal>
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">The Framework</p>
              <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                One plate.{" "}
                <span className="brand-gradient-text">Built for steady glucose.</span>
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                The EatoBetics Plate is the practical model at the heart of the framework. Four parts,
                built in the right order — fibre and vegetables first, a protein anchor, smart carbs,
                and healthy fats.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                You don&apos;t cut out the foods you love. You rebuild the plate so it works better for
                your body — flatter curves, steadier energy, fewer cravings.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <Link href={ASSESSMENT_HREF} className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-icon-green px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white">
                Take the assessment
                <ArrowUpRight size={14} />
              </Link>
            </ScrollReveal>
          </div>

          {/* Right: plate image + quadrant cards */}
          <div className="flex-1">
            <ScrollReveal delay={100}>
              <div className="flex justify-center">
                {/* TODO: swap to an EatoBetics plate image once supplied. */}
                <Image
                  src="/eatobiotics-plate.png"
                  alt="The EatoBetics Plate — fibre and vegetables, a protein anchor, smart carbohydrates, and healthy fats, built in the right order for steadier glucose."
                  width={500}
                  height={500}
                  className="w-full max-w-[420px] drop-shadow-md"
                />
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Build the plate in order: vegetables and fibre first, then protein, carbs, and fats.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {quadrants.map((q, index) => (
                  <ScrollReveal key={q.label} delay={index * 80}>
                    <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-5 transition-shadow hover:shadow-lg">
                      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: q.gradient }} />
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: q.color }}>{q.role}</p>
                      <h3 className="mt-1.5 font-serif text-base font-semibold text-foreground">{q.label}</h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {q.examples.map((ex) => (
                          <span key={ex} className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ background: q.gradient }}>{ex}</span>
                        ))}
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                A 10-minute walk after the meal flattens the curve even further.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  )
}
