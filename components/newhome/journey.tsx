import { Kicker, Section, SectionHeading } from "./shared"

const STEPS = [
  {
    name: "Understand",
    horizon: "Now",
    text: "Complete the free assessment and receive your Food System Score.",
  },
  {
    name: "Explain",
    horizon: "This week",
    text: "Unlock a personalised Food System Report and understand the patterns behind the score.",
  },
  {
    name: "Improve",
    horizon: "One month",
    text: "Follow practical food-first actions and a personal plan, one step at a time.",
  },
  {
    name: "Measure",
    horizon: "75 days",
    text: "Check in, retest, and see how your patterns change over time.",
  },
  {
    name: "Continue",
    horizon: "One year and beyond",
    text: "Build a better relationship with food through ongoing support and membership.",
  },
]

const PROGRESS_STATES = [
  { label: "Improved", color: "var(--icon-green)",  note: "Patterns strengthened" },
  { label: "Stable",   color: "var(--icon-teal)",   note: "Holding steady counts" },
  { label: "Mixed",    color: "var(--icon-yellow)", note: "Some up, some down" },
  { label: "Declined", color: "var(--icon-orange)", note: "Useful information, not failure" },
]

/** Section 4 — the journey over time. Anchored for the hero's "See How It Works". */
export function Journey() {
  return (
    <Section id="journey" tinted>
      <div className="max-w-3xl">
        <Kicker>How it works</Kicker>
        <SectionHeading>A journey, not a one-time test</SectionHeading>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          The Food System Inside You changes slowly, with the seasons of your life. EatoBiotics is
          built around watching it over weeks, months, and years — not judging it on one day.
        </p>
      </div>

      <ol className="mt-10 space-y-4">
        {STEPS.map((s, i) => (
          <li key={s.name} className="flex gap-4 rounded-3xl bg-white px-5 py-5 sm:items-center sm:gap-6 sm:px-7"
            style={{ border: "1px solid rgba(26,46,18,0.10)" }}>
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full font-mono text-sm font-bold text-white brand-gradient"
              aria-hidden="true">
              {i + 1}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-serif text-xl font-bold text-foreground">{s.name}</h3>
                <span className="text-xs font-semibold uppercase tracking-wider text-icon-teal">{s.horizon}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 rounded-3xl bg-white px-6 py-6 sm:px-8" style={{ border: "1px solid rgba(26,46,18,0.10)" }}>
        <p className="font-serif text-lg font-bold text-foreground">
          Every check-in gives direction, not judgement.
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Progress is rarely a straight line. A retest can come back four ways — and each one tells
          you something useful about what to do next.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PROGRESS_STATES.map((p) => (
            <div key={p.label} className="rounded-2xl px-4 py-3" style={{ background: "rgba(26,46,18,0.035)" }}>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: p.color }} aria-hidden="true" />
                <p className="text-sm font-semibold text-foreground">{p.label}</p>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.note}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
