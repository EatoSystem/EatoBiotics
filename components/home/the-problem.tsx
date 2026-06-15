import { ScrollReveal } from "@/components/scroll-reveal"

export function TheProblem() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-green">The Problem</p>
            <h2 className="mt-4 text-pretty font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
              You feel it every day.{" "}
              <span className="brand-gradient-text">You just can&apos;t see it.</span>
            </h2>
            <blockquote className="mt-8 border-l-2 pl-6 font-serif text-xl font-medium italic text-foreground" style={{ borderColor: "var(--icon-green)" }}>
              &ldquo;Energy, digestion, mood, immunity — it all traces back to one system you were never shown how to read.&rdquo;
            </blockquote>
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <div className="rounded-3xl border border-border bg-secondary/40 p-8 md:p-10">
              <p className="text-base leading-relaxed text-muted-foreground">
                Low energy, poor digestion, brain fog, a fragile immune system — most of us treat the
                symptoms and never see the cause: the living food system inside you.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                EatoBiotics makes that system visible. <span className="font-semibold text-foreground">One score, one framework, one plate</span> — a clear,
                food-first way to understand your gut and improve how you feel, starting today.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
