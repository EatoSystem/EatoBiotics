import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase-server"
import { buildAccountTwin } from "@/lib/agent-loop/account-twin"
import { twinVisualState } from "@/lib/account/twin-visual"
import { getAccountTwinInput, buildTwinLenses } from "@/lib/account/twin-data"
import { TwinDashboard } from "@/components/account/twin/twin-dashboard"

export const metadata: Metadata = {
  title: "Your Living Twin — EatoBiotics",
  description: "Your Food System Digital Twin — live, learning, and lens by lens.",
  robots: "noindex",
}

export default async function AccountTwinPage() {
  const user = await getUser()
  if (!user) redirect("/assessment?signin=1")

  const input = await getAccountTwinInput(user.id, user.email ?? null)
  const { twin, feed } = await buildAccountTwin(input)
  const visual = twinVisualState(twin)
  const lenses = buildTwinLenses()

  return (
    <TwinDashboard twin={twin} visual={visual} feed={feed} lenses={lenses} userId={user.id} />
  )
}
