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
    personalityWord: "Balanced",
    message: "This is how EatoBiotics begins.",
    description:
      "The entry point. The clearest, most balanced, most welcoming plate in the system. Built to introduce the central idea of EatoBiotics: not only feeding you, but feeding the ecosystem inside you.",
    emphasis: "Balance",
    supports: ["digestion", "energy", "resilience"],
    question: "What is EatoBiotics?",
    arcWord: "awareness",
    protein: "Trout",
    // Food photography — warm, balanced, complete circular composition
    image: "/food-1.png",
    topBar: "var(--icon-lime)",
    accent: "var(--icon-lime)",
    accentClass: "text-icon-lime",
    borderColor: "border-icon-lime/20",
    tagBg: "bg-icon-lime/10",
    emotional: "clear and foundational",
    bioticsLabel: "Prebiotic + Probiotic support",
  },
  {
    number: "1.2",
    name: "The Immunity, Mood & Energy Plate",
    role: "Function",
    personalityWord: "Functional",
    message: "Support the system, and the system supports more of you.",
    description:
      "Shows that the microbiome affects far more than digestion. A vibrant plate designed to support immunity, steadier energy, emotional resilience, and recovery through the EatoBiotics framework.",
    emphasis: "Function and support",
    supports: ["immunity", "mood", "energy", "recovery"],
    question: "Why does this matter to how I feel?",
    arcWord: "function",
    protein: "Chicken",
    // Editorial scattered — bright, functional, energised
    image: "/food-2.png",
    topBar: "linear-gradient(90deg, var(--icon-lime), var(--icon-yellow))",
    accent: "var(--icon-yellow)",
    accentClass: "text-icon-yellow",
    borderColor: "border-icon-yellow/20",
    tagBg: "bg-icon-yellow/10",
    emotional: "bright and functional",
    bioticsLabel: "Prebiotic + Probiotic + Postbiotic support",
  },
  {
    number: "1.3",
    name: "The Living Plate",
    role: "Richness",
    personalityWord: "Abundant",
    message: "The system thrives when it is fed with richness and variety.",
    description:
      "A fibre-rich, plant-diverse plate built to express the full range of what a thriving microbiome needs — colour, abundance, variety, and nourishment. Diversity is the goal.",
    emphasis: "Diversity and abundance",
    supports: ["richness", "diversity", "nourishment", "consistency"],
    question: "What does a thriving internal system need?",
    arcWord: "nourishment",
    protein: "Tofu",
    // Most plant-diverse of all eight — rainbow carrots, broccoli, edamame
    image: "/food-7.png",
    topBar: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow))",
    accent: "var(--icon-teal)",
    accentClass: "text-icon-teal",
    borderColor: "border-icon-teal/20",
    tagBg: "bg-icon-teal/10",
    emotional: "abundant and alive",
    bioticsLabel: "Prebiotic + Probiotic + Protein Balance",
  },
  {
    number: "1.4",
    name: "The Rebuild Plate",
    role: "Restoration",
    personalityWord: "Restorative",
    message: "Not perfection. Rebuilding.",
    description:
      "Closes the weekly sequence with resilience, recovery, and restoration. Designed to support rebuilding through better daily inputs and weekly consistency — calm, purposeful, and hopeful.",
    emphasis: "Restoration and resilience",
    supports: ["rebuilding", "steadiness", "recovery"],
    question: "How do I begin improving and restoring it?",
    arcWord: "rebuilding",
    protein: "Chicken",
    // Warm sweet potato, earthy grain — grounded and restorative
    image: "/food-4.png",
    topBar: "linear-gradient(90deg, var(--icon-teal), var(--icon-green))",
    accent: "var(--icon-orange)",
    accentClass: "text-icon-orange",
    borderColor: "border-icon-orange/20",
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
      {/* ── Hero — split layout ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-28 pb-16 md:pt-36 md:pb-24">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 100% 50%, color-mix(in srgb, var(--icon-green) 5%, transparent), transparent 65%)",
          }}
        />

        <div className="relative mx-auto max-w-[1200px]">
          <div className="flex flex-col items-center gap-12 md:flex-row md:items-center md:gap-16 lg:gap-20">

            {/* Left: all text content */}
            <div className="flex-1 text-center md:text-left">
              <ScrollReveal>
                <Image
                  src="/eatobiotics-icon.webp"
                  alt=""
                  width={44}
                  height={44}
                  className="mx-auto mb-5 h-11 w-11 md:mx-0"
                />
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
                  The Weekly EatoBiotics Expression
                </p>
                <h1 className="mt-5 font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl text-balance">
                  One week.{" "}
                  <GradientText>Four plates.</GradientText>
                  <br />
                  One food system.
                </h1>
                <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg md:mx-0">
                  A four-part plate system designed to help you build the food system inside you
                  through repeated, balanced, microbiome-conscious meals.
                </p>
              </ScrollReveal>

              {/* Arc labels — compact row */}
              <ScrollReveal delay={100}>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-1 md:justify-start">
                  {ARC.map((step, i) => (
                    <div key={step.label} className="flex items-center">
                      <div
                        className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold text-white"
                        style={{ background: step.color }}
                      >
                        <span className="text-[10px] opacity-70">{step.number}</span>
                        {step.label}
                      </div>
                      {i < ARC.length - 1 && (
                        <ArrowRight size={12} className="mx-1 shrink-0 text-muted-foreground/35" />
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-2.5 text-center text-xs tracking-wide text-muted-foreground/50 md:text-left">
                  awareness → function → nourishment → rebuilding
                </p>
              </ScrollReveal>

              {/* CTAs */}
              <ScrollReveal delay={160}>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
                  <Link
                    href="/assessment"
                    className="brand-gradient inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
                  >
                    Take the free assessment
                    <ArrowUpRight size={15} />
                  </Link>
                  <a
                    href="#plates"
                    className="inline-flex items-center gap-2 rounded-full border-2 border-border px-7 py-3.5 text-base font-semibold text-foreground transition-colors hover:border-icon-green hover:text-icon-green"
                  >
                    Explore this week&apos;s plates
                  </a>
                </div>
              </ScrollReveal>
            </div>

            {/* Right: hero food image — Food 8.0, editorial scattered layout */}
            <ScrollReveal delay={80} className="w-full flex-1 md:max-w-[480px]">
              <div className="relative mx-auto max-w-[420px] md:max-w-none">
                <Image
                  src="/food-9.png"
                  alt="A vibrant composition of EatoBiotics ingredients — vegetables, fermented foods, grains, and healthy fats"
                  width={700}
                  height={700}
                  priority
                  className="w-full h-auto"
                />
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── DNA of the weekly expression ─────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[1100px]">

          {/* Top: 2-column intro */}
          <div className="flex flex-col gap-10 md:flex-row md:items-center md:gap-16">

            {/* Left: heading + paragraph */}
            <div className="flex-1">
              <ScrollReveal>
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
                  The philosophy
                </p>
                <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
                  The DNA of the{" "}
                  <GradientText>weekly expression</GradientText>
                </h2>
                <p className="mt-6 text-lg leading-8 text-muted-foreground">
                  These four plates are not just four recipes. They are four expressions of one
                  philosophy:{" "}
                  <span className="font-semibold text-foreground">
                    build the food system inside you through repeated, balanced,
                    microbiome-conscious meals.
                  </span>
                </p>
              </ScrollReveal>
            </div>

            {/* Right: Food 3.0 — diverse mixed-system composition */}
            <ScrollReveal delay={80} className="w-full md:w-[340px] lg:w-[400px] shrink-0">
              <Image
                src="/food-14.png"
                alt="A diverse arrangement of EatoBiotics ingredients — the whole food system in one composition"
                width={600}
                height={600}
                className="w-full h-auto"
              />
            </ScrollReveal>

          </div>

          {/* Four-step logic cards — full width below */}
          <ScrollReveal delay={100}>
            <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { num: "1.1", verb: "introduces", desc: "the central idea of the food system inside you", color: "var(--icon-lime)" },
                { num: "1.2", verb: "expands", desc: "into immunity, mood, and energy", color: "var(--icon-yellow)" },
                { num: "1.3", verb: "deepens", desc: "through richness, diversity, and abundance", color: "var(--icon-teal)" },
                { num: "1.4", verb: "restores", desc: "with resilience, recovery, and rebuilding", color: "var(--icon-orange)" },
              ].map((item) => (
                <div
                  key={item.num}
                  className="flex items-start gap-4 rounded-2xl border border-border bg-background p-6"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                    style={{ background: item.color }}
                  >
                    {item.num}
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-foreground">
                      {item.num}{" "}
                      <span className="font-normal text-muted-foreground">{item.verb}</span>
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          {/* Arc callout */}
          <ScrollReveal delay={140}>
            <div className="mt-5 rounded-2xl border border-border bg-background px-7 py-6">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-icon-green">
                The weekly arc
              </p>
              <p className="text-[15px] leading-7 text-muted-foreground">
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
      <section id="plates" className="px-6 py-20 md:py-28">
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
                >
                  {/* Per-plate top stripe */}
                  <div className="h-[5px] w-full" style={{ background: plate.topBar }} />

                  {/* Food photography image — square format, generous crop */}
                  <div className="relative w-full overflow-hidden bg-white">
                    <Image
                      src={plate.image}
                      alt={plate.name}
                      width={600}
                      height={600}
                      className="w-full h-auto"
                    />
                  </div>

                  {/* Card content */}
                  <div className="p-7">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                          style={{ background: plate.accent }}
                        >
                          {plate.number}
                        </span>
                        <span className={`text-xs font-semibold uppercase tracking-widest ${plate.accentClass}`}>
                          {plate.role}
                        </span>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${plate.tagBg} ${plate.accentClass}`}>
                        {plate.personalityWord}
                      </span>
                    </div>

                    <h3 className="mt-3 font-serif text-xl font-semibold text-foreground leading-tight">
                      {plate.name}
                    </h3>

                    <p className="mt-3 text-base italic leading-relaxed text-muted-foreground/80">
                      &ldquo;{plate.message}&rdquo;
                    </p>

                    <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
                      {plate.description}
                    </p>

                    <div className="my-5 h-px bg-border" />

                    <div className="flex flex-wrap items-center gap-2">
                      {plate.supports.map((s) => (
                        <span
                          key={s}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${plate.tagBg} ${plate.accentClass}`}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground/60">
                      <span className="font-semibold text-foreground/60">Emphasis:</span>{" "}
                      {plate.emphasis}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── How the week works — visual timeline ─────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[900px]">
          <ScrollReveal>
            <div className="mx-auto max-w-[680px]">
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
                The sequence
              </p>
              <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
                How the week works
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Each plate answers a different question. That sequence gives the week coherence,
                direction, and emotional rhythm — the same four questions, every week.
              </p>
            </div>
          </ScrollReveal>

          {/* Desktop: horizontal timeline with food thumbnails */}
          <ScrollReveal delay={80}>
            <div className="mt-14 hidden md:block">
              <div className="relative grid grid-cols-4 gap-6">
                {/* Gradient connecting line */}
                <div
                  className="absolute top-10 left-[12.5%] right-[12.5%] h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--icon-lime), var(--icon-yellow), var(--icon-teal), var(--icon-orange))",
                    opacity: 0.25,
                  }}
                />
                {PLATES.map((plate) => (
                  <div key={plate.number} className="flex flex-col items-center text-center">
                    {/* Circular food thumbnail — sits above the connecting line */}
                    <div
                      className="relative z-10 h-20 w-20 overflow-hidden rounded-full ring-2 ring-background"
                      style={{ boxShadow: `0 0 0 3px color-mix(in srgb, ${plate.accent} 30%, transparent)` }}
                    >
                      <Image
                        src={plate.image}
                        alt={plate.name}
                        width={160}
                        height={160}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {/* Role */}
                    <p
                      className="mt-4 text-[11px] font-bold uppercase tracking-widest"
                      style={{ color: plate.accent }}
                    >
                      {plate.role}
                    </p>
                    {/* Name */}
                    <p className="mt-1.5 text-sm font-semibold text-foreground leading-snug">
                      {plate.name}
                    </p>
                    {/* Arc word */}
                    <p className="mt-1.5 text-xs italic text-muted-foreground/60">
                      {plate.arcWord}
                    </p>
                    {/* Question */}
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground italic">
                      &ldquo;{plate.question}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Mobile: vertical steps with thumbnails */}
          <ScrollReveal delay={80}>
            <div className="mt-10 space-y-0 md:hidden">
              {PLATES.map((plate, i) => (
                <div key={plate.number} className="relative flex gap-5">
                  {/* Left: thumbnail + connector */}
                  <div className="flex flex-col items-center">
                    <div
                      className="h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-background"
                      style={{ boxShadow: `0 0 0 3px color-mix(in srgb, ${plate.accent} 30%, transparent)` }}
                    >
                      <Image
                        src={plate.image}
                        alt={plate.name}
                        width={112}
                        height={112}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {i < PLATES.length - 1 && (
                      <div className="mt-1 w-px flex-1 bg-border" style={{ minHeight: "36px" }} />
                    )}
                  </div>
                  {/* Right: content */}
                  <div className={`pb-8 pt-2 ${i === PLATES.length - 1 ? "pb-0" : ""}`}>
                    <p
                      className="text-[11px] font-bold uppercase tracking-widest"
                      style={{ color: plate.accent }}
                    >
                      {plate.role}
                    </p>
                    <p className="mt-0.5 text-[15px] font-semibold text-foreground">
                      {plate.name}
                    </p>
                    <p className="mt-0.5 text-xs italic text-muted-foreground/60">
                      {plate.arcWord}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed italic text-muted-foreground">
                      &ldquo;{plate.question}&rdquo;
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Plate framework — split layout ───────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[1100px]">
          <div className="flex flex-col gap-12 md:flex-row md:items-start md:gap-16">

            {/* Left: heading + paragraph + 2×2 cards */}
            <div className="flex-1">
              <ScrollReveal>
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-lime">
                  The framework
                </p>
                <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
                  One plate. Four parts.{" "}
                  <GradientText>Built once a week.</GradientText>
                </h2>
                <p className="mt-5 text-lg leading-8 text-muted-foreground">
                  Every weekly plate changes in expression, but the underlying framework remains the
                  same. That is what makes the system flexible, repeatable, and easy to live with.
                </p>
              </ScrollReveal>

              <ScrollReveal delay={80}>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {FRAMEWORK_PARTS.map((part) => (
                    <div
                      key={part.label}
                      className="rounded-2xl border border-border bg-background p-6 transition-all hover:shadow-sm"
                    >
                      <div
                        className="mb-4 h-1 w-10 rounded-full"
                        style={{ background: part.color }}
                      />
                      <h3 className="text-[15px] font-semibold text-foreground">{part.label}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {part.desc}
                      </p>
                      <p className="mt-3 text-xs text-muted-foreground/55">{part.examples}</p>
                    </div>
                  ))}
                </div>
              </ScrollReveal>

              <ScrollReveal delay={120}>
                <div className="mt-5 rounded-2xl border border-border bg-background px-7 py-6">
                  <p className="text-[15px] leading-7 text-muted-foreground">
                    Every weekly plate is built on this same four-part logic. The foods rotate.
                    The season changes. The framework stays constant. That stability is what
                    makes consistency possible.
                  </p>
                </div>
              </ScrollReveal>
            </div>

            {/* Right: Food 6.0 — complete bowl showing all four quadrant types */}
            <ScrollReveal delay={60} className="w-full md:w-[360px] lg:w-[420px] shrink-0 md:pt-14">
              <Image
                src="/food-6.png"
                alt="A complete EatoBiotics plate showing all four parts — prebiotic base, probiotic side, protein balance, and postbiotic builders"
                width={600}
                height={600}
                className="w-full h-auto"
              />
              <p className="mt-3 text-center text-xs text-muted-foreground/60">
                The four-part structure in a single plate.
              </p>
            </ScrollReveal>

          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── What stays / what evolves ────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[760px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-yellow">
              Stability and flexibility
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              What stays fixed.{" "}
              <GradientText>What evolves each week.</GradientText>
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              The system stays recognisable. The meals stay alive.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background p-7">
                <div className="mb-5 flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
                  >
                    <CheckCircle2 size={14} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-wide text-foreground">
                    What stays fixed
                  </span>
                </div>
                <ul className="space-y-3">
                  {[
                    "The 4-part plate framework",
                    "The weekly arc",
                    "The microbiome-conscious logic",
                    "The EatoBiotics visual language",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[15px] text-muted-foreground">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-icon-green" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-border bg-background p-7">
                <div className="mb-5 flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))" }}
                  >
                    <ArrowRight size={14} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-wide text-foreground">
                    What evolves
                  </span>
                </div>
                <ul className="space-y-3">
                  {[
                    "Featured proteins",
                    "Vegetables and grains",
                    "Fermented side",
                    "Seasonal ingredients",
                    "Flavour direction",
                    "Weekly theme",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[15px] text-muted-foreground">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-icon-teal" />
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
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[680px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">
              Emotional identity
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              Why the four plates{" "}
              <GradientText>feel different</GradientText>
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Each plate is designed to carry its own emotional tone — not just a different
              ingredient list, but a different feeling at the table.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="mt-10 space-y-3">
              {PLATES.map((plate) => (
                <div
                  key={plate.number}
                  className={`flex gap-4 rounded-2xl border ${plate.borderColor} bg-background p-6`}
                >
                  {/* Small food image crop */}
                  <div
                    className="h-12 w-12 shrink-0 overflow-hidden rounded-xl"
                    style={{ boxShadow: `0 0 0 2px color-mix(in srgb, ${plate.accent} 20%, transparent)` }}
                  >
                    <Image
                      src={plate.image}
                      alt={plate.name}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-foreground">{plate.name}</p>
                    <p className="mt-0.5 text-sm italic leading-relaxed text-muted-foreground">
                      Feels <em>{plate.emotional}</em>.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <p className="mt-8 text-[15px] leading-7 text-muted-foreground">
              Together, they create a weekly experience that feels both{" "}
              <span className="font-semibold text-foreground">practical and emotionally intelligent</span>{" "}
              — a rhythm that is easy to follow because it makes sense at every stage.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── This week's plates ───────────────────────────────────────────────── */}
      <section className="bg-muted/20 px-6 py-20 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
                Current week
              </p>
              <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                This week&apos;s plates
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-lg leading-8 text-muted-foreground">
                Four plates. One complete weekly system. Each plate appears once in the rotation —
                all four, every week, in sequence.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLATES.map((plate, i) => (
              <ScrollReveal key={plate.number} delay={i * 60}>
                <div
                  className={`group flex h-full flex-col overflow-hidden rounded-2xl border ${plate.borderColor} bg-background shadow-sm`}
                >
                  <div className="h-1 w-full" style={{ background: plate.topBar }} />
                  <div className="relative overflow-hidden bg-white">
                    <Image
                      src={plate.image}
                      alt={plate.name}
                      width={600}
                      height={600}
                      className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <div
                      className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm"
                      style={{ background: plate.accent }}
                    >
                      {plate.number}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <span className={`text-[11px] font-bold uppercase tracking-widest ${plate.accentClass}`}>
                      {plate.role}
                    </span>
                    <h3 className="mt-1.5 font-serif text-[15px] font-semibold text-foreground leading-snug">
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
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={200}>
            <div className="mt-14 text-center">
              <Link
                href="/assessment"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-10 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
              >
                Take the free assessment
                <ArrowUpRight size={16} />
              </Link>
              <p className="mt-4 text-sm text-muted-foreground/60">
                Understand your gut health picture before you change anything.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Start here ───────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[680px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-lime">
              Getting started
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              New to EatoBiotics?{" "}
              <GradientText>Start here.</GradientText>
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              If you are new to the framework, build slowly. The system compounds through
              repetition, not complexity.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="mt-10 space-y-3">
              {[
                {
                  step: "01",
                  title: "Take the free Food System Inside You assessment",
                  desc: "Understand your current gut health picture before you change anything.",
                  color: "var(--icon-lime)",
                  primary: true,
                },
                {
                  step: "02",
                  title: "Explore this week's four plates",
                  desc: "Read the framework behind each plate. Understand what each one is trying to do.",
                  color: "var(--icon-green)",
                  primary: false,
                },
                {
                  step: "03",
                  title: "Choose one plate to repeat this week",
                  desc: "Start with one. Consistency with one plate is worth more than sampling all four.",
                  color: "var(--icon-teal)",
                  primary: false,
                },
                {
                  step: "04",
                  title: "Build consistency before complexity",
                  desc: "The system rewards repetition. Once one plate feels natural, add the next.",
                  color: "var(--icon-orange)",
                  primary: false,
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`flex gap-5 rounded-2xl border bg-background p-6 ${
                    item.primary ? "border-icon-lime/30 shadow-sm" : "border-border"
                  }`}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ background: item.color }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
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
      <section className="bg-foreground px-6 py-20 md:py-28">
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
              <Link
                href="/assessment"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
              >
                Take the free assessment
                <ArrowUpRight size={16} />
              </Link>
              <a
                href="#plates"
                className="inline-flex items-center gap-2 rounded-full border-2 border-background/20 px-8 py-4 text-base font-semibold text-background transition-colors hover:border-icon-lime hover:text-icon-lime"
              >
                Explore this week&apos;s plates
              </a>
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
