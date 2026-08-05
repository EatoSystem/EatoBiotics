import type { Metadata } from "next"
import Link from "next/link"
import {
  LayoutDashboard, Sprout, TrendingUp, ArrowRight, ArrowUpRight,
  ChefHat, GraduationCap, Repeat, LineChart, ClipboardList, UtensilsCrossed,
  Baby, Backpack, Users, User, Sparkles, Compass, Activity,
} from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { SystemDisclaimer } from "@/components/systems/system-disclaimer"
import { disclaimerFor } from "@/lib/assessment-disclaimers"
import { FamilyHero } from "@/components/family/family-hero"
import { FamilyFramework } from "@/components/family/FamilyFramework"
import { FamilyScoreShowcase } from "@/components/family/FamilyScoreShowcase"

export const metadata: Metadata = {
  title: "The Food System Inside Your Family",
  description:
    "A practical framework any family can follow — one weekly plate, three types of food, and daily habits that build gut health for every person at the table.",
  openGraph: {
    title: "The Food System Inside Your Family | EatoBiotics",
    description:
      "A practical framework any family can follow — one weekly plate, three types of food, and daily habits that build gut health for every person at the table.",
  },
}

const ASSESSMENT_HREF = "/assessment/family"
const FAMILY_GRADIENT = "linear-gradient(135deg, var(--icon-green), var(--icon-teal))"

/* ── Section 3 — The 3 Systems of a Family Food System ──────────────── */
const SYSTEMS = [
  {
    number: "01", title: "Manage", label: "OVERSEE", icon: LayoutDashboard,
    accent: "var(--icon-green)", gradientFrom: "var(--icon-lime)", gradientTo: "var(--icon-green)",
    description: "See every family member's gut health score, track their meal logs, and understand where your family food system stands — all in one place.",
    support: "Scores · Logs · Overview",
  },
  {
    number: "02", title: "Develop", label: "BUILD", icon: Sprout,
    accent: "var(--icon-teal)", gradientFrom: "var(--icon-green)", gradientTo: "var(--icon-teal)",
    description: "Build the weekly plate together. Create food habits that become part of family life — not a short-term fix or another diet that doesn't stick.",
    support: "Plate · Habits · Together",
  },
  {
    number: "03", title: "Evolve", label: "GROW", icon: TrendingUp,
    accent: "var(--icon-orange)", gradientFrom: "var(--icon-yellow)", gradientTo: "var(--icon-orange)",
    description: "As children grow and needs change, the system grows with you. One framework that works at every stage of family life.",
    support: "Adapt · Sustain · Last",
  },
]

/* ── Section 5 — Why Family (contrast cards) ────────────────────────── */
const CONTRASTS = [
  { icon: ChefHat, old: "Instead of cooking three different dinners", neu: "One weekly plate that works for all ages.", accent: "var(--icon-green)" },
  { icon: GraduationCap, old: "Instead of nagging kids about food", neu: "They learn the why by building the plate.", accent: "var(--icon-teal)" },
  { icon: Repeat, old: "Instead of another short-term diet", neu: "Habits that outlast any diet or fix.", accent: "var(--icon-orange)" },
  { icon: LineChart, old: "Instead of guessing how everyone's doing", neu: "Every member gets their own gut health score.", accent: "var(--icon-yellow)" },
]

/* ── Section 6 — Every age, one system (life stages) ────────────────── */
const STAGES = [
  {
    title: "Little ones", subtitle: "Toddlers & pre-school", icon: Baby,
    accent: "var(--icon-lime)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    description: "Build early variety and a love of real food. Smaller portions of the same family plate lay the foundation for a healthy gut for life.",
  },
  {
    title: "School age", subtitle: "Growing & learning", icon: Backpack,
    accent: "var(--icon-green)", gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    description: "Steady energy and focus for the school day. Kids who help build the weekly plate learn why food matters — without the lectures.",
  },
  {
    title: "Teens", subtitle: "Independence & appetite", icon: Users,
    accent: "var(--icon-yellow)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    description: "Bigger appetites and more independence. The same framework gives teens habits and understanding they can carry on their own.",
  },
  {
    title: "Grown-ups", subtitle: "Parents & beyond", icon: User,
    accent: "var(--icon-orange)", gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    description: "The architects of the family food system — and members of it too. One weekly cook covers your own gut health alongside everyone else's.",
  },
]

