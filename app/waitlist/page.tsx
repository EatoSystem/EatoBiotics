import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { ArrowUpRight, BookOpen, Smartphone, GraduationCap, Check } from "lucide-react"

export const metadata: Metadata = {
  title: "Join the Waitlist",
  description:
    "Be first in line for the EatoBiotics book, app, and course. One subscription — three launches. Join the waitlist now.",
  openGraph: {
    title: "Join the Waitlist — EatoBiotics",
    description: "Be first in line for the EatoBiotics book, app, and course.",
  },
}

const launches = [
  {
    icon: BookOpen,
    title: "The Book",
    label: "COMING 2026",
    accent: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    description:
      "EatoBiotics: The Food System Inside You. 25 chapters. The complete guide to building your microbiome through the 3 Biotics framework.",
    perks: [
      "Early access before public launch",
      "Pre-order price locked in",
      "Signed digital edition",
    ],
    href: "/book",
  },
  {
    icon: Smartphone,
    title: "The App",
    label: "COMING 2026",
    accent: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    description:
      "Your personal Biotics Score. Log food, track microbiome diversity, and build your weekly plate — all in one companion app.",
    perks: [
      "Beta access before public launch",
      "Founding member pricing",
      "Input on features during development",
    ],
    href: "/app",
  },
  {
    icon: GraduationCap,
    title: "The Course",
    label: "COMING 2026",
    accent: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    description:
      "Five modules. Five pillars. The complete EatoBiotics framework turned into a structured online course with practical weekly actions.",
    perks: [
      "Waitlist-only early bird pricing",
      "Free module preview before launch",
      "Direct access to Jason during cohort",
    ],
    href: "/course",
  },
]

export default function WaitlistPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 pb-20">
<div className="relative z-10 mx-auto flex max-w-[720px] flex-col items-center text-center">
          <ScrollReveal>
            <Image src="/eatobiotics-icon.webp" alt="EatoBiotics" width={200} height={200} priority className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32" />
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-icon-green">
              Join the Waitlist
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <h1 className="mt-4 font-serif text-5xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl text-balance">
              Three launches.{" "}
              <GradientText>One subscription.</GradientText>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              The EatoBiotics book, app, and course are all coming in 2026. Subscribe to the
              Substack and you&apos;ll be first to know the moment each one launches —
              with early access, founding member pricing, and direct access to Jason.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <a
                href="https://eatobiotics.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
              >
                Join the waitlist on Substack
                <ArrowUpRight size={16} />
              </a>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Free to subscribe. Unsubscribe anytime.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={500}>
            <div className="mt-10 flex items-center justify-center gap-1.5">
              <span className="biotic-pill bg-icon-lime" />
              <span className="biotic-pill bg-icon-green" />
              <span className="biotic-pill bg-icon-teal" />
              <span className="biotic-pill bg-icon-yellow" />
              <span className="biotic-pill bg-icon-orange" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Three launches */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">
              What&apos;s Coming
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              What you&apos;ll get{" "}
              <GradientText>early access to.</GradientText>
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {launches.map((launch, index) => (
              <ScrollReveal key={launch.title} delay={index * 120}>
                <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-background p-8">
                  <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: launch.gradient }} />

                  {/* Icon */}
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: launch.gradient }}>
                    <launch.icon size={26} className="text-white" />
                  </div>

                  {/* Label */}
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: launch.accent }}>
                    {launch.label}
                  </p>

                  {/* Title */}
                  <h3 className="mt-1 font-serif text-2xl font-semibold text-foreground">
                    {launch.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {launch.description}
                  </p>

                  {/* Divider */}
                  <div className="my-6 h-px w-full bg-border" />

                  {/* Perks */}
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Waitlist perks
                  </p>
                  <ul className="flex flex-col gap-2">
                    {launch.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2">
                        <Check size={14} className="mt-0.5 shrink-0" style={{ color: launch.accent }} />
                        <span className="text-sm text-foreground">{perk}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Link */}
                  <Link
                    href={launch.href}
                    className="mt-6 flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-70"
                    style={{ color: launch.accent }}
                  >
                    Learn more <ArrowUpRight size={14} />
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Manifesto strip */}
      <section className="bg-foreground px-6 py-16 md:py-20">
        <div className="mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-lime">
              Why Now
            </p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-background sm:text-4xl md:text-5xl text-balance">
              The earlier you join,{" "}
              <span className="brand-gradient-text">the more you get.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-background/60">
              Waitlist members get founding pricing, early access, and input into
              what gets built. The community shapes the platform. Join before the launches.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="mt-10">
              <a
                href="https://eatobiotics.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
              >
                Subscribe on Substack — it&apos;s free
                <ArrowUpRight size={16} />
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Explore the platform */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              While you wait —{" "}
              <GradientText>explore the platform.</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              The food library, the framework, the story, and the EatoSystem vision are all here now.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {[
                { label: "Today's Food", href: "/today" },
                { label: "The Biotics", href: "/biotics" },
                { label: "Food Library", href: "/food" },
                { label: "About Jason", href: "/about" },
                { label: "EatoSystem", href: "/eatosystem" },
                { label: "Roadmap", href: "/roadmap" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-icon-green hover:text-icon-green"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
