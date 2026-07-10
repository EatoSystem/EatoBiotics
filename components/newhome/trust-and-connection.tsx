import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Kicker, Section } from "./shared"

const COMMITMENTS = [
  "EatoBiotics does not diagnose conditions.",
  "It does not replace medical care.",
  "It does not recommend medication changes.",
  "It does not sell supplements as the solution.",
  "It helps you understand food patterns and practical opportunities.",
  "For medical concerns, always speak to a healthcare professional.",
]

/** Section 9 — trust and safety with real visual weight, then the EatoSystem connection, then the close. */
export function TrustAndConnection() {
  return (
    <>
      <Section>
        <div className="rounded-3xl px-6 py-9 sm:px-10 sm:py-11"
          style={{ border: "2px solid rgba(76,182,72,0.30)", background: "rgba(76,182,72,0.04)" }}>
          <Kicker>Our commitments</Kicker>
          <h2 className="mt-2 font-serif text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            Food-first. Educational. Personal. Non-diagnostic.
          </h2>
          <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {COMMITMENTS.map((c) => (
              <li key={c} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground sm:text-base">
                <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-icon-green" aria-hidden="true" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tinted>
        <div className="mx-auto max-w-3xl text-center">
          <Kicker>Part of something larger</Kicker>
          <h2 className="mt-2 font-serif text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            Understand within. Improve daily. Participate outward.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            EatoBiotics begins by helping you understand and improve the Food System Inside You.
            Over time, responsible participation can help EatoSystem understand where families and
            communities need better food knowledge, access, and support.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            <Link href="/eatosystem" className="font-medium text-icon-teal underline underline-offset-2 hover:opacity-80">
              Learn about EatoSystem
            </Link>
          </p>

          <div className="mt-12">
            <h3 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
              Start with the system inside you.
            </h3>
            <div className="mt-6">
              <Link
                href="/assessment"
                className="brand-gradient inline-flex items-center gap-2.5 rounded-full px-9 py-4.5 text-lg font-semibold text-white shadow-xl shadow-icon-green/25 transition-all hover:opacity-90 hover:shadow-2xl hover:shadow-icon-green/35"
              >
                Get My Food System Score <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Takes about 5 minutes. Educational, food-first, and non-diagnostic.
            </p>
          </div>
        </div>
      </Section>
    </>
  )
}
