import type { Metadata } from "next"
import Link from "next/link"
import { Leaf, FlaskConical, Sprout, Eye, ShieldCheck, ArrowRight, Utensils, ClipboardList, Flame, Sparkles } from "lucide-react"
import { SCORE_BANDS } from "@/lib/scoring"

export const metadata: Metadata = {
  title: "Our Method — How EatoBiotics Works",
  description:
    "How the Food System Score, the three biotics, and Your Food System actually work — in plain language, with honest limits.",
}

/* The five assessment pillars behind the Food System Score. */
const PILLARS = [
  { key: "diversity", label: "Plant Diversity", blurb: "How many different plants reach your plate — variety is the single strongest food signal for a thriving inner ecosystem." },
  { key: "feeding", label: "Feeding", blurb: "How well your meals feed your resident microbes — fibre-rich wholefoods, legumes, and wholegrains." },
  { key: "adding", label: "Live Foods", blurb: "How often fermented, live-culture foods appear — kefir, live yoghurt, kimchi, sauerkraut." },
  { key: "consistency", label: "Consistency", blurb: "Your rhythm — the same good patterns repeated beat occasional perfection." },
  { key: "feeling", label: "How You Feel", blurb: "Your own signal — energy, comfort and mood day to day. You are part of the data." },
]

const BIOTICS = [
  {
    label: "Prebiotics",
    color: "#A8E063",
    icon: Sprout,
    what: "The feeders — fibres and plant compounds your body can't digest, which travel down to feed your microbes.",
    scored: "Each meal is scored for the variety and quantity of plant fibre it delivers.",
  },
  {
    label: "Probiotics",
    color: "#2DAA6E",
    icon: FlaskConical,
    what: "The living cultures — microbes in fermented foods that join and diversify your inner community.",
    scored: "Each meal is scored for live-culture foods like kefir, yoghurt, kimchi and miso.",
  },
  {
    label: "Postbiotics",
    color: "#F5C518",
    icon: Leaf,
    what: "The output — beneficial compounds well-fed microbes produce, associated with comfort, energy and resilience.",
    scored: "Each meal is scored for how well it supports that production — the follow-through of the first two.",
  },
]

const SIGNALS = [
  { icon: ClipboardList, label: "Your assessment", detail: "The five-pillar baseline — where your Food System starts." },
  { icon: Utensils, label: "Every meal you log", detail: "Analysed for its three-biotic profile and overall score." },
  { icon: Flame, label: "Your daily ritual & streaks", detail: "Rhythm and consistency — the strongest signal of all." },
  { icon: Sparkles, label: "Patterns over time", detail: "Weekday vs weekend shifts, repeat winners, fortnight trends — noticed only when your data genuinely supports them." },
]

function SectionShell({ children, alt = false }: { children: React.ReactNode; alt?: boolean }) {
  return (
    <section className={alt ? "bg-white" : ""} style={alt ? undefined : { background: "linear-gradient(180deg, #FDFBF7 0%, #F4F8EC 100%)" }}>
      <div className="mx-auto max-w-5xl px-5 py-14 md:px-8 md:py-20">{children}</div>
    </section>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--icon-green)" }}>{children}</p>
}

