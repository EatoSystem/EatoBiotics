import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, ageBracket, referralCode, assessmentType } = body as {
      name: string
      ageBracket: string
      referralCode?: string
      assessmentType?: "gut" | "mind"
    }
    const email = ((body as { email: string }).email ?? "").toLowerCase().trim()

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
          assessment_type: assessmentType ?? "gut",
        },
        { onConflict: "email,assessment_type" }
      )
      if (error) {
        console.error("[submit-lead] Supabase error:", error.message)
      }

      // Track referral if a code was provided
      if (referralCode) {
        try {
          await supabase.from("referrals").insert({
            referrer_code: referralCode,
            referred_email: email,
          })
        } catch (refErr) {
          console.error("[submit-lead] Referral insert error:", refErr)
        }
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
