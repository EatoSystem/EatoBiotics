import Link from "next/link"
import { ArrowRight, Check, ShieldCheck } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function MembershipTeaser() {
  return (
    <section className="relative overflow-hidden px-6 py-20 md:py-28">
      <div className="relative mx-auto max-w-[960px]">

        <ScrollReveal>
          <div className="mb-12 text-center">
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl text-balance">
              Two ways to start
            </h2>
            <p className="mt-4 mx-auto max-w-lg text-base text-muted-foreground leading-relaxed">
              Start with clarity. Continue with a system.
            </p>
          </div>
        </ScrollReveal>

        {/* Two sequential steps */}
        <div className="grid gap-5 sm:grid-cols-2">

          {/* Step 1 — Gut Report */}
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
                Step 1 · Gut Report
              </p>
              <p className="mb-1 font-serif text-3xl font-bold text-foreground">
                €49 <span className="text-base font-normal text-muted-foreground">one-time</span>
              </p>
              <p className="mb-5 text-sm text-muted-foreground">
                Understand what is driving your gut score and get your personalised 30-day action plan.
              </p>
              <ul className="mb-6 flex-1 space-y-2.5">
                {[
                  "See what is driving your gut score",
                  "Get a personalised 30-day action plan",
                  "Know your next best food changes",
                  "Understand your stability, diversity, and recovery scores",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check size={13} className="mt-0.5 shrink-0" style={{ color: "var(--icon-teal)" }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/assessment"
                className="flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))" }}
              >
                Get my Gut Report <ArrowRight size={14} />
              </Link>
            </div>
          </ScrollReveal>

          {/* Step 2 — Membership */}
          <ScrollReveal delay={120}>
            <div
              className="relative flex h-full flex-col rounded-3xl border-2 bg-card p-8 shadow-lg"
              style={{ borderColor: "color-mix(in srgb, var(--icon-green) 50%, transparent)" }}
            >
              <div
                className="mb-5 h-1 w-full rounded-full"
                style={{ background: "linear-gradient(90deg, var(--icon-teal), var(--icon-green))" }}
              />
              <div className="mb-1 flex items-center justify-between gap-2">
                <p
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--icon-green)" }}
                >
                  Step 2 · EatoBiotics Membership
                </p>
                <span
                  className="rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white"
                  style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
                >
                  Best for ongoing improvement
                </span>
              </div>
              <p className="mb-1 font-serif text-3xl font-bold text-foreground">
                €24.99<span className="text-base font-normal text-muted-foreground">/month</span>
              </p>
              <p className="mb-5 text-sm text-muted-foreground">
                Keep improving your score, meals, habits, and food confidence week by week.
              </p>
              <ul className="mb-6 flex-1 space-y-2.5">
                {[
                  "Track your score week by week",
                  "Build better meals with ongoing guidance",
                  "Stay accountable with a simple daily system",
                  "Keep improving after your 30-day plan",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check size={13} className="mt-0.5 shrink-0" style={{ color: "var(--icon-green)" }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
              >
                Join EatoBiotics <ArrowRight size={14} />
              </Link>
              <p className="mt-2.5 text-center text-xs text-muted-foreground">Cancel anytime.</p>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={220}>
          <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs font-medium text-muted-foreground">
            <ShieldCheck size={14} style={{ color: "var(--icon-green)" }} />
            30-day money-back guarantee on the Gut Report.
          </p>
        </ScrollReveal>

      </div>
    </section>
  )
}