export default function MethodPage() {
  // Low → high for the visual band scale.
  const bands = [...SCORE_BANDS].reverse()

  return (
    <div className="bg-background pt-[57px]">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(175deg, #0B1607 0%, #122208 55%, #16290F 100%)" }}>
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-[400px] w-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(168,224,99,0.14) 0%, transparent 65%)" }} />
          <div className="absolute -right-24 bottom-0 h-[440px] w-[440px] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,170,110,0.16) 0%, transparent 65%)" }} />
        </div>
        <div className="relative mx-auto max-w-5xl px-5 py-16 text-center md:px-8 md:py-24">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: "#A8E063" }}>Our method</p>
          <h1 className="mx-auto mt-3 max-w-3xl font-serif text-3xl font-bold leading-tight md:text-5xl" style={{ color: "#FDFBF7" }}>
            How EatoBiotics works — in plain language.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed md:text-lg" style={{ color: "rgba(253,251,247,0.65)" }}>
            No black box. Here is exactly what your Food System Score measures, how the three
            biotics are scored, what Your Food System learns from — and what we deliberately
            don&apos;t claim.
          </p>
        </div>
      </section>

      {/* ── The Food System Score ── */}
      <SectionShell>
        <Eyebrow>The Food System Score</Eyebrow>
        <h2 className="mt-2 font-serif text-2xl font-bold md:text-3xl" style={{ color: "var(--foreground)" }}>
          One number, five pillars.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed md:text-base" style={{ color: "var(--muted-foreground)" }}>
          Your score (0–100) starts from your assessment across five food-first pillars, then
          moves as your Food System learns from what you actually eat. It measures your <em>food
          patterns</em> — not your body, and not a medical status.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PILLARS.map((p, i) => (
            <div key={p.key} className="rounded-2xl border border-border bg-card p-4" style={{ boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
              <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #4CB648, #2DAA6E)" }}>{i + 1}</span>
              <p className="mt-2.5 text-sm font-bold" style={{ color: "var(--foreground)" }}>{p.label}</p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{p.blurb}</p>
            </div>
          ))}
        </div>

        {/* band scale */}
        <div className="mt-10">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>The score bands</p>
          <div className="flex overflow-hidden rounded-full border border-border">
            {bands.map((b) => (
              <div key={b.label} className="flex-1 px-1 py-2.5 text-center" style={{ background: `color-mix(in srgb, ${b.color} 16%, white)` }}>
                <p className="truncate text-[11px] font-bold" style={{ color: b.color === "var(--muted-foreground)" ? "var(--muted-foreground)" : b.color }}>{b.label}</p>
                <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{b.min}+</p>
              </div>
            ))}
          </div>
        </div>
      </SectionShell>

      {/* ── The three biotics ── */}
      <SectionShell alt>
        <Eyebrow>The three biotics</Eyebrow>
        <h2 className="mt-2 font-serif text-2xl font-bold md:text-3xl" style={{ color: "var(--foreground)" }}>
          Every meal is read three ways.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed md:text-base" style={{ color: "var(--muted-foreground)" }}>
          Decades of well-established nutrition and microbiome science point to the same simple
          triad: feed your microbes, add living cultures, and let them give back. We score every
          meal against all three.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {BIOTICS.map((b) => (
            <div key={b.label} className="rounded-2xl border p-5" style={{ borderColor: `color-mix(in srgb, ${b.color} 40%, transparent)`, background: `color-mix(in srgb, ${b.color} 6%, white)` }}>
              <span className="flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ background: b.color }}>
                <b.icon size={17} />
              </span>
              <p className="mt-3 font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{b.label}</p>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{b.what}</p>
              <p className="mt-2.5 border-t border-border pt-2.5 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                <span className="font-bold">How it&apos;s scored: </span>{b.scored}
              </p>
            </div>
          ))}
        </div>
      </SectionShell>

      {/* ── What your Twin learns from ── */}
      <SectionShell>
        <Eyebrow>Your Food System</Eyebrow>
        <h2 className="mt-2 font-serif text-2xl font-bold md:text-3xl" style={{ color: "var(--foreground)" }}>
          What it learns from — and what it does with it.
        </h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {SIGNALS.map((s) => (
            <div key={s.label} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4" style={{ boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: "color-mix(in srgb, var(--icon-green) 12%, white)", color: "var(--icon-green)" }}>
                <s.icon size={15} />
              </span>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{s.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-start gap-3 rounded-2xl p-4" style={{ background: "color-mix(in srgb, var(--icon-teal) 7%, white)", border: "1px solid color-mix(in srgb, var(--icon-teal) 30%, transparent)" }}>
          <Eye size={15} className="mt-0.5 shrink-0" style={{ color: "var(--icon-teal)" }} />
          <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
            Your Food System combines a deterministic model (the same inputs always produce the same
            score — you can trust the number to be stable) with AI-assisted meal analysis.
            <span className="font-semibold"> Your data powers your Food System — it is never sold and never used for advertising.</span>
          </p>
        </div>
      </SectionShell>

      {/* ── Honest limits ── */}
      <SectionShell alt>
        <Eyebrow>Honest limits</Eyebrow>
        <h2 className="mt-2 font-serif text-2xl font-bold md:text-3xl" style={{ color: "var(--foreground)" }}>
          What we deliberately don&apos;t claim.
        </h2>
        <div className="mt-6 space-y-3 text-sm leading-relaxed md:text-base" style={{ color: "var(--foreground)" }}>
          <p>
            EatoBiotics is an <span className="font-semibold">educational, food-first companion</span>.
            It does not diagnose, treat, or cure any condition, and your scores describe food
            patterns — not your health status. We use careful language (&ldquo;associated
            with&rdquo;, &ldquo;supports&rdquo;) because that is what the evidence honestly allows.
          </p>
          <p>
            If you experience red-flag symptoms — unexplained weight loss, blood in your stool,
            persistent pain, or anything that worries you — please see your GP. No app should sit
            between you and a doctor.
          </p>
        </div>
        <div className="mt-6 flex items-start gap-3 rounded-2xl p-4" style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.3)" }}>
          <ShieldCheck size={15} className="mt-0.5 shrink-0" style={{ color: "var(--icon-orange)" }} />
          <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>
            EatoBiotics provides food-first guidance for general wellbeing and is not medical
            advice. Always consult a qualified healthcare professional about medical concerns.
          </p>
        </div>
      </SectionShell>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(175deg, #10200A 0%, #0B1607 100%)" }}>
        <div className="relative mx-auto max-w-5xl px-5 py-14 text-center md:px-8 md:py-16">
          <h2 className="font-serif text-2xl font-bold md:text-3xl" style={{ color: "#FDFBF7" }}>
            See your own Food System Score.
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm" style={{ color: "rgba(253,251,247,0.6)" }}>
            Two minutes, five pillars, and Your Food System starts learning.
          </p>
          <Link
            href="/assessment"
            className="mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #4CB648, #2DAA6E)", boxShadow: "0 8px 30px rgba(76,182,72,0.4)" }}
          >
            Understand My Food System <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
