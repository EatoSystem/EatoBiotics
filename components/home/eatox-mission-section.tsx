import Image from "next/image"
import { ChefHat, Camera, FlaskConical, Landmark, Users, MapPin } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

/**
 * Homepage section — the EatoX mission.
 *
 * Sits between the Digital Twin section and the membership teaser, which is the
 * whole point of it: the page has just spent five sections on "this helps me",
 * and this turns that into "this also helps build something bigger" before
 * pricing asks for anything. Above the product explanation it would be a
 * non-sequitur; after pricing nobody reads it.
 *
 * ── Why this is the page's one dark band ─────────────────────────────────────
 *
 * The concept renders are dark twilight and the homepage is warm white. An
 * earlier pass tried to manage that with framing; adopting it works better. The
 * site already has the idiom — /you, /family, /book and /biotics all carry
 * bg-foreground bands — and giving the page a single dark moment exactly where
 * the story turns outward is what stops this section reading as a quiet
 * footnote. It is the mission, so it should feel like a pause.
 *
 * The renders do the arguing. The exterior establishes that EatoX is a place;
 * Kitchen, Studio and Lab put the actual room inside each of the three cards,
 * which previously carried an icon and a line of text. The exterior's KITCHEN /
 * STUDIO / LAB signage is not duplication — it previews the three cards
 * directly beneath it.
 *
 * A fifth render (the lobby) was supplied and deliberately not used: its wall
 * screen carries garbled generated text and the wordmark is malformed, which is
 * legible at homepage scale and works against the credibility this section is
 * trying to build.
 *
 * ── Contrast on dark, measured ───────────────────────────────────────────────
 *
 *   text-background (white)   14.55:1
 *   text-background/70         7.87:1     ← body copy
 *   text-background/50         4.76:1     margin too thin
 *   text-background/40         3.58:1     FAILS
 *
 * So: solid white for headings, /70 for body, never /50 or below. The
 * alpha-reduced light text on /book, /books, /weekly, /about and /start is
 * precisely what makes up the known dark-ground violations; this section must
 * not add to them.
 *
 * Brand hues all pass on --foreground (lime 9.36, green 5.61, teal 4.91,
 * yellow 8.92, orange 7.18), so accents use the raw hues here — NOT the -text
 * or -display tokens, which are calibrated for white grounds and invert on
 * dark. text-icon-* is safe because #187's `.bg-foreground .text-icon-*`
 * override restores the raw hue inside exactly this kind of band.
 *
 * ── Claims ───────────────────────────────────────────────────────────────────
 *
 * Every future-state phrase is deliberate. "We intend to reinvest", not "we
 * reinvest". "Are intended for", not "are dedicated to". Nothing implies land,
 * planning permission, funding or a build timetable, because none of that
 * exists — the status strip says Concept development for the same reason, and
 * each alt text says "proposed". Change this wording deliberately or not at all.
 *
 * A "Discover EatoX" CTA was requested and left out: /eatox does not exist,
 * pointing it at /eatosystem would send people somewhere that is not about
 * EatoX, and a thin route invented to catch one link is worse. A decision, not
 * an oversight.
 *
 * Server component.
 */

const PLACES = [
  {
    Icon: ChefHat,
    title: "Kitchen",
    line: "Create, test, and share better food.",
    hue: "var(--icon-lime)",
    to: "var(--icon-green)",
    image: "/images/eatox/eatox-kitchen.webp",
    alt: "Concept illustration of the proposed EatoX Kitchen — a long counter with induction hobs and prepared dishes, open to a window wall at dusk.",
  },
  {
    Icon: Camera,
    title: "Studio",
    line: "Capture and share the stories of the system.",
    hue: "var(--icon-yellow)",
    to: "var(--icon-orange)",
    image: "/images/eatox/eatox-studio.webp",
    alt: "Concept illustration of the proposed EatoX Studio — editing desks with food photography on screen, beside a lit shooting set.",
  },
  {
    Icon: FlaskConical,
    title: "Lab",
    line: "Develop ideas, tools, and future food-system solutions.",
    hue: "var(--icon-teal)",
    to: "var(--icon-green)",
    image: "/images/eatox/eatox-lab.webp",
    alt: "Concept illustration of the proposed EatoX Lab — people working around shared tables under suspended data screens.",
  },
]

const STATUS = [
  { Icon: Landmark, label: "Current stage", value: "Concept development" },
  { Icon: Users, label: "Next milestone", value: "Community + expert design" },
  { Icon: MapPin, label: "Location", value: "Dublin, Ireland" },
]

