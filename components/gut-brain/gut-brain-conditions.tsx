import { ScrollReveal } from "@/components/scroll-reveal"

const CONDITIONS = [
  {
    name: "Depression",
    emoji: "🌧️",
    gutLink:
      "People with depression show significantly reduced microbial diversity — particularly lower levels of Lactobacillus and Bifidobacterium, the bacteria most associated with serotonin and GABA production. Neuroinflammation driven by dysbiosis is now considered a primary mechanism in treatment-resistant depression.",
    foodAngle:
      "Fermented foods, diverse plants, and prebiotic fibre directly increase the bacterial populations depleted in depression. Clinical trials show dietary improvement reduces depressive symptoms comparably to low-dose pharmacological intervention.",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  },
  {
    name: "Anxiety",
    emoji: "⚡",
    gutLink:
      "The gut produces GABA — the brain's primary calming neurotransmitter — through specific probiotic bacteria. Anxiety disorders consistently show reduced vagal tone (the signalling strength between gut and brain) and elevated intestinal permeability, allowing inflammatory molecules to cross the gut wall and reach the brain.",
    foodAngle:
      "Foods that restore gut barrier integrity (postbiotics), increase GABA-producing bacteria (fermented foods), and reduce inflammation (polyphenol-rich plants) each address a different mechanism through which the gut drives anxiety.",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
  {
    name: "Bipolar Disorder",
    emoji: "🔄",
    gutLink:
      "Research consistently shows that people with bipolar disorder have a distinct gut microbiome signature — lower microbial diversity, elevated inflammatory markers, and disrupted circadian rhythm in gut bacterial activity. Mood episodes correlate with periods of gut dysbiosis, and gut inflammation precedes mood shifts rather than following them.",
    foodAngle:
      "While bipolar disorder requires medical management, gut health is a modifiable factor that affects mood stability. Consistent meal timing, prebiotic fibre, and live fermented foods each support the circadian gut rhythm that mood stabilisation depends on.",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  {
    name: "ADHD & Focus",
    emoji: "🎯",
    gutLink:
      "ADHD is associated with lower levels of short-chain fatty acid-producing bacteria, elevated intestinal permeability, and disruption to the dopamine-serotonin balance that the gut-brain axis regulates. Gut inflammation reduces the bioavailability of tryptophan — the amino acid your gut converts into serotonin.",
    foodAngle:
      "Omega-3 rich foods (wild salmon, walnuts), polyphenol-rich plants (blueberries, dark chocolate), and fermented foods all directly support the bacterial and inflammatory pathways most disrupted in ADHD presentations.",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
]

export function GutBrainConditions() {
  return (
    <section className="bg-secondary/40 px-6 py-16 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal mb-3">
              Mental Health & The Gut
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              The gut connection in common conditions
            </h2>
            <p className="mt-4 max-w-xl text-base text-muted-foreground leading-relaxed">
              This section is educational — not clinical advice. If you are managing any of these
              conditions, please work with a qualified healthcare practitioner. The gut-brain
              connection is one important factor among many.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-5 sm:grid-cols-2">
          {CONDITIONS.map((condition, i) => (
            <ScrollReveal key={condition.name} delay={i * 80}>
              <div
                className="relative overflow-hidden rounded-3xl border border-border bg-background p-6 h-full"
                style={{ borderLeft: `4px solid ${condition.color}` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{condition.emoji}</span>
                  <h3
                    className="font-serif text-xl font-semibold"
                    style={{ color: condition.color }}
                  >
                    {condition.name}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <p
                      className="mb-1.5 text-xs font-bold uppercase tracking-widest"
                      style={{ color: condition.color }}
                    >
                      The gut connection
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {condition.gutLink}
                    </p>
                  </div>
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      background: `color-mix(in srgb, ${condition.color} 8%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${condition.color} 20%, transparent)`,
                    }}
                  >
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      What food can do
                    </p>
                    <p className="text-sm leading-relaxed text-foreground/80">
                      {condition.foodAngle}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Disclaimer */}
        <ScrollReveal delay={320}>
          <div className="mt-8 rounded-2xl border border-border bg-background/60 px-6 py-4 text-center">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Important:</strong> This information is for educational
              purposes only and does not constitute medical advice, diagnosis, or treatment.
              Always consult a qualified healthcare professional for mental health concerns.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
