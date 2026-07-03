import Image from "next/image"

/**
 * ReactionCards — "See it in action": every choice creates a reaction.
 *
 * Six teach-by-contrast cards (Kefir, Beans, Berries, Poor sleep,
 * Ultra-processed meal, Consistent meals). Each shows a mini Food System
 * figure whose relevant pathway glows or dims — the same colour language the
 * member later sees on their own Meal Reveal — with a one-line lesson.
 * Positive reactions glow green/lime/teal; strain shows an amber pulse
 * (buffering, never a red alarm). Pure CSS; server-rendered.
 */

const LIME = "#A8E063"
const GREEN = "#4CB648"
const TEAL = "#2DAA6E"
const YELLOW = "#F5C518"
const ORANGE = "#F5A623"

interface Reaction {
  trigger: string
  thing: string
  effect: string
  lesson: string
  color: string
  /** Where the reaction lands on the mini figure (% of card stage). */
  node: { x: number; y: number }
  /** Strain reactions dim the figure and pulse slower — handled, not punished. */
  strain?: boolean
  /** Whole-system reactions light the full aura rather than one point. */
  whole?: boolean
}

const REACTIONS: Reaction[] = [
  {
    trigger: "You ate",
    thing: "Kefir",
    effect: "Probiotic network lights up",
    lesson: "Live cultures travel to your gut and join your resident microbial community.",
    color: TEAL,
    node: { x: 54, y: 56 },
  },
  {
    trigger: "You ate",
    thing: "Beans",
    effect: "Fibre pathways expand",
    lesson: "Prebiotic fibre flows down to the colon — the food your microbes actually eat.",
    color: LIME,
    node: { x: 47, y: 63 },
  },
  {
    trigger: "You ate",
    thing: "Berries",
    effect: "Antioxidant defence activates",
    lesson: "Polyphenols feed protective microbes and support your gut barrier.",
    color: GREEN,
    node: { x: 50, y: 38 },
  },
  {
    trigger: "Last night",
    thing: "Poor sleep",
    effect: "Energy pathway dims",
    lesson: "Short sleep slows recovery — a fibre-rich breakfast helps steady the day.",
    color: YELLOW,
    node: { x: 48, y: 30 },
    strain: true,
  },
  {
    trigger: "You ate an",
    thing: "Ultra-processed meal",
    effect: "The system buffers the strain",
    lesson: "Little here for your microbes to work with — the next plant-rich meal starts the recovery.",
    color: ORANGE,
    node: { x: 54, y: 56 },
    strain: true,
  },
  {
    trigger: "One week of",
    thing: "Consistent meals",
    effect: "System balance improves",
    lesson: "Rhythm is a nutrient — steady, varied meals compound into a stronger Food System.",
    color: GREEN,
    node: { x: 50, y: 46 },
    whole: true,
  },
]

function MiniSystem({ r }: { r: Reaction }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[190px]">
      {/* light orb the figure lives in */}
      <div
        className="absolute left-1/2 top-1/2 h-[94%] w-[94%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, #FDFBF7 0%, #FDFBF7 55%, rgba(253,251,247,0) 76%)" }}
      />
      {/* reaction aura — tinted by the reaction, dimmer under strain */}
      <div
        className="eb-aura absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: r.whole
            ? `radial-gradient(circle, ${r.color}66 0%, ${YELLOW}33 50%, transparent 72%)`
            : `radial-gradient(circle at ${r.node.x}% ${r.node.y}%, ${r.color}${r.strain ? "3d" : "66"} 0%, transparent 55%)`,
          animationDuration: r.strain ? "5.5s" : "3.5s",
          opacity: r.strain ? 0.7 : 1,
        }}
      />
      <Image
        src="/images/couple-hero.png"
        alt=""
        width={190}
        height={190}
        sizes="190px"
        className="absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 object-contain"
        style={{ mixBlendMode: "multiply", filter: r.strain ? "saturate(0.55) opacity(0.85)" : undefined }}
      />
      {/* the reaction node — pings where the choice lands */}
      <span className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${r.node.x}%`, top: `${r.node.y}%` }}>
        <span className="relative flex h-7 w-7 items-center justify-center">
          <span
            className="eb-ping absolute inline-flex h-full w-full rounded-full"
            style={{ background: r.color, opacity: r.strain ? 0.4 : 0.6, animationDuration: r.strain ? "2.6s" : "1.7s" }}
          />
          <span
            className="relative inline-flex h-[13px] w-[13px] rounded-full"
            style={{ background: r.color, border: "2px solid white", boxShadow: `0 0 14px ${r.color}cc` }}
          />
        </span>
      </span>
    </div>
  )
}

export function ReactionCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {REACTIONS.map((r) => (
        <div
          key={r.thing}
          className="overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg"
          style={{ boxShadow: "0 4px 20px rgba(26,46,18,0.06)" }}
        >
          <div className="flex items-baseline gap-1.5 px-5 pt-4">
            <span className="text-[11px] font-semibold" style={{ color: "var(--muted-foreground)" }}>{r.trigger}</span>
            <span className="font-serif text-base font-bold" style={{ color: "var(--foreground)" }}>{r.thing}</span>
          </div>
          <div className="px-5 py-2">
            <MiniSystem r={r} />
          </div>
          <div className="px-5 pb-5">
            <p className="flex items-center gap-2 text-sm font-bold" style={{ color: r.strain ? "#a05a0a" : "#2d7a24" }}>
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: r.color, boxShadow: `0 0 8px ${r.color}` }} />
              {r.effect}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{r.lesson}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
