import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { SettingsClient } from "@/components/account/settings-client"

export const metadata: Metadata = {
  title: "Account Settings — EatoBiotics",
  description: "Update your name, age bracket, and account preferences.",
}

export default async function AccountSettingsPage() {
  const user = await getUser()
  if (!user) redirect("/assessment?signin=1")

  const adminSupabase = getSupabase()

  let profile: {
    id: string
    email: string
    name: string | null
    age_bracket: string | null
    created_at: string | null
  } | null = null

  if (adminSupabase) {
    const { data } = await adminSupabase
      .from("profiles")
      .select("id, email, name, age_bracket, created_at")
      .eq("id", user.id)
      .single()
    profile = data
  }

  // Fallback if no profile row yet
  if (!profile) {
    profile = {
      id: user.id,
      email: user.email!,
      name: null,
      age_bracket: null,
      created_at: null,
    }
  }

  return (
    <div className="min-h-screen bg-background pt-24">
      <SettingsClient profile={profile} />
    </div>
  )
}
