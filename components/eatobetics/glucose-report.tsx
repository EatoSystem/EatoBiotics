"use client"

/**
 * components/eatobetics/glucose-report.tsx
 *
 * The full EatoBetics Report rendered on assessment completion. Built from a
 * GlucoseResult (lib/glucose-assessment-scoring). Structured as a free preview
 * (score, pillars, energy stability, biggest opportunity) followed by a "Full
 * Report" block (GLP-1 focus, all insights, meal timing, 30-day protocol, key
 * levers) — the boundary is marked so a paywall can gate the full block later.
 * Educational only — not a medical assessment.
 */

import Link from "next/link"
import {
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Salad,
  Clock,
  Dumbbell,
  HeartPulse,
  Syringe,
  Zap,
  Target,
  Trophy,
  Footprints,
  Wheat,
  ListOrdered,
  type LucideIcon,
} from "lucide-react"
import { ScoreRing } from "@/components/assessment/score-ring"
import { GLUCOSE_PILLARS, type GlucosePillarKey } from "@/lib/glucose-assessment-data"
import type { GlucoseResult } from "@/lib/glucose-assessment-scoring"

const ICONS: Record<string, LucideIcon> = { Salad, Clock, Dumbbell, HeartPulse }

const LEVERS = [
  { icon: Wheat, title: "Fibre first", body: "Lead meals with vegetables and fibre to slow absorption." },
  { icon: Dumbbell, title: "Protein & muscle", body: "A palm of protein each meal protects muscle and steadies glucose." },
  { icon: ListOrdered, title: "Food order", body: "Vegetables and protein before starch flattens the curve." },
  { icon: Footprints, title: "Move after meals", body: "A 10-minute walk helps your body handle the glucose." },
]

