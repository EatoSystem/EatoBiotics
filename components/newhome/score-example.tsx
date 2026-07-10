import Link from "next/link"
import { Kicker, Section, SectionHeading } from "./shared"

const EXAMPLE_PILLARS = [
  { key: "Feed", science: "Prebiotics",  value: 71, color: "var(--icon-green)" },
  { key: "Seed", science: "Probiotics",  value: 42, color: "var(--icon-teal)" },
  { key: "Heal", science: "Postbiotics", value: 58, color: "var(--icon-orange)" },
]

/** Section 2 — the Food System Score, shown through a clearly-labelled example. */
export function ScoreExample() {
  return (
    <Section tinted>
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
        <div>
          <Kicker>The Food System Score</Kicker>
          <SectionHeading>See the Food System Inside You</SectionHeading>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Every person has an internal food system shaped by food, routine, culture, household,
            environment, and daily life. EatoBiotics helps make those patterns understandable —
            starting with one number you can watch change.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            The score is based on your self-reported food patterns and behaviours. It is an
            educational reflection of how you are feeding your system — not a biological
            measurement, and not a diagnosis.{" "}
            <Link href="/method" className="font-medium text-icon-teal underline underline-offset-2 hover:opacity-80">
              How it works
            </Link>
          </p>
        </div>

        {/* Illustrative score card */}
        <div className="overflow-hidden rounded-3xl bg-white"
          style={{ border: "1px solid rgba(26,46,18,0.10)", boxShadow: "0 8px 40px rgba(26,46,18,0.08)" }}>
          <div className="px-6 py-6 sm:px-7" style={{ background: "linear-gradient(135deg, #1a4a14 0%, #0a5c44 100%)" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Illustrative example — not your data
                </p>
                <p className="mt-1 font-serif text-lg font-bold text-white">Food System Score</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-5xl font-bold leading-none text-icon-lime">64</p>
                <p className="mt-1 text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>/100</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-6 py-6 sm:px-7">
            {EXAMPLE_PILLARS.map((p) => (
              <div key={p.key}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold text-foreground">
                    {p.key} <span className="ml-1 text-xs font-normal text-muted-foreground">({p.science})</span>
                  </span>
                  <span className="font-mono text-sm font-bold text-foreground">{p.value}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full" style={{ background: "rgba(26,46,18,0.07)" }}
                  role="img" aria-label={`${p.key} example value ${p.value} out of 100`}>
                  <div className="h-full rounded-full" style={{ width: `${p.value}%`, background: p.color }} />
                </div>
              </div>
            ))}

            <div className="rounded-2xl px-4 py-3.5" style={{ background: "rgba(168,224,99,0.10)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-icon-teal">Example insight</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                Your food variety is strongest at dinner but drops during the working week.
              </p>
            </div>
            <div className="rounded-2xl px-4 py-3.5" style={{ background: "rgba(245,166,35,0.08)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#a06400" }}>Example action</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                Add one additional plant food to two weekday lunches this week.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
