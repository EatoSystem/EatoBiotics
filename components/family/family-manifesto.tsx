import { ScrollReveal } from "@/components/scroll-reveal"

export function FamilyManifesto() {
  return (
    <section className="bg-foreground px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[900px] text-center">
        <ScrollReveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-icon-lime">
            The Family Mission
          </p>
          <blockquote className="mt-8 font-serif text-3xl font-semibold leading-tight text-background sm:text-4xl md:text-5xl lg:text-6xl text-balance">
            <span className="brand-gradient-text">
              Build the food system inside your family&hellip;
            </span>
            <br />
            <span className="text-background">
              and help build the food system around you.
            </span>
          </blockquote>
          <p className="mx-auto mt-8 max-w-lg text-base leading-relaxed text-background/60">
            The habits your children build at the table today will shape
            how they feel for decades.
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
