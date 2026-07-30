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
 * ── Two deliberate absences ──────────────────────────────────────────────────
 *
 * No photograph. The concept render exists as a design mockup but not as a
 * production asset, and a building-only crop could not be taken from it cleanly
 * — the plaza and the people are one continuous scene with the EatoX wordmark
 * baked in beneath. Rather than ship a flat mockup as a homepage image, the
 * visual here is CSS: stacked curved terraces and an orbit, in the brand
 * gradient, decorative and aria-hidden. Same call global-direction.tsx made for
 * the same reason, and its header comment says so.
 *
 * No CTA. /eatox does not exist. Pointing "Discover EatoX" at /eatosystem would
 * send people somewhere that is not about EatoX, and inventing a thin route to
 * catch one link is worse. The section ends on its closing line until there is
 * a real destination — and the page already carries its primary assessment CTA
 * elsewhere, so this section adding a second one would compete with it.
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

/** Decorative stand-in for the concept render: curved terraces under an orbit. */
function ConceptMotif() {
  return (
    <div aria-hidden className="relative mx-auto aspect-square w-full max-w-[380px]">
      <svg viewBox="0 0 400 400" className="h-full w-full" role="presentation">
        <defs>
          <linearGradient id="eatox-terrace" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--icon-lime)" />
            <stop offset="45%" stopColor="var(--icon-green)" />
            <stop offset="100%" stopColor="var(--icon-teal)" />
          </linearGradient>
          <linearGradient id="eatox-warm" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--icon-yellow)" />
            <stop offset="100%" stopColor="var(--icon-orange)" />
          </linearGradient>
          <radialGradient id="eatox-glow">
            <stop offset="0%" stopColor="var(--icon-lime)" stopOpacity="0.30" />
            <stop offset="100%" stopColor="var(--icon-lime)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="200" cy="205" r="165" fill="url(#eatox-glow)" />
        <ellipse
          cx="200" cy="205" rx="175" ry="120"
          fill="none" stroke="var(--icon-lime)" strokeOpacity="0.45" strokeWidth="1"
        />
        <circle cx="352" cy="150" r="4" fill="var(--icon-orange)" />
        <circle cx="52" cy="243" r="3.5" fill="var(--icon-green)" />

        {/* Four stacked terraces, each narrower than the one below it. */}
        {[
          { y: 300, w: 210, h: 30 },
          { y: 258, w: 178, h: 28 },
          { y: 218, w: 146, h: 26 },
          { y: 180, w: 112, h: 24 },
        ].map((t) => (
          <rect
            key={t.y}
            x={200 - t.w / 2}
            y={t.y}
            width={t.w}
            height={t.h}
            rx={t.h / 2}
            fill="url(#eatox-terrace)"
            opacity="0.92"
          />
        ))}

        {/* The spine the terraces cantilever from. */}
        <rect x="192" y="150" width="16" height="180" rx="8" fill="url(#eatox-terrace)" />
        {/* A warm crown, echoing the lit upper floors in the concept. */}
        <rect x="176" y="140" width="48" height="12" rx="6" fill="url(#eatox-warm)" />
        {/* Ground line. */}
        <rect x="70" y="336" width="260" height="3" rx="1.5" fill="var(--icon-green)" opacity="0.28" />
      </svg>
    </div>
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

      <div className="mt-14 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <ScrollReveal>
          <div>
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
            <ConceptMotif />
            <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Concept vision — EatoX Dublin
            </p>
            <h3 className="mt-6 font-serif text-5xl font-semibold text-foreground">EatoX</h3>
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
