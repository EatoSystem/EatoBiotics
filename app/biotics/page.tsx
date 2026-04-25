import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ArrowRight, ArrowDown, Zap } from "lucide-react"

export const metadata: Metadata = {
  title: "The 3 Biotics | EatoBiotics",
  description:
    "Prebiotics, Probiotics, and Postbiotics — the three pillars of the EatoBiotics food system. Learn how to Feed, Add, and Produce your way to a stronger microbiome.",
}

/* ── Data ──────────────────────────────────────────────────────────────── */

const BIOTICS = [
  {
    number: "01",
    title: "Prebiotics",
    action: "Feed",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    image: "/prebiotics-1.png",
    tagBg: "color-mix(in srgb, var(--icon-lime) 12%, var(--background))",
    summary:
      "The fibers and compounds in everyday plant foods that nourish your beneficial gut bacteria. The fuel the whole system runs on.",
    body: "Prebiotics are non-digestible fibers and compounds found in everyday plant foods. They pass through your upper digestive tract intact and arrive in your colon, where they become the primary fuel source for beneficial gut bacteria. Without consistent prebiotic intake, your bacterial community weakens — diversity drops, resilience falls, and everything downstream suffers. The good news: most people are one meal away from improving their prebiotic intake.",
    whyItMatters:
      "A well-fed microbiome produces the compounds that regulate your immune system, synthesise key vitamins, and stabilise your mood. Prebiotics are the foundation everything else depends on.",
    foods: ["Garlic", "Onions", "Leeks", "Asparagus", "Oats", "Bananas", "Chicory Root", "Apples", "Jerusalem Artichoke", "Flaxseed"],
  },
  {
    number: "02",
    title: "Probiotics",
    action: "Add",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    image: "/probiotics-1.png",
    tagBg: "color-mix(in srgb, var(--icon-teal) 12%, var(--background))",
    summary:
      "Living bacteria and yeasts found in fermented foods that replenish and diversify the microbial community in your gut.",
    body: "Probiotics are live beneficial bacteria and yeasts found primarily in fermented foods. When you eat yogurt, kimchi, kefir, or miso, you introduce new living residents into your gut ecosystem. Modern diets, antibiotics, stress, and ultra-processed food all deplete gut bacteria diversity. Fermented foods are the most direct and practical way to replenish what has been lost — ideally daily, and from varied sources.",
    whyItMatters:
      "Gut bacteria diversity is one of the strongest predictors of long-term health. The more varied your probiotic sources, the more resilient and capable your microbiome becomes.",
    foods: ["Yogurt", "Kimchi", "Sauerkraut", "Kefir", "Miso", "Tempeh", "Kombucha", "Natto", "Aged Cheese", "Lassi"],
  },
  {
    number: "03",
    title: "Postbiotics",
    action: "Produce",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    image: "/postbiotics-1.png",
    tagBg: "color-mix(in srgb, var(--icon-orange) 10%, var(--background))",
    summary:
      "The beneficial compounds your gut bacteria produce — short-chain fatty acids, vitamins, and neurotransmitters. The output that makes you feel better every day.",
    body: "Postbiotics are the metabolic byproducts your gut bacteria produce as they ferment prebiotics. These include short-chain fatty acids like butyrate and propionate, vitamins B12 and K2, amino acids, and serotonin precursors. Postbiotics are not eaten — they are earned. They are the output of a system that is well-fed and well-populated. They reduce inflammation, strengthen the gut lining, regulate immune response, and directly influence how you feel.",
    whyItMatters:
      "90% of your body's serotonin is produced in your gut. Postbiotics are the bridge between what you eat and how you feel — the measurable output of everything the biotic system produces.",
    foods: ["Butyrate", "Short-chain Fatty Acids", "Vitamin K2", "Vitamin B12", "Serotonin Precursors", "Acetate", "Propionate", "Lactate"],
  },
]

