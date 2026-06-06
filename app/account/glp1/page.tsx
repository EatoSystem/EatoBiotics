import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, Dumbbell, Lock } from "lucide-react"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { canAccess, getUserMembershipTier } from "@/lib/membership"
import { Glp1Client, type Glp1Log } from "./glp1-client"

export const metadata: Metadata = {
  title: "GLP-1 Companion — EatoBetics",
  description: "Track your protein and muscle-protecting habits while you're on a GLP-1.",
}

export default async function Glp1AccountPage() {
  const user = await getUser()
  if (!user) redirect("/assessment?signin=1")

  const tier = await getUserMembershipTier(user.id)

  // ── Soft gate: free/grow tiers see the value + an upgrade path ──
  if (!canAccess(tier, "glp1_companion")) {
    return (
      <div className="min-h-screen bg-background pt-24">
        <div className="mx-auto max-w-xl px-6 py-16 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
            <Dumbbell size={24} />
          </span>
          <h1 className="mt-5 font-serif text-3xl font-bold tracking-tight text-foreground">
            Your GLP-1 Companion
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">
            Track your daily protein against your muscle-protecting target, log your
            weight and strength sessions, and see your progress week to week — built for
            people on Ozempic, Wegovy, or Mounjaro.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/pricing?feature=glp1-companion"
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
            >
              <Lock size={14} /> Unlock with Restore <ArrowRight size={14} />
            </Link>
            <Link href="/eatobetics/glp1" className="text-sm font-medium underline underline-offset-4 text-muted-foreground">
              Try the free protein calculator
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Member: load recent logs ──
  const adminSupabase = getSupabase()
  let memberName: string | null = null
  let logs: Glp1Log[] = []

  if (adminSupabase) {
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single()
    memberName = profile?.name ?? null

    const { data: logData } = await adminSupabase
      .from("glp1_logs")
      .select("log_date, protein_grams, protein_target, weight_kg, strength_session, notes")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(30)

    logs = (logData ?? []) as Glp1Log[]
  }

  const latestWeightKg =
    logs.find((l) => l.weight_kg != null)?.weight_kg ?? null

  return (
    <div className="min-h-screen bg-background pt-20">
      <Glp1Client
        memberName={memberName}
        initialLogs={logs}
        latestWeightKg={latestWeightKg}
      />
    </div>
  )
}
