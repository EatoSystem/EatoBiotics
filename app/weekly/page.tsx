import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { ArrowRight, ArrowUpRight, CheckCircle2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Weekly Expression",
  description:
    "The Weekly EatoBiotics Expression — a four-part plate system that turns one idea into one week of practical, repeatable, microbiome-conscious eating.",
  openGraph: {
    title: "The Weekly EatoBiotics Expression",
    description: "One week. Four plates. One food system inside you.",
  },
}

const PLATES = [
  {
    number: "1.1",
    name: "The Food System Bowl",
    role: "Foundation",
    message: "This is how EatoBiotics begins.",
    description:
      "The entry point. The clearest, most balanced, most welcoming plate in the system. Built to introduce the central idea of EatoBiotics: not only feeding you, but feeding the ecosystem inside you.",
    emphasis: "Balance",
    supports: ["digestion", "energy", "resilience"],
    question: "What is EatoBiotics?",
    protein: "Trout",
    image: "/plate-bowl.png",
    accent: "var(--icon-lime)",
    accentClass: "text-icon-lime",
    borderColor: "border-icon-lime/20",
    bgColor: "bg-icon-lime/5",
    tagBg: "bg-icon-lime/10",
    emotional: "clear and foundational",
    bioticsLabel: "Prebiotic + Probiotic support",
  },
  {
    number: "1.2",
    name: "The Immunity, Mood & Energy Plate",
    role: "Function",
    message: "Support the system, and the system supports more of you.",
    description:
      "Shows that the microbiome affects far more than digestion. A vibrant plate designed to support immunity, steadier energy, emotional resilience, and recovery through the EatoBiotics framework.",
    emphasis: "Function and support",
    supports: ["immunity", "mood", "energy", "recovery"],
    question: "Why does this matter to how I feel?",
    protein: "Salmon",
    image: "/plate-immunity.png",
    accent: "var(--icon-yellow)",
    accentClass: "text-icon-yellow",
    borderColor: "border-icon-yellow/20",
    bgColor: "bg-icon-yellow/5",
    tagBg: "bg-icon-yellow/10",
    emotional: "bright and functional",
    bioticsLabel: "Prebiotic + Probiotic + Postbiotic support",
  },
  {
    number: "1.3",
    name: "The Living Plate",
    role: "Richness",
    message: "The system thrives when it is fed with richness and variety.",
    description:
      "A fibre-rich, plant-diverse plate built to express the full range of what a thriving microbiome needs — colour, abundance, variety, and nourishment. Diversity is the goal.",
    emphasis: "Diversity and abundance",
    supports: ["richness", "nourishment", "consistency"],
    question: "What does a thriving internal system need?",
    protein: "Tempeh",
    image: "/plate-living.png",
    accent: "var(--icon-teal)",
    accentClass: "text-icon-teal",
    borderColor: "border-icon-teal/20",
    bgColor: "bg-icon-teal/5",
    tagBg: "bg-icon-teal/10",
    emotional: "abundant and alive",
    bioticsLabel: "Prebiotic + Probiotic + Protein Balance",
  },
  {
    number: "1.4",
    name: "The Rebuild Plate",
    role: "Restoration",
    message: "Not perfection. Rebuilding.",
    description:
      "Closes the weekly sequence with resilience, recovery, and restoration. Designed to support rebuilding through better daily inputs and weekly consistency — calm, purposeful, and hopeful.",
    emphasis: "Restoration and resilience",
    supports: ["rebuilding", "steadiness", "recovery"],
    question: "How do I begin improving and restoring it?",
    protein: "Salmon",
    image: "/plate-rebuild.png",
    accent: "var(--icon-orange)",
    accentClass: "text-icon-orange",
    borderColor: "border-icon-orange/20",
    bgColor: "bg-icon-orange/5",
    tagBg: "bg-icon-orange/10",
    emotional: "calm, restorative, and hopeful",
    bioticsLabel: "Prebiotic + Probiotic + Postbiotic support",
  },
]

const ARC = [
  { number: "1.1", label: "Foundation", color: "var(--icon-lime)" },
  { number: "1.2", label: "Function", color: "var(--icon-yellow)" },
  { number: "1.3", label: "Richness", color: "var(--icon-teal)" },
  { number: "1.4", label: "Rebuild", color: "var(--icon-orange)" },
]

