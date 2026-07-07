/**
 * EatoBiotics — account Twin data loader.
 *
 * Fetches exactly what `buildAccountTwin` needs for a signed-in member (latest +
 * previous assessment score, averaged biotics, recent meals, streak) and returns
 * a ready `AccountTwinInput`. Shared by the account dashboard and the dedicated
 * /account/twin page so the queries live in one place. Server-only (uses the
 * service-role client); mirrors the queries already in app/account/page.tsx.
 */

import { getSupabase } from "@/lib/supabase"
import { ownerOrFilter } from "@/lib/supabase-filters"
import { computeStreak } from "@/lib/streak"
import type { AccountTwinInput } from "@/lib/agent-loop/account-twin"
import { FOUNDATION_SYSTEM, liveSpecialisedSystems } from "@/lib/agent-loop/systems"
import type { LensDef } from "@/components/account/twin/twin-lenses"

/** The lens list for the Twin: Foundation + the live specialised systems. */
const LENS_HREF: Record<string, string> = {
  stability: "/stability",
  glucose: "/glucose",
  mind: "/mind",
  performance: "/performance",
}

export function buildTwinLenses(): LensDef[] {
  const foundation: LensDef = {
    key: "foundation",
    label: "Food System",
    focusBiotic: FOUNDATION_SYSTEM.loop.focusBiotic,
    observes: FOUNDATION_SYSTEM.loop.observes,
    blurb: "Your whole Food System — the parent of every other lens.",
    href: null,
  }
  const specialised = liveSpecialisedSystems().map<LensDef>((s) => ({
    key: s.key,
    label: s.label,
    focusBiotic: s.loop.focusBiotic,
    observes: s.loop.observes,
    blurb: s.blurb,
    href: LENS_HREF[s.key] ?? null,
  }))
  return [foundation, ...specialised]
}

export async function getAccountTwinInput(userId: string, email: string | null): Promise<AccountTwinInput> {
  const supabase = getSupabase()
  if (!supabase) {
    return { score: null, previousScore: null, profileType: null, biotics: null, meals: [], streak: 0 }
  }

  const [assessments, biotics, meals, streakInfo] = await Promise.all([
    /* Last 2 gut assessments → score, previousScore, profileType */
    (async () => {
      const { data } = await supabase
        .from("leads")
        .select("overall_score, profile_type")
        .or(ownerOrFilter(userId, email))
        .eq("assessment_type", "gut")
        .not("overall_score", "is", null)
        .order("created_at", { ascending: false })
        .limit(2)
      return (data ?? []) as { overall_score: number | null; profile_type: string | null }[]
    })(),

    /* Averaged biotics from the last 5 scored analyses */
    (async () => {
      const { data } = await supabase
        .from("analyses")
        .select("prebiotic_score, probiotic_score, postbiotic_score")
        .eq("user_id", userId)
        .not("biotics_score", "is", null)
        .order("created_at", { ascending: false })
        .limit(5)
      const rows = (data ?? []).filter(
        (a) => a.prebiotic_score != null && a.probiotic_score != null && a.postbiotic_score != null,
      )
      if (rows.length === 0) return null
      const avg = (k: string) =>
        Math.round(rows.reduce((s: number, a: Record<string, unknown>) => s + ((a[k] as number) ?? 0), 0) / rows.length)
      return { prebiotic: avg("prebiotic_score"), probiotic: avg("probiotic_score"), postbiotic: avg("postbiotic_score") }
    })(),

    /* Recent meals — 30 days so longitudinal patterns (lib/account/patterns)
       have real history; the twin replay itself stays capped at the newest 20. */
    (async () => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const { data } = await supabase
        .from("analyses")
        .select("meal_name, biotics_score, prebiotic_score, probiotic_score, postbiotic_score, created_at")
        .eq("user_id", userId)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(60)
      return (data ?? []) as {
        meal_name: string | null
        biotics_score: number | null
        prebiotic_score: number | null
        probiotic_score: number | null
        postbiotic_score: number | null
        created_at: string
      }[]
    })(),

    /* Streak — consecutive days with ≥1 analysis */
    (async () => {
      const { data } = await supabase
        .from("analyses")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
      return computeStreak((data ?? []).map((r) => r.created_at as string))
    })(),
  ])

  return {
    score: assessments[0]?.overall_score ?? null,
    previousScore: assessments[1]?.overall_score ?? null,
    profileType: assessments[0]?.profile_type ?? null,
    biotics,
    streak: streakInfo.current,
    meals: meals.map((a) => ({
      name: a.meal_name ?? "Analysed meal",
      score: a.biotics_score ?? 0,
      prebiotic: a.prebiotic_score ?? 0,
      probiotic: a.probiotic_score ?? 0,
      postbiotic: a.postbiotic_score ?? 0,
      createdAt: a.created_at,
    })),
  }
}
