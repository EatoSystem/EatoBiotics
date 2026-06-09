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

// The Four Plates — evolved from the EatoBiotics weekly system for glucose,
// reusing the same plate photography.
const PLATES = [
  {
    number: "1.1",
    name: "The Steady Plate",
    role: "Foundation",
    personalityWord: "Balanced",
    message: "This is where steady glucose begins.",
    description:
      "The entry point — the clearest, most balanced plate in the system. Vegetables and fibre first, a quality protein anchor, smart carbs, and healthy fats, built in the right order.",
    emphasis: "Balance & food order",
    supports: ["stability", "energy", "fullness"],
    image: "/food-1.webp",
    topBar: "var(--icon-lime)",
    accent: "var(--icon-lime)",
    accentClass: "text-icon-lime",
    borderColor: "border-icon-lime/20",
    tagBg: "bg-icon-lime/10",
  },
  {
    number: "1.2",
    name: "The Energy & Focus Plate",
    role: "Function",
    personalityWord: "Functional",
    message: "Eat now for the energy you want this afternoon.",
    description:
      "Built to flatten the post-meal curve so you stay sharp — more fibre and protein up front, fewer fast carbs, and a short walk to finish.",
    emphasis: "Steady energy, no crashes",
    supports: ["focus", "fewer cravings", "stamina"],
    image: "/food-2.webp",
    topBar: "linear-gradient(90deg, var(--icon-lime), var(--icon-yellow))",
    accent: "var(--icon-yellow)",
    accentClass: "text-icon-yellow",
    borderColor: "border-icon-yellow/20",
    tagBg: "bg-icon-yellow/10",
  },
  {
    number: "1.3",
    name: "The Abundance Plate",
    role: "Richness",
    personalityWord: "Abundant",
    message: "A flatter curve doesn't mean less food.",
    description:
      "Fibre-rich and plant-diverse — colour, volume, and variety that slow absorption and keep you full, without ever feeling like restriction.",
    emphasis: "Fibre & diversity",
    supports: ["satiety", "gut health", "stability"],
    image: "/food-7.webp",
    topBar: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow))",
    accent: "var(--icon-teal)",
    accentClass: "text-icon-teal",
    borderColor: "border-icon-teal/20",
    tagBg: "bg-icon-teal/10",
  },
  {
    number: "1.4",
    name: "The Reset Plate",
    role: "Restoration",
    personalityWord: "Restorative",
    message: "Not perfection. Back on track.",
    description:
      "Closes the week with gentle, grounding meals — warming foods, a lower glycaemic load, and steadier blood sugar to reset and rebuild.",
    emphasis: "Recovery & steadiness",
    supports: ["reset", "steadiness", "resilience"],
    image: "/food-4.webp",
    topBar: "linear-gradient(90deg, var(--icon-teal), var(--icon-green))",
    accent: "var(--icon-orange)",
    accentClass: "text-icon-orange",
    borderColor: "border-icon-orange/20",
    tagBg: "bg-icon-orange/10",
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

        {/* ── The Four Plates ── */}
        <div className="mt-20 border-t border-border/60" />

        <div className="mt-16">
          <ScrollReveal>
            <p className="text-center text-sm leading-relaxed text-muted-foreground max-w-xl mx-auto">
              Across the week, the framework expresses itself through four distinct plates — each with
              its own role in keeping your glucose steady.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={60}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">The Four Plates</p>
                <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
                  Four plates. Four jobs.{" "}
                  <span className="brand-gradient-text">One steady week.</span>
                </h2>
              </div>
              <Link href={ASSESSMENT_HREF} className="flex shrink-0 items-center gap-1 text-sm font-medium text-icon-green transition-colors hover:text-icon-orange">
                Take the assessment
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </ScrollReveal>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            {PLATES.map((plate, i) => (
              <ScrollReveal key={plate.number} delay={i * 60}>
                <Link href={ASSESSMENT_HREF} className="group block">
                  <div className={`overflow-hidden rounded-3xl border ${plate.borderColor} bg-background transition-all hover:shadow-lg`}>
                    <div className="h-[5px] w-full" style={{ background: plate.topBar }} />
                    <div className="relative w-full overflow-hidden bg-white">
                      <Image src={plate.image} alt={plate.name} width={600} height={600} className="w-full h-auto" />
                    </div>
                    <div className="p-7">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ background: plate.accent }}>{plate.number}</span>
                          <span className={`text-xs font-semibold uppercase tracking-widest ${plate.accentClass}`}>{plate.role}</span>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${plate.tagBg} ${plate.accentClass}`}>{plate.personalityWord}</span>
                      </div>
                      <h3 className="mt-3 font-serif text-xl font-semibold text-foreground leading-tight">{plate.name}</h3>
                      <p className="mt-3 text-base italic leading-relaxed text-muted-foreground/80">&ldquo;{plate.message}&rdquo;</p>
                      <p className="mt-3 text-[15px] leading-7 text-muted-foreground">{plate.description}</p>
                      <div className="my-5 h-px bg-border" />
                      <div className="flex flex-wrap items-center gap-2">
                        {plate.supports.map((s) => (
                          <span key={s} className={`rounded-full px-3 py-1 text-xs font-medium ${plate.tagBg} ${plate.accentClass}`}>{s}</span>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground/60">
                        <span className="font-semibold text-foreground/60">Emphasis:</span> {plate.emphasis}
                      </p>
                      <p className={`mt-4 text-xs font-semibold ${plate.accentClass} opacity-0 transition-opacity group-hover:opacity-100`}>
                        Take the assessment →
                      </p>
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
