import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function POST() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const adminSupabase = getSupabase()
  if (!adminSupabase) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  try {
    const { data: existing } = await adminSupabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single()

    if (!existing) {
      const { data: lead } = await adminSupabase
        .from("leads")
        .select("name, age_bracket")
        .eq("email", user.email!)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      let referralCode = generateReferralCode()
      const { data: conflict } = await adminSupabase
        .from("profiles")
        .select("id")
        .eq("referral_code", referralCode)
        .single()
      if (conflict) {
        referralCode = generateReferralCode() + Math.random().toString(36).substring(2, 4).toUpperCase()
      }

      await adminSupabase.from("profiles").insert({
        id: user.id,
        email: user.email!,
        name: lead?.name ?? null,
        age_bracket: lead?.age_bracket ?? null,
        membership: "free",
        referral_code: referralCode,
      })

    }

    // Always link user_id to any unlinked rows for this email
    // (runs on every sign-in so new assessments taken after account creation are linked too)
    await adminSupabase
      .from("leads")
      .update({ user_id: user.id })
      .eq("email", user.email!)
      .is("user_id", null)

    await adminSupabase
      .from("deep_assessments")
      .update({ user_id: user.id })
      .eq("email", user.email!)
      .is("user_id", null)
  } catch (err) {
    console.error("[setup-profile] error (non-fatal):", err)
  }

  return NextResponse.json({ ok: true })
}
