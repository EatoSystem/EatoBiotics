import { ScrollReveal } from "@/components/scroll-reveal"

const STATS = [
  {
    value: "100 Trillion",
    label: "microbes in your gut",
    description:
      "Your gut microbiome contains more microbial cells than there are human cells in your entire body — a second genome that responds directly to what you eat.",
    color: "var(--icon-lime)",
  },
  {
    value: "70%",
    label: "of your immune system lives here",
    description:
      "The gut-associated lymphoid tissue (GALT) is the largest immune organ in your body. What you eat shapes how well it protects you — every single day.",
    color: "var(--icon-green)",
  },
  {
    value: "95%",
    label: "of serotonin produced in the gut",
    description:
      "Serotonin — the neurotransmitter most linked to mood, sleep, and wellbeing — is made almost entirely in your gut, not your brain. Food is mood.",
    color: "var(--icon-teal)",
  },
]

export function YouIntro() {
  return (
    <section className="bg-secondary/40 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">

        <ScrollReveal>
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green mb-3">
              Your Microbiome
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              What lives inside you{" "}
              <span className="brand-gradient-text">shapes everything</span>
            </h2>
            <p className="mt-5 mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground">
              Inside your gut is a thriving ecosystem of bacteria, fungi, and viruses — a
              community shaped by every meal you eat. This microbiome influences your energy,
              immunity, mental clarity, and long-term health more than almost any other factor
              you can control.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-5 sm:grid-cols-3">
          {STATS.map((stat, i) => (
            <ScrollReveal key={stat.value} delay={i * 80}>
              <div
                className="relative overflow-hidden rounded-3xl border border-border bg-background p-6"
                style={{ borderTop: `3px solid ${stat.color}` }}
              >
                <p
                  className="font-serif text-4xl font-bold"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{stat.label}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  )
}
