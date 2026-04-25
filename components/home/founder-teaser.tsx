import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function FounderTeaser() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="overflow-hidden rounded-3xl border border-border bg-background">
            <div
              className="h-1 w-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
              }}
            />
            <div className="flex flex-col lg:flex-row">
              {/* Image panel */}
              <div className="relative h-64 w-full overflow-hidden lg:h-auto lg:w-80 lg:shrink-0">
                <Image
                  src="/food-12.png"
                  alt="Jason Curry — Founder of EatoBiotics"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Content panel */}
              <div className="flex flex-1 flex-col justify-center p-8 md:p-12">
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
                  The Founder
                </p>
                <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground md:text-4xl">
                  Built from a personal journey.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                  Jason Curry spent years chasing performance — until he discovered that everything he
                  was looking for started in the gut. EatoBiotics is the framework he built for
                  himself, made practical for everyone.
                </p>
                <Link
                  href="/about"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-icon-green transition-colors hover:text-icon-teal"
                >
                  Read the full story
                  <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
