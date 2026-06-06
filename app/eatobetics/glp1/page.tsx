import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  Dumbbell,
  Salad,
  Clock,
  Droplets,
  TrendingDown,
  RefreshCw,
  Soup,
  Apple,
  Leaf,
  Check,
  ShieldCheck,
} from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ProteinCalculator } from "@/components/eatobetics/protein-calculator"

export const metadata: Metadata = {
  title: { absolute: "EatoBetics GLP-1 Companion — Keep the Muscle, Build the Habit" },
  description:
    "On Ozempic, Wegovy, or Mounjaro? Losing weight isn't the same as getting healthier. The EatoBetics GLP-1 Companion helps you protect muscle with the right protein, strength, and food habits while your appetite is low.",
  openGraph: {
    title: "EatoBetics GLP-1 Companion — Keep the Muscle, Build the Habit",
    description:
      "Protect muscle and build lasting food habits while you're on a GLP-1. Estimate your protein target and get a glucose- and muscle-smart plan.",
  },
}

const ASSESSMENT_HREF = "/eatobetics/assessment"
const CARD =
  "h-full rounded-3xl border border-black/[0.05] bg-white p-7 shadow-[0_10px_40px_-16px_rgba(26,46,18,0.18)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_-22px_rgba(26,46,18,0.28)]"
const G = {
  green: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  teal: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  amber: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  mix: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
}

const PROBLEMS = [
  { icon: TrendingDown, gradient: G.amber, title: "Muscle goes with the fat", body: "When weight falls fast on low appetite, a large share of what's lost can be muscle — not just fat. Muscle is what keeps you strong, mobile, and metabolically healthy." },
  { icon: RefreshCw, gradient: G.teal, title: "The rebound risk", body: "Less muscle means a lower metabolism, which makes weight easier to regain if the medication stops. Protecting muscle now protects your results later." },
  { icon: Salad, gradient: G.green, title: "Eating less ≠ eating well", body: "A smaller appetite is a powerful window — but eating less of the same food can leave you short on protein, fibre, and nutrients. Every bite has to count." },
]

const FRAMEWORK = [
  { icon: Dumbbell, gradient: G.amber, title: "Protein first", body: "Lead every meal with protein and aim for a steady daily total. It's the single biggest lever for keeping muscle while you lose fat." },
  { icon: Dumbbell, gradient: G.teal, title: "Resistance training", body: "Two to three short strength sessions a week tell your body to hold on to muscle. Even bodyweight or bands count." },
  { icon: Leaf, gradient: G.green, title: "Fibre for fullness", body: "Vegetables, legumes, and wholegrains stretch a small appetite further, steady your glucose, and ease constipation." },
  { icon: Droplets, gradient: G.mix, title: "Hydrate & steady rhythm", body: "Sip through the day and keep meals at regular times. Hydration and rhythm soften side effects and support energy." },
]

const SIDE_EFFECTS = [
  { icon: Soup, title: "Nausea", body: "Smaller, slower meals. Lean on bland, protein-rich options — eggs, yoghurt, chicken, fish. Avoid greasy, very sweet, or heavy meals." },
  { icon: Apple, title: "Early fullness", body: "Eat protein and vegetables first while you have room, and drink between meals rather than during, so liquid doesn't crowd out food." },
  { icon: Leaf, title: "Constipation", body: "Build up fibre gradually, keep fluids high, and move daily. A short walk after meals helps digestion and glucose alike." },
]

const SWAPS = [
  { from: "Tea & toast", to: "Greek yoghurt + berries + nuts", note: "~20g protein, fibre, and fullness instead of a fast carb." },
  { from: "Half-eaten big pasta", to: "Smaller pasta + chicken + side salad", note: "Protein and fibre first so the few bites you manage count." },
  { from: "Skipping lunch", to: "Protein-forward small plate", note: "Even on low appetite, a protein anchor protects muscle." },
]