/* ── Section 7 — How it works (flow + mock card) ────────────────────── */
const FLOW = [
  { step: "01", icon: ClipboardList, label: "Assess", detail: "Each family member answers 15 questions and gets a personalised gut health score." },
  { step: "02", icon: UtensilsCrossed, label: "Build", detail: "Use the EatoBiotics Plate to plan one weekly shop and one weekly cook for the whole family." },
  { step: "03", icon: GraduationCap, label: "Teach", detail: "Kids who build the plate learn why food matters — real food, real habits, no lectures." },
  { step: "04", icon: TrendingUp, label: "Track", detail: "Log meals together, watch scores improve, and build a gut health culture that lasts." },
]

const MOCK_MEMBERS = [
  { label: "You", score: 78, accent: "var(--icon-green)", gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" },
  { label: "Partner", score: 72, accent: "var(--icon-teal)", gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))" },
  { label: "Maya (teen)", score: 64, accent: "var(--icon-yellow)", gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))" },
  { label: "Sam (child)", score: 81, accent: "var(--icon-orange)", gradient: "linear-gradient(90deg, var(--icon-teal), var(--icon-yellow))" },
]

/* ── Section 9 — The 3 Biotics (dark foundation) ────────────────────── */
const BIOTICS = [
  { number: "01", title: "Prebiotics", verb: "Feed", accent: "var(--icon-lime)", gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))", body: "The fibres and compounds in everyday foods that feed your family's gut bacteria — foods kids already know and adults can build every meal around.", examples: ["Oats", "Bananas", "Garlic", "Beans"] },
  { number: "02", title: "Probiotics", verb: "Seed", accent: "var(--icon-green)", gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))", body: "Living microorganisms in fermented foods like yogurt, kefir, and cheese — one of the most powerful ways to diversify gut bacteria at any age.", examples: ["Yogurt", "Kefir", "Cheese", "Kimchi"] },
  { number: "03", title: "Postbiotics", verb: "Regenerate", accent: "var(--icon-teal)", gradient: "linear-gradient(90deg, var(--icon-teal), var(--icon-yellow))", body: "The compounds your family's gut bacteria produce — driving better energy, immunity, mood, and sleep. Feed the system right, and it produces the results.", examples: ["SCFAs", "B vitamins", "Butyrate"] },
]

