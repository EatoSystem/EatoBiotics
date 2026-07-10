import Link from "next/link"
import { ArrowRight } from "lucide-react"

/** /newhome concept hero — locked headline, one primary conversion action. */
export function ConceptHero() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 md:pb-24 md:pt-14">
      {/* Soft brand wash, decorative only */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72"
        style={{ background: "radial-gradient(60% 100% at 50% 0%, rgba(168,224,99,0.14), rgba(255,255,255,0) 70%)" }}
      />
      <div className="relative mx-auto max-w-5xl">
        {/* Internal review marker — not part of the public proposition */}
        <p className="mb-8 inline-flex items-center gap-2 rounded-full border border-dashed px-3 py-1 text-xs font-medium text-muted-foreground"
          style={{ borderColor: "rgba(26,46,18,0.25)" }}>
          <span aria-hidden="true">◦</span> New homepage concept
        </p>

        <div className="max-w-3xl">
          <h1 className="font-serif text-5xl font-bold leading-[1.05] text-foreground sm:text-6xl md:text-7xl">
            The Food System <span className="brand-gradient-text">Inside You</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Your digestion, energy, cravings, gut comfort, mood, daily rhythm, and relationship
            with food are connected. EatoBiotics helps you understand your own food system, see
            how it is being fed, and take practical steps to improve it over time.
          </p>

          <p className="mt-4 text-base font-medium text-foreground">
            Understand the Food System Inside You. Learn how to feed it better. Watch it improve.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/assessment"
              className="brand-gradient inline-flex items-center gap-2.5 rounded-full px-9 py-4.5 text-lg font-semibold text-white shadow-xl shadow-icon-green/25 transition-all hover:opacity-90 hover:shadow-2xl hover:shadow-icon-green/35"
            >
              Get My Food System Score <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a
              href="#journey"
              className="inline-flex items-center gap-2 rounded-full border px-7 py-4 text-base font-semibold text-foreground transition-colors hover:border-icon-teal hover:text-icon-teal"
              style={{ borderColor: "rgba(26,46,18,0.2)" }}
            >
              See How It Works
            </a>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Takes about 5 minutes. Educational, food-first, and non-diagnostic.
          </p>

          <p className="mt-8 text-sm font-medium text-muted-foreground">
            Built on the 3 Biotics — <span className="text-foreground">Prebiotics, Probiotics, and Postbiotics</span>.
          </p>
        </div>
      </div>
    </section>
  )
}
