import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { SystemDisclaimer } from "@/components/systems/system-disclaimer"
import { PregnancyRedFlags } from "@/components/pregnancy/PregnancyRedFlags"
import { SYSTEMS } from "@/lib/systems"
import { PREGNANCY_SECTIONS } from "@/lib/pregnancy/questions"

const system = SYSTEMS.pregnancy

// Sensitive Life system — kept out of the index until clinical/legal sign-off.
export const metadata: Metadata = {
  title: `${system.productName} | EatoBiotics`,
  description:
    "A food-first, non-diagnostic reflection of your general-wellbeing food patterns during pregnancy — built on your You or Family foundation.",
  robots: { index: false },
}

export default function PregnancyPage() {
  const Icon = system.icon
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-28 pb-16 md:pt-36">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-0 mx-auto h-[420px] max-w-[1100px] opacity-70 blur-3xl"
          style={{ background: `radial-gradient(50% 50% at 50% 40%, color-mix(in srgb, ${system.accent} 16%, transparent), transparent 72%)` }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg" style={{ background: system.gradient }}>
            <Icon size={30} className="text-white" />
          </div>
          <p className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <Sparkles size={12} style={{ color: system.accent }} /> Life System · Food-first
          </p>
          <h1 className="mt-5 text-balance font-serif text-4xl font-bold leading-[1.1] text-foreground sm:text-5xl">
            {system.productName}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            A gentle, food-first reflection of your everyday eating patterns for general wellbeing — never a diagnosis,
            and never a substitute for your midwife or doctor.
          </p>
          <div className="mt-8">
            <Link
              href="/pregnancy/assessment"
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-opacity hover:opacity-90"
            >
              Start the assessment <ArrowRight size={18} />
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">Free · a few minutes · food-first, not medical</p>
          </div>
        </div>
      </section>

      {/* What it looks at */}
      <section className="px-6 pb-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-serif text-2xl font-semibold text-foreground">What it looks at</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
            Five everyday food patterns — no nutrient targets, no trimester rules, just a picture of your week.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PREGNANCY_SECTIONS.map((s) => (
              <div key={s.id} className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-serif text-lg font-semibold text-foreground">{s.title}</h3>
                {s.intro && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.intro}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it fits your one Food System */}
      <section className="px-6 py-14">
        <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-border bg-card p-7">
          <h2 className="font-serif text-xl font-semibold text-foreground">How it fits your one Food System</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Pregnancy isn&apos;t a separate app or a standalone score — it&apos;s a lens on the same living Food System.
            It builds on your <strong className="text-foreground">You</strong> or{" "}
            <strong className="text-foreground">Family</strong> foundation, so you&apos;ll start there first, then layer
            this on for a deeper combined report.
          </p>
          <div className="mt-5">
            <Link href="/assessment" className="inline-flex items-center gap-1.5 text-sm font-semibold text-icon-green underline underline-offset-4 hover:text-icon-teal">
              Begin with You or Family <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="px-6 pb-14">
        <div className="mx-auto max-w-3xl">
          <PregnancyRedFlags />
        </div>
      </section>

      <SystemDisclaimer level="sensitive" />
    </main>
  )
}
