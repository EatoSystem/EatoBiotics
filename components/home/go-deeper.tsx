import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ArrowUpRight, BookOpen, Mic2, Mail, Globe } from "lucide-react"

const RESOURCES = [
  {
    icon: Mail,
    label: "WEEKLY LETTER",
    title: "The Substack",
    desc: "Food profiles, plate builds, and the science behind every bite. Free, weekly.",
    cta: "Subscribe free",
    href: "https://eatobiotics.substack.com/",
    external: true,
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    status: "Live now",
  },
  {
    icon: BookOpen,
    label: "THE BOOK",
    title: "The Food System Inside You",
    desc: "25 chapters. The complete guide to rebuilding your microbiome through the 3 Biotics.",
    cta: "Explore the book",
    href: "/book",
    external: false,
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    status: "Coming 2026",
  },
  {
    icon: Mic2,
    label: "THE PODCAST",
    title: "Food habits behind extraordinary lives",
    desc: "Jason Curry talks to the world's greatest minds about what they eat.",
    cta: "Learn more",
    href: "/podcast",
    external: false,
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    status: "Coming 2026",
  },
  {
    icon: Globe,
    label: "EATOSYSTEM",
    title: "The food system around you",
    desc: "Ireland's regenerative food transformation. 32 counties. One national movement.",
    cta: "Explore EatoSystem",
    href: "/eatosystem",
    external: false,
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    status: "In progress",
  },
]

export function GoDeeper() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal mb-3">
            Go Deeper
          </p>
          <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
            Four ways to go{" "}
            <span className="brand-gradient-text">further.</span>
          </h2>
          <p className="mt-4 max-w-lg text-base text-muted-foreground leading-relaxed">
            Beyond the platform — a book, a podcast, a weekly newsletter, and a national food movement.
          </p>
        </ScrollReveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {RESOURCES.map((r, i) => {
            const Icon = r.icon
            const inner = (
              <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-6 transition-all hover:shadow-lg">
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: r.gradient }} />
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: `color-mix(in srgb, ${r.color} 15%, transparent)` }}
                  >
                    <Icon size={18} style={{ color: r.color }} />
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-semibold text-white"
                    style={{ background: r.gradient }}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: r.color }}>
                  {r.label}
                </p>
                <h3 className="font-serif text-lg font-semibold text-foreground leading-snug">
                  {r.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {r.desc}
                </p>
                <div
                  className="mt-5 flex items-center gap-1 text-sm font-semibold transition-opacity group-hover:opacity-70"
                  style={{ color: r.color }}
                >
                  {r.cta}
                  <ArrowUpRight size={14} />
                </div>
              </div>
            )
            return (
              <ScrollReveal key={r.label} delay={i * 80}>
                {r.external ? (
                  <a href={r.href} target="_blank" rel="noopener noreferrer" className="block h-full">
                    {inner}
                  </a>
                ) : (
                  <Link href={r.href} className="block h-full">
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
