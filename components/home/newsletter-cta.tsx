import { ScrollReveal } from "@/components/scroll-reveal"
import { ArrowUpRight } from "lucide-react"

const perks = [
  { label: "Weekly", detail: "Every week, no exceptions" },
  { label: "Free", detail: "Always free to read" },
  { label: "Practical", detail: "Food you can eat today" },
  { label: "Science-backed", detail: "No fads, no trends" },
]

export function NewsletterCta() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[900px]">
        <div className="rounded-3xl border border-border bg-background p-10 md:p-16">
          <ScrollReveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
              The Substack
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Every week, something{" "}
              <span className="brand-gradient-text">worth eating.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
              The EatoBiotics Substack is where the framework comes to life — food profiles,
              deep dives, plate builds, and the science behind every bite. Free, weekly,
              and written for people who want to actually understand what they&apos;re eating.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {perks.map((perk) => (
                <div key={perk.label} className="text-center">
                  <div className="mx-auto mb-2 h-1 w-10 rounded-full brand-gradient" />
                  <p className="font-serif text-lg font-semibold text-foreground">{perk.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{perk.detail}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href="https://eatobiotics.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
              >
                Subscribe on Substack
                <ArrowUpRight size={16} />
              </a>
              <p className="text-sm text-muted-foreground">Free. Unsubscribe anytime.</p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
