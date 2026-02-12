import type { Metadata } from "next"
import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { ZigZagSection } from "@/components/framework/zig-zag-section"

export const metadata: Metadata = {
  title: "The Biotics",
  description:
    "Prebiotics, Probiotics, and Postbiotics -- the three pillars of the EatoBiotics food system for your microbiome.",
}

const deepDives = [
  {
    number: "01",
    label: "Prebiotics",
    action: "Feed",
    color: "var(--icon-lime)",
    heading: "Feed your gut bacteria",
    body: "Prebiotics are the non-digestible fibers and compounds found in everyday plant foods. They pass through your upper digestive tract undigested and reach your colon, where they become fuel for beneficial bacteria. Foods rich in prebiotics include garlic, onions, leeks, asparagus, bananas, oats, and apples. By consistently eating these foods, you provide the raw materials your gut ecosystem needs to thrive.",
    foods: ["Garlic", "Onions", "Leeks", "Asparagus", "Bananas", "Oats", "Apples", "Chicory Root"],
  },
  {
    number: "02",
    label: "Probiotics",
    action: "Add",
    color: "var(--icon-teal)",
    heading: "Add living microorganisms",
    body: "Probiotics are live beneficial bacteria and yeasts found primarily in fermented foods. When you eat yogurt, kimchi, sauerkraut, kefir, miso, tempeh, or kombucha, you are introducing new microbial residents to your gut community. These living organisms help maintain a diverse and resilient microbiome, support immune function, and aid in the breakdown of foods your body cannot process alone.",
    foods: ["Yogurt", "Kimchi", "Sauerkraut", "Kefir", "Miso", "Tempeh", "Kombucha"],
  },
  {
    number: "03",
    label: "Postbiotics",
    action: "Produce",
    color: "var(--icon-orange)",
    heading: "Harvest what your bacteria make",
    body: "Postbiotics are the beneficial compounds produced by your gut bacteria as they ferment prebiotics. These include short-chain fatty acids (like butyrate), vitamins (B12, K2), amino acids, and even neurotransmitters like serotonin. Postbiotics are the actual output of a healthy microbiome -- they reduce inflammation, strengthen your gut lining, regulate your immune system, and directly influence your mood and energy.",
    foods: ["Butyrate", "Short-chain Fatty Acids", "Vitamin K2", "Vitamin B12", "Serotonin Precursors"],
  },
]

export default function FrameworkPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative px-6 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-[680px] text-center">
          <ScrollReveal>
            <Image
              src="/eatobiotics-icon.webp"
              alt=""
              width={80}
              height={80}
              className="mx-auto mb-6 h-16 w-16 md:h-20 md:w-20"
            />
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
              The Biotics
            </p>
            <h1 className="mt-4 font-serif text-5xl font-semibold text-foreground sm:text-6xl md:text-7xl text-balance">
              Feed. Add.{" "}
              <GradientText>Produce.</GradientText>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              EatoBiotics is built on three pillars -- the three types of biotics
              that work together to build and maintain the food system inside you.
            </p>
            <div className="mx-auto mt-8 h-1 w-48 rounded-full brand-gradient" />
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* The Plate Diagram */}
      <section className="px-6 py-32 md:py-40">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">
                Visual Model
              </p>
              <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl">
                The EatoBiotics Plate
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
                A circular system where each biotic type supports the next.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="mt-16 flex justify-center">
              <Image
                src="/eatobiotics-plate.png"
                alt="The EatoBiotics Plate -- divided into four sections: Prebiotic Base with leafy greens and vegetables, Probiotic Side with fermented foods, Postbiotic Builders with berries and dark chocolate, and Protein Balance with salmon, eggs and beans."
                width={700}
                height={700}
                className="w-full max-w-[600px]"
                priority
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Deep Dives */}
      <section className="px-6 py-32 md:py-40">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
              Deep Dive
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl">
              Understanding Each Biotic
            </h2>
          </ScrollReveal>

          <div className="mt-20 flex flex-col gap-32">
            {deepDives.map((item, index) => (
              <ZigZagSection key={item.number} {...item} reverse={index % 2 === 1} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
