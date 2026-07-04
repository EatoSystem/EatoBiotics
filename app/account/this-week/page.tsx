import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase-server"
import { buildAccountTwin } from "@/lib/agent-loop/account-twin"
import { getAccountTwinInput } from "@/lib/account/twin-data"
import { ThisWeekClient } from "@/components/account/twin/this-week-client"

export const metadata: Metadata = {
  title: "This Week — Your Food System — EatoBiotics",
  description: "How your Food System is changing this week — momentum, patterns and next week's one focus.",
  robots: "noindex",
}

export default async function ThisWeekPage() {
  const user = await getUser()
  if (!user) redirect("/assessment?signin=1")

  const input = await getAccountTwinInput(user.id, user.email ?? null)
  const { twin } = await buildAccountTwin(input)

  return <ThisWeekClient twin={twin} streak={input.streak ?? 0} />
}
