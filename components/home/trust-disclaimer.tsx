import { ScrollReveal } from "@/components/scroll-reveal"
import { Leaf, FlaskConical, Heart } from "lucide-react"

const PILLARS = [
  {
    icon: Leaf,
    title: "Food first, not medicine",
    desc: "EatoBiotics is a food framework — not a medical programme. We help you understand and improve your diet through the science of your microbiome.",
    color: "var(--icon-green)",
  },
  {
    icon: FlaskConical,
    title: "Science-backed, not sensationalised",
    desc: "Every recommendation is grounded in peer-reviewed microbiome research. No trends, no fads — just what the evidence says.",
    color: "var(--icon-teal)",
  },
  {
    icon: Heart,
    title: "Not a substitute for medical advice",
    desc: "If you have a diagnosed condition, always consult a qualified healthcare professional. EatoBiotics supports your health — it doesn't replace your doctor.",
    color: "var(--icon-orange)",
  },
]

export function TrustDisclaimer() {
  return (
    <section className="px-6 py-20 md:py-24">
      <div className="mx-auto max-w-[1100px]">
        <ScrollReveal>
          <div className="rounded-3xl border border-border bg-background p-8 md:p-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Our Approach
            </p>
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl mb-10">
              Honest about what we are — and what we&apos;re not.
            </h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {PILLARS.map((p, i) => {
                const Icon = p.icon
                return (
                  <ScrollReveal key={p.title} delay={i * 80}>
                    <div className="flex flex-col gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: `color-mix(in srgb, ${p.color} 15%, transparent)` }}
                      >
                        <Icon size={18} style={{ color: p.color }} />
                      </div>
                      <h3 className="font-semibold text-foreground text-base">{p.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                    </div>
                  </ScrollReveal>
                )
              })}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
