import Image from "next/image"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ArrowUpRight } from "lucide-react"

const platforms = [
  {
    number: "01",
    title: "The Substack",
    label: "READ",
    accent: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    description:
      "Weekly writing on the foods, science, and habits that build a stronger microbiome. Free to subscribe. Published every week.",
    cta: "Subscribe",
    href: "https://eatobiotics.substack.com/",
    external: true,
    status: "Live now",
  },
  {
    number: "02",
    title: "The Book",
    label: "LEARN",
    accent: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    description:
      "EatoBiotics: The Food System Inside You. 25 chapters. The complete guide to building your microbiome through the 3 Biotics framework.",
    cta: "Learn more",
    href: "/book",
    external: false,
    status: "Coming 2026",
  },
  {
    number: "03",
    title: "The Platform",
    label: "TRACK",
    accent: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    description:
      "Assess your food system, score your meals, build your plate, and get personalised advice from EatoBiotic — your AI food system advisor.",
    cta: "Start free",
    href: "/assessment",
    external: false,
    status: "Live now",
  },
  {
    number: "04",
    title: "The Podcast",
    label: "LISTEN",
    accent: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    description:
      "The world's greatest minds sitting down to talk about what they eat, how they live, and the food habits behind their extraordinary lives.",
    cta: "Listen",
    href: "/podcast",
    external: false,
    status: "Coming 2026",
  },
]

export function WhatWereBuilding() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-10 md:flex-row md:items-center md:gap-16 mb-16">
          <ScrollReveal className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
              What We&apos;re Building
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl text-pretty">
              One framework.
              <br />
              <span className="brand-gradient-text">Four expressions.</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              EatoBiotics is more than a website. It&apos;s a growing platform — a book, an app,
              a weekly Substack, and a systemic food movement. Here&apos;s where it&apos;s going.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={80} className="w-full md:w-[340px] lg:w-[400px] shrink-0">
            <Image
              src="/food-12.png"
              alt="Fresh ingredients that form the EatoBiotics food system"
              width={600}
              height={600}
              className="w-full h-auto"
            />
          </ScrollReveal>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {platforms.map((p, index) => {
            const inner = (
              <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-6 transition-all hover:shadow-lg">
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ background: p.gradient }}
                />
                <div className="flex items-start justify-between">
                  <span
                    className="font-serif text-5xl font-bold"
                    style={{ color: p.accent }}
                  >
                    {p.number}
                  </span>
                  <span
                    className="mt-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                    style={{ background: p.gradient }}
                  >
                    {p.status}
                  </span>
                </div>
                <p
                  className="mt-3 text-xs font-bold uppercase tracking-widest"
                  style={{ color: p.accent }}
                >
                  {p.label}
                </p>
                <h3 className="mt-1 font-serif text-xl font-semibold text-foreground">
                  {p.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
                <div
                  className="mt-5 flex items-center gap-1 text-sm font-semibold transition-opacity group-hover:opacity-70"
                  style={{ color: p.accent }}
                >
                  {p.cta}
                  <ArrowUpRight size={14} />
                </div>
              </div>
            )

            return (
              <ScrollReveal key={p.number} delay={index * 100}>
                {p.external ? (
                  <a href={p.href} target="_blank" rel="noopener noreferrer" className="block h-full">
                    {inner}
                  </a>
                ) : (
                  <Link href={p.href} className="block h-full">
                    {inner}
                  </Link>
                )}
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
