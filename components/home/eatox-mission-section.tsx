import Image from "next/image"
import { ChefHat, Camera, FlaskConical, Landmark, Users, MapPin } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { Eyebrow, Section, SectionHeading } from "./section-shared"

/**
 * Homepage section — the EatoX mission.
 *
 * Sits between the Digital Twin section and the membership teaser, which is the
 * whole point of it: the page has just spent five sections on "this helps me",
 * and this turns that into "this also helps build something bigger" before
 * pricing asks for anything. Above the product explanation it would be a
 * non-sequitur; after pricing nobody reads it.
 *
 * ── The image carries this section ───────────────────────────────────────────
 *
 * The first version used an abstract SVG motif, because no clean render existed.
 * It was correct about the narrative position and too quiet to hold it — an
 * ambition this size needs to look real, not diagrammatic. The concept render
 * replaced it.
 *
 * Sized with `fill` inside an aspect-[4/3] box and `object-cover` rather than
 * fixed width/height: at a matching ratio that crops nothing, which is what
 * keeps the entrance, the public space and the human scale in frame. Those three
 * are the whole argument of the picture — a tighter crop of just the building
 * would make it architecture rather than a place people go.
 *
 * The caption and the alt text both say what this is. "Concept vision" is
 * visible; "a proposed public-facing" is in the alt, so the conceptual status
 * reaches the accessibility tree too and does not live only in sighted copy.
 *
 * ── No CTA, and it was asked for ─────────────────────────────────────────────
 *
 * A "Discover EatoX" CTA was requested and deliberately left out: /eatox does
 * not exist. Pointing it at /eatosystem would send people somewhere that is not
 * about EatoX, and inventing a thin route to catch one link is worse. This is a
 * decision, not an oversight — add the CTA when the destination is real. The
 * page already carries its primary assessment CTA elsewhere, so a second one
 * here would compete with it regardless.
 *
 * ── Claims ───────────────────────────────────────────────────────────────────
 *
 * Every future-state phrase here is deliberate. "We intend to reinvest", not
 * "we reinvest". "Are intended for", not "are dedicated to". Nothing implies
 * land, planning permission, funding or a construction timetable, because none
 * of that exists — the status strip says Concept development for the same
 * reason. Treat this copy the way lib/pillars.ts treats the biotics vocabulary:
 * it is the wording that was signed off, so change it deliberately or not at
 * all.
 *
 * ── Contrast ─────────────────────────────────────────────────────────────────
 *
 * Brand colour reaches text only through text-icon-* (remapped to the AA-safe
 * --icon-*-text variants in #187) or those tokens directly. Raw hues appear
 * only on gradient bars, borders and icon glyphs, which are not text.
 *
 * Note what is NOT copied from feed-seed-heal.tsx: its tint pill sets text to
 * `color-mix(in srgb, <hue> 78%, var(--foreground))` on a 15% tint, which axe
 * measures at 3.49:1 — a known failure awaiting the contrast sweep. The pills
 * here keep the shape and take an AA-safe colour instead, so this section does
 * not add to that backlog.
 *
 * Server component.
 */

const PLACES = [
  {
    Icon: ChefHat,
    title: "Kitchen",
    line: "Create, test, and share better food.",
    hue: "var(--icon-green)",
    text: "var(--icon-green-text)",
    to: "var(--icon-teal)",
  },
  {
    Icon: Camera,
    title: "Studio",
    line: "Capture and share the stories of the system.",
    hue: "var(--icon-orange)",
    text: "var(--icon-orange-text)",
    to: "var(--icon-yellow)",
  },
  {
    Icon: FlaskConical,
    title: "Lab",
    line: "Develop ideas, tools, and future food-system solutions.",
    hue: "var(--icon-teal)",
    text: "var(--icon-teal-text)",
    to: "var(--icon-green)",
  },
]

const STATUS = [
  { Icon: Landmark, label: "Current stage", value: "Concept development" },
  { Icon: Users, label: "Next milestone", value: "Community + expert design" },
  { Icon: MapPin, label: "Location", value: "Dublin, Ireland" },
]

/**
 * The concept render. Not decorative — it is the section's argument, so it takes
 * real alt text rather than aria-hidden.
 *
 * fill + aspect-[4/3] + object-cover: the committed asset's exact intrinsic size
 * is not fixed here, and at a matching ratio object-cover crops nothing. That
 * keeps the entrance, the plaza and the people in frame, which is the point of
 * the picture.
 *
 * w-full on the figure is load-bearing: its parent is a centred flex column,
 * which sizes children to their content, so without it the aspect box collapses
 * and the render shrinks to a 232px thumbnail.
 */
