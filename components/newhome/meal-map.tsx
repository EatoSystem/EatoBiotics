import { Camera, GitBranch, Sparkles, Lightbulb, CalendarPlus } from "lucide-react"
import { Kicker, Section, StatusBadge } from "./shared"

/*
 * "Meal Map" is a provisional working name for the concept only — keep the
 * name isolated here so it can be changed in one place.
 */
const CONCEPT_NAME = "Meal Map"

const FLOW = [
  { icon: Camera,       text: "Photograph a meal" },
  { icon: GitBranch,    text: "Map it through Feed, Seed, and Heal" },
  { icon: Sparkles,     text: "See one strength" },
  { icon: Lightbulb,    text: "Discover one practical opportunity" },
  { icon: CalendarPlus, text: "Add it to your journey" },
]

/** Section 7 — future signature interaction, presented as concept only. */
export function MealMap() {
  return (
    <Section>
      <div className="max-w-3xl">
        <Kicker>A future signature experience</Kicker>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="font-serif text-3xl font-bold leading-tight text-foreground sm:text-4xl">{CONCEPT_NAME}</h2>
          <StatusBadge status="in-development" />
        </div>
        <p className="mt-4 text-lg font-medium text-foreground">
          See how this meal feeds the system inside you.
        </p>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Today you can describe a plate in words and see how it feeds your system. {CONCEPT_NAME}{" "}
          is where that is going: point your camera at any meal — a plate, a bowl, a thali, a
          tiffin — and see its composition through Feed, Seed, and Heal. No calories, no
          &ldquo;good&rdquo; or &ldquo;bad&rdquo; meals, no judgement — one strength, one
          practical opportunity, and where uncertainty exists, you confirm what&apos;s on the
          plate.
        </p>
      </div>

      <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {FLOW.map((step, i) => {
          const Icon = step.icon
          return (
            <li key={step.text} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 lg:flex-col lg:items-start lg:gap-4 lg:py-5"
              style={{ border: "1px solid rgba(26,46,18,0.10)" }}>
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-icon-teal"
                style={{ background: "rgba(45,170,110,0.10)" }} aria-hidden="true">
                <Icon size={16} />
              </span>
              <p className="text-sm font-medium leading-snug text-foreground">
                <span className="mr-1 font-mono text-xs text-muted-foreground">{i + 1}.</span>
                {step.text}
              </p>
            </li>
          )
        })}
      </ol>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        Concept preview — composition guidance, not medical advice. Image recognition will not
        identify everything perfectly, so you stay in control of what counts.
      </p>
    </Section>
  )
}
