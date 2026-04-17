import Link from "next/link"
import { ArrowRight, Users, ShoppingBasket, Sprout } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const PRINCIPLES = [
  {
    icon: Users,
    title: "Works for every family member",
    detail: "The same framework applies from toddlers to teenagers to adults — adapted portions, same plate. No special diets for anyone.",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  {
    icon: ShoppingBasket,
    title: "Everyday food, not special diets",
    detail: "No separate shopping lists. No complicated prep. Every improvement is built around food your family already recognises.",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-yellow))",
  },
  {
    icon: Sprout,
    title: "Habits that compound over generations",
    detail: "The food system your family builds now shapes how your children eat as adults. This isn't just a weekly win — it's a long-term foundation.",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
]

export function StartFamilyTrust() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[640px]">

        <ScrollReveal>
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Built around real food-system principles
          </p>
          <h2 className="text-center font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            One framework. Every age.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
            The Family Food System Score is built on gut microbiome science — not trends or supplements.
            Every recommendation works with food your family already eats.
          </p>
        </ScrollReveal>

        <div className="mt-10 space-y-4">
          {PRINCIPLES.map((p, i) => {
            const Icon = p.icon
            return (
              <ScrollReveal key={p.title} delay={i * 80}>
                <div className="flex gap-4 rounded-2xl border border-border bg-background p-5">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: p.gradient }}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{p.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.detail}</p>
                  </div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>

        <ScrollReveal delay={320}>
          <div className="mt-10 text-center">
            <Link href="/assessment-family" className="inline-flex items-center gap-1.5 text-sm font-semibold text-icon-green transition-colors hover:text-foreground">
              Check your Family Food System Score <ArrowRight size={14} />
            </Link>
          </div>
        </ScrollReveal>

      </div>
    </section>
  )
}
