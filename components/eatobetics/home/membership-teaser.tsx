import Link from "next/link"
import { ArrowRight, Check, Zap } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const ASSESSMENT_HREF = "/eatobetics/assessment"

export function EbMembershipTeaser() {
  return (
    <section className="relative overflow-hidden px-6 py-20 md:py-28">
      <div className="relative mx-auto max-w-[960px]">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ background: "color-mix(in srgb, var(--icon-lime) 15%, transparent)", color: "var(--icon-green)" }}>
              <Zap size={11} /> One clear path
            </div>
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl text-balance">
              Free score.{" "}
              <span style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange), var(--icon-green))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Personal report.
              </span>
            </h2>
            <p className="mt-4 mx-auto max-w-lg text-base text-muted-foreground leading-relaxed">
              Start with the free assessment to get your EatoBetics Score. Then unlock your Personal
              Report and 30-day glucose protocol.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-5 sm:grid-cols-2">
          <ScrollReveal delay={60}>
            <div className="flex flex-col rounded-3xl border bg-card p-8">
              <div className="mb-5 h-1 w-full rounded-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" }} />
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Free Assessment</p>
              <p className="mb-1 font-serif text-3xl font-bold text-foreground">Free</p>
              <p className="mb-5 text-sm text-muted-foreground">Your EatoBetics Score and where to start. No card required.</p>
              <ul className="mb-6 flex-1 space-y-2.5">
                {["EatoBetics Score across 3 pillars", "Your glucose profile", "Your biggest opportunity", "A taste of your 30-day focus"].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check size={13} className="mt-0.5 shrink-0" style={{ color: "var(--icon-green)" }} /> {f}
                  </li>
                ))}
              </ul>
              <Link href={ASSESSMENT_HREF} className="flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg" style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}>
                Take the free assessment <ArrowRight size={14} />
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <div className="relative flex flex-col rounded-3xl border-2 bg-card p-8 shadow-lg" style={{ borderColor: "color-mix(in srgb, var(--icon-orange) 45%, transparent)" }}>
              <div className="mb-5 h-1 w-full rounded-full" style={{ background: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))" }} />
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>Personal Report</p>
              <p className="mb-1 font-serif text-3xl font-bold text-foreground">€49 <span className="text-base font-normal text-muted-foreground">one-time</span></p>
              <p className="mb-5 text-sm text-muted-foreground">Personalised from your assessment. Yours to keep.</p>
              <ul className="mb-6 flex-1 space-y-2.5">
                {["Full glucose profile & energy score", "Your 30-day glucose protocol", "Meal timing & food-order guidance", "Top food swaps for steadier curves", "Meal intelligence tools"].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check size={13} className="mt-0.5 shrink-0" style={{ color: "var(--icon-orange)" }} /> {f}
                  </li>
                ))}
              </ul>
              <Link href={ASSESSMENT_HREF} className="flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg" style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}>
                Start with the assessment <ArrowRight size={14} />
              </Link>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={220}>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            EatoBetics is in early access and actively in development. The free assessment is available now.
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