const FRAMEWORK_PARTS = [
  {
    label: "Prebiotic Base",
    desc: "Fibres and plant foods that feed beneficial bacteria",
    color: "var(--icon-lime)",
    examples: "Garlic · Oats · Onions · Asparagus · Legumes",
  },
  {
    label: "Probiotic Side",
    desc: "Fermented foods that help strengthen microbial diversity",
    color: "var(--icon-teal)",
    examples: "Kimchi · Sauerkraut · Yogurt · Kefir · Miso",
  },
  {
    label: "Protein Balance",
    desc: "A rotating protein source that anchors the meal",
    color: "var(--icon-green)",
    examples: "Salmon · Trout · Eggs · Tempeh · Beans",
  },
  {
    label: "Postbiotic Builders",
    desc: "Healthy fats, herbs, polyphenols, and supportive extras",
    color: "var(--icon-orange)",
    examples: "Avocado · Olive oil · Seeds · Berries · Walnuts",
  },
]

export default function WeeklyPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-32 pb-20 md:pt-40 md:pb-28">
        {/* Background glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 60% at 50% 0%, color-mix(in srgb, var(--icon-green) 7%, transparent), transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-[760px] text-center">
          <ScrollReveal>
            <Image
              src="/eatobiotics-icon.webp"
              alt=""
              width={48}
              height={48}
              className="mx-auto mb-6 h-12 w-12"
            />
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
              The Weekly EatoBiotics Expression
            </p>
            <h1 className="mt-5 font-serif text-5xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl text-balance">
              One week.{" "}
              <GradientText>Four plates.</GradientText>
              <br />
              One food system.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              The Weekly EatoBiotics Expression is a four-part plate system designed to help
              you build the food system inside you through repeated, balanced,
              microbiome-conscious meals.
            </p>
          </ScrollReveal>

          {/* Arc pills */}
          <ScrollReveal delay={120}>
            <div className="mt-10 flex items-center justify-center gap-0 flex-wrap">
              {ARC.map((step, i) => (
                <div key={step.label} className="flex items-center">
                  <div
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
                    style={{ background: step.color }}
                  >
                    <span className="text-xs opacity-70">{step.number}</span>
                    {step.label}
                  </div>
                  {i < ARC.length - 1 && (
                    <ArrowRight size={14} className="mx-1 shrink-0 text-muted-foreground/40" />
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground/50 tracking-wide">
              Foundation → Function → Richness → Rebuild
            </p>
          </ScrollReveal>

          {/* CTAs */}
          <ScrollReveal delay={180}>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href="#plates"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
              >
                Explore this week&apos;s plates
              </a>
              <Link
                href="/assessment"
                className="inline-flex items-center gap-2 rounded-full border-2 border-border px-8 py-4 text-base font-semibold text-foreground transition-colors hover:border-icon-green hover:text-icon-green"
              >
                Start with the free assessment
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── DNA of the weekly expression ─────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[720px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
              The philosophy
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              The DNA of the{" "}
              <GradientText>weekly expression</GradientText>
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              These four plates are not just four recipes. They are four expressions of one
              philosophy:{" "}
              <span className="font-semibold text-foreground">
                build the food system inside you through repeated, balanced,
                microbiome-conscious meals.
              </span>
            </p>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {[
                { num: "1.1", verb: "introduces", desc: "the central idea of the food system inside you" },
                { num: "1.2", verb: "expands", desc: "it into immunity, mood, and energy" },
                { num: "1.3", verb: "deepens", desc: "through richness, diversity, and abundance" },
                { num: "1.4", verb: "restores", desc: "with resilience, recovery, and rebuilding" },
              ].map((item) => (
                <div
                  key={item.num}
                  className="flex items-start gap-4 rounded-2xl border border-border bg-background p-5"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))" }}
                  >
                    {item.num}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{item.num} {item.verb}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <div className="mt-10 rounded-2xl border border-border bg-background p-6">
              <p className="text-sm font-semibold uppercase tracking-widest text-icon-green mb-3">
                The weekly arc
              </p>
              <p className="text-base leading-relaxed text-muted-foreground">
                Together, these four plates create a real weekly arc:{" "}
                <span className="font-semibold text-foreground">
                  awareness → function → nourishment → rebuilding.
                </span>{" "}
                This is what makes EatoBiotics feel like a system, not a collection of meals.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Four plate cards ──────────────────────────────────────────────────── */}
      <section id="plates" className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">
                The four plates
              </p>
              <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
                Four plates. Four jobs.{" "}
                <GradientText>One complete weekly system.</GradientText>
              </h2>
            </div>
          </ScrollReveal>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {PLATES.map((plate, i) => (
              <ScrollReveal key={plate.number} delay={i * 60}>
                <div
                  className={`overflow-hidden rounded-3xl border ${plate.borderColor} bg-background transition-all hover:shadow-lg`}
                  style={{
                    boxShadow: `0 0 0 1px color-mix(in srgb, ${plate.accent} 8%, transparent)`,
                  }}
                >
                  {/* Image */}
                  <div className="relative w-full overflow-hidden bg-muted/30">
                    <Image
                      src={plate.image}
                      alt={plate.name}
                      width={1200}
                      height={675}
                      className="w-full h-auto"
                    />
                  </div>

                  {/* Card content */}
                  <div className="p-6">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                            style={{ background: plate.accent }}
                          >
                            {plate.number}
                          </span>
                          <span
                            className={`text-xs font-semibold uppercase tracking-widest ${plate.accentClass}`}
                          >
                            {plate.role}
                          </span>
                        </div>
                        <h3 className="font-serif text-xl font-semibold text-foreground leading-tight">
                          {plate.name}
                        </h3>
                      </div>
                    </div>

                    {/* Internal message */}
                    <p className="mt-3 text-sm italic text-muted-foreground">
                      &ldquo;{plate.message}&rdquo;
                    </p>

                    {/* Description */}
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {plate.description}
                    </p>

                    {/* Supports tags */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {plate.supports.map((s) => (
                        <span
                          key={s}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${plate.tagBg} ${plate.accentClass}`}
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    {/* Emphasis row */}
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Emphasis:</span>
                      {plate.emphasis}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── How the week works ───────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[760px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
              The sequence
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              How the week works
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              The Weekly EatoBiotics Expression works because each plate answers a different question.
              That sequence gives the week coherence, direction, and emotional rhythm.
            </p>
          </ScrollReveal>

          {/* Arc steps */}
          <div className="mt-12 space-y-4">
            {PLATES.map((plate, i) => (
              <ScrollReveal key={plate.number} delay={i * 70}>
                <div className="relative flex gap-5">
                  {/* Left column: number + connector */}
                  <div className="flex flex-col items-center">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
                      style={{ background: plate.accent }}
                    >
                      {plate.number}
                    </div>
                    {i < PLATES.length - 1 && (
                      <div className="mt-2 h-8 w-0.5 bg-border" />
                    )}
                  </div>

                  {/* Right column: content */}
                  <div className="pb-2 pt-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{plate.name}</span>
                      <span
                        className={`text-xs font-semibold uppercase tracking-widest ${plate.accentClass}`}
                      >
                        {plate.role}
                      </span>
                    </div>
                    <p className="mt-1 text-sm italic text-muted-foreground">
                      &ldquo;{plate.question}&rdquo;
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Plate framework ──────────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[760px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-lime">
              The framework
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              One plate. Four parts.{" "}
              <GradientText>Built once a week.</GradientText>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Every weekly plate changes in expression, but the underlying framework remains the
              same. That is what makes the system flexible, repeatable, and easy to live with.
            </p>
          </ScrollReveal>

          {/* Framework 2×2 grid */}
          <ScrollReveal delay={100}>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {FRAMEWORK_PARTS.map((part) => (
                <div
                  key={part.label}
                  className="rounded-2xl border border-border bg-background p-6 transition-all hover:shadow-md"
                >
                  {/* Accent bar */}
                  <div
                    className="mb-4 h-1 w-10 rounded-full"
                    style={{ background: part.color }}
                  />
                  <h3 className="font-semibold text-foreground">{part.label}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {part.desc}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground/60">{part.examples}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={140}>
            <div
              className="mt-6 rounded-2xl border border-border bg-background p-6"
            >
              <p className="text-sm leading-relaxed text-muted-foreground">
                Every weekly plate is built on this same four-part logic — prebiotic, probiotic,
                protein, and postbiotic. The foods rotate. The season changes. The framework
                stays constant. That stability is what makes consistency possible.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── What stays / what evolves ────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[760px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-yellow">
              Stability and flexibility
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              What stays fixed.{" "}
              <GradientText>What evolves each week.</GradientText>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              The system stays recognisable. The meals stay alive.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {/* Fixed */}
              <div className="rounded-2xl border border-border bg-background p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
                  >
                    <CheckCircle2 size={14} className="text-white" />
                  </div>
                  <span className="font-semibold text-foreground text-sm uppercase tracking-wide">
                    What stays fixed
                  </span>
                </div>
                <ul className="space-y-2.5">
                  {[
                    "The 4-part plate framework",
                    "The weekly arc",
                    "The microbiome-conscious logic",
                    "The EatoBiotics visual language",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-icon-green" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Evolves */}
              <div className="rounded-2xl border border-border bg-background p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))" }}
                  >
                    <ArrowRight size={14} className="text-white" />
                  </div>
                  <span className="font-semibold text-foreground text-sm uppercase tracking-wide">
                    What evolves
                  </span>
                </div>
                <ul className="space-y-2.5">
                  {[
                    "Featured proteins",
                    "Vegetables and grains",
                    "Fermented side",
                    "Seasonal ingredients",
                    "Flavour direction",
                    "Weekly theme",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-icon-teal" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Why each plate feels different ───────────────────────────────────── */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[760px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">
              Emotional identity
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              Why the four plates{" "}
              <GradientText>feel different</GradientText>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Each plate is designed to carry its own emotional tone — not just a different
              ingredient list, but a different feeling.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="mt-10 space-y-4">
              {PLATES.map((plate) => (
                <div
                  key={plate.number}
                  className={`flex gap-4 rounded-2xl border ${plate.borderColor} bg-background p-5`}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                    style={{ background: plate.accent }}
                  >
                    {plate.number}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">{plate.name} </span>
                    <span className="text-muted-foreground">
                      feels <em>{plate.emotional}</em>.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <p className="mt-8 text-base leading-relaxed text-muted-foreground">
              Together, they create a weekly experience that feels both{" "}
              <span className="font-semibold text-foreground">practical and emotionally intelligent</span>{" "}
              — a rhythm that is easy to follow because it makes sense at every stage.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── This week's plates ───────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
                Current week
              </p>
              <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
                This week&apos;s plates
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
                Each plate appears once in the weekly rotation. Four plates. One complete system. All four,
                every week.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLATES.map((plate, i) => (
              <ScrollReveal key={plate.number} delay={i * 60}>
                <div
                  className={`group flex h-full flex-col overflow-hidden rounded-2xl border ${plate.borderColor} bg-background`}
                >
                  {/* Image */}
                  <div className="relative overflow-hidden bg-muted/20">
                    <Image
                      src={plate.image}
                      alt={plate.name}
                      width={600}
                      height={338}
                      className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    {/* Number overlay */}
                    <div
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                      style={{ background: plate.accent }}
                    >
                      {plate.number}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-5">
                    <span
                      className={`text-xs font-semibold uppercase tracking-widest ${plate.accentClass}`}
                    >
                      {plate.role}
                    </span>
                    <h3 className="mt-1 font-serif text-base font-semibold text-foreground leading-snug">
                      {plate.name}
                    </h3>
                    <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                      <p>
                        <span className="font-semibold text-foreground">Featured protein:</span>{" "}
                        {plate.protein}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">Biotics focus:</span>{" "}
                        {plate.bioticsLabel}
                      </p>
                    </div>
                    <div className="mt-auto pt-5">
                      <Link
                        href="/assessment"
                        className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl border ${plate.borderColor} px-4 py-2.5 text-sm font-semibold ${plate.accentClass} transition-all hover:bg-muted`}
                      >
                        Start your assessment
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Start here ───────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[680px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-lime">
              Getting started
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              New to EatoBiotics?{" "}
              <GradientText>Start here.</GradientText>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              If you are new to the framework, build slowly. The system compounds through
              repetition, not complexity.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="mt-10 space-y-4">
              {[
                {
                  step: "01",
                  title: "Take the free Food System Inside You assessment",
                  desc: "Understand your current gut health picture before you change anything.",
                  color: "var(--icon-lime)",
                },
                {
                  step: "02",
                  title: "Explore this week's four plates",
                  desc: "Read the framework behind each plate. Understand what each one is trying to do.",
                  color: "var(--icon-green)",
                },
                {
                  step: "03",
                  title: "Choose one plate to repeat this week",
                  desc: "Start with one. Consistency with one plate is worth more than sampling all four.",
                  color: "var(--icon-teal)",
                },
                {
                  step: "04",
                  title: "Build consistency before complexity",
                  desc: "The system rewards repetition. Once one plate feels natural, add the next.",
                  color: "var(--icon-orange)",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 rounded-2xl border border-border bg-background p-5">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ background: item.color }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <div className="mt-10 text-center">
              <Link
                href="/assessment"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
              >
                Start the free assessment
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Closing CTA ──────────────────────────────────────────────────────── */}
      <section className="bg-foreground px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <Image
              src="/eatobiotics-icon.webp"
              alt="EatoBiotics"
              width={48}
              height={48}
              className="mx-auto mb-6 h-12 w-12"
            />
            <h2 className="font-serif text-3xl font-semibold text-background sm:text-4xl md:text-5xl text-balance">
              One idea.{" "}
              <span className="brand-gradient-text">Four plates.</span>
              <br />
              One better pattern at a time.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-background/60">
              The Weekly EatoBiotics Expression is designed to make the food system inside you
              easier to understand, easier to support, and easier to live with — week after week.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href="#plates"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
              >
                Explore this week&apos;s plates
              </a>
              <Link
                href="/assessment"
                className="inline-flex items-center gap-2 rounded-full border-2 border-background/20 px-8 py-4 text-base font-semibold text-background transition-colors hover:border-icon-lime hover:text-icon-lime"
              >
                Take the free assessment
              </Link>
            </div>
            <p className="mt-6 text-sm text-background/40">
              Follow the weekly expression on{" "}
              <a
                href="https://eatobiotics.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-background/60 underline hover:text-background"
              >
                Substack
              </a>
            </p>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
