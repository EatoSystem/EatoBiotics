import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function ClosingCta() {
  return (
    <section className="px-6 py-8">
      <div
        className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[2.5rem] px-6 py-20 text-center md:py-28"
        style={{ background: "linear-gradient(135deg, #14250F 0%, #1A2E12 45%, #2C3A12 100%)" }}
      >
        {/* Ambient colour glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--icon-green), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--icon-yellow), transparent 70%)" }}
        />
        {/* Top gradient hairline */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }}
        />

        <div className="relative z-10">
          <ScrollReveal>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-icon-lime">
              Start today
            </p>
            <h2 className="mx-auto max-w-2xl font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl text-balance">
              Meet the food system{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, var(--icon-lime), var(--icon-yellow))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                inside you.
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              Your gut, digestion, meals, energy, and long-term health are connected. EatoBiotics
              helps you measure the system, rebuild the plate, and improve every week.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <div className="mt-9 flex justify-center">
              <Link
                href="/assessment"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-xl shadow-black/30 transition-all hover:opacity-90"
              >
                Get my gut score free <ArrowRight size={16} />
              </Link>
            </div>
            <p className="mt-5 text-xs text-white/55">
              Takes about 3 minutes. No account required.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
