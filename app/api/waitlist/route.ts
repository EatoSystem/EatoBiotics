import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

/**
 * Public waitlist capture for the pre-launch landing page (/enter).
 * Stores the email in the existing `leads` table, tagged with
 * assessment_type "waitlist" so it never collides with assessment leads.
 * Intentionally email-only and tolerant — it never blocks the visitor.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string }
    const email = (body.email ?? "").toLowerCase().trim()

    // Lightweight email sanity check.
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 })
    }

    const supabase = getSupabase()
    if (supabase) {
      const { error } = await supabase.from("leads").upsert(
        { email, assessment_type: "waitlist" },
        { onConflict: "email,assessment_type" }
      )
      if (error) {
        console.error("[waitlist] Supabase error:", error.message)
      }
    } else {
      console.log("[waitlist] New signup (Supabase not configured):", email)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[waitlist] Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
