import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getSupabase } from "@/lib/supabase"
import { ScoreRing } from "@/components/assessment/score-ring"
import { WaitlistStatus } from "@/components/waitlist/waitlist-status"
import { resultFromLead } from "@/lib/waitlist-result"
import { ENGINES, type QuickPillar } from "@/lib/quick-assessment"
import { getPercentile } from "@/lib/percentile"

export const dynamic = "force-dynamic"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"
const ENGINE_ORDER: QuickPillar[] = ["prebiotics", "probiotics", "postbiotics"]

async function loadLead(code: string) {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data } = await supabase
    .from("leads")
    .select("name, overall_score, sub_scores, profile_type, share_code")
    .eq("share_code", code)
    .maybeSingle()
  return data
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params
  const lead = await loadLead(code)
  const result = lead ? resultFromLead(lead) : null
  if (!result) {
    return { title: "Your Food System — EatoBiotics", robots: { index: false } }
  }
  const title = `${result.profile.type} · ${result.overall}/100 — Food System Type`
  return {
    title,
    description: `My Food System Type is ${result.profile.type} (${result.overall}/100). What's yours? Discover the living food system inside you in 60 seconds.`,
    robots: { index: false },
    openGraph: {
      title,
      description: "What's your Food System Type? Discover yours in 60 seconds.",
    },
  }
}

export default async function DiscoverResultPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const lead = await loadLead(code)
  const result = lead ? resultFromLead(lead) : null

  if (!result) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-3xl font-bold text-foreground">This result isn&rsquo;t available</h1>
        <p className="mt-3 text-muted-foreground">The link may be incomplete — but you can discover your own food system in 60 seconds.</p>
        <Link href="/enter" className="brand-gradient mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-lg">
          Discover my food system <ArrowRight size={15} />
        </Link>
      </main>
    )
  }

  const { profile, overall, subScores, insights } = result
  const firstName = (lead?.name as string | undefined)?.split(" ")[0]
  const percentile = getPercentile(overall)
  const shareUrl = `${SITE_URL}/discover/${code}`
  const weakest = insights[0]
  const strongest = insights[insights.length - 1]

  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      {/* Hero */}
      <section className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--icon-green)]">
          {firstName ? `${firstName}'s Food System` : "Your Food System"}
        </p>
        <div className="relative mx-auto mt-4 w-fit">
          <div aria-hidden className="pointer-events-none absolute -inset-6 -z-10 rounded-full opacity-70 blur-3xl"
            style={{ background: `radial-gradient(60% 60% at 50% 45%, color-mix(in srgb, ${profile.color} 30%, transparent), transparent 75%)` }} />
          <ScoreRing score={overall} color={profile.color} gradientId="discover-page-ring" className="relative mx-auto h-44 w-44" />
        </div>
        <h1 className="mt-4 font-serif text-4xl font-bold sm:text-5xl" style={{ color: profile.color }}>{profile.type}</h1>
        <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">{profile.tagline} {profile.description}</p>
        <p className="mt-3 text-sm font-semibold text-muted-foreground">Higher than {percentile}% of people with typical eating habits.</p>
      </section>

      {/* Three engines explained */}
      <section className="mt-12">
        <h2 className="mb-5 font-serif text-2xl font-bold text-foreground">Your three engines</h2>
        <div className="space-y-4">
          {ENGINE_ORDER.map((p) => {
            const eng = ENGINES[p]
            const insight = insights.find((i) => i.pillar === p)
            const value = subScores[p] ?? 0
            const copy = insight?.strength ?? insight?.opportunity ?? eng.blurb
            return (
              <div key={p} className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_2px_12px_rgba(26,46,18,0.05)]">
                <div className="h-1.5 w-full" style={{ background: eng.gradient }} />
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: eng.gradient }}>{eng.index}</span>
                      <h3 className="font-serif text-xl font-bold text-foreground">{eng.label}</h3>
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: eng.color }}>{eng.verb}</span>
                    </div>
                    <span className="tabular-nums text-sm font-bold" style={{ color: eng.color }}>{value}/100</span>
                  </div>
                  <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${value}%`, background: eng.gradient }} />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy}</p>
                  {insight?.action && (
                    <p className="mt-3 rounded-2xl px-4 py-3 text-sm leading-relaxed text-foreground/80" style={{ background: `color-mix(in srgb, ${eng.color} 7%, transparent)` }}>
                      <span className="font-semibold" style={{ color: eng.color }}>Try this: </span>{insight.action}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Strongest + biggest opportunity */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--icon-green)]">Strongest engine</p>
          <p className="mt-1 font-serif text-lg font-bold text-foreground">{strongest?.label}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Keep it up — it&rsquo;s doing real work for your gut.</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--icon-orange)]">Biggest opportunity</p>
          <p className="mt-1 font-serif text-lg font-bold text-foreground">{weakest?.label}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">The fastest place to create momentum from here.</p>
        </div>
      </section>

      {/* Skip-the-line + share */}
      <section className="mt-10">
        <WaitlistStatus shareCode={code} shareUrl={shareUrl} profileType={profile.type} overall={overall} />
      </section>

      {/* The advert — what the full report adds */}
      <section className="mt-10 overflow-hidden rounded-[2rem] border border-border bg-card">
        <div className="h-2 w-full brand-gradient" />
        <div className="p-7 text-center sm:p-9">
          <h2 className="font-serif text-2xl font-bold text-foreground">This is just your snapshot</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            At launch, your full EatoBiotics experience turns this into action: your top foods to prioritise,
            easy swaps, a 30-day plan built around your weakest engine, pillar deep-dives, AI meal scoring,
            and recipes — plus your daily Biotics Score™.
          </p>
          <Link href={`/enter?ref=${code}`} className="brand-gradient mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5">
            Join the waitlist for early access <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* CTA — take it yourself */}
      <section className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">Not your result?</p>
        <Link href={`/enter?ref=${code}`} className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--icon-green)] hover:underline">
          Discover your own food system <ArrowRight size={14} />
        </Link>
      </section>
    </main>
  )
}
