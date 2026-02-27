import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { BookCover } from "@/components/book/book-cover"
import { ChapterList } from "@/components/book/chapter-list"
import { JsonLd } from "@/components/json-ld"
import { generateBookSchema, generateBreadcrumbSchema } from "@/lib/structured-data"
import { ArrowUpRight, BookOpen, Lock, Star, Bell } from "lucide-react"

export const metadata: Metadata = {
  title: "The Book",
  description:
    "EatoBiotics: The Food System Inside You — a structured guide through the science and practice of feeding your microbiome. Pre-order now and lock in your early access price.",
  openGraph: {
    title: "The Book — EatoBiotics",
    description: "25 chapters. The complete guide to building your microbiome through the 3 Biotics framework. Join the waitlist.",
  },
}

export default function BookPage() {
  return (
    <>
      <JsonLd data={generateBookSchema()} />
      <JsonLd data={generateBreadcrumbSchema()} />

      {/* Hero */}
      <section className="relative px-6 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col items-center gap-12 md:flex-row md:gap-20">
            <ScrollReveal>
              <BookCover />
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
                  The Book - Coming Soon
                </p>
                <h1 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl text-balance">
                  <GradientText>EatoBiotics</GradientText>
                </h1>
                <p className="mt-2 font-serif text-xl font-medium text-muted-foreground sm:text-2xl">
                  The Food System Inside You
                </p>
                <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base md:mx-0">
                  A structured journey through the science and practice of prebiotics, probiotics,
                  and postbiotics. Written chapter by chapter on Substack, each installment builds
                  on the last -- from foundations to food profiles to real-world application.
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
                    Read on Substack
                  </a>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Pre-order / Notify Me */}
      <section className="bg-foreground px-6 py-16 md:py-20">
        <div className="mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-icon-lime/30 bg-icon-lime/10 px-4 py-1.5">
              <Bell size={13} className="text-icon-lime" />
              <span className="text-xs font-semibold uppercase tracking-widest text-icon-lime">
                Coming 2026 — Join the Waitlist
              </span>
            </div>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-background sm:text-4xl md:text-5xl text-balance">
              Be first in line.{" "}
              <span className="brand-gradient-text">Lock in your price.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-background/60">
              Waitlist members get the book at the pre-order price — before it goes
              public. Subscribe on Substack and you&apos;ll be notified the moment it launches.
            </p>
          </ScrollReveal>

          {/* Perks */}
          <ScrollReveal delay={100}>
            <div className="mx-auto mt-10 grid max-w-lg gap-3 text-left sm:grid-cols-2">
              {[
                { icon: Lock, label: "Pre-order price locked in", desc: "Pay less than launch day pricing." },
                { icon: Star, label: "Signed digital edition", desc: "A personalised copy for early supporters." },
                { icon: BookOpen, label: "Early access before launch", desc: "Read before the public release date." },
                { icon: Bell, label: "First to know", desc: "Chapter-by-chapter updates via Substack." },
              ].map((perk) => (
                <div key={perk.label} className="flex items-start gap-3 rounded-2xl border border-background/10 bg-background/5 p-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}>
                    <perk.icon size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-background">{perk.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-background/50">{perk.desc}</p>
                  </div>
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
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
              >
                Notify me on Substack
                <ArrowUpRight size={16} />
              </a>
              <Link
                href="/waitlist"
                className="inline-flex items-center gap-2 rounded-full border-2 border-background/20 px-8 py-4 text-base font-semibold text-background transition-colors hover:border-icon-lime hover:text-icon-lime"
              >
                See all three launches
              </Link>
            </div>
            <p className="mt-4 text-sm text-background/40">Free to subscribe. Unsubscribe anytime.</p>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* What's inside */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[720px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
              What&apos;s Inside
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              25 chapters.{" "}
              <GradientText>One complete framework.</GradientText>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              From the foundations of gut science to food profiles, daily practices, and the full
              3 Biotics plate — every chapter builds on the last into a complete, actionable system
              for rebuilding your microbiome from the inside out.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { label: "25", desc: "Chapters" },
                { label: "3", desc: "Biotic pillars" },
                { label: "100+", desc: "Foods profiled" },
              ].map((stat) => (
                <div key={stat.desc} className="rounded-2xl border border-border bg-background p-6 text-center">
                  <p className="font-serif text-4xl font-semibold">
                    <GradientText>{stat.label}</GradientText>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Chapter List */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[680px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">
              Table of Contents
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl">
              The Chapters
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <ChapterList />
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Final CTA */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <Image
              src="/eatobiotics-icon.webp"
              alt="EatoBiotics"
              width={64}
              height={64}
              className="mx-auto mb-6 h-12 w-12"
            />
            <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              The book that builds the{" "}
              <GradientText>food system inside you.</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              Subscribe on Substack to follow the book chapter by chapter — and be first in
              line when it launches in 2026.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href="https://eatobiotics.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
              >
                Subscribe on Substack
                <ArrowUpRight size={16} />
              </a>
              <Link
                href="/biotics"
                className="inline-flex items-center gap-2 rounded-full border-2 border-icon-green px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white"
              >
                Learn the framework
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