const CYCLE = [
  { step: "01", label: "Eat Prebiotics",       desc: "Plant fibres reach the colon intact",    color: "var(--icon-lime)" },
  { step: "02", label: "Bacteria are fed",      desc: "Beneficial bacteria multiply",           color: "var(--icon-green)" },
  { step: "03", label: "Add Probiotics",        desc: "New living bacteria join the colony",    color: "var(--icon-teal)" },
  { step: "04", label: "Diversity grows",       desc: "More species, more resilience",          color: "var(--icon-yellow)" },
  { step: "05", label: "Postbiotics produced",  desc: "Butyrate, vitamins, serotonin",          color: "var(--icon-orange)" },
]

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function BioticsPage() {
  return (
    <>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative px-6 pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-20">

            {/* Left: text */}
            <div className="flex-1">
              <ScrollReveal>
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-green mb-4">
                  The Biotics Framework
                </p>
                <h1 className="font-serif text-5xl font-bold text-foreground sm:text-6xl lg:text-7xl leading-tight text-balance">
                  Feed.{" "}
                  <span className="brand-gradient-text">Add.</span>
                  <br />
                  Produce.
                </h1>
                <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                  Three types of biotics. One connected system. Every plate you build either
                  feeds it, adds to it, or harvests from it.
                </p>
              </ScrollReveal>

              {/* Stats */}
              <ScrollReveal delay={100}>
                <div className="mt-8 flex flex-wrap gap-8">
                  {[
                    { num: "38T",  label: "bacteria in your gut" },
                    { num: "3",    label: "biotic types" },
                    { num: "1",    label: "connected system" },
                  ].map((s) => (
                    <div key={s.label}>
                      <p className="font-serif text-3xl font-bold brand-gradient-text">{s.num}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </ScrollReveal>

              {/* CTAs */}
              <ScrollReveal delay={160}>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/assessment"
                    className="brand-gradient inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90 hover:shadow-xl"
                  >
                    <Zap size={15} /> Get My Free Biotics Score
                  </Link>
                  <a
                    href="#deep-dive"
                    className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-semibold text-foreground transition-all hover:bg-muted"
                  >
                    Explore each biotic <ArrowDown size={14} />
                  </a>
                </div>
              </ScrollReveal>
            </div>

            {/* Right: plate with floating labels */}
            <ScrollReveal delay={80} className="lg:w-[480px] lg:shrink-0">
              <div className="relative">
                <Image
                  src="/eatobiotics-plate.png"
                  alt="The EatoBiotics Plate — the four-quadrant food system"
                  width={700}
                  height={700}
                  priority
                  className="w-full h-auto drop-shadow-xl"
                />
                <div
                  className="absolute top-4 left-2 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm"
                  style={{ color: "var(--icon-lime)" }}
                >
                  Prebiotics — Feed
                </div>
                <div
                  className="absolute top-4 right-2 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm"
                  style={{ color: "var(--icon-teal)" }}
                >
                  Probiotics — Add
                </div>
                <div
                  className="absolute bottom-10 left-2 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm"
                  style={{ color: "var(--icon-orange)" }}
                >
                  Postbiotics — Produce
                </div>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Three overview cards ─────────────────────────────────────── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal mb-3">
              The Three Biotics
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Three pillars.{" "}
              <span className="brand-gradient-text">One food system.</span>
            </h2>
          </ScrollReveal>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {BIOTICS.map((b, i) => (
              <ScrollReveal key={b.number} delay={i * 120}>
                <div className="relative flex flex-col overflow-hidden rounded-3xl border border-border bg-background">
                  <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: b.gradient }} />
                  <div className="overflow-hidden">
                    <Image src={b.image} alt={b.title} width={600} height={380} className="w-full h-auto" />
                  </div>
                  <div className="flex flex-col flex-1 p-7">
                    <span className="font-serif text-6xl font-bold" style={{ color: b.color }}>
                      {b.number}
                    </span>
                    <h3 className="mt-4 font-serif text-2xl font-semibold text-foreground">{b.title}</h3>
                    <p className="text-sm font-bold uppercase tracking-widest mt-1" style={{ color: b.color }}>
                      {b.action}
                    </p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{b.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {b.foods.slice(0, 4).map((f) => (
                        <span
                          key={f}
                          className="rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{ background: b.tagBg, color: b.color }}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── The Cycle ────────────────────────────────────────────────── */}
      <section className="bg-foreground px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1100px]">

          <ScrollReveal className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-lime mb-3">
              How They Connect
            </p>
            <h2 className="font-serif text-4xl font-semibold text-white sm:text-5xl text-balance">
              The biotic cycle
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/60">
              The three biotics don&apos;t work in isolation. Each feeds into the next —
              creating a self-reinforcing system that builds on itself every time you eat.
            </p>
          </ScrollReveal>

          {/* Steps */}
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-5 lg:gap-0">
            {CYCLE.map((s, i) => (
              <ScrollReveal key={s.step} delay={i * 90}>
                <div className="relative flex items-center gap-4 rounded-2xl p-4 lg:flex-col lg:items-center lg:text-center lg:p-5 lg:rounded-none">

                  {/* Arrow — desktop */}
                  {i < CYCLE.length - 1 && (
                    <div
                      className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 z-10 lg:block"
                      style={{ color: s.color }}
                    >
                      <ArrowRight size={14} className="opacity-40" />
                    </div>
                  )}

                  {/* Number bubble */}
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg"
                    style={{ background: s.color }}
                  >
                    {s.step}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white leading-snug">{s.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-white/50">{s.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Loop note */}
          <ScrollReveal delay={500}>
            <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-sm leading-relaxed text-white/70">
                Then the cycle continues.{" "}
                <span className="font-semibold text-white">
                  Postbiotics strengthen the gut lining — making it more receptive to the
                  next round of prebiotics and probiotics.
                </span>{" "}
                Every good meal makes the next one more effective.
              </p>
            </div>
          </ScrollReveal>

        </div>
      </section>

      <div className="section-divider" />

      {/* ── Deep Dives ───────────────────────────────────────────────── */}
      <div id="deep-dive">
        {BIOTICS.map((b, i) => (
          <div key={b.number} id={b.title.toLowerCase()}>

            <section className="px-6 py-24 md:py-32">
              <div className="mx-auto max-w-[1200px]">
                <div
                  className={`flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-20 ${
                    i % 2 === 1 ? "lg:flex-row-reverse" : ""
                  }`}
                >

                  {/* Food photo */}
                  <ScrollReveal className="lg:w-[500px] lg:shrink-0">
                    <div className="overflow-hidden rounded-3xl shadow-xl">
                      <Image
                        src={b.image}
                        alt={b.title}
                        width={700}
                        height={560}
                        className="w-full h-auto"
                      />
                    </div>
                  </ScrollReveal>

                  {/* Content */}
                  <div className="flex-1">
                    <ScrollReveal>
                      <p
                        className="text-xs font-bold uppercase tracking-widest mb-2"
                        style={{ color: b.color }}
                      >
                        {b.number} — {b.action}
                      </p>
                      <h2
                        className="font-serif text-5xl font-bold sm:text-6xl"
                        style={{ color: b.color }}
                      >
                        {b.title}
                      </h2>
                      <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                        {b.body}
                      </p>
                    </ScrollReveal>

                    {/* Why it matters callout */}
                    <ScrollReveal delay={80}>
                      <div
                        className="mt-6 rounded-2xl p-5 sm:p-6"
                        style={{
                          background: `color-mix(in srgb, ${b.color} 8%, var(--background))`,
                          border: `1px solid color-mix(in srgb, ${b.color} 22%, var(--border))`,
                        }}
                      >
                        <p
                          className="text-[10px] font-bold uppercase tracking-widest mb-2"
                          style={{ color: b.color }}
                        >
                          Why it matters
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {b.whyItMatters}
                        </p>
                      </div>
                    </ScrollReveal>

                    {/* Key foods */}
                    <ScrollReveal delay={120}>
                      <div className="mt-6">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Key foods
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {b.foods.map((f) => (
                            <span
                              key={f}
                              className="rounded-full px-3 py-1.5 text-xs font-semibold"
                              style={{ background: b.tagBg, color: b.color }}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </ScrollReveal>
                  </div>

                </div>
              </div>
            </section>

            {i < BIOTICS.length - 1 && <div className="section-divider" />}
          </div>
        ))}
      </div>

      <div className="section-divider" />

      {/* ── Bottom CTA ───────────────────────────────────────────────── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[900px]">
          <div className="rounded-3xl border border-border bg-background p-10 text-center md:p-16">
            <ScrollReveal>
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-green mb-4">
                Now you know the framework
              </p>
              <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                Find out where{" "}
                <span className="brand-gradient-text">you stand.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
                Your free Biotics Score measures how well your current diet supports your
                microbiome — across all three biotic types, five pillars, and every meal.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/assessment"
                  className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90 hover:shadow-xl"
                >
                  <Zap size={16} /> Get My Free Biotics Score
                </Link>
                <Link
                  href="/weekly"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-semibold text-foreground transition-all hover:bg-muted"
                >
                  See the weekly plates <ArrowRight size={15} />
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Free. No card required. Takes about 3 minutes.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

    </>
  )
}
