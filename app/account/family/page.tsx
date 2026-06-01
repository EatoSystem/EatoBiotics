import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { familyScoreFromMembers, type FamilyMember } from "@/lib/family"
import { FamilyClient } from "./family-client"

export const metadata: Metadata = {
  title: "Your Family Food System — EatoBiotics",
  description: "Track your whole household's gut health in one place.",
}

interface MemberRow {
  id: string
  name: string
  age_band: string | null
  relationship: string | null
  latest_score: number | null
}

export default async function FamilyPage() {
  const user = await getUser()
  if (!user) redirect("/assessment?signin=1")

  const supabase = getSupabase()
  let members: FamilyMember[] = []
  let ownerScore: number | null = null
  let ownerName: string | null = null

  if (supabase) {
    const { data } = await supabase
      .from("household_members")
      .select("id, name, age_band, relationship, latest_score")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
    members = (data ?? []).map((r: MemberRow) => ({
      id: r.id,
      name: r.name,
      ageBand: r.age_band,
      relationship: r.relationship,
      score: r.latest_score,
    }))

    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle()
    ownerName = (profile?.name as string | null) ?? null

    const { data: latest } = await supabase
      .from("analyses")
      .select("biotics_score")
      .eq("user_id", user.id)
      .not("biotics_score", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    ownerScore = (latest?.biotics_score as number | null) ?? null
  }

  const familyScore = familyScoreFromMembers(members, ownerScore)

  return (
    <FamilyClient
      initialMembers={members}
      ownerName={ownerName}
      ownerScore={ownerScore}
      initialFamilyScore={familyScore}
    />
  )
}
