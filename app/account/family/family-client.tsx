"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { familyScoreFromMembers, type FamilyMember, type FamilyScore } from "@/lib/family"
import { useI18n } from "@/components/i18n/locale-provider"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { interpolate } from "@/lib/i18n/config"
import { REVIEWED_LOCALES } from "@/lib/i18n/dictionaries"

const AGE_BANDS = ["child", "teen", "adult"] as const
const RELATIONSHIPS = ["self", "child", "partner", "parent", "sibling", "other"] as const

function scoreColor(score: number): string {
  if (score >= 80) return "var(--icon-green)"
  if (score >= 60) return "var(--icon-teal)"
  if (score >= 40) return "var(--icon-yellow)"
  return "var(--icon-orange)"
}

export function FamilyClient({
  initialMembers,
  ownerName,
  ownerScore,
  initialFamilyScore,
}: {
  initialMembers: FamilyMember[]
  ownerName: string | null
  ownerScore: number | null
  initialFamilyScore: FamilyScore
}) {
  const { t, locale } = useI18n()
  const [members, setMembers] = useState<FamilyMember[]>(initialMembers)
  const [name, setName] = useState("")
  const [ageBand, setAgeBand] = useState<string>("")
  const [relationship, setRelationship] = useState<string>("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const familyScore: FamilyScore = useMemo(
    () => familyScoreFromMembers(members, ownerScore),
    [members, ownerScore],
  )
  // Show the freshly-computed score, falling back to the server's initial value.
  const shown = members === initialMembers ? initialFamilyScore : familyScore

  async function addMember(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setError(t.family.nameRequired)
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/household/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          ageBand: ageBand || null,
          relationship: relationship || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Could not add member")
      const m = json.member
      setMembers((prev) => [
        ...prev,
        { id: m.id, name: m.name, ageBand: m.age_band, relationship: m.relationship, score: m.latest_score },
      ])
      setName("")
      setAgeBand("")
      setRelationship("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  async function updateScore(id: string, raw: string) {
    const value = raw === "" ? null : Math.max(0, Math.min(100, Math.round(Number(raw))))
    if (raw !== "" && Number.isNaN(value as number)) return
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, score: value } : m)))
    try {
      await fetch("/api/household/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, latestScore: value }),
      })
    } catch {
      /* optimistic — a failed sync just means the next load shows the stored value */
    }
  }

  async function removeMember(id: string) {
    const prev = members
    setMembers((m) => m.filter((x) => x.id !== id))
    try {
      const res = await fetch("/api/household/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setMembers(prev) // roll back on failure
      setError("Could not remove that member — please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-background pt-[57px]">
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/account" className="text-sm font-semibold" style={{ color: "var(--icon-green)" }}>
            {t.common.backToDashboard}
          </Link>
          <LanguageSwitcher />
        </div>

        <h1 className="mt-4 text-2xl font-bold md:text-3xl">{t.family.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.family.subtitle}</p>
        {!REVIEWED_LOCALES.includes(locale) && (
          <p className="mt-2 text-xs italic text-muted-foreground">{t.family.draftNotice}</p>
        )}

        {/* Family score */}
        <div
          className="mt-6 flex items-center gap-5 rounded-2xl p-5 text-white"
          style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
        >
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/20 text-3xl font-bold tabular-nums">
            {shown.average ?? "—"}
          </div>
          <div>
            <div className="text-lg font-bold">{t.family.scoreLabel}</div>
            <p className="text-sm opacity-90">
              {shown.average === null
                ? t.family.scoreEmpty
                : interpolate(t.family.averageNote, { contributors: shown.contributors, total: shown.memberCount })}
            </p>
          </div>
        </div>

        {/* Owner row */}
        <div className="mt-6 flex items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: "#ebebeb" }}>
          <div>
            <div className="font-semibold">{ownerName ?? "You"} <span className="text-xs text-muted-foreground">· {t.family.you}</span></div>
            <div className="text-xs text-muted-foreground">{t.family.ownerSource}</div>
          </div>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white tabular-nums"
            style={{ background: ownerScore != null ? scoreColor(ownerScore) : "var(--muted-foreground)" }}
          >
            {ownerScore ?? "—"}
          </div>
        </div>

        {/* Members */}
        <div className="mt-3 space-y-3">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3" style={{ borderColor: "#ebebeb" }}>
              <div className="min-w-0">
                <div className="truncate font-semibold">{m.name}</div>
                <div className="text-xs text-muted-foreground">
                  {[m.relationship, m.ageBand].filter(Boolean).join(" · ") || t.family.householdMember}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={m.score ?? ""}
                  placeholder="—"
                  aria-label={`${m.name}'s score`}
                  onBlur={(e) => updateScore(m.id, e.target.value)}
                  className="w-16 rounded-lg border px-2 py-1 text-center text-sm tabular-nums"
                  style={{ borderColor: "#ebebeb" }}
                />
                <button
                  onClick={() => removeMember(m.id)}
                  aria-label={`${t.family.remove} ${m.name}`}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-red-600"
                >
                  {t.family.remove}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add member */}
        <form onSubmit={addMember} className="mt-6 rounded-2xl border p-4" style={{ borderColor: "#ebebeb" }}>
          <div className="text-sm font-semibold">{t.family.addTitle}</div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.family.namePlaceholder}
              maxLength={60}
              aria-label={t.family.namePlaceholder}
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "#ebebeb" }}
            />
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              aria-label={t.family.relationshipPlaceholder}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "#ebebeb" }}
            >
              <option value="">{t.family.relationshipPlaceholder}</option>
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
            <select
              value={ageBand}
              onChange={(e) => setAgeBand(e.target.value)}
              aria-label={t.family.agePlaceholder}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "#ebebeb" }}
            >
              <option value="">{t.family.agePlaceholder}</option>
              {AGE_BANDS.map((a) => (
                <option key={a} value={a}>{a[0].toUpperCase() + a.slice(1)}</option>
              ))}
            </select>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-3 rounded-full px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
          >
            {busy ? "Adding…" : "Add member"}
          </button>
        </form>
      </div>
    </div>
  )
}
