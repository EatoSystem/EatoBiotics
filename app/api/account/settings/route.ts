import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, age_bracket } = await req.json()

    const supabase = getSupabase()
    if (supabase) {
      await supabase
        .from("profiles")
        .update({ name: name ?? null, age_bracket: age_bracket ?? null, updated_at: new Date().toISOString() })
        .eq("id", user.id)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}
