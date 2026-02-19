import type { Metadata } from "next"
import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { IPhoneMockup } from "@/components/app/iphone-mockup"
import { Activity, Apple, BarChart3, Utensils } from "lucide-react"

export const metadata: Metadata = {
  title: "The App",
  description:
    "Track your Biotics Score and build better food habits with the EatoBiotics companion app.",
}

const features = [
  {
    icon: BarChart3,
    title: "Biotics Score",
    color: "var(--icon-lime)",
    gradientTo: "var(--icon-green)",
    description:
      "A daily 0-100 score that measures how well your food choices support your microbiome across all three biotic types.",
  },
  {
    icon: Utensils,
    title: "Food Logging",
    color: "var(--icon-teal)",
    gradientTo: "var(--icon-green)",
    description:
      "Log meals with auto-tagging for prebiotic, probiotic, and postbiotic foods. See your biotic balance at a glance.",
  },
  {
    icon: Activity,
    title: "Gut Health Trends",
    color: "var(--icon-orange)",
    gradientTo: "var(--icon-yellow)",
    description:
      "Track your progress over weeks and months. See how dietary changes correlate with how you feel.",
  },
  {
    icon: Apple,
    title: "Food Profiles",
    color: "var(--icon-yellow)",
    gradientTo: "var(--icon-orange)",
    description:
      "Browse a growing library of foods with detailed breakdowns of their prebiotic, probiotic, and postbiotic properties.",
  },
]

export default function AppPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative px-6 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col items-center gap-12 md:flex-row md:gap-20">
            <ScrollReveal>
              <IPhoneMockup />
            </ScrollReveal>

            <div className="flex-1 text-center md:text-left">
              <ScrollReveal delay={100}>
                <Image
                  src="/eatobiotics-icon.webp"
                  alt=""
                  width={48}
                  height={48}
                  className="mx-auto mb-4 h-12 w-12 md:mx-0"
                />
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
                  The App - Coming Soon
                </p>
                <h1 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl text-balance">
                  The <GradientText>EatoBiotics</GradientText> App
                </h1>
                <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base md:mx-0 md:text-lg">
                  Your companion for tracking the three biotics in your daily diet.
                  Score your meals, discover new foods, and build the habits that
                  strengthen your microbiome.
                </p>
                <div className="mt-6 flex items-center justify-center gap-1 sm:gap-1.5 md:justify-start">
                  <span className="biotic-pill bg-icon-lime" />
                  <span className="biotic-pill bg-icon-green" />
                  <span className="biotic-pill bg-icon-teal" />
                  <span className="biotic-pill bg-icon-yellow" />
                  <span className="biotic-pill bg-icon-orange" />
                </div>
                <div className="mt-8">
                  <a
                    href="https://eatobiotics.substack.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brand-gradient inline-block rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
                  >
                    Get Notified at Launch
                  </a>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Features */}
      <section className="px-6 py-32 md:py-40">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-icon-teal">
              Features
            </p>
            <h2 className="mt-4 text-center font-serif text-4xl font-semibold text-foreground sm:text-5xl">
              Built for Your Microbiome
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:gap-10">
            {features.map((feature, index) => (
              <ScrollReveal key={feature.title} delay={index * 100}>
                <div className="relative flex gap-5 overflow-hidden rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-lg">
                  {/* Top gradient bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: `linear-gradient(90deg, ${feature.color}, ${feature.gradientTo})` }}
                  />
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: feature.color }}
                  >
                    <feature.icon size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
