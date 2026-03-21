"use client"

import Image from "next/image"
import { useState } from "react"
import { Users, CheckCircle2, FileText, TrendingUp, Share2, UserCheck, LogOut } from "lucide-react"

type Lead = {
  name: string | null
  email: string
  overall_score: number | null
  profile_type: string | null
  age_bracket: string | null
  created_at: string
}

type AdminStats = {
  totalLeads: number
  completedAssessments: number
  accounts: number
  paidReports: number
  referrals: number
  profileTypes: Record<string, number>
  tierCounts: Record<string, number>
  ageBrackets: Record<string, number>
  recentLeads: Lead[]
}

const TIER_COLORS: Record<string, string> = {
  starter: "bg-[var(--icon-lime)]/15 text-[var(--icon-lime)] border-[var(--icon-lime)]/30",
  full: "bg-[var(--icon-green)]/15 text-[var(--icon-green)] border-[var(--icon-green)]/30",
  premium: "bg-[var(--icon-teal)]/15 text-[var(--icon-teal)] border-[var(--icon-teal)]/30",
}

const PROFILE_COLORS = [
  "var(--icon-green)",
  "var(--icon-teal)",
  "var(--icon-lime)",
  "var(--icon-yellow)",
  "var(--icon-orange)",
]

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground text-xs">—</span>
  const color = score >= 70 ? "var(--icon-green)" : score >= 45 ? "var(--icon-yellow)" : "var(--icon-orange)"
  return (
    <span
      className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums"
      style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
    >
      {score}
    </span>
  )
}

function StatCard({
  icon: Icon,
  value,
  label,
  sub,
  color = "var(--icon-green)",
}: {
  icon: React.ElementType
  value: string | number
  label: string
  sub?: string
  color?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
        >
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground/80">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export function AdminDashboard({ stats }: { stats: AdminStats }) {
  const [signingOut, setSigningOut] = useState(false)
  const completionRate = stats.totalLeads > 0 ? Math.round((stats.completedAssessments / stats.totalLeads) * 100) : 0
  const conversionRate = stats.totalLeads > 0 ? Math.round((stats.paidReports / stats.totalLeads) * 100) : 0

  const sortedProfiles = Object.entries(stats.profileTypes).sort((a, b) => b[1] - a[1])
  const totalProfiled = sortedProfiles.reduce((s, [, n]) => s + n, 0)

  const sortedAges = Object.entries(stats.ageBrackets).sort((a, b) => b[1] - a[1])

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
              Admin
            </span>
          </div>
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

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">

        {/* Stat cards */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Overview</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard icon={Users} value={stats.totalLeads} label="Total leads" color="var(--icon-green)" />
            <StatCard
              icon={CheckCircle2}
              value={stats.completedAssessments}
              label="Assessments"
              sub={`${completionRate}% completion`}
              color="var(--icon-lime)"
            />
            <StatCard icon={UserCheck} value={stats.accounts} label="Accounts" sub="Registered users" color="var(--icon-teal)" />
            <StatCard
              icon={FileText}
              value={stats.paidReports}
              label="Paid reports"
              sub={`${conversionRate}% of leads`}
              color="var(--icon-yellow)"
            />
            <StatCard icon={Share2} value={stats.referrals} label="Referrals" color="var(--icon-orange)" />
            <StatCard
              icon={TrendingUp}
              value={`${conversionRate}%`}
              label="Conversion"
              sub="Leads → paid"
              color="var(--icon-green)"
            />
          </div>
        </section>

        {/* Breakdowns row */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Profile types */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Profile types</h2>
            {sortedProfiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
            ) : (
              <div className="space-y-3">
                {sortedProfiles.map(([type, count], i) => {
                  const pct = totalProfiled > 0 ? Math.round((count / totalProfiled) * 100) : 0
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{type}</span>
                        <span className="text-sm text-muted-foreground tabular-nums ml-2">{count} <span className="text-xs">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-border/60">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%`, background: PROFILE_COLORS[i % PROFILE_COLORS.length] }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Paid report tiers */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Report tiers</h2>
            {stats.paidReports === 0 ? (
              <p className="text-sm text-muted-foreground">No paid reports yet</p>
            ) : (
              <div className="space-y-3">
                {(["starter", "full", "premium"] as const).map((tier) => {
                  const count = stats.tierCounts[tier] ?? 0
                  const pct = stats.paidReports > 0 ? Math.round((count / stats.paidReports) * 100) : 0
                  return (
                    <div key={tier} className="flex items-center justify-between">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${TIER_COLORS[tier]}`}>
                        {tier}
                      </span>
                      <div className="flex items-center gap-2 ml-3 flex-1">
                        <div className="flex-1 h-1.5 rounded-full bg-border/60">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: tier === "starter" ? "var(--icon-lime)" : tier === "full" ? "var(--icon-green)" : "var(--icon-teal)"
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground tabular-nums w-6 text-right">{count}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Age brackets */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Age brackets</h2>
            {sortedAges.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
            ) : (
              <div className="space-y-3">
                {sortedAges.map(([bracket, count]) => {
                  const total = sortedAges.reduce((s, [, n]) => s + n, 0)
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0
                  return (
                    <div key={bracket}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{bracket}</span>
                        <span className="text-sm text-muted-foreground tabular-nums">{count} <span className="text-xs">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-border/60">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${pct}%`, background: "var(--icon-teal)" }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent leads table */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Recent leads</h2>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Name</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Email</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Score</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Profile</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Age</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">When</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No leads yet</td>
                    </tr>
                  ) : (
                    stats.recentLeads.map((lead, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                        <td className="px-5 py-3.5 font-medium">{lead.name ?? <span className="text-muted-foreground">—</span>}</td>
                        <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{lead.email}</td>
                        <td className="px-5 py-3.5"><ScoreBadge score={lead.overall_score} /></td>
                        <td className="px-5 py-3.5">
                          {lead.profile_type ? (
                            <span className="text-xs font-medium text-foreground/80">{lead.profile_type}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground text-xs">{lead.age_bracket ?? "—"}</td>
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
