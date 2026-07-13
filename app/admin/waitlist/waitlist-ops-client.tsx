"use client"

/**
 * app/admin/waitlist/waitlist-ops-client.tsx
 *
 * Pre-launch waitlist ops view: at-a-glance growth + conversion for the viral
 * funnel (signups, quiz-completion, referrals credited, founding unlocks),
 * signups by country, segmentation breakdowns, the referral leaderboard, and a
 * recent-signups table. DB-backed (the committed funnel); anonymous drop-off
 * lives in PostHog.
 */

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Users, CheckCircle2, Share2, Trophy, Globe, ArrowLeft, LogOut } from "lucide-react"
import { StatCard, ScoreBadge, timeAgo } from "../admin-ui"
import { pct, type DailyCount } from "@/lib/admin-stats"
import type { CountryRank } from "@/lib/market"

type Referrer = {
  name: string | null
  email: string
  country: string | null
  referral_count: number | null
  reward_code: string | null
}

type RecentSignup = {
  name: string | null
  email: string
  country: string | null
  overall_score: number | null
  profile_type: string | null
  created_at: string
}

type WaitlistStats = {
  total: number
  completed: number
  unlocked: number
  totalReferrals: number
  countries: CountryRank[]
  profileTypes: Record<string, number>
  diets: Record<string, number>
  goals: Record<string, number>
  challenges: Record<string, number>
  leaders: Referrer[]
  recent: RecentSignup[]
  daily: DailyCount[]
}

const BAR_COLORS = [
  "var(--icon-green)",
  "var(--icon-teal)",
  "var(--icon-lime)",
  "var(--icon-yellow)",
  "var(--icon-orange)",
]

function Breakdown({ title, data, color = "var(--icon-teal)" }: { title: string; data: Record<string, number>; color?: string }) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1])
  const total = sorted.reduce((s, [, n]) => s + n, 0)
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">{title}</h2>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data yet</p>
      ) : (
        <div className="space-y-3">
          {sorted.map(([key, count], i) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium truncate capitalize">{key.replace(/_/g, " ")}</span>
                <span className="text-sm text-muted-foreground tabular-nums ml-2">
                  {count} <span className="text-xs">({pct(count, total)}%)</span>
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-border/60">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: `${pct(count, total)}%`, background: color === "rotate" ? BAR_COLORS[i % BAR_COLORS.length] : color }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function WaitlistOpsClient({ stats }: { stats: WaitlistStats }) {
  const [signingOut, setSigningOut] = useState(false)
  const completionRate = pct(stats.completed, stats.total)
  const maxDaily = Math.max(1, ...stats.daily.map((d) => d.count))
  const maxCountry = stats.countries[0]?.count || 1

  async function handleSignOut() {
    setSigningOut(true)
    await fetch("/api/admin/logout", { method: "POST" })
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Image src="/eatobiotics-icon.webp" alt="EatoBiotics" width={30} height={30} className="h-7.5 w-7.5" />
            <span className="font-serif text-lg font-semibold text-foreground">EatoBiotics</span>
            <span className="rounded-full bg-[var(--icon-green)]/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest text-[var(--icon-green)]">
              Waitlist
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-foreground/30"
            >
              <ArrowLeft size={12} />
              Dashboard
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/30 disabled:opacity-50"
            >
              <LogOut size={12} />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">

        {/* Stat cards */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Pre-launch funnel</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard icon={<Users size={16} style={{ color: "var(--icon-green)" }} />} value={stats.total} label="Signups" color="var(--icon-green)" />
            <StatCard
              icon={<CheckCircle2 size={16} style={{ color: "var(--icon-lime)" }} />}
              value={stats.completed}
              label="Completed quiz"
              sub={`${completionRate}% of signups`}
              color="var(--icon-lime)"
            />
            <StatCard
              icon={<Share2 size={16} style={{ color: "var(--icon-teal)" }} />}
              value={stats.totalReferrals}
              label="Referrals credited"
              color="var(--icon-teal)"
            />
            <StatCard
              icon={<Trophy size={16} style={{ color: "var(--icon-yellow)" }} />}
              value={stats.unlocked}
              label="Founding unlocks"
              sub="Hit referral goal"
              color="var(--icon-yellow)"
            />
            <StatCard icon={<Globe size={16} style={{ color: "var(--icon-orange)" }} />} value={stats.countries.length} label="Countries" color="var(--icon-orange)" />
          </div>
        </section>

        {/* Daily signups */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Signups · last 14 days</h2>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-end gap-1.5 h-32">
              {stats.daily.map((d) => (
                <div key={d.date} className="group flex flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-[10px] tabular-nums text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    {d.count}
                  </span>
                  <div
                    className="w-full rounded-t-md brand-gradient transition-all"
                    style={{ height: `${Math.max(2, Math.round((d.count / maxDaily) * 100))}%` }}
                    title={`${d.date}: ${d.count}`}
                  />
                  <span className="text-[10px] tabular-nums text-muted-foreground">{d.date.slice(8, 10)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Countries + breakdowns */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Country leaderboard */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Signups by country</h2>
            {stats.countries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
            ) : (
              <div className="space-y-2.5">
                {stats.countries.slice(0, 12).map((c) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="w-5 shrink-0 text-right text-xs font-bold tabular-nums text-muted-foreground">{c.rank}</span>
                    <span className="text-base leading-none">{c.flag}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-foreground/80">{c.name}</span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{c.count.toLocaleString()}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                        <div className="h-full rounded-full brand-gradient" style={{ width: `${Math.max(4, Math.round((c.count / maxCountry) * 100))}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profile types */}
          <Breakdown title="Food System types" data={stats.profileTypes} color="rotate" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Breakdown title="Main goals" data={stats.goals} color="var(--icon-green)" />
          <Breakdown title="Food challenges" data={stats.challenges} color="var(--icon-orange)" />
          <Breakdown title="Diets" data={stats.diets} color="var(--icon-teal)" />
        </div>

        {/* Referral leaders */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Referral leaders</h2>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Name</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Email</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Country</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Referrals</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Unlocked</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.leaders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No referrals yet</td>
                    </tr>
                  ) : (
                    stats.leaders.map((l, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                        <td className="px-5 py-3.5 font-medium">{l.name ?? <span className="text-muted-foreground">—</span>}</td>
                        <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{l.email}</td>
                        <td className="px-5 py-3.5 text-muted-foreground text-xs">{l.country ?? "—"}</td>
                        <td className="px-5 py-3.5 font-bold tabular-nums">{l.referral_count ?? 0}</td>
                        <td className="px-5 py-3.5">
                          {l.reward_code ? (
                            <span className="font-mono text-xs text-[var(--icon-green)]">{l.reward_code}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Recent signups */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Recent signups</h2>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Name</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Email</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Country</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Score</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Profile</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">When</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No signups yet</td>
                    </tr>
                  ) : (
                    stats.recent.map((lead, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                        <td className="px-5 py-3.5 font-medium">{lead.name ?? <span className="text-muted-foreground">—</span>}</td>
                        <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{lead.email}</td>
                        <td className="px-5 py-3.5 text-muted-foreground text-xs">{lead.country ?? "—"}</td>
                        <td className="px-5 py-3.5"><ScoreBadge score={lead.overall_score} /></td>
                        <td className="px-5 py-3.5">
                          {lead.profile_type ? (
                            <span className="text-xs font-medium text-foreground/80">{lead.profile_type}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground text-xs">{timeAgo(lead.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
