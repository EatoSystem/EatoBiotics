import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"  // service role client for admin ops

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/account"
  const ref = searchParams.get("ref")  // referral code if present

  if (!code) {
    return NextResponse.redirect(`${origin}/assessment?error=no_code`)
  }

  const supabase = await getSupabaseServer()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("Auth callback error:", error)
    return NextResponse.redirect(`${origin}/assessment?error=auth_failed`)
  }

  // Get the newly signed-in user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/assessment`)
  }

  // Use service role client for admin DB operations
  const adminSupabase = getSupabase()

  if (adminSupabase) {
    try {
      // Check if profile already exists
      const { data: existingProfile } = await adminSupabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single()

      if (!existingProfile) {
        // New user — create profile
        // Pull name + age_bracket from leads table
        const { data: lead } = await adminSupabase
          .from("leads")
          .select("name, age_bracket")
          .eq("email", user.email!.toLowerCase())
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        // Generate unique referral code
        let referralCode = generateReferralCode()
        // Ensure uniqueness (retry once on collision)
        const { data: existing } = await adminSupabase
          .from("profiles")
          .select("id")
          .eq("referral_code", referralCode)
          .single()
        if (existing) referralCode = generateReferralCode() + Math.random().toString(36).substring(2, 4).toUpperCase()

        await adminSupabase.from("profiles").insert({
          id: user.id,
          email: user.email!,
          name: lead?.name ?? null,
          age_bracket: lead?.age_bracket ?? null,
          membership: "free",
          referral_code: referralCode,
          referred_by: ref ?? null,
        })

        // Link existing leads rows to this user_id
        await adminSupabase
          .from("leads")
          .update({ user_id: user.id })
          .eq("email", user.email!.toLowerCase())
          .is("user_id", null)

        // Link existing deep_assessments rows by email
        await adminSupabase
          .from("deep_assessments")
          .update({ user_id: user.id })
          .eq("email", user.email!.toLowerCase())
          .is("user_id", null)

        // Record referral if ref code was provided
        if (ref) {
          await adminSupabase.from("referrals").upsert({
            referrer_code: ref.toUpperCase(),
            referred_email: user.email!,
            referred_id: user.id,
          }, { onConflict: "referred_email" })

          // Check if referrer should get early_access reward (3+ referrals)
          const { count } = await adminSupabase
            .from("referrals")
            .select("*", { count: "exact", head: true })
            .eq("referrer_code", ref.toUpperCase())

          if (count && count >= 3) {
            // Find the referrer's profile and upgrade them
            const { data: referrerProfile } = await adminSupabase
              .from("profiles")
              .select("id")
              .eq("referral_code", ref.toUpperCase())
              .single()
            if (referrerProfile) {
              await adminSupabase
                .from("profiles")
                .update({ membership: "early_access" })
                .eq("id", referrerProfile.id)
            }
          }
        }
      }
    } catch (err) {
      console.error("Profile creation error (non-fatal):", err)
      // Don't block the redirect — profile creation failure is not critical
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
