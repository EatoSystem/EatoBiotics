import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { SystemDisclaimer } from "@/components/systems/system-disclaimer"
import type { SystemDef } from "@/lib/systems"

/**
 * A premium, templated landing for a scaffold system (Health: Recovery,
 * Longevity · Life: Pregnancy, Birth, Baby). Education-only — no assessment,
 * scoring, tracking, or data capture. Every non-foundation system inherits from
 * a You or Family foundation, which the page states plainly.
 *
 * CTA differs by family: Health scaffolds point to the foundation assessment;
 * Life systems offer a soft "notify me" to the existing waitlist (no new
 * capture). Life pages always render the sensitive safety copy.
 */
export function SystemLanding({ system }: { system: SystemDef }) {
  const Icon = system.icon
  const isLife = system.family === "life"
  const cta = isLife
    ? { label: "Notify me when it's ready", href: "/waitlist" }
    : { label: "Start with your foundation", href: "/assessment" }

  return (
    <>
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
            <Sparkles size={12} style={{ color: system.accent }} /> {system.family === "life" ? "Life System" : "Health System"} · Coming soon
          </p>
          <h1 className="mt-5 text-balance font-serif text-4xl font-bold leading-[1.1] text-foreground sm:text-5xl">
            {system.productName}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">{system.tagline}</p>
          <div className="mt-8">
            <Link
              href={cta.href}
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-opacity hover:opacity-90"
            >
              {cta.label} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Focus + how it fits your one Food System */}
      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-border bg-card p-7">
            <h2 className="font-serif text-xl font-semibold text-foreground">What it focuses on</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{system.focus}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{system.description}</p>
          </div>
          <div className="rounded-[1.5rem] border border-border bg-card p-7">
            <h2 className="font-serif text-xl font-semibold text-foreground">How it fits your one Food System</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {system.label} isn&apos;t a separate app or a standalone score — it&apos;s a lens on the same
              living Food System. It builds on your <strong className="text-foreground">You</strong> or{" "}
              <strong className="text-foreground">Family</strong> foundation, so everything you already
              know about your food patterns carries straight through.
            </p>
            <div
              className="mt-5 flex items-start gap-2.5 rounded-2xl p-4 text-sm leading-relaxed"
              style={{ background: `color-mix(in srgb, ${system.accent} 8%, transparent)`, color: "var(--foreground)" }}
            >
              <Sparkles size={16} className="mt-0.5 shrink-0" style={{ color: system.accent }} />
              <span>
                Every system starts from a foundation.{" "}
                <Link href="/assessment" className="font-semibold underline underline-offset-2" style={{ color: system.accent }}>
                  Begin with You or Family
                </Link>{" "}
                to lay the groundwork.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Safety — standard for Health, sensitive for Life */}
      <SystemDisclaimer level={system.safetyLevel} />
    </>
  )
}
