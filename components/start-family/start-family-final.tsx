import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function StartFamilyFinal() {
  return (
    <section className="bg-secondary/40 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[640px]">
        <div className="rounded-3xl border border-border bg-background p-10 text-center md:p-14">

          <ScrollReveal>
            <div className="mx-auto mb-6 h-1 w-16 rounded-full brand-gradient" />
            <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              Check your{" "}
              <span className="brand-gradient-text">Family Food System Score</span>
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
              Free report included &nbsp;·&nbsp; Takes 2 minutes &nbsp;·&nbsp; Instant results
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="mt-8 flex flex-col items-center gap-3">
              <Link
                href="/assessment-family"
                className="brand-gradient inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-full px-8 py-5 text-base font-semibold text-white shadow-xl shadow-icon-green/25 transition-all hover:shadow-2xl hover:opacity-90"
              >
                Check your Family Food System Score <ArrowRight size={18} />
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={180}>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {["No signup required", "No spam", "No credit card"].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1 w-1 rounded-full" style={{ background: "var(--icon-green)" }} />
                  {item}
                </span>
              ))}
            </div>
          </ScrollReveal>

        </div>
      </div>
    </section>
  )
}