/* ── Section 10 — Part of EatoBiotics (real sibling programs) ───────── */
const FAMILY_PROGRAMS = [
  { number: "01", name: "Family", icon: Users, tagline: "The Food System Inside Your Family", status: "You're here", here: true, href: null, accent: "var(--icon-green)", gradient: FAMILY_GRADIENT },
  { number: "02", name: "Stability™", icon: Compass, tagline: "The Stability System Inside You", status: "Explore", here: false, href: "/stability", accent: "var(--icon-teal)", gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" },
  { number: "03", name: "Glucose", icon: Activity, tagline: "The Glucose System Inside You", status: "Explore", here: false, href: "/glucose", accent: "var(--icon-orange)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" },
  { number: "04", name: "You", icon: User, tagline: "The Food System Inside You", status: "Explore", here: false, href: "/you", accent: "var(--icon-lime)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" },
]

export default function FamilyPage() {
  return (
    <main className="overflow-hidden bg-white">
      {/* ── 1. HERO ── */}
      <FamilyHero />
      <div style={{ height: "2px", background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />

      {/* ── 2. THE PROBLEM (editorial) ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
            <ScrollReveal>
              <p className="text-xs font-bold uppercase tracking-widest text-icon-green">The Problem</p>
              <h2 className="mt-4 text-pretty font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
                Feeding a family well shouldn&apos;t mean{" "}
                <span className="brand-gradient-text">cooking three dinners.</span>
              </h2>
              <blockquote className="mt-8 border-l-2 pl-6 font-serif text-xl font-medium italic text-foreground" style={{ borderColor: "var(--icon-green)" }}>
                &ldquo;The habits your children build at the table today are habits they can carry for life.&rdquo;
              </blockquote>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <div className="rounded-3xl border border-border bg-secondary/40 p-8 md:p-10">
                <p className="text-base leading-relaxed text-muted-foreground">
                  Different ages, different tastes, different schedules — most families end up with fragmented
                  eating, fussy battles, and a fridge full of compromises.
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  But gut health isn&apos;t built one person at a time. <span className="font-semibold text-foreground">EatoBiotics gives parents one
                  system for the whole household</span> — a weekly plate, three types of food, and a score for every
                  person at the table.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 3. THE 3 SYSTEMS ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-icon-green">The Framework</p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              You&apos;re the architect{" "}
              <span className="brand-gradient-text">of your family&apos;s food system</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              EatoBiotics gives parents the tools to manage, develop, and evolve a food culture at home — one
              that improves every family member&apos;s gut health over time.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {SYSTEMS.map((sys, index) => {
              const Icon = sys.icon
              const bgGradient = `linear-gradient(160deg, color-mix(in srgb, ${sys.accent} 10%, transparent), transparent 60%)`
              return (
                <ScrollReveal key={sys.number} delay={index * 80}>
                  <div
                    className="relative flex h-full flex-col rounded-3xl p-6 transition-shadow hover:shadow-lg"
                    style={{ background: bgGradient, border: `1.5px solid color-mix(in srgb, ${sys.accent} 30%, transparent)`, borderLeft: `4px solid ${sys.accent}` }}
                  >
                    <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: sys.accent }}>{sys.number}</p>
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `color-mix(in srgb, ${sys.accent} 15%, transparent)` }}>
                      <Icon size={20} style={{ color: sys.accent }} />
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-foreground">{sys.title}</h3>
                    <p className="mt-1 text-xs font-bold uppercase tracking-widest" style={{ color: sys.accent }}>{sys.label}</p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{sys.description}</p>
                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">{sys.support}</p>
                    {index < SYSTEMS.length - 1 && (
                      <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 lg:block" style={{ zIndex: 1 }}>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full text-white" style={{ background: `linear-gradient(135deg, ${sys.gradientFrom}, ${sys.gradientTo})` }}>
                          <ArrowRight size={12} />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 4. ONE HOUSEHOLD. ONE FOOD SYSTEM. ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-20">
            <div className="lg:w-[420px] lg:shrink-0">
              <ScrollReveal>
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">The Framework</p>
                <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                  One household.{" "}
                  <span className="brand-gradient-text">One food system.</span>
                </h2>
                <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                  Every family member gets their own gut health score. Together, those scores roll up into one
                  Family Food System Score — a clear picture of how your whole household eats.
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  And your family&apos;s food system contributes to your overall Biotics Score™, the core score of
                  EatoBiotics.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={150}>
                <Link href={ASSESSMENT_HREF} className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-icon-green px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white">
                  Start the family assessment <ArrowUpRight size={14} />
                </Link>
              </ScrollReveal>
            </div>
            <div className="flex-1">
              <ScrollReveal delay={100}><FamilyFramework /></ScrollReveal>
              <ScrollReveal delay={200}>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  A connected system where every member&apos;s score builds one Family Food System Score.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 5. WHY FAMILY ── */}
      <section className="bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-start lg:gap-24">
            <ScrollReveal>
              <p className="text-xs font-bold uppercase tracking-widest text-icon-green">Why Family</p>
              <h2 className="mt-4 text-pretty font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
                Build a food culture, not another diet.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                Diets are individual and short-lived. A family food system is shared and lasting — it improves
                every member&apos;s gut health, energy, and wellbeing over time.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                You don&apos;t cut foods out. You build better habits in — one weekly plate, three types of food,
                understood by everyone at the table.
              </p>
              <blockquote className="mt-8 border-l-2 pl-6 font-serif text-xl font-medium italic text-foreground" style={{ borderColor: "var(--icon-green)" }}>
                &ldquo;Understand the why behind every food — not just the what.&rdquo;
              </blockquote>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="space-y-5">
                {CONTRASTS.map((item, i) => (
                  <div key={i} className="flex gap-5 rounded-2xl border border-border bg-background p-6">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${item.accent} 15%, transparent)` }}>
                      <item.icon size={20} style={{ color: item.accent }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground line-through decoration-muted-foreground/40">{item.old}</p>
                      <p className="mt-1 flex items-center gap-2 font-semibold text-foreground">
                        <ArrowRight size={15} style={{ color: item.accent }} /> {item.neu}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 6. EVERY AGE. ONE SYSTEM. ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-green">Every Stage</p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
              Different ages.
              <br />
              <span className="brand-gradient-text">Different needs.</span>
              <br />
              One family system.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              One weekly plate, adapted for every member. The same framework grows with your family — from
              toddlers to teenagers to adults.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STAGES.map((st, index) => (
              <ScrollReveal key={st.title} delay={index * 100}>
                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-7">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: st.gradient }} />
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${st.accent} 15%, transparent)` }}>
                    <st.icon size={22} style={{ color: st.accent }} />
                  </div>
                  <h3 className="mt-5 font-serif text-xl font-semibold text-foreground">{st.title}</h3>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: st.accent }}>{st.subtitle}</p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{st.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 7. HOW IT WORKS ── */}
      <section id="how-it-works" className="scroll-mt-24 bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-green">The Tool</p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
              One framework.
              <br />
              <span className="brand-gradient-text">Every member.</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              From a first family assessment to a weekly routine everyone can stick to — here&apos;s how
              EatoBiotics works for families.
            </p>
          </ScrollReveal>

          {/* 4-step flow */}
          <div className="mt-14">
            <ScrollReveal delay={100}>
              <div className="grid gap-8 sm:grid-cols-4 sm:gap-0">
                {FLOW.map((item, i) => (
                  <div key={item.step} className="flex items-start gap-3 sm:flex-col sm:gap-2">
                    <div className="flex items-center gap-3 sm:w-full">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: FAMILY_GRADIENT }}>{item.step}</div>
                      {i < FLOW.length - 1 && (
                        <div className="hidden h-px flex-1 sm:block" style={{ background: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))", opacity: 0.3 }} />
                      )}
                    </div>
                    <div className="pt-0.5 sm:pt-3">
                      <item.icon size={20} style={{ color: "var(--icon-green)" }} />
                      <p className="mt-2 text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Mock family card */}
          <ScrollReveal delay={200}>
            <div className="mt-14 overflow-hidden rounded-3xl border border-border bg-background shadow-lg">
              <div className="flex items-center justify-between px-7 py-5" style={{ background: "color-mix(in srgb, var(--icon-green) 6%, var(--background))" }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: FAMILY_GRADIENT }}>
                    <Users size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Family Food System</p>
                    <p className="text-xs text-muted-foreground">4 members · this week</p>
                  </div>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: FAMILY_GRADIENT }}>Example</span>
              </div>
              <div className="px-7 pb-7 pt-6">
                <div className="space-y-5">
                  {MOCK_MEMBERS.map((m) => (
                    <div key={m.label}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{m.label}</span>
                        <span className="text-sm font-bold" style={{ color: m.accent }}>{m.score}/100</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full" style={{ width: `${m.score}%`, background: m.gradient }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-7 flex items-start gap-4 rounded-2xl p-5" style={{ background: "color-mix(in srgb, var(--icon-green) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--icon-green) 25%, transparent)" }}>
                  <Sparkles size={18} style={{ color: "var(--icon-green)", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Build this week around Maya</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Maya&apos;s score has the most room to grow. Plan the weekly plate around a few gut-friendly
                      foods she&apos;ll actually eat, and the whole family&apos;s average lifts with her.
                    </p>
                  </div>
                </div>
                <p className="mt-5 text-center text-xs text-muted-foreground/60">An illustrative example — your own family scores come from the free assessment.</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 8. YOUR FAMILY SCORE ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-icon-green">The Score</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">Your Family Food System Score</h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              A single score for how well your whole household eats — the average of every member&apos;s gut
              health score.
            </p>
            <p className="mt-3 font-semibold text-foreground">Each member&apos;s score contributes to your overall Biotics Score™.</p>
          </ScrollReveal>
          <div className="mt-16">
            <FamilyScoreShowcase />
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 9. THE 3 BIOTICS (dark foundation) ── */}
      <section className="bg-foreground px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-lime">The Food System Inside You</p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-background sm:text-5xl md:text-6xl">
              The same three biotics.
              <br />
              <span className="brand-gradient-text">For every age.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-background/70">
              Your family food system is built on EatoBiotics — The Food System Inside You. The same three
              biotics power gut health from toddlers to grandparents.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <Link href="/biotics" className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-icon-lime px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-icon-lime hover:text-foreground">
              Explore the framework <ArrowUpRight size={14} />
            </Link>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {BIOTICS.map((card, index) => (
              <ScrollReveal key={card.title} delay={index * 100}>
                <div className="relative flex flex-col overflow-hidden rounded-2xl p-7" style={{ background: `color-mix(in srgb, ${card.accent} 8%, var(--foreground))`, border: `1px solid color-mix(in srgb, ${card.accent} 25%, transparent)` }}>
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: card.gradient }} />
                  <span className="font-serif text-4xl font-semibold" style={{ color: card.accent }}>{card.number}</span>
                  <h3 className="mt-4 font-serif text-xl font-semibold text-background">{card.title}</h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-widest" style={{ color: card.accent }}>{card.verb}</p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-background/70">{card.body}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {card.examples.map((ex) => (
                      <span key={ex} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: `color-mix(in srgb, ${card.accent} 18%, transparent)`, color: card.accent }}>{ex}</span>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 10. PART OF EATOBIOTICS (family) ── */}
      <section className="bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-green">The Ecosystem</p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
              Part of
              <br />
              <span className="brand-gradient-text">EatoBiotics.</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Family is one expression of EatoBiotics — the food system inside you. Each program is a new way
              to understand and strengthen it.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FAMILY_PROGRAMS.map((sys, index) => {
              const Card = (
                <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-background p-6 transition-all hover:shadow-lg" style={{ borderColor: sys.here ? `color-mix(in srgb, ${sys.accent} 45%, transparent)` : "var(--border)" }}>
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: sys.gradient }} />
                  <div className="flex items-start justify-between">
                    <span className="font-serif text-5xl font-bold" style={{ color: sys.accent }}>{sys.number}</span>
                    <span className="mt-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ background: sys.gradient }}>{sys.status}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <sys.icon size={18} style={{ color: sys.accent }} />
                    <h3 className="font-serif text-xl font-semibold text-foreground">{sys.name}</h3>
                  </div>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{sys.tagline}</p>
                  {!sys.here && (
                    <span className="mt-5 flex items-center gap-1 text-sm font-semibold opacity-70 transition-opacity group-hover:opacity-100" style={{ color: sys.accent }}>
                      Explore <ArrowUpRight size={14} />
                    </span>
                  )}
                </div>
              )
              return (
                <ScrollReveal key={sys.number} delay={index * 100}>
                  {sys.href ? <Link href={sys.href} className="block h-full">{Card}</Link> : Card}
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 11. FINAL CTA ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[900px]">
          <div className="overflow-hidden rounded-3xl border border-border bg-background">
            <div className="h-1.5 w-full brand-gradient" />
            <div className="p-10 md:p-16 text-center">
              <ScrollReveal>
                <p className="text-xs font-bold uppercase tracking-widest text-icon-green">The Family Mission</p>
                <h2 className="mt-4 text-balance font-serif text-4xl font-semibold text-foreground sm:text-5xl">
                  Build the food system <span className="brand-gradient-text">inside your family.</span>
                </h2>
                <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
                  Start with a free assessment for everyone at the table — and begin building a gut health
                  culture that lasts a lifetime.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={150}>
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <Link href={ASSESSMENT_HREF} className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90 hover:shadow-xl">
                    Start Family Assessment <ArrowRight size={16} />
                  </Link>
                  <Link href="/biotics" className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-semibold text-foreground transition-all hover:border-icon-green hover:text-icon-green">
                    Explore the framework
                  </Link>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Free to start. Each family member gets their own score.</p>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── Medical disclaimer ── */}
      <SystemDisclaimer level="standard" note={disclaimerFor("family")} />
    </main>
  )
}
