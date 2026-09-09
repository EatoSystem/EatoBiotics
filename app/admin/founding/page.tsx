import { cookies } from "next/headers"
import { getSupabase } from "@/lib/supabase"
import { ADMIN_COOKIE, verifyAdminCookie } from "@/lib/admin-auth"
import { AdminLogin } from "../admin-login"
import { FoundingAdminClient } from "./founding-admin-client"

export const metadata = {
  title: "Founding 100 — EatoBiotics Admin",
  robots: { index: false, follow: false },
}

export default async function FoundingAdminPage() {
  const cookieStore = await cookies()
  const isAuthed = verifyAdminCookie(cookieStore.get(ADMIN_COOKIE)?.value)
  if (!isAuthed) return <AdminLogin />

  const db = getSupabase()
  if (!db) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Supabase not configured.</div>

  const [{ count: total }, { count: admitted }, { count: rejected }, { count: waitlist }, { data: rows }] = await Promise.all([
    db.from("founding_applications").select("*", { head: true, count: "exact" }),
    db.from("founding_applications").select("*", { head: true, count: "exact" }).eq("status", "admitted"),
    db.from("founding_applications").select("*", { head: true, count: "exact" }).eq("status", "rejected"),
    db.from("founding_applications").select("*", { head: true, count: "exact" }).eq("status", "waitlist"),
    db.from("founding_applications")
      .select("id, name, email, why, focus, referral, status, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        <h1 className="font-serif text-2xl font-semibold">Founding 100</h1>
        <FoundingAdminClient
          rows={(rows ?? []) as any}
          stats={{
            total: total ?? 0,
            admitted: admitted ?? 0,
            rejected: rejected ?? 0,
            waitlist: waitlist ?? 0,
          }}
        />
      </div>
    </div>
  )
}

