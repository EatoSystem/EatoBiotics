import Link from "next/link"
import { ArrowRight, Check, Zap } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function MembershipTeaser() {
  return (
    <section className="relative overflow-hidden px-6 py-20 md:py-28">
      <div className="relative mx-auto max-w-[960px]">

        <ScrollReveal>
          <div className="mb-12 text-center">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
              style={{ background: "color-mix(in srgb, var(--icon-lime) 15%, transparent)", color: "var(--icon-green)" }}
            >
              <Zap size={11} /> One clear path
            </div>
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl text-balance">
              €49 report.{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Free 30-day account.
              </span>
            </h2>
            <p className="mt-4 mx-auto max-w-lg text-base text-muted-foreground leading-relaxed">
              Take the free assessment to get your EatoBiotics Score. Then unlock your Personal Report
              for a one-time €49 — and get a free 30-day account to follow your plan.
            </p>
          </div>
        </ScrollReveal>

        {/* Two-column layout */}
        <div className="grid gap-5 sm:grid-cols-2">

          {/* Report card */}
          <ScrollReveal delay={60}>
            <div
              className="relative flex flex-col rounded-3xl border-2 bg-card p-8 shadow-lg"
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
                Personal Report
              </p>
              <p className="mb-1 font-serif text-3xl font-bold text-foreground">
                €49 <span className="text-base font-normal text-muted-foreground">one-time</span>
              </p>
              <p className="mb-5 text-sm text-muted-foreground">
                AI-generated from your assessment. Yours forever.
              </p>
              <ul className="mb-6 flex-1 space-y-2.5">
                {[
                  "Full gut health score breakdown",
                  "Your 30-day gut reset plan",
                  "Top 10 food recommendations",
                  "Weekly shopping framework",
                  "Meal timing guidance",
                  "Free 30-day account included",
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
                Take the free assessment <ArrowRight size={14} />
              </Link>
            </div>
          </ScrollReveal>

          {/* After 30 days card */}
          <ScrollReveal delay={120}>
            <div className="flex flex-col rounded-3xl border bg-card p-8">
              <div
                className="mb-5 h-1 w-full rounded-full"
                style={{ background: "linear-gradient(90deg, var(--icon-teal), var(--icon-green))" }}
              />
              <p
                className="mb-1 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--icon-green)" }}
              >
                After 30 days — optional
              </p>
              <p className="mb-1 font-serif text-3xl font-bold text-foreground">
                €24.99<span className="text-base font-normal text-muted-foreground">/month</span>
              </p>
              <p className="mb-5 text-sm text-muted-foreground">
                Continue your journey. Cancel any time.
              </p>
              <ul className="mb-6 flex-1 space-y-2.5">
                {[
                  "Monthly updated EatoBiotics Score",
                  "New 30-day focus plan each month",
                  "Weekly personalised food guidance",
                  "Monthly progress report",
                  "Ongoing food recommendations",
                  "Priority access to new features",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check size={13} className="mt-0.5 shrink-0" style={{ color: "var(--icon-green)" }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="flex items-center justify-center gap-2 rounded-full border py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted"
              >
                See full details <ArrowRight size={14} />
              </Link>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={220}>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            No subscription required to get started. The report is a one-time purchase.{" "}
            <Link href="/pricing" className="underline underline-offset-4 hover:text-foreground transition-colors">
              Full pricing details →
            </Link>
          </p>
        </ScrollReveal>

      </div>
    </section>
  )
}
