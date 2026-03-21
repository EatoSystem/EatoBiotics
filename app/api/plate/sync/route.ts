import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { plate, plants } = body

    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ ok: true }) // graceful no-op

    await supabase.from("plate_data").upsert({
      user_id: user.id,
      plate: plate ?? null,
      plants: plants ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Plate sync error:", err)
    return NextResponse.json({ ok: true }) // never block the UI
  }
}
