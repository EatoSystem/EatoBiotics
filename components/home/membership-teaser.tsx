import Link from "next/link"
import { ArrowRight, Check, ShieldCheck } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { REPORT_OFFER_FEATURES, REPORT_PRICE_EUR } from "@/lib/report/offer"
import { MEMBER_PRICE_EUR } from "@/lib/membership-tiers"

export function MembershipTeaser() {
  return (
    <section className="relative overflow-hidden px-6 py-20 md:py-28">
      <div className="relative mx-auto max-w-[960px]">

        <ScrollReveal>
          <div className="mb-12 text-center">
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl text-balance">
              Where it goes from here
            </h2>
            <p className="mt-4 mx-auto max-w-lg text-base text-muted-foreground leading-relaxed">
              Step 1 is your free Food System Assessment — it produces your Biotics Score™.
              These are the two steps after it.
            </p>
          </div>
        </ScrollReveal>

        {/* Two sequential steps */}
        <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:gap-7">

          {/* Step 2 — the €49 Consultation (step 1 is the free Assessment, named above) */}
          <ScrollReveal delay={60}>
            <div
              className="relative flex h-full flex-col rounded-3xl border-2 bg-card p-8 shadow-lg"
              style={{ borderColor: "color-mix(in srgb, var(--icon-teal) 50%, transparent)" }}
            >
              <div
                className="mb-5 h-1 w-full rounded-full"
                style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-teal))" }}
              />
              <p
                className="mb-1 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--icon-teal)" }}
              >
                Step 2 · Personal Food System Consultation
              </p>
              <p className="mb-1 font-serif text-3xl font-bold text-foreground">
                €{REPORT_PRICE_EUR} <span className="text-base font-normal text-muted-foreground">one-time</span>
              </p>
              <p className="mb-5 text-sm text-muted-foreground">
Understand how your Food System works. The Consultation produces your Personal Food System Report, and includes 30 days of EatoBiotics access.
              </p>
              <ul className="mb-6 flex-1 space-y-2.5">
                {/* A prefix of the shared offer, not a list of its own. The homepage
                    card has room for four lines where /pricing has room for seven,
                    and a prefix can only under-sell — the failure this shared list
                    exists to stop is copy that promises what the report does not
                    contain, which no prefix can do. The line it replaces —
                    "Understand your stability, diversity, and recovery scores" —
                    named three scores the €49 report does not produce. */}
                {REPORT_OFFER_FEATURES.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check size={13} className="mt-0.5 shrink-0" style={{ color: "var(--icon-teal)" }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/assessment"
                /* text-center + a horizontal pad: "Begin my Food System
                 * Consultation" wraps to two lines in this card at 390px, and
                 * without centring the wrapped lines sit left of the arrow.
                 * Measured at 390px, not guessed. */
                className="flex items-center justify-center gap-2 rounded-full px-5 py-4 text-center text-base font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))" }}
              >
                Begin my Food System Consultation <ArrowRight size={16} className="shrink-0" />
              </Link>
            </div>
          </ScrollReveal>

          {/* Step 3 — Member (elevated, ongoing system) */}
          <ScrollReveal delay={120}>
            <div
              className="relative flex h-full flex-col rounded-3xl border-2 p-8 pt-9 shadow-2xl"
              style={{
                borderColor: "color-mix(in srgb, var(--icon-green) 60%, transparent)",
                background: "linear-gradient(170deg, color-mix(in srgb, var(--icon-green) 7%, var(--card)) 0%, var(--card) 55%)",
              }}
            >
              {/* Prominent floating badge */}
              <span
                className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-md"
                style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
              >
                Best for ongoing improvement
              </span>
              <div
                className="mb-5 h-1 w-full rounded-full"
                style={{ background: "linear-gradient(90deg, var(--icon-teal), var(--icon-green))" }}
              />
              <p
                className="mb-1 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--icon-green)" }}
              >
                Step 3 · EatoBiotics Member
              </p>
              <p className="mb-1 font-serif text-3xl font-bold text-foreground">
                €{MEMBER_PRICE_EUR}<span className="text-base font-normal text-muted-foreground">/month</span>
              </p>
              <p className="mb-5 text-sm text-muted-foreground">
Keep building your Food System after your 30 days — score, meals and habits, week by week.
              </p>
              <ul className="mb-6 flex-1 space-y-2.5">
                {[
                  "Track your score week by week",
                  "Build better meals with ongoing guidance",
                  "Stay accountable with a simple daily system",
                  "Keep going after your included 30 days",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check size={13} className="mt-0.5 shrink-0" style={{ color: "var(--icon-green)" }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="flex items-center justify-center gap-2 rounded-full py-4 text-base font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
              >
                Join EatoBiotics <ArrowRight size={16} />
              </Link>
              <p className="mt-2.5 text-center text-xs text-muted-foreground">Cancel anytime.</p>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={220}>
          <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs font-medium text-muted-foreground">
            <ShieldCheck size={14} style={{ color: "var(--icon-green)" }} />
            30-day money-back guarantee on the Personal Food System Consultation.
          </p>
        </ScrollReveal>

      </div>
    </section>
  )
}
