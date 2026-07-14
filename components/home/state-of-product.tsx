import { ScrollReveal } from "@/components/scroll-reveal"
import { Eyebrow, Section, SectionHeading, StatusBadge, type Availability } from "./section-shared"

/**
 * Homepage section — what exists today, what is being built, where this is
 * going. Composed from the existing tinted-card idiom (how-it-works.tsx) and
 * the gradient/tint pill idioms (the-framework.tsx).
 */
type Item = { name: string; note?: string }

const COLUMNS: Array<{ status: Availability; title: string; color: string; items: Item[] }> = [
  {
    status: "available",
    title: "Use it today",
    color: "var(--icon-green)",
    items: [
      { name: "Free Food System Assessment", note: "About 5 minutes, no account required" },
      { name: "Food System Score", note: "With Feed, Seed, and Heal breakdown" },
      { name: "Personalised Food System Report", note: "One-time purchase, yours to keep" },
      { name: "Online report access + PDF download", note: "From your account, whenever you return" },
      { name: "Meal scoring", note: "Describe a plate or photograph a meal, see how it feeds your system" },
      { name: "Membership plans", note: "Ongoing tracking and support tiers" },
      { name: "Weekly member check-ins", note: "An automated weekly summary for members on our ongoing plans" },
    ],
  },
  {
    status: "in-development",
    title: "Being built now",
    color: "var(--icon-yellow)",
    items: [
      { name: "Score history over time", note: "Early views exist for members" },
      { name: "Family household features", note: "A shared Family Food System Score and deeper household guidance — core family accounts are live today" },
      { name: "Local food guidance", note: "Early groundwork for local foods and terms" },
    ],
  },
  {
    status: "direction",
    title: "Where this is going",
    color: "var(--icon-teal)",
    items: [
      { name: "Day-75 retest ritual with before-and-after progress" },
      { name: "One-action weeks", note: "One practical focus at a time" },
      { name: "Country and food-culture adaptation", note: "Deeper localisation" },
      { name: "Responsible participation in the wider EatoSystem" },
    ],
  },
]

function ItemList({ items }: { items: Item[] }) {
  return (
    <ul className="mt-5 space-y-4">
      {items.map((it) => (
        <li key={it.name}>
          <p className="text-sm font-semibold leading-relaxed text-foreground">{it.name}</p>
          {it.note && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{it.note}</p>}
        </li>
      ))}
    </ul>
  )
}

export function StateOfProduct() {
  return (
    <Section>
      <ScrollReveal>
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Eyebrow>Honest By Design</Eyebrow>
          <SectionHeading>
            What you can use today — <span className="brand-gradient-text">and where this is going</span>
          </SectionHeading>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
            EatoBiotics is a young system with a long direction. Here is exactly where it stands.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid gap-6 lg:grid-cols-3">
        {COLUMNS.map((col, i) => (
          <ScrollReveal key={col.title} delay={i * 80}>
            <div
              className="flex h-full flex-col rounded-3xl p-8"
              style={{
                background: `linear-gradient(160deg, color-mix(in srgb, ${col.color} 10%, transparent), transparent 60%)`,
                border: `1.5px solid color-mix(in srgb, ${col.color} 30%, transparent)`,
                borderLeft: `4px solid ${col.color}`,
              }}
            >
              <StatusBadge status={col.status} />
              <h3 className="mt-4 font-serif text-2xl font-semibold text-foreground">{col.title}</h3>
              <ItemList items={col.items} />
            </div>
          </ScrollReveal>
        ))}
      </div>
    </Section>
  )
}
