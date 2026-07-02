import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { buildAccountTwin } from "@/lib/agent-loop/account-twin"
import { twinVisualState } from "@/lib/account/twin-visual"
import { getAccountTwinInput, buildTwinLenses } from "@/lib/account/twin-data"
import { twinFigureSrc, twinVideo, normaliseSex } from "@/lib/account/twin-figure"
import { TwinDashboard } from "@/components/account/twin/twin-dashboard"

export const metadata: Metadata = {
  title: "Your Digital Twin — EatoBiotics",
  description: "Your Food System Digital Twin — live, learning, and lens by lens.",
  robots: "noindex",
}

export default async function AccountTwinPage() {
  const user = await getUser()
  if (!user) redirect("/assessment?signin=1")

  const [input, sex] = await Promise.all([
    getAccountTwinInput(user.id, user.email ?? null),
    (async () => {
      const supabase = getSupabase()
      if (!supabase) return null
      const { data } = await supabase.from("profiles").select("sex").eq("id", user.id).single()
      return normaliseSex((data?.sex as string | null) ?? null)
    })(),
  ])
  const { twin, feed } = await buildAccountTwin(input)
  const visual = twinVisualState(twin)
  const lenses = buildTwinLenses()

  return (
    <TwinDashboard twin={twin} visual={visual} feed={feed} lenses={lenses} userId={user.id} figureSrc={twinFigureSrc(sex)} video={twinVideo(sex)} streak={input.streak ?? 0} />
  )
}
