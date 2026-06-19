import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function normalizeEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase()
  return normalized || null
}

export async function POST() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const normalizedEmail = normalizeEmail(user.email)
  if (!normalizedEmail) {
    return NextResponse.json({ error: "Authenticated user is missing an email" }, { status: 400 })
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

    const { data: lead } = await adminSupabase
      .from("leads")
      .select("name, age_bracket")
      .ilike("email", normalizedEmail)
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
        email: normalizedEmail,
        name: lead?.name ?? null,
        age_bracket: lead?.age_bracket ?? null,
        membership: "free",
        referral_code: referralCode,
      })
    } else {
      await adminSupabase
        .from("profiles")
        .update({ email: normalizedEmail })
        .eq("id", user.id)
    }

    // Always link user_id to matching rows by normalized email. Run on every sign-in
    // so reports created before account creation or from differently-cased emails
    // attach to the authenticated account before /account loads.
    await adminSupabase
      .from("leads")
      .update({ user_id: user.id, email: normalizedEmail })
      .ilike("email", normalizedEmail)
      .or(`user_id.is.null,user_id.eq.${user.id}`)

    await adminSupabase
      .from("deep_assessments")
      .update({ user_id: user.id, email: normalizedEmail })
      .ilike("email", normalizedEmail)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
  } catch (err) {
    console.error("[setup-profile] error (non-fatal):", err)
  }

  return NextResponse.json({ ok: true })
}
