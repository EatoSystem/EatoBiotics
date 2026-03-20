import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { ArrowUpRight, BookOpen, Smartphone, GraduationCap, Check, Zap, Users, Star } from "lucide-react"

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
    subtitle: "EatoBiotics: The Food System Inside You",
    label: "COMING 2026",
    earlyPrice: "€97",
    fullPrice: "€24.99",
    priceNote: "Early bird",
    accent: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    description:
      "25 chapters. The complete guide to building your microbiome through the 3 Biotics framework.",
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
    subtitle: "Your daily Biotics Score companion",
    label: "COMING 2026",
    earlyPrice: "Beta",
    fullPrice: "Paid",
    priceNote: "Free beta access",
    accent: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    description:
      "Log food, track microbiome diversity, and build your weekly plate — all in one app.",
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
    subtitle: "Five modules. Five pillars.",
    label: "COMING 2026",
    earlyPrice: "€97",
    fullPrice: "€197",
    priceNote: "Waitlist early bird",
    accent: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    description:
      "The complete EatoBiotics framework as a structured online course with practical weekly actions.",
    perks: [
      "Waitlist-only early bird pricing",
      "Free module preview before launch",
      "Direct access to Jason during cohort",
    ],
    href: "/course",
  },
]

const whyNowPoints = [
  {
    icon: Zap,
    heading: "Founding pricing is waitlist-only",
    body: "Early bird prices on the Book and Course are reserved for Substack subscribers. They won't be available at launch.",
  },
  {
    icon: Users,
    heading: "The community shapes what gets built",
    body: "Every question, every comment, every piece of feedback from subscribers directly influences what goes into the book, the app, and the course.",
  },
  {
    icon: Star,
    heading: "First access to everything",
    body: "Beta slots for the app, preview chapters of the book, and the first cohort of the course — all go to subscribers first.",
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

          <div className="mt-16 grid gap-6 lg:grid-cols-3">
            {launches.map((launch, index) => (
              <ScrollReveal key={launch.title} delay={index * 120}>
                <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-background">
                  {/* Top gradient stripe */}
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: launch.gradient }} />

                  <div className="flex flex-1 flex-col p-7 pt-8">
                    {/* Icon row */}
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: launch.gradient }}>
                        <launch.icon size={22} className="text-white" />
                      </div>
                      {/* Early price badge */}
                      <div className="flex flex-col items-end">
                        <div className="rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-center">
                          <p className="text-xs text-muted-foreground">{launch.priceNote}</p>
                          <p className="font-serif text-lg font-bold text-foreground">{launch.earlyPrice}</p>
                        </div>
                      </div>
                    </div>

                    {/* Label */}
                    <p className="mt-5 text-[11px] font-bold uppercase tracking-widest" style={{ color: launch.accent }}>
                      {launch.label}
                    </p>

                    {/* Title */}
                    <h3 className="mt-1 font-serif text-2xl font-semibold text-foreground">
                      {launch.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{launch.subtitle}</p>

                    {/* Description */}
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {launch.description}
                    </p>

                    {/* Divider */}
                    <div className="my-5 h-px w-full bg-border" />

                    {/* Perks */}
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Waitlist perks
                    </p>
                    <ul className="flex flex-col gap-2">
                      {launch.perks.map((perk) => (
                        <li key={perk} className="flex items-start gap-2">
                          <Check size={13} className="mt-0.5 shrink-0" style={{ color: launch.accent }} />
                          <span className="text-sm text-foreground">{perk}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Link */}
                    <Link
                      href={launch.href}
                      className="mt-5 flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-70"
                      style={{ color: launch.accent }}
                    >
                      Learn more <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Bundle callout */}
          <ScrollReveal delay={400}>
            <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-background">
              <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />
              <div className="flex flex-col items-center gap-4 px-8 py-8 text-center sm:flex-row sm:text-left">
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-icon-green">The Bundle</p>
                  <p className="mt-1 font-serif text-xl font-semibold text-foreground">
                    All three — at the Substack price.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    One free Substack subscription unlocks early access, waitlist pricing, and beta slots across all three launches.
                  </p>
                </div>
                <a
                  href="https://eatobiotics.substack.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brand-gradient inline-flex shrink-0 items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Subscribe free <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Why Now — pull-quote style */}
      <section className="bg-foreground px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[960px]">
          <ScrollReveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-lime">
              Why Now
            </p>
            <blockquote className="mt-6 font-serif text-3xl font-semibold leading-tight text-background sm:text-4xl md:text-5xl text-balance">
              &ldquo;The earlier you join,{" "}
              <span className="brand-gradient-text">the more you get.</span>&rdquo;
            </blockquote>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {whyNowPoints.map((point, i) => (
              <ScrollReveal key={point.heading} delay={i * 100}>
                <div className="rounded-2xl border border-background/10 bg-background/5 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/10">
                    <point.icon size={18} className="text-icon-lime" />
                  </div>
                  <p className="mt-4 font-serif text-base font-semibold text-background">
                    {point.heading}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-background/60">
                    {point.body}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={300}>
            <div className="mt-12 text-center">
              <a
                href="https://eatobiotics.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:opacity-90"
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
                { label: "My Plate", href: "/myplate" },
                { label: "About Jason", href: "/about" },
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
