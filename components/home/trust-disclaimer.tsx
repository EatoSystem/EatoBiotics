import { ScrollReveal } from "@/components/scroll-reveal"
import { Leaf, FlaskConical, Heart } from "lucide-react"

const PILLARS = [
  {
    icon: Leaf,
    title: "Food first, not medicine",
    desc: "EatoBiotics is a food framework — not a medical programme. We help you understand and improve your diet through the science of your microbiome.",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  {
    icon: FlaskConical,
    title: "Science-backed, not sensationalised",
    desc: "Every recommendation is grounded in peer-reviewed microbiome research. No trends, no fads — just what the evidence says.",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  },
  {
    icon: Heart,
    title: "Not a substitute for medical advice",
    desc: "If you have a diagnosed condition, always consult a qualified healthcare professional. EatoBiotics supports your health — it doesn't replace your doctor.",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
]

export function TrustDisclaimer() {
  return (
    <section className="px-6 py-20 md:py-24">
      <div className="mx-auto max-w-[1100px]">
        <ScrollReveal>
          <div
            className="relative overflow-hidden rounded-[2rem] border border-black/[0.06] p-8 shadow-[0_18px_60px_-24px_rgba(26,46,18,0.25)] md:p-12"
            style={{ background: "linear-gradient(150deg, #F7FBF3 0%, #FFFFFF 55%, #FBF8F0 100%)" }}
          >
            {/* Accent glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-50 blur-3xl"
              style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--icon-green) 22%, transparent), transparent 70%)" }}
            />
            <div className="relative z-10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-icon-green">
                Our Approach
              </p>
              <h2 className="mb-10 font-serif text-2xl font-semibold text-foreground sm:text-3xl text-balance">
                Honest about what we are — and what we&apos;re not.
              </h2>
              <div className="grid gap-8 sm:grid-cols-3">
                {PILLARS.map((p, i) => {
                  const Icon = p.icon
                  return (
                    <ScrollReveal key={p.title} delay={i * 80}>
                      <div
                        className="flex h-full flex-col gap-4 rounded-2xl border-t-2 bg-white/70 p-5 backdrop-blur-sm"
                        style={{ borderTopColor: p.color }}
                      >
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm"
                          style={{ background: p.gradient }}
                        >
                          <Icon size={22} />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">{p.title}</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                      </div>
                    </ScrollReveal>
                  )
                })}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