function ConceptImage() {
  return (
    <figure className="m-0 w-full">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-[0_30px_60px_-30px_rgba(20,37,15,0.35)]">
        <Image
          src="/images/eatox/eatox-dublin-concept.webp"
          alt="Concept illustration of EatoX Dublin, a proposed public-facing Kitchen, Studio and Lab with curved architecture, greenery, and people gathering outside."
          fill
          sizes="(max-width: 1024px) 100vw, 620px"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute left-0 right-0 top-0 h-1.5"
          style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-orange))" }}
        />
      </div>
      <figcaption className="mt-3 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Concept vision — EatoX Dublin
      </figcaption>
    </figure>
  )
}

export function EatoxMissionSection() {
  return (
    <Section id="eatox">
      <ScrollReveal>
        <div className="max-w-3xl">
          <Eyebrow>A bigger mission. Together.</Eyebrow>
          <SectionHeading>
            Build the food system{" "}
            <span style={{ color: "var(--icon-green-display)" }}>inside you</span> — and help
            build the food system{" "}
            <span style={{ color: "var(--icon-orange-display)" }}>around you</span>.
          </SectionHeading>
        </div>
      </ScrollReveal>

      {/* Image column is the wider of the two: the render is what makes EatoX
          feel like a real place, so it leads and the copy supports it. */}
      <div className="mt-14 grid items-start gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
        <ScrollReveal>
          <div className="lg:pt-6">
            <p className="text-lg leading-relaxed text-muted-foreground">
              EatoBiotics helps you improve your health, diet, and the Food System Inside You.
            </p>
            <div
              className="mt-7 h-1 w-20 rounded-full"
              style={{ background: "linear-gradient(90deg, var(--icon-green), var(--icon-orange))" }}
            />
            <p className="mt-7 text-lg leading-relaxed text-foreground">
              We intend to reinvest 50% of annual distributable profits into building EatoX in
              Dublin — the Kitchen, Studio &amp; Lab at the heart of the EatoSystem.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={120}>
          <div className="flex flex-col items-center">
            <ConceptImage />
            <h3 className="mt-8 font-serif text-5xl font-semibold text-foreground sm:text-6xl">
              EatoX
            </h3>
            <p className="mt-2 font-serif text-xl">
              <span style={{ color: "var(--icon-green-text)" }}>Kitchen</span>
              <span className="text-muted-foreground">, </span>
              <span style={{ color: "var(--icon-orange-text)" }}>Studio</span>
              <span className="text-muted-foreground"> &amp; </span>
              <span style={{ color: "var(--icon-teal-text)" }}>Lab</span>
            </p>
            <p className="mt-4 max-w-md text-center text-base leading-relaxed text-muted-foreground">
              A place where chefs, scientists, creators, communities, and developers come
              together to build better food systems.
            </p>
            <p className="mt-3 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
              The headquarters of the EatoSystem — where food is created, stories are told, and
              the future of the food system is built.
            </p>
          </div>
        </ScrollReveal>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        {/* Commitment. Deliberately not a ring: the Biotics Score already owns
            that shape, and this is a pledge, not a measurement. */}
        <ScrollReveal>
          <div className="relative h-full overflow-hidden rounded-2xl border border-border bg-background p-7">
            <div
              className="absolute left-0 right-0 top-0 h-1.5"
              style={{ background: "linear-gradient(90deg, var(--icon-green), var(--icon-orange))" }}
            />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Our commitment
            </p>
            <p
              className="mt-3 font-sans text-6xl font-bold leading-none tracking-tight"
              style={{ color: "var(--icon-green-display)" }}
            >
              50%
            </p>
            <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full w-1/2 rounded-full"
                style={{ background: "linear-gradient(90deg, var(--icon-green), var(--icon-orange))" }}
              />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              50% of annual distributable profits are intended for building EatoX.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="grid h-full gap-4 rounded-2xl border border-border bg-background p-7 sm:grid-cols-3">
            {STATUS.map(({ Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: "color-mix(in srgb, var(--icon-green) 12%, transparent)",
                    color: "var(--icon-green)",
                  }}
                >
                  <Icon size={17} aria-hidden strokeWidth={2} />
                </span>
                <span>
                  <span className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {label}
                  </span>
                  <span className="mt-1 block text-sm font-semibold leading-snug text-foreground">
                    {value}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3 md:gap-8">
        {PLACES.map(({ Icon, title, line, hue, text, to }, i) => (
          <ScrollReveal key={title} delay={i * 120}>
            <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-7 transition-all hover:shadow-lg">
              <div
                className="absolute left-0 right-0 top-0 h-1.5"
                style={{ background: `linear-gradient(90deg, ${hue}, ${to})` }}
              />
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  background: `color-mix(in srgb, ${hue} 12%, transparent)`,
                  color: hue,
                }}
              >
                <Icon size={21} aria-hidden strokeWidth={2} />
              </span>
              <h3 className="mt-5 font-serif text-2xl font-semibold" style={{ color: text }}>
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{line}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal delay={120}>
        <p className="mt-14 text-center font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          Built with <span style={{ color: "var(--icon-green-display)" }}>people</span>, not just
          for <span style={{ color: "var(--icon-orange-display)" }}>them</span>.
        </p>
      </ScrollReveal>
    </Section>
  )
}