export function EatoxMissionSection() {
  return (
    <section id="eatox" className="scroll-mt-28 bg-foreground px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-lime">
              A bigger mission. Together.
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-background sm:text-5xl text-balance">
              Build the food system{" "}
              <span style={{ color: "var(--icon-lime)" }}>inside you</span> — and help build the
              food system <span style={{ color: "var(--icon-orange)" }}>around you</span>.
            </h2>
          </div>
        </ScrollReveal>

        {/* The exterior leads: it establishes that EatoX is a place, and its
            signage previews the three rooms in the cards below. */}
        <ScrollReveal delay={80}>
          <figure className="m-0 mt-12">
            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl border border-white/15">
              <Image
                src="/images/eatox/eatox-exterior.webp"
                alt="Concept illustration of EatoX Dublin, a proposed public-facing Kitchen, Studio and Lab with curved architecture, greenery, and people gathering outside."
                fill
                sizes="(max-width: 1024px) 100vw, 1160px"
                className="object-cover"
                priority={false}
              />
              <div
                aria-hidden
                className="absolute left-0 right-0 top-0 h-1.5"
                style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-orange))" }}
              />
            </div>
            <figcaption className="mt-3 text-center text-xs font-semibold uppercase tracking-widest text-background/70">
              Concept vision — EatoX Dublin
            </figcaption>
          </figure>
        </ScrollReveal>

        <div className="mt-14 grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <ScrollReveal>
            <div>
              <h3 className="font-serif text-4xl font-semibold text-background sm:text-5xl">EatoX</h3>
              <p className="mt-2 font-serif text-xl">
                <span style={{ color: "var(--icon-lime)" }}>Kitchen</span>
                <span className="text-background/70">, </span>
                <span style={{ color: "var(--icon-orange)" }}>Studio</span>
                <span className="text-background/70"> &amp; </span>
                <span style={{ color: "var(--icon-teal)" }}>Lab</span>
              </p>
              <p className="mt-5 text-base leading-relaxed text-background/70">
                A place where chefs, scientists, creators, communities, and developers come
                together to build better food systems.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-background/70">
                The headquarters of the EatoSystem — where food is created, stories are told, and
                the future of the food system is built.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div>
              <p className="text-base leading-relaxed text-background/70">
                EatoBiotics helps you improve your health, diet, and the Food System Inside You.
              </p>
              <div
                className="mt-6 h-1 w-20 rounded-full"
                style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-orange))" }}
              />
              <p className="mt-6 text-lg leading-relaxed text-background">
                We intend to reinvest 50% of annual distributable profits into building EatoX in
                Dublin — the Kitchen, Studio &amp; Lab at the heart of the EatoSystem.
              </p>
            </div>
          </ScrollReveal>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          {/* Commitment. Deliberately not a ring: the Biotics Score already owns
              that shape, and this is a pledge, not a measurement. */}
          <ScrollReveal>
            <div className="relative h-full overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] p-7">
              <div
                className="absolute left-0 right-0 top-0 h-1.5"
                style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-orange))" }}
              />
              <p className="text-xs font-bold uppercase tracking-widest text-background/70">
                Our commitment
              </p>
              <p
                className="mt-3 font-sans text-6xl font-bold leading-none tracking-tight"
                style={{ color: "var(--icon-lime)" }}
              >
                50%
              </p>
              <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full w-1/2 rounded-full"
                  style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-orange))" }}
                />
              </div>
              <p className="mt-4 text-sm leading-relaxed text-background/70">
                50% of annual distributable profits are intended for building EatoX.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            {/* content-center matters: this card is stretched to the commitment
                card's height, and without it the three items pin to the top and
                leave a visible empty half. */}
            <div className="grid h-full content-center gap-4 rounded-2xl border border-white/15 bg-white/[0.04] p-7 sm:grid-cols-3">
              {STATUS.map(({ Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10"
                    style={{ color: "var(--icon-lime)" }}
                  >
                    <Icon size={17} aria-hidden strokeWidth={2} />
                  </span>
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-widest text-background/70">
                      {label}
                    </span>
                    <span className="mt-1 block text-sm font-semibold leading-snug text-background">
                      {value}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>

        {/* Each room gets its own render. This is what turns three icon cards
            into three places. */}
        <div className="mt-8 grid gap-6 md:grid-cols-3 md:gap-8">
          {PLACES.map(({ Icon, title, line, hue, to, image, alt }, i) => (
            <ScrollReveal key={title} delay={i * 120}>
              <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04]">
                <div
                  className="absolute left-0 right-0 top-0 z-10 h-1.5"
                  style={{ background: `linear-gradient(90deg, ${hue}, ${to})` }}
                />
                <div className="relative aspect-[3/2] w-full overflow-hidden">
                  <Image
                    src={image}
                    alt={alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 370px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"
                    style={{ color: hue }}
                  >
                    <Icon size={21} aria-hidden strokeWidth={2} />
                  </span>
                  <h3 className="mt-5 font-serif text-2xl font-semibold" style={{ color: hue }}>
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-background/70">{line}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={120}>
          <p className="mt-14 text-center font-serif text-2xl font-semibold text-background sm:text-3xl">
            Built with <span style={{ color: "var(--icon-lime)" }}>people</span>, not just for{" "}
            <span style={{ color: "var(--icon-orange)" }}>them</span>.
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
