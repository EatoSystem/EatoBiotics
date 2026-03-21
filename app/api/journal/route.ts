import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"

export async function GET() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = getSupabase()
    if (!db) return NextResponse.json({ entries: [] })

    const since = new Date()
    since.setDate(since.getDate() - 90)

    const { data, error } = await db
      .from("journal_entries")
      .select("date, energy, digestion, mood, notes, plants_this_week")
      .eq("user_id", user.id)
      .gte("date", since.toISOString().slice(0, 10))
      .order("date", { ascending: false })

    if (error) {
      console.error("[journal GET] error:", error.message)
      return NextResponse.json({ entries: [] })
    }

    return NextResponse.json({ entries: data ?? [] })
  } catch (err) {
    console.error("[journal GET] unexpected:", err)
    return NextResponse.json({ entries: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { date, energy, digestion, mood, notes, plants_this_week } = body as {
      date: string
      energy: number
      digestion: number
      mood: number
      notes?: string
      plants_this_week?: number
    }

    // Validate
    if (!date || ![1, 2, 3, 4, 5].includes(energy) || ![1, 2, 3, 4, 5].includes(digestion) || ![1, 2, 3, 4, 5].includes(mood)) {
      return NextResponse.json({ error: "Invalid entry" }, { status: 400 })
    }

    const db = getSupabase()
    if (!db) return NextResponse.json({ ok: true })

    const { error } = await db.from("journal_entries").upsert(
      {
        user_id: user.id,
        date,
        energy,
        digestion,
        mood,
        notes: notes ?? null,
        plants_this_week: plants_this_week ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,date" }
    )

    if (error) {
      console.error("[journal POST] error:", error.message)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[journal POST] unexpected:", err)
    return NextResponse.json({ ok: true }) // non-blocking
  }
}
