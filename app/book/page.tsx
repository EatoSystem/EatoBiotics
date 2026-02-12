import type { Metadata } from "next"
import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { BookCover } from "@/components/book/book-cover"
import { ChapterList } from "@/components/book/chapter-list"

export const metadata: Metadata = {
  title: "The Book",
  description:
    "EatoBiotics: The Food System Inside You — a structured guide through the science and practice of feeding your microbiome.",
}

export default function BookPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative px-6 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="pointer-events-none absolute inset-0 icon-glow" />
        <div className="relative mx-auto max-w-[1200px]">
          <div className="flex flex-col items-center gap-16 md:flex-row md:gap-20">
            {/* Book cover visual */}
            <ScrollReveal>
              <BookCover />
            </ScrollReveal>

            {/* Book info */}
            <div className="flex-1 text-center md:text-left">
              <ScrollReveal delay={100}>
                <Image
                  src="/eatobiotics-icon.webp"
                  alt=""
                  width={48}
                  height={48}
                  className="mx-auto mb-4 h-12 w-12 md:mx-0"
                />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  The Book
                </p>
                <h1 className="mt-4 font-serif text-5xl text-foreground sm:text-6xl text-balance">
                  <GradientText>EatoBiotics</GradientText>
                </h1>
                <p className="mt-2 font-serif text-2xl text-muted-foreground">
                  The Food System Inside You
                </p>
                <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
                  A structured journey through the science and practice of prebiotics, probiotics,
                  and postbiotics. Written chapter by chapter on Substack, each installment builds
                  on the last — from foundations to food profiles to real-world application.
                </p>
                {/* Icon colour pills */}
                <div className="mt-6 flex items-center gap-1.5 md:justify-start justify-center">
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
                    className="brand-gradient inline-block rounded-full px-8 py-4 text-base font-semibold text-background transition-opacity hover:opacity-90"
                  >
                    Read on Substack
                  </a>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter List */}
      <section className="bg-secondary px-6 py-32 md:py-40">
        <div className="mx-auto max-w-[680px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Table of Contents
            </p>
            <h2 className="mt-4 font-serif text-4xl text-foreground sm:text-5xl">
              The Chapters
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <ChapterList />
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
