import { Kicker, Section, SectionHeading, StatusBadge, type Availability } from "./shared"

type Item = { name: string; note?: string; status?: Availability }

const AVAILABLE: Item[] = [
  { name: "Free Food System Assessment", note: "About 5 minutes, no account required" },
  { name: "Food System Score", note: "With Feed, Seed, and Heal breakdown" },
  { name: "Personalised Food System Report", note: "One-time purchase, yours to keep" },
  { name: "Online report access + PDF download", note: "From your account, whenever you return" },
  { name: "Meal scoring", note: "Describe a plate, see how it feeds your system" },
  { name: "Membership plans", note: "Ongoing tracking and support tiers" },
]

const VERIFY: Item[] = [
  { name: "Report email delivery timing", note: "Code-complete; live delivery depends on production configuration" },
  { name: "Weekly member check-ins", note: "Built and scheduled; live cadence needs production confirmation" },
]

const IN_DEVELOPMENT: Item[] = [
  { name: "Score history over time", note: "Early views exist for members" },
  { name: "Family household features", note: "Shared patterns and household profiles" },
  { name: "Meal Map", note: "Photograph a meal, map it through Feed, Seed, and Heal" },
  { name: "Local food guidance", note: "Early groundwork for local foods and terms" },
]

const DIRECTION: Item[] = [
  { name: "Day-75 retest ritual with before-and-after progress" },
  { name: "One-action weeks", note: "One practical focus at a time" },
  { name: "Country and food-culture adaptation", note: "Deeper localisation" },
  { name: "Responsible participation in the wider EatoSystem" },
]

function ItemList({ items, showBadge }: { items: Item[]; showBadge?: Availability }) {
  return (
    <ul className="mt-4 space-y-3">
      {items.map((it) => (
        <li key={it.name} className="text-sm leading-relaxed">
          <span className="font-semibold text-foreground">{it.name}</span>
          {showBadge && (
            <span className="ml-2 align-middle">
              <StatusBadge status={it.status ?? showBadge} />
            </span>
          )}
          {it.note && <p className="mt-0.5 text-xs text-muted-foreground">{it.note}</p>}
        </li>
      ))}
    </ul>
  )
}

/** Section 5 — what exists today, what is being built, where this is going. */
export function StateOfProduct() {
  return (
    <Section>
      <div className="max-w-3xl">
        <Kicker>Honest by design</Kicker>
        <SectionHeading>What you can use today — and where this is going</SectionHeading>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          EatoBiotics is a young system with a long direction. Here is exactly where it stands.
        </p>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl bg-white px-6 py-6" style={{ border: "1.5px solid rgba(76,182,72,0.35)" }}>
          <StatusBadge status="available" />
          <h3 className="mt-3 font-serif text-xl font-bold text-foreground">Use it today</h3>
          <ItemList items={AVAILABLE} />
          <div className="mt-5 border-t pt-4" style={{ borderColor: "rgba(26,46,18,0.08)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Being confirmed</p>
            <ItemList items={VERIFY} showBadge="verify" />
          </div>
        </div>

        <div className="rounded-3xl bg-white px-6 py-6" style={{ border: "1px solid rgba(245,197,24,0.45)" }}>
          <StatusBadge status="in-development" />
          <h3 className="mt-3 font-serif text-xl font-bold text-foreground">Being built now</h3>
          <ItemList items={IN_DEVELOPMENT} />
        </div>

        <div className="rounded-3xl bg-white px-6 py-6" style={{ border: "1px solid rgba(45,170,110,0.30)" }}>
          <StatusBadge status="direction" />
          <h3 className="mt-3 font-serif text-xl font-bold text-foreground">Where this is going</h3>
          <ItemList items={DIRECTION} />
        </div>
      </div>
    </Section>
  )
}
