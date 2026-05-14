import { NextResponse } from "next/server"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"

export async function DELETE() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const adminSupabase = getSupabase()
    if (!adminSupabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const userId = user.id
    const email  = user.email ?? ""

    // Delete user data in FK-safe order (children before parents)
    await adminSupabase.from("weekly_checkins").delete().eq("user_id", userId)
    await adminSupabase.from("analyses").delete().eq("user_id", userId)
    await adminSupabase.from("consultations").delete().eq("user_id", userId)
    await adminSupabase.from("journal_entries").delete().eq("user_id", userId)
    await adminSupabase.from("plate_data").delete().eq("user_id", userId)

    // Soft-delete leads: unlink user_id but preserve email/assessment data for records
    if (email) {
      await adminSupabase
        .from("leads")
        .update({ user_id: null })
        .eq("user_id", userId)
    }

    // Delete profile row
    await adminSupabase.from("profiles").delete().eq("id", userId)

    // Delete the auth user (irreversible)
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId)
    if (authError) {
      console.error("[account/delete] Auth delete failed:", authError.message)
      return NextResponse.json({ error: "Account deletion failed" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[account/delete]", err)
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 })
  }
}
