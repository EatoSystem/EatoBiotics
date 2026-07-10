import { Kicker, Section, SectionHeading, StatusBadge } from "./shared"

const EATING_STRUCTURES = ["Plate", "Bowl", "Thali", "Tiffin", "Mezze", "Mixed household meals"]

const ADAPTS_TO = [
  "Country", "Culture", "Language", "Budget", "Household", "Dietary pattern",
  "Religious requirements", "Food availability", "Meal structure", "Local terminology",
]

/** Section 8 — global direction. Direction only; nothing here is live. */
export function GlobalDirection() {
  return (
    <Section tinted>
      <div className="max-w-3xl">
        <Kicker>Global by philosophy, local by practice</Kicker>
        <SectionHeading>The science is global. The food is local.</SectionHeading>
        <div className="mt-4">
          <StatusBadge status="direction" />
        </div>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          The Food System Inside You is universal. How you feed it is personal, local, and
          cultural. Kefir and lassi, sauerkraut and kimchi, oats and dal — different foods, same
          Feed, Seed, and Heal. The future EatoBiotics platform is designed to adapt to how people
          actually eat, wherever they are.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl bg-white px-6 py-6" style={{ border: "1px solid rgba(26,46,18,0.10)" }}>
          <h3 className="font-serif text-lg font-bold text-foreground">Designed to adapt to</h3>
          <ul className="mt-4 flex flex-wrap gap-2">
            {ADAPTS_TO.map((a) => (
              <li key={a} className="rounded-full px-3.5 py-1.5 text-sm font-medium text-foreground"
                style={{ background: "rgba(26,46,18,0.05)" }}>
                {a}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl bg-white px-6 py-6" style={{ border: "1px solid rgba(26,46,18,0.10)" }}>
          <h3 className="font-serif text-lg font-bold text-foreground">Every way the world eats</h3>
          <ul className="mt-4 flex flex-wrap gap-2">
            {EATING_STRUCTURES.map((s) => (
              <li key={s} className="rounded-full px-3.5 py-1.5 text-sm font-medium text-white"
                style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            One science, expressed through the meal structures people already use — not a Western
            plate imposed on everyone.
          </p>
        </div>
      </div>
    </Section>
  )
}