export function GlucoseReport({ result, onRetake }: { result: GlucoseResult; onRetake: () => void }) {
  const { overall, profile, subScores, energyStability, mealTiming, glp1, insights, weakest, strongest, protocol } = result
  const date = new Date(result.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })

  return (
    <main className="bg-white px-6 pb-24 pt-24">
      <div className="mx-auto max-w-2xl">

        {/* ── Report header ── */}
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>
            <Sparkles size={14} /> EatoBetics Report
          </span>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{date}</span>
        </div>

        {/* ── Score card ── */}
        <div className="relative overflow-hidden rounded-[2rem] border-2 p-8 text-center shadow-2xl" style={{ borderColor: "color-mix(in srgb, var(--icon-orange) 35%, transparent)" }}>
          <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>Your EatoBetics Score</p>
          <div className="mt-6 flex justify-center">
            <ScoreRing score={overall} color={profile.color} gradientId="glucose-report-ring" profileType={profile.type} />
          </div>
          <p className="mt-5 font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>{profile.tagline}</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{profile.description}</p>
        </div>

        {/* ── At-a-glance stats ── */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatTile icon={Zap} label="Energy stability" value={`${energyStability}`} suffix="/100" gradient="linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" />
          <StatTile icon={Clock} label="Meal timing" value={mealTiming.label} gradient="linear-gradient(135deg, var(--icon-green), var(--icon-teal))" />
          <StatTile icon={Trophy} label="Top strength" value={strongest.label} gradient="linear-gradient(135deg, var(--icon-lime), var(--icon-green))" />
        </div>

        {/* ── Pillar breakdown ── */}
        <SectionCard title="Your glucose pillars">
          <div className="space-y-5">
            {(["plate", "rhythm", "strength", "recovery"] as GlucosePillarKey[]).map((key) => {
              const meta = GLUCOSE_PILLARS[key]
              const Icon = ICONS[meta.icon] ?? Salad
              const score = subScores[key]
              return (
                <div key={key}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      <Icon size={15} style={{ color: meta.color }} /> {meta.label}
                    </span>
                    <span className="font-serif text-sm font-bold" style={{ color: meta.color }}>{score}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: meta.gradient }} />
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>

        {/* ── Biggest opportunity ── */}
        <div className="mt-6 overflow-hidden rounded-3xl border-2 p-7 shadow-sm" style={{ borderColor: "color-mix(in srgb, var(--icon-orange) 30%, transparent)", background: "linear-gradient(160deg, #FFFBF2, #FFFFFF)" }}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>
            <Target size={14} /> Your biggest opportunity
          </div>
          <h3 className="mt-3 font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>{weakest.label} — {weakest.score}/100</h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{weakest.opportunity ?? weakest.strength}</p>
          <p className="mt-4 rounded-xl px-4 py-3 text-sm leading-relaxed" style={{ background: "color-mix(in srgb, var(--icon-orange) 10%, white)", color: "var(--foreground)" }}>
            <span className="font-semibold">Start here: </span>{weakest.action}
          </p>
        </div>

        {/* ════ FULL REPORT (gate below here for a future paywall) ════ */}
        <div className="mt-12 flex items-center gap-4">
          <div className="h-px flex-1" style={{ background: "var(--border)" }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>Your Full Report</span>
          <div className="h-px flex-1" style={{ background: "var(--border)" }} />
        </div>

        {/* ── GLP-1 focus (conditional) ── */}
        {glp1 !== "none" && (
          <div className="mt-6 overflow-hidden rounded-3xl border border-[#dbe9cf] p-7" style={{ background: "linear-gradient(160deg, #F1F8EC, #FFFFFF)" }}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
              <Syringe size={20} />
            </div>
            <h3 className="mt-4 font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>
              {glp1 === "active" ? "Your GLP-1 focus" : "Thinking about a GLP-1?"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              {glp1 === "active"
                ? "A smaller appetite is a powerful window — but eating less of the same food can cost you muscle. Make every bite count: prioritise protein first at each meal (aim for a palm-sized portion), keep fibre high for fullness, and add resistance training to protect the muscle that keeps you strong and insulin-sensitive."
                : "If you start a GLP-1, the goal isn't simply to eat less — it's to rebuild your relationship with food. Going in with strong protein, fibre, and resistance-training habits helps you preserve muscle and get far more from the appetite window."}
            </p>
            <p className="mt-4 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              This is general education, not medical advice. Always follow the guidance of the clinician managing your medication.
            </p>
            <Link href="/glucose/glp1" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-75" style={{ color: "var(--icon-green)" }}>
              Open your GLP-1 Companion <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* ── Strength callout ── */}
        <div className="mt-6 rounded-3xl border border-[#dbe9cf] bg-[#f4f8f0] p-7">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
            <Trophy size={14} /> What&apos;s working for you
          </div>
          <h3 className="mt-3 font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{strongest.label} — {strongest.score}/100</h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{strongest.strength ?? strongest.opportunity}</p>
        </div>

        {/* ── Full pillar insights ── */}
        <SectionCard title="Your pillar-by-pillar plan" plain>
          <div className="space-y-4">
            {insights.map((ins) => {
              const Icon = ICONS[ins.icon] ?? Salad
              return (
                <div key={ins.pillar} className="rounded-3xl border border-[#e8efe2] bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: ins.gradient }}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{ins.label}</h4>
                        <span className="font-serif text-base font-bold" style={{ color: ins.color }}>{ins.score}</span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{ins.strength ?? ins.opportunity}</p>
                      <p className="mt-3 rounded-xl px-3 py-2 text-sm leading-relaxed" style={{ background: "color-mix(in srgb, var(--muted) 60%, transparent)", color: "var(--foreground)" }}>
                        <span className="font-semibold">Try this: </span>{ins.action}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>

        {/* ── Meal timing pattern ── */}
        <SectionCard title="Your meal timing pattern">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
              <Clock size={20} />
            </div>
            <div>
              <p className="font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{mealTiming.label}</p>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{mealTiming.description}</p>
            </div>
          </div>
        </SectionCard>

        {/* ── 30-day protocol ── */}
        <SectionCard title="Your personalised 30-day protocol" plain>
          <div className="grid gap-4 sm:grid-cols-2">
            {protocol.map((w) => (
              <div key={w.week} className="rounded-2xl border border-[#e8efe2] bg-white p-6 shadow-sm">
                <span className="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm" style={{ background: w.gradient }}>{w.week}</span>
                <h4 className="mt-3 font-serif text-base font-bold" style={{ color: "var(--foreground)" }}>{w.title}</h4>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{w.body}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── Key levers ── */}
        <SectionCard title="Your key glucose levers">
          <div className="grid gap-3 sm:grid-cols-2">
            {LEVERS.map((l) => (
              <div key={l.title} className="flex items-start gap-3 rounded-2xl bg-secondary/50 p-4">
                <l.icon size={18} className="mt-0.5 shrink-0" style={{ color: "var(--icon-green)" }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{l.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{l.body}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── CTA ── */}
        <div className="mt-8 rounded-[2rem] px-6 py-10 text-center" style={{ background: "linear-gradient(135deg, #14250F 0%, #1A2E12 50%, #2C3A12 100%)" }}>
          <h3 className="font-serif text-2xl font-bold text-white sm:text-3xl text-balance">Keep building your glucose system</h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/75">
            Join early access for meal-by-meal glucose intelligence, weekly check-ins, and a guided version of your 30-day protocol.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/glucose" className="brand-gradient inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90">
              Join early access <ArrowRight size={15} />
            </Link>
            <button onClick={onRetake} className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              <RotateCcw size={14} /> Retake assessment
            </button>
          </div>
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
          <ShieldCheck size={13} /> EatoBetics is educational and does not diagnose, treat, or cure any condition.
        </p>
      </div>
    </main>
  )
}

/* ── Small building blocks ──────────────────────────────────────── */

function StatTile({ icon: Icon, label, value, suffix, gradient }: { icon: LucideIcon; label: string; value: string; suffix?: string; gradient: string }) {
  return (
    <div className="rounded-2xl border border-[#e8efe2] bg-white p-4 shadow-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl text-white" style={{ background: gradient }}>
        <Icon size={16} />
      </div>
      <p className="mt-3 font-serif text-2xl font-bold leading-none" style={{ color: "var(--foreground)" }}>
        {value}{suffix && <span className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>{suffix}</span>}
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</p>
    </div>
  )
}

function SectionCard({ title, children, plain }: { title: string; children: React.ReactNode; plain?: boolean }) {
  if (plain) {
    return (
      <div className="mt-8">
        <h3 className="mb-4 font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{title}</h3>
        {children}
      </div>
    )
  }
  return (
    <div className="mt-6 rounded-3xl border border-[#e8efe2] bg-white p-7 shadow-sm">
      <h3 className="mb-5 font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{title}</h3>
      {children}
    </div>
  )
}
