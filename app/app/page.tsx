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
    bg: "rgba(168,224,99,0.15)",
    description:
      "A daily 0-100 score that measures how well your food choices support your microbiome across all three biotic types.",
  },
  {
    icon: Utensils,
    title: "Food Logging",
    color: "var(--icon-teal)",
    bg: "rgba(45,170,110,0.12)",
    description:
      "Log meals with auto-tagging for prebiotic, probiotic, and postbiotic foods. See your biotic balance at a glance.",
  },
  {
    icon: Activity,
    title: "Gut Health Trends",
    color: "var(--icon-orange)",
    bg: "rgba(245,166,35,0.12)",
    description:
      "Track your progress over weeks and months. See how dietary changes correlate with how you feel.",
  },
  {
    icon: Apple,
    title: "Food Profiles",
    color: "var(--icon-yellow)",
    bg: "rgba(245,197,24,0.12)",
    description:
      "Browse a growing library of foods with detailed breakdowns of their prebiotic, probiotic, and postbiotic properties.",
  },
]

export default function AppPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative px-6 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="pointer-events-none absolute inset-0 icon-glow" />
        <div className="relative mx-auto max-w-[1200px]">
          <div className="flex flex-col items-center gap-16 md:flex-row md:gap-20">
            {/* iPhone mockup */}
            <ScrollReveal>
              <IPhoneMockup />
            </ScrollReveal>

            {/* App info */}
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
                  Coming Soon
                </p>
                <h1 className="mt-4 font-serif text-5xl font-800 text-foreground sm:text-6xl text-balance">
                  The <GradientText>EatoBiotics</GradientText> App
                </h1>
                <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                  Your companion for tracking the three biotics in your daily diet.
                  Score your meals, discover new foods, and build the habits that
                  strengthen your microbiome.
                </p>
                {/* Icon colour pills */}
                <div className="mt-6 flex items-center gap-1.5 md:justify-start justify-center">
                  <span className="biotic-pill bg-icon-lime" />
                  <span className="biotic-pill bg-icon-green" />
                  <span className="biotic-pill bg-icon-teal" />
                  <span className="biotic-pill bg-icon-yellow" />
                  <span className="biotic-pill bg-icon-orange" />
                </div>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="https://eatobiotics.substack.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brand-gradient rounded-full px-8 py-4 text-center text-base font-semibold text-foreground shadow-lg shadow-icon-lime/20 transition-all hover:shadow-xl hover:shadow-icon-lime/30 hover:opacity-90"
                  >
                    Get Notified at Launch
                  </a>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-green-section px-6 py-32 md:py-40">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-icon-teal">
              Features
            </p>
            <h2 className="mt-4 text-center font-serif text-4xl font-800 text-foreground sm:text-5xl">
              Built for Your Microbiome
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:gap-10">
            {features.map((feature, index) => (
              <ScrollReveal key={feature.title} delay={index * 100}>
                <div
                  className="flex gap-5 rounded-2xl border-l-4 p-6 shadow-sm"
                  style={{ borderLeftColor: feature.color, backgroundColor: feature.bg }}
                >
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: feature.color }}
                  >
                    <feature.icon size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-700 text-foreground">
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
