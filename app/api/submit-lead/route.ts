import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, ageBracket } = body as {
      name: string
      email: string
      ageBracket: string
    }

    if (!name || !email || !ageBracket) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Store in Supabase if configured
    const supabase = getSupabase()
    if (supabase) {
      const { error } = await supabase.from("leads").upsert(
        {
          name,
          email,
          age_bracket: ageBracket,
        },
        { onConflict: "email" }
      )
      if (error) {
        console.error("[submit-lead] Supabase error:", error.message)
      }
    } else {
      console.log("[submit-lead] New lead (Supabase not configured):", { name, email, ageBracket })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[submit-lead] Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
