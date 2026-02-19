import { ScrollReveal } from "@/components/scroll-reveal"

export function Manifesto() {
  return (
    <section className="bg-foreground px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[900px] text-center">
        <ScrollReveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-icon-lime">
            The Mission
          </p>
          <blockquote className="mt-8 font-serif text-3xl font-semibold leading-tight text-background sm:text-4xl md:text-5xl lg:text-6xl text-balance">
            <span className="brand-gradient-text">
              Build the food system inside you…
            </span>
            <br />
            <span className="text-background">
              and help build the food system around you.
            </span>
          </blockquote>
          <p className="mx-auto mt-8 max-w-lg text-base leading-relaxed text-background/60">
            Personal health and systemic change aren&apos;t separate goals.
            Every plate you build feeds both.
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