export default function Glp1CompanionPage() {
  return (
    <main className="overflow-hidden bg-white">
      {/* ── HERO ── */}
      <section className="relative px-6 pt-28 pb-16 md:pt-32 md:pb-20">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[440px]" style={{ background: "radial-gradient(60% 70% at 50% 0%, color-mix(in srgb, var(--icon-yellow) 16%, transparent), color-mix(in srgb, var(--icon-green) 8%, transparent) 50%, transparent 75%)" }} />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
              <Sparkles size={14} style={{ color: "var(--icon-yellow)" }} /> EatoBetics · GLP-1 Companion
            </span>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-[1.08] text-balance sm:text-5xl lg:text-6xl">
              <span style={{ color: "var(--foreground)" }}>Keep the </span>
              <span style={{ background: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>muscle.</span>
              <span style={{ color: "var(--foreground)" }}> Build the </span>
              <span style={{ color: "var(--icon-green)" }}>habit.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              On Ozempic, Wegovy, or Mounjaro? Losing weight isn&apos;t the same as getting
              healthier. EatoBetics helps you protect muscle and rebuild your relationship
              with food while your appetite is low — so the results last.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={ASSESSMENT_HREF} className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90 hover:shadow-xl">
                Take the free assessment <ArrowRight size={16} />
              </Link>
              <a href="#calculator" className="text-sm font-medium underline underline-offset-4 transition-colors" style={{ color: "var(--muted-foreground)" }}>
                Estimate your protein target
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div style={{ height: "2px", background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />

      {/* ── PROBLEM ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>The Hidden Cost</p>
            <h2 className="font-serif text-3xl font-bold leading-tight text-balance sm:text-4xl lg:text-5xl" style={{ color: "var(--foreground)" }}>
              The scale goes down. But what are you losing?
            </h2>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              GLP-1 medications are remarkable tools. But rapid weight loss on a low
              appetite can quietly cost you muscle — and that&apos;s the part you most
              want to keep.
            </p>
          </ScrollReveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {PROBLEMS.map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 80}>
                <div className={CARD}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: p.gradient }}>
                    <p.icon size={22} />
                  </div>
                  <h3 className="mt-5 font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{p.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CALCULATOR ── */}
      <section id="calculator" className="scroll-mt-24 px-6 py-24 md:py-32" style={{ background: "linear-gradient(180deg, #F4F9EF 0%, #FFFFFF 100%)" }}>
        <div className="mx-auto max-w-[900px]">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Your Protein Target</p>
            <h2 className="font-serif text-3xl font-bold leading-tight text-balance sm:text-4xl" style={{ color: "var(--foreground)" }}>
              How much protein do you actually need?
            </h2>
            <p className="mt-5 text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              Protein is your number-one muscle-protecting lever on a GLP-1. Get a quick,
              personalised estimate — then aim to hit it across your meals.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="mt-12">
              <ProteinCalculator />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FRAMEWORK ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>The Companion Framework</p>
            <h2 className="font-serif text-3xl font-bold leading-tight text-balance sm:text-4xl lg:text-5xl" style={{ color: "var(--foreground)" }}>
              Four habits that protect your results
            </h2>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              Make the appetite window work for you — not against you.
            </p>
          </ScrollReveal>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {FRAMEWORK.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 80}>
                <div className={CARD}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: f.gradient }}>
                    <f.icon size={22} />
                  </div>
                  <span className="mt-4 block font-serif text-3xl font-bold" style={{ color: "color-mix(in srgb, var(--icon-green) 35%, transparent)" }}>0{i + 1}</span>
                  <h3 className="mt-1 font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{f.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── IN-APP TRACKER (monetised) ── */}
      <section className="px-6 pb-4">
        <div className="relative mx-auto max-w-[1100px] overflow-hidden rounded-[2.5rem] border border-[#e3ecd9] p-8 shadow-[0_18px_60px_-26px_rgba(26,46,18,0.3)] md:p-12" style={{ background: "linear-gradient(150deg, #F4F9EF 0%, #FFFFFF 55%, #FBF6EA 100%)" }}>
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-50 blur-3xl" style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--icon-green) 22%, transparent), transparent 70%)" }} />
          <div className="relative z-10 grid gap-8 md:grid-cols-2 md:items-center">
            <ScrollReveal>
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest" style={{ borderColor: "var(--border)", color: "var(--icon-orange)" }}>
                <Sparkles size={13} /> Included with membership
              </span>
              <h2 className="mt-4 font-serif text-3xl font-bold leading-tight text-balance sm:text-4xl" style={{ color: "var(--foreground)" }}>
                Track it daily in your Companion
              </h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                The free calculator gives you the target. Members get the full GLP-1 Companion:
                log your protein against it each day, track weight and strength sessions, and
                watch your muscle-protecting streak build week to week.
              </p>
              <ul className="mt-5 space-y-2.5">
                {[
                  "Daily protein target with a live progress ring",
                  "Weight trend & strength-session tracking",
                  "Weekly summary of the days you protected muscle",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--foreground)" }}>
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white" style={{ background: "var(--icon-green)" }}><Check size={12} /></span>
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/account/glp1" className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
                  Open your Companion <ArrowRight size={15} />
                </Link>
                <Link href="/pricing?feature=glp1-companion" className="inline-flex items-center justify-center gap-2 rounded-full border px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-black/[0.03]" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                  See membership
                </Link>
              </div>
            </ScrollReveal>

            {/* Tracker preview */}
            <ScrollReveal delay={120}>
              <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_14px_50px_-22px_rgba(26,46,18,0.35)]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
                  <Dumbbell size={14} /> Today
                </div>
                <div className="mt-4 flex items-center justify-center">
                  <div className="relative">
                    <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#eef1ea" strokeWidth="10" />
                      <circle cx="60" cy="60" r="52" fill="none" stroke="var(--icon-green)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${0.82 * 2 * Math.PI * 52} ${2 * Math.PI * 52}`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-serif text-3xl font-bold" style={{ color: "var(--foreground)" }}>128</span>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>of 156 g</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  {[["5/6", "Days hit"], ["3", "Sessions"], ["142g", "Avg/day"]].map(([v, l]) => (
                    <div key={l} className="rounded-2xl bg-[#f4f8f0] p-3">
                      <div className="font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{v}</div>
                      <div className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── SIDE EFFECTS ── */}
      <section className="px-6 py-24 md:py-32" style={{ background: "#f4f8f0" }}>
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Eat Through The Side Effects</p>
            <h2 className="font-serif text-3xl font-bold leading-tight text-balance sm:text-4xl lg:text-5xl" style={{ color: "var(--foreground)" }}>
              Food that works with the medication
            </h2>
          </ScrollReveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {SIDE_EFFECTS.map((s, i) => (
              <ScrollReveal key={s.title} delay={i * 80}>
                <div className="h-full rounded-3xl border border-[#e1ead8] bg-white p-7 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: G.teal }}>
                    <s.icon size={20} />
                  </div>
                  <h3 className="mt-4 font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{s.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAKE EVERY BITE COUNT ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1000px]">
          <ScrollReveal className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>Make Every Bite Count</p>
            <h2 className="font-serif text-3xl font-bold leading-tight text-balance sm:text-4xl" style={{ color: "var(--foreground)" }}>
              Small swaps, big difference
            </h2>
          </ScrollReveal>
          <div className="mt-14 space-y-4">
            {SWAPS.map((s, i) => (
              <ScrollReveal key={i} delay={i * 70}>
                <div className="grid items-center gap-4 rounded-3xl border border-black/[0.05] bg-white p-6 shadow-sm sm:grid-cols-[1fr_auto_1fr]">
                  <div className="rounded-2xl bg-[#fdf8ef] p-4">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--icon-orange)" }}>Instead of</span>
                    <p className="mt-1 font-semibold" style={{ color: "var(--foreground)" }}>{s.from}</p>
                  </div>
                  <div aria-hidden className="mx-auto hidden h-9 w-9 items-center justify-center rounded-full text-white shadow sm:flex" style={{ background: "linear-gradient(135deg, var(--icon-orange), var(--icon-green))" }}>
                    <ArrowRight size={16} />
                  </div>
                  <div className="rounded-2xl bg-[#f1f8ec] p-4">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--icon-green)" }}>Try</span>
                    <p className="mt-1 font-semibold" style={{ color: "var(--foreground)" }}>{s.to}</p>
                    <p className="mt-1 flex items-start gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}><Check size={13} className="mt-0.5 shrink-0" style={{ color: "var(--icon-green)" }} /> {s.note}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-8">
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[2.5rem] px-6 py-20 text-center md:py-28" style={{ background: "linear-gradient(135deg, #14250F 0%, #1A2E12 45%, #2C3A12 100%)" }}>
          <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, var(--icon-green), transparent 70%)" }} />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, var(--icon-yellow), transparent 70%)" }} />
          <div aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />
          <div className="relative z-10">
            <ScrollReveal>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-lime)" }}>Start today</p>
              <h2 className="mx-auto max-w-2xl font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl text-balance">
                Make the most of your{" "}
                <span style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-yellow))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>appetite window.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                Take the free EatoBetics assessment — it tailors your report and 30-day
                protocol for protecting muscle while you&apos;re on a GLP-1.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href={ASSESSMENT_HREF} className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-xl shadow-black/30 transition-all hover:opacity-90">
                  Take the free assessment <ArrowRight size={16} />
                </Link>
                <Link href="/eatobetics" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-white/10">
                  About EatoBetics
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── DISCLAIMER ── */}
      <section className="px-6 py-12" style={{ background: "#f7f7f5" }}>
        <div className="mx-auto flex max-w-3xl items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            EatoBetics is an educational food intelligence platform and is not affiliated with
            any medication or manufacturer. It does not diagnose, treat, cure, or prevent any
            condition, and does not provide medical or dietetic advice. GLP-1 medications should
            only be started, changed, or stopped under the care of a qualified healthcare
            professional. Protein and nutrition needs are individual — always follow the guidance
            of the clinician or dietitian managing your care, especially regarding muscle, kidney
            health, and any existing conditions.
          </p>
        </div>
      </section>
    </main>
  )
}
