import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function StartFinal() {
  return (
    <section className="bg-secondary/40 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[640px]">
        <div className="rounded-3xl border border-border bg-background p-10 text-center md:p-14">
          <ScrollReveal>
            <div
              className="mx-auto mb-6 h-1 w-16 rounded-full brand-gradient"
            />
            <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              Start with{" "}
              <span className="brand-gradient-text">your score.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
              Understanding your food system is the first step to actually
              changing it. Your score shows you exactly where to start.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="mt-8 flex flex-col items-center gap-3">
              <Link
                href="/assessment"
                className="brand-gradient inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
              >
                Check your Food System Score
                <ArrowRight size={18} />
              </Link>
              <p className="text-xs text-muted-foreground">
                Free &nbsp;·&nbsp; 2 minutes &nbsp;·&nbsp; Results sent to your inbox
              </p>
            </div>
          </ScrollReveal>

          {/* Reassurance */}
          <ScrollReveal delay={180}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {["No signup required to start", "No spam", "No credit card"].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ background: "var(--icon-green)" }}
                  />
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
