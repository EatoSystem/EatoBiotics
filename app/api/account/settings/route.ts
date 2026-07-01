import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()

    // Partial update — only touch the fields actually provided, so a caller that
    // sends just { sex } (onboarding) doesn't wipe name/age_bracket, and vice versa.
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if ("name" in body) update.name = body.name ?? null
    if ("age_bracket" in body) update.age_bracket = body.age_bracket ?? null
    if ("sex" in body) update.sex = body.sex === "male" || body.sex === "female" ? body.sex : null

    const supabase = getSupabase()
    if (supabase) {
      await supabase.from("profiles").update(update).eq("id", user.id)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}
