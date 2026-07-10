import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Kicker, Section, SectionHeading, StatusBadge } from "./shared"

const PATHWAYS = [
  {
    name: "Stability",
    color: "var(--icon-green)",
    line: "Support greater digestive comfort, predictability, and confidence.",
  },
  {
    name: "Glucose",
    color: "var(--icon-teal)",
    line: "Support steadier energy, cravings, and food rhythm.",
  },
  {
    name: "Mind",
    color: "var(--icon-yellow)",
    line: "Explore the relationship between food, gut, mood, focus, and daily clarity.",
  },
  {
    name: "Performance",
    color: "var(--icon-orange)",
    line: "Support energy, recovery, strength, and output through better food patterns.",
  },
]

/** Section 6 — You first, Family next, deeper pathways on the shared foundation. */
export function Pathways() {
  return (
    <Section tinted>
      <div className="max-w-3xl">
        <Kicker>One connected system</Kicker>
        <SectionHeading>Begin with you</SectionHeading>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Everything in EatoBiotics builds on one foundation: your own Food System Score. Establish
          it once, and every deeper pathway starts from what you have already shared — you are
          never asked to repeat the complete foundation assessment.
        </p>
        <Link
          href="/assessment"
          className="mt-6 inline-flex items-center gap-2 rounded-full border-2 px-6 py-3 text-sm font-semibold text-icon-teal transition-colors hover:bg-icon-teal hover:text-white"
          style={{ borderColor: "var(--icon-teal)" }}
        >
          Get My Food System Score <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      {/* Family */}
      <div className="mt-12 overflow-hidden rounded-3xl"
        style={{ border: "1px solid rgba(26,46,18,0.10)", background: "linear-gradient(135deg, #1a4a14 0%, #0a5c44 100%)" }}>
        <div className="px-6 py-8 sm:px-9 sm:py-10">
          <StatusBadge status="in-development" />
          <h3 className="mt-4 font-serif text-3xl font-bold text-white sm:text-4xl">
            Your family has a food system too.
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: "rgba(255,255,255,0.75)" }}>
            A household eats together, shops together, and builds habits together. Family is
            EatoBiotics&apos; next major expansion — adult household profiles first, with shared
            household food patterns, a Family Food System Score, one shared weekly action, and
            practical household meal and shopping guidance.
          </p>
          <p className="mt-3 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
            Household features are being built adult-first. Child-specific profiles are not live.
          </p>
        </div>
      </div>

      {/* Deeper pathways */}
      <div className="mt-12">
        <h3 className="font-serif text-2xl font-bold text-foreground">Go deeper where it matters to you</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Four pathways, all part of EatoBiotics, all building on your You or Family foundation.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {PATHWAYS.map((p) => (
            <div key={p.name} className="rounded-3xl bg-white px-6 py-5"
              style={{ border: "1px solid rgba(26,46,18,0.10)" }}>
              <div className="h-1 w-8 rounded-full" style={{ background: p.color }} aria-hidden="true" />
              <h4 className="mt-3 font-serif text-xl font-bold text-foreground">{p.name}</h4>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.line}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
