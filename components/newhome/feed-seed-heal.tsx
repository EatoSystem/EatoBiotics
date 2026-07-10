import { Kicker, Section, SectionHeading } from "./shared"

const PILLARS = [
  {
    key: "Feed",
    color: "var(--icon-green)",
    wash: "rgba(76,182,72,0.08)",
    line: "Feed the system with diverse, fibre-rich foods.",
    detail:
      "Vegetables, fruits, whole grains, legumes, nuts, and seeds give the system inside you the raw material it runs on. Variety matters as much as quantity.",
    science: "Prebiotics",
    scienceLine: "The fibres and plant compounds that nourish your gut's beneficial residents.",
  },
  {
    key: "Seed",
    color: "var(--icon-teal)",
    wash: "rgba(45,170,110,0.08)",
    line: "Support beneficial living cultures through appropriate fermented foods and food patterns.",
    detail:
      "Yoghurt with live cultures, kefir, kimchi, sauerkraut, lassi, miso — every food culture has its own living foods. Small, regular amounts count.",
    science: "Probiotics",
    scienceLine: "The living cultures found in fermented foods.",
  },
  {
    key: "Heal",
    color: "var(--icon-orange)",
    wash: "rgba(245,166,35,0.08)",
    line: "Support the environment, routines, and interactions that allow the internal food system to function well.",
    detail:
      "Meal rhythm, eating pace, rest, and the overall pattern of your days shape what your food system can do with what you feed it. No single food does this on its own.",
    science: "Postbiotics",
    scienceLine: "The beneficial outcomes your system produces when it is fed and supported well.",
  },
]

/** Section 3 — accessible language first, scientific foundation beneath. */
export function FeedSeedHeal() {
  return (
    <Section>
      <div className="max-w-3xl">
        <Kicker>The foundation</Kicker>
        <SectionHeading>Feed. Seed. Heal.</SectionHeading>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Three everyday words, built on the 3 Biotics — Prebiotics, Probiotics, and Postbiotics.
          The everyday language is how you act; the science is why it works.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {PILLARS.map((p) => (
          <div key={p.key} className="flex flex-col overflow-hidden rounded-3xl bg-white"
            style={{ border: "1px solid rgba(26,46,18,0.10)", boxShadow: "0 4px 24px rgba(26,46,18,0.05)" }}>
            <div className="px-6 pb-5 pt-6" style={{ background: p.wash }}>
              <div className="h-1 w-10 rounded-full" style={{ background: p.color }} aria-hidden="true" />
              <h3 className="mt-4 font-serif text-2xl font-bold text-foreground">{p.key}</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">{p.line}</p>
            </div>
            <div className="flex flex-1 flex-col px-6 py-5">
              <p className="text-sm leading-relaxed text-muted-foreground">{p.detail}</p>
              <div className="mt-auto pt-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Scientific foundation
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{p.science}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{p.scienceLine}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
