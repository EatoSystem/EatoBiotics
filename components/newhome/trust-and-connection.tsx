import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { Eyebrow, Section } from "./shared"

/**
 * Section 9 — trust and safety with real visual weight, then the EatoSystem
 * connection and the close. The trust panel uses the production score-card
 * idiom (rounded-[2rem], border-2, gradient hairline); the closing panel is
 * the production dark-panel idiom from components/home/closing-cta.tsx with
 * an identical primary CTA.
 */
const COMMITMENTS = [
  "EatoBiotics does not diagnose conditions.",
  "It does not replace medical care.",
  "It does not recommend medication changes.",
  "It does not sell supplements as the solution.",
  "It helps you understand food patterns and practical opportunities.",
  "For medical concerns, always speak to a healthcare professional.",
]

export function TrustAndConnection() {
  return (
    <>
      <Section>
        <ScrollReveal>
          <div
            className="relative overflow-hidden rounded-[2rem] border-2 bg-card px-8 py-10 md:px-12 md:py-12"
            style={{ borderColor: "color-mix(in srgb, var(--icon-green) 40%, transparent)" }}
          >
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-1.5"
              style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-orange))" }}
            />
            <Eyebrow>Our Commitments</Eyebrow>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Food-first. Educational.{" "}
              <span className="brand-gradient-text">Personal. Non-diagnostic.</span>
            </h2>
            <ul className="mt-8 grid gap-x-10 gap-y-4 sm:grid-cols-2">
              {COMMITMENTS.map((c) => (
                <li key={c} className="flex items-start gap-3 text-base leading-relaxed text-foreground">
                  <span
                    className="mt-2 h-2 w-2 flex-none rounded-full"
                    style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
                    aria-hidden="true"
                  />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </Section>

      {/* EatoSystem connection + close — production dark-panel idiom */}
      <section className="px-6 pt-4 pb-16 md:pb-20">
        <div
          className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[2.5rem] px-6 py-20 text-center md:py-28"
          style={{ background: "linear-gradient(135deg, #14250F 0%, #1A2E12 45%, #2C3A12 100%)" }}
        >
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
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }}
          />

          <div className="relative z-10">
            <ScrollReveal>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-icon-lime">
                Part Of Something Larger
              </p>
              <h2 className="mx-auto max-w-2xl font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl text-balance">
                Understand within. Improve daily.{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg, var(--icon-lime), var(--icon-yellow))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Participate outward.
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                EatoBiotics begins by helping you understand and improve the Food System Inside
                You. Over time, responsible participation can help EatoSystem understand where
                families and communities need better food knowledge, access, and support.
              </p>
              <p className="mt-4 text-sm text-white/55">
                <Link href="/eatosystem" className="font-medium underline underline-offset-2 transition-opacity hover:opacity-80">
                  Learn about EatoSystem
                </Link>
              </p>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <p className="mx-auto mt-12 max-w-2xl font-serif text-2xl font-semibold text-white sm:text-3xl text-balance">
                Start with the system inside you.
              </p>
              <div className="mt-7 flex justify-center">
                <Link
                  href="/assessment"
                  className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-xl shadow-black/30 transition-all hover:opacity-90"
                >
                  Get My Food System Score <ArrowRight size={16} />
                </Link>
              </div>
              <p className="mt-5 text-xs text-white/55">
                Takes about 5 minutes. Educational, food-first, and non-diagnostic.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  )
}
