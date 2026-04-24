import Image from "next/image"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ArrowUpRight } from "lucide-react"

export function PodcastTeaser() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">

          {/* Left: text */}
          <div className="lg:w-[460px] lg:shrink-0">
            <ScrollReveal>
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
                The Podcast
              </p>
              <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                The food habits behind{" "}
                <span className="brand-gradient-text">extraordinary lives.</span>
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                Jason Curry sits down with the world&apos;s greatest minds in business,
                sport, and entertainment to ask the question no one else is asking
                — what do you eat?
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Coming to YouTube, Spotify, Apple Podcasts, and Substack in 2026.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="mt-8">
                <Link
                  href="/podcast"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-icon-orange px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-icon-orange hover:text-white"
                >
                  Explore the Podcast
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="mt-10 grid grid-cols-3 gap-4">
                {[
                  { number: "12", label: "Guest Types" },
                  { number: "4", label: "Platforms" },
                  { number: "2026", label: "Coming" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-border p-4 text-center">
                    <p className="font-serif text-3xl font-bold brand-gradient-text">{stat.number}</p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Right: food image */}
          <div className="flex-1">
            <ScrollReveal delay={100}>
              <Image
                src="/food-11.png"
                alt="A beautifully prepared meal — every conversation starts at the table"
                width={700}
                height={700}
                className="w-full h-auto"
              />
            </ScrollReveal>
          </div>

        </div>
      </div>
    </section>
  )
}
