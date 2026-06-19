import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function normalizeEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase()
  return normalized || null
}

function safeId(id: unknown): string | null {
  if (typeof id !== "string") return null
  const trimmed = id.trim()
  return /^[a-zA-Z0-9_-]{6,80}$/.test(trimmed) ? trimmed : null
}

type LinkedRow = { id: string; overall_score?: number | null }

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { assessmentId?: string; reportId?: string }
  const explicitAssessmentId = safeId(body.assessmentId)
  const explicitReportId = safeId(body.reportId)
  const normalizedEmail = normalizeEmail(user.email)
  if (!normalizedEmail) {
    return NextResponse.json({ error: "Authenticated user is missing an email" }, { status: 400 })
  }

  const adminSupabase = getSupabase()
  if (!adminSupabase) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const linkedLeadIds = new Set<string>()
  const linkedDeepAssessmentIds = new Set<string>()
  let selectedAssessmentId: string | null = explicitAssessmentId
  let selectedScore: number | null = null
  let profileName: string | null = null
  let linkedLeadName: string | null = null

  try {
    const { data: existing } = await adminSupabase
      .from("profiles")
      .select("id, name")
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

      profileName = lead?.name ?? null
      await adminSupabase.from("profiles").insert({
        id: user.id,
        email: normalizedEmail,
        name: profileName,
        age_bracket: lead?.age_bracket ?? null,
        membership: "free",
        referral_code: referralCode,
      })
    } else {
      profileName = (existing.name as string | null) ?? null
      await adminSupabase
        .from("profiles")
        .update({ email: normalizedEmail })
        .eq("id", user.id)
    }

    // 1) Explicit identifiers from the magic-link callback/request.
    if (explicitAssessmentId) {
      const { data } = await adminSupabase
        .from("leads")
        .update({ user_id: user.id, email: normalizedEmail })
        .eq("id", explicitAssessmentId)
        .select("id, name, overall_score")
      for (const row of (data ?? []) as LinkedRow[]) {
        linkedLeadIds.add(row.id)
        linkedLeadName = (row as LinkedRow & { name?: string | null }).name ?? linkedLeadName
        selectedAssessmentId = row.id
        selectedScore = row.overall_score ?? selectedScore
      }
    }

    if (explicitReportId) {
      const { data } = await adminSupabase
        .from("deep_assessments")
        .update({ user_id: user.id, email: normalizedEmail })
        .eq("id", explicitReportId)
        .select("id")
      for (const row of (data ?? []) as { id: string }[]) linkedDeepAssessmentIds.add(row.id)
    }

    // 2) Rows already attached to this authenticated user.
    const { data: userLeadRows } = await adminSupabase
      .from("leads")
      .select("id, name, overall_score")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    for (const row of (userLeadRows ?? []) as LinkedRow[]) {
      linkedLeadIds.add(row.id)
      linkedLeadName = ((row as LinkedRow & { name?: string | null }).name ?? linkedLeadName)
      if (!selectedAssessmentId && row.overall_score != null) {
        selectedAssessmentId = row.id
        selectedScore = row.overall_score
      }
    }

    const { data: userDeepRows } = await adminSupabase
      .from("deep_assessments")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    for (const row of (userDeepRows ?? []) as { id: string }[]) linkedDeepAssessmentIds.add(row.id)

    // 3) Normalized email fallback for unlinked or already-this-user rows.
    const { data: emailLeadRows } = await adminSupabase
      .from("leads")
      .update({ user_id: user.id, email: normalizedEmail })
      .ilike("email", normalizedEmail)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .select("id, name, overall_score")
    for (const row of (emailLeadRows ?? []) as LinkedRow[]) {
      linkedLeadIds.add(row.id)
      linkedLeadName = ((row as LinkedRow & { name?: string | null }).name ?? linkedLeadName)
      if (!selectedAssessmentId && row.overall_score != null) {
        selectedAssessmentId = row.id
        selectedScore = row.overall_score
      }
    }

    const { data: emailDeepRows } = await adminSupabase
      .from("deep_assessments")
      .update({ user_id: user.id, email: normalizedEmail })
      .ilike("email", normalizedEmail)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .select("id")
    for (const row of (emailDeepRows ?? []) as { id: string }[]) linkedDeepAssessmentIds.add(row.id)


    if (linkedLeadName && linkedLeadName !== profileName) {
      await adminSupabase
        .from("profiles")
        .update({ name: linkedLeadName, email: normalizedEmail })
        .eq("id", user.id)
      profileName = linkedLeadName
    }

    console.log("[setup-profile] linked account", {
      authenticatedEmail: normalizedEmail,
      authenticatedUserId: user.id,
      profileName,
      linkedLeadIds: Array.from(linkedLeadIds),
      linkedLeadName,
      linkedDeepAssessmentIds: Array.from(linkedDeepAssessmentIds),
      selectedAssessmentId,
      selectedScore,
      explicitAssessmentId,
      explicitReportId,
    })
  } catch (err) {
    console.error("[setup-profile] error (non-fatal):", err)
  }

  return NextResponse.json({
    ok: true,
    debug: {
      authenticatedEmail: normalizedEmail,
      authenticatedUserId: user.id,
      profileName,
      linkedLeadIds: Array.from(linkedLeadIds),
      linkedDeepAssessmentIds: Array.from(linkedDeepAssessmentIds),
      selectedAssessmentId,
      selectedScore,
    },
  })
}
