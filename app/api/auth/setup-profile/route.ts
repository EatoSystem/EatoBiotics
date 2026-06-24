import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { reconcileAccountAfterAuth } from "@/lib/auth/reconcile-account"

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

    // Latest lead for this email — the name/age the user entered most recently
    // at the start of an assessment. Used both to seed a new profile and to keep
    // an existing profile's name in sync (so a stale value can never persist).
    const { data: lead } = await adminSupabase
      .from("leads")
      .select("name, age_bracket")
      .eq("email", user.email!)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!existing) {
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
    } else if (lead?.name) {
      // Existing profile — refresh the name/age from the latest assessment so the
      // account header always reflects what the user actually entered.
      await adminSupabase
        .from("profiles")
        .update({ name: lead.name, ...(lead.age_bracket ? { age_bracket: lead.age_bracket } : {}) })
        .eq("id", user.id)
    }

    // Link prior anonymous assessments to this user AND activate the deferred
    // 30-day report trial if they paid before signing up. Idempotent.
    await reconcileAccountAfterAuth(adminSupabase, user.id, user.email!)
  } catch (err) {
    console.error("[setup-profile] error (non-fatal):", err)
  }

  return NextResponse.json({ ok: true })
}
