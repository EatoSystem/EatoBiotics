import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { type Plate, PLATES, FRAMEWORK_PARTS } from "@/lib/plates"

interface PlatePageProps {
  plate: Plate
}

export function PlatePage({ plate }: PlatePageProps) {
  const index = PLATES.findIndex((p) => p.slug === plate.slug)
  const prev = index > 0 ? PLATES[index - 1] : null
  const next = index < PLATES.length - 1 ? PLATES[index + 1] : null

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-28 pb-16 md:pt-36 md:pb-24">
        {/* Subtle gradient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 60% at 100% 50%, color-mix(in srgb, ${plate.accent} 6%, transparent), transparent 65%)`,
          }}
        />

        {/* Per-plate top stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: plate.topBar }}
        />

        <div className="relative mx-auto max-w-[1200px]">
          {/* Back breadcrumb */}
          <ScrollReveal>
            <Link
              href="/weekly"
              className="mb-8 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground uppercase tracking-widest"
            >
              <ArrowLeft size={12} />
              The Weekly System
            </Link>
          </ScrollReveal>

          <div className="flex flex-col items-center gap-12 md:flex-row md:items-center md:gap-16 lg:gap-20">
            {/* Left: text */}
            <div className="flex-1 text-center md:text-left">
              <ScrollReveal>
                {/* Number + role badge */}
                <div className="flex items-center justify-center gap-2 md:justify-start">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold text-white"
                    style={{ background: plate.accent }}
                  >
                    {plate.number}
                  </span>
                  <span className={`text-xs font-bold uppercase tracking-widest ${plate.accentClass}`}>
                    {plate.role}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${plate.tagBg} ${plate.accentClass}`}>
                    {plate.personalityWord}
                  </span>
                </div>

                <h1 className="mt-5 font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl text-balance">
                  {plate.name}
                </h1>

                <blockquote
                  className="mt-6 border-l-2 pl-5 font-serif text-xl italic leading-relaxed text-muted-foreground sm:text-2xl"
                  style={{ borderColor: plate.accent }}
                >
                  &ldquo;{plate.message}&rdquo;
                </blockquote>

                <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
                  {plate.description}
                </p>
              </ScrollReveal>

              {/* Support tags */}
              <ScrollReveal delay={100}>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  {plate.supports.map((s) => (
                    <span
                      key={s}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${plate.tagBg} ${plate.accentClass}`}
                    >
                      {s}
                    </span>
                  ))}
                  <span className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    Emphasis: {plate.emphasis}
                  </span>
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground/60 md:text-left">
                  {plate.bioticsLabel}
                </p>
              </ScrollReveal>

              {/* CTAs */}
              <ScrollReveal delay={160}>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
                  <Link
                    href="/assessment"
                    className="brand-gradient inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
                  >
                    Take the free assessment
                    <ArrowUpRight size={14} />
                  </Link>
                  <Link
                    href="/weekly"
                    className="inline-flex items-center gap-2 rounded-full border-2 border-border px-7 py-3.5 text-sm font-semibold text-foreground transition-colors hover:border-icon-green hover:text-icon-green"
                  >
                    See all four plates
                  </Link>
                </div>
              </ScrollReveal>
            </div>

            {/* Right: food photo */}
            <ScrollReveal delay={80} className="w-full flex-1 md:max-w-[480px]">
              <Image
                src={plate.image}
                alt={plate.name}
                width={700}
                height={700}
                priority
                className="w-full h-auto"
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Weekly arc ───────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-24">
        <div className="mx-auto max-w-[900px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
              The weekly arc
            </p>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-foreground sm:text-3xl text-balance">
              Where this plate sits in the sequence
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Every plate answers a different question. Together they form one coherent week —{" "}
              <span className="font-medium text-foreground">
                awareness → function → nourishment → rebuilding.
              </span>
            </p>
          </ScrollReveal>

          {/* Desktop arc */}
          <ScrollReveal delay={80}>
            <div className="mt-12 hidden md:block">
              <div className="relative grid grid-cols-4 gap-4">
                <div
                  className="absolute top-10 left-[12.5%] right-[12.5%] h-px opacity-20"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--icon-lime), var(--icon-yellow), var(--icon-teal), var(--icon-orange))",
                  }}
                />
                {PLATES.map((p) => {
                  const isActive = p.slug === plate.slug
                  return (
                    <Link
                      key={p.slug}
                      href={`/${p.slug}`}
                      className={`flex flex-col items-center text-center transition-opacity ${isActive ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
                    >
                      <div
                        className="relative z-10 h-20 w-20 overflow-hidden rounded-full ring-2 ring-background"
                        style={{
                          boxShadow: isActive
                            ? `0 0 0 3px color-mix(in srgb, ${p.accent} 50%, transparent)`
                            : `0 0 0 2px color-mix(in srgb, ${p.accent} 20%, transparent)`,
                        }}
                      >
                        <Image
                          src={p.image}
                          alt={p.name}
                          width={160}
                          height={160}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p
                        className="mt-4 text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: p.accent }}
                      >
                        {p.number} · {p.role}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-foreground leading-snug">
                        {p.name}
                      </p>
                      <p className="mt-1 text-[11px] italic text-muted-foreground/60">
                        {p.arcWord}
                      </p>
                      {isActive && (
                        <span
                          className="mt-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                          style={{ background: p.accent }}
                        >
                          You are here
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </ScrollReveal>

          {/* Mobile arc */}
          <ScrollReveal delay={80}>
            <div className="mt-8 flex flex-wrap justify-center gap-2 md:hidden">
              {PLATES.map((p) => {
                const isActive = p.slug === plate.slug
                return (
                  <Link
                    key={p.slug}
                    href={`/${p.slug}`}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? "text-white border-transparent"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                    style={isActive ? { background: p.accent } : undefined}
                  >
                    <span className="opacity-70">{p.number}</span>
                    {p.role}
                  </Link>
                )
              })}
            </div>
          </ScrollReveal>

          {/* Arc callout */}
          <ScrollReveal delay={120}>
            <div className="mt-8 rounded-2xl border border-border bg-background px-7 py-6">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: plate.accent }}>
                {plate.number} · {plate.arcWord}
              </p>
              <p className="text-[15px] leading-7 text-muted-foreground">
                &ldquo;{plate.question}&rdquo;{" "}
                <span className="font-medium text-foreground">
                  This plate is the system&apos;s answer — {plate.emotional}.
                </span>
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── The four quadrants ───────────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[1100px]">
          <div className="flex flex-col gap-12 md:flex-row md:items-start md:gap-16">

            {/* Left */}
            <div className="flex-1">
              <ScrollReveal>
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-lime">
                  The framework
                </p>
                <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
                  One plate.{" "}
                  <span className="brand-gradient-text">Four parts.</span>
                </h2>
                <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                  Every EatoBiotics plate is built on the same four-part structure. The foods rotate.
                  The framework stays constant — that stability is what makes consistency possible.
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

              {/* Protein callout for this specific plate */}
              <ScrollReveal delay={120}>
                <div
                  className="mt-5 rounded-2xl border p-6"
                  style={{
                    borderColor: `color-mix(in srgb, ${plate.accent} 30%, var(--border))`,
                    background: `color-mix(in srgb, ${plate.accent} 4%, var(--background))`,
                  }}
                >
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: plate.accent }}>
                    This plate&apos;s protein
                  </p>
                  <p className="text-[15px] font-semibold text-foreground">{plate.protein}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The Protein Balance quadrant for {plate.name.toLowerCase()}.
                    Rotate proteins week to week to maximise microbiome diversity.
                  </p>
                </div>
              </ScrollReveal>
            </div>

            {/* Right: illustrated plate */}
            <ScrollReveal delay={60} className="w-full md:w-[380px] lg:w-[440px] shrink-0 md:pt-10">
              <Image
                src={plate.plateImage}
                alt={`${plate.name} — illustrated plate breakdown`}
                width={600}
                height={600}
                className="w-full h-auto drop-shadow-sm"
              />
              <p className="mt-3 text-center text-xs text-muted-foreground/60">
                {plate.name} — the four-part structure.
              </p>
            </ScrollReveal>

          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Prev / Next navigation ───────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-24">
        <div className="mx-auto max-w-[900px]">
          <ScrollReveal>
            <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Continue the weekly arc
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Prev */}
              {prev ? (
                <Link href={`/${prev.slug}`} className="group">
                  <div className={`flex h-full items-center gap-4 overflow-hidden rounded-2xl border ${prev.borderColor} bg-background p-5 transition-all hover:shadow-md`}>
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                      <Image src={prev.image} alt={prev.name} width={128} height={128} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        ← Previous
                      </p>
                      <p className={`mt-1 text-xs font-bold uppercase tracking-wider ${prev.accentClass}`}>
                        {prev.number} · {prev.role}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground leading-snug truncate">
                        {prev.name}
                      </p>
                    </div>
                  </div>
                </Link>
              ) : (
                <Link href="/weekly" className="group">
                  <div className="flex h-full items-center gap-4 rounded-2xl border border-border bg-background p-5 transition-all hover:shadow-md">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border">
                      <ArrowLeft size={20} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">← Back</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">The Weekly System</p>
                    </div>
                  </div>
                </Link>
              )}

              {/* Next */}
              {next ? (
                <Link href={`/${next.slug}`} className="group">
                  <div className={`flex h-full items-center gap-4 overflow-hidden rounded-2xl border ${next.borderColor} bg-background p-5 transition-all hover:shadow-md`}>
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                      <Image src={next.image} alt={next.name} width={128} height={128} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Next →
                      </p>
                      <p className={`mt-1 text-xs font-bold uppercase tracking-wider ${next.accentClass}`}>
                        {next.number} · {next.role}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground leading-snug truncate">
                        {next.name}
                      </p>
                    </div>
                  </div>
                </Link>
              ) : (
                <Link href="/weekly" className="group">
                  <div className="flex h-full items-center gap-4 rounded-2xl border border-border bg-background p-5 transition-all hover:shadow-md">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border">
                      <ArrowRight size={20} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Back →</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">The Weekly System</p>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </ScrollReveal>

          {/* Assessment CTA */}
          <ScrollReveal delay={100}>
            <div className="mt-12 rounded-3xl border border-border bg-background p-8 text-center md:p-12">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: plate.accent }}>
                Start here
              </p>
              <h3 className="mt-3 font-serif text-2xl font-semibold text-foreground sm:text-3xl text-balance">
                Find out where your food system stands today.
              </h3>
              <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground leading-relaxed">
                The free EatoBiotics assessment gives you your Biotics Score in under 3 minutes —
                your personalised starting point for the weekly system.
              </p>
              <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/assessment"
                  className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
                >
                  Take the free assessment
                  <ArrowUpRight size={16} />
                </Link>
                <Link
                  href="/weekly"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-semibold text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                >
                  Back to all four plates
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground/60">Free. No card needed. 3 minutes.</p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
