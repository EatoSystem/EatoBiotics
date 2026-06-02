import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getSupabase } from "@/lib/supabase"
import { verifyCronRequest } from "@/lib/cron-auth"

export const dynamic = "force-dynamic"

/**
 * Daily site-analysis digest: summarises the last 24h of funnel/business
 * activity and emails it to the owner. Triggered by the Daily Digest GitHub
 * Action (curls this route with the CRON_SECRET bearer) — no Vercel cron used.
 */
export async function GET(req: NextRequest) {
  const unauthorised = verifyCronRequest(req)
  if (unauthorised) return unauthorised

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [leadsRes, completedRes, analysesRes, deepRes, subsRes] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", since).not("overall_score", "is", null),
    supabase.from("analyses").select("*", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("deep_assessments").select("*", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("subscription_events").select("*", { count: "exact", head: true }).gte("created_at", since).eq("event_type", "subscribed"),
  ])

  const metrics = {
    newLeads: leadsRes.count ?? 0,
    completedAssessments: completedRes.count ?? 0,
    mealsAnalysed: analysesRes.count ?? 0,
    paidReportsStarted: deepRes.count ?? 0,
    newSubscriptions: subsRes.count ?? 0,
  }

  const text =
    `EatoBiotics — last 24 hours\n\n` +
    `New leads:               ${metrics.newLeads}\n` +
    `Completed assessments:   ${metrics.completedAssessments}\n` +
    `Meals analysed:          ${metrics.mealsAnalysed}\n` +
    `Paid reports started:    ${metrics.paidReportsStarted}\n` +
    `New subscriptions:       ${metrics.newSubscriptions}\n`

  let emailed = false
  const resendKey = process.env.RESEND_API_KEY
  const to = process.env.OWNER_EMAIL
  const from = process.env.EMAIL_FROM
  if (resendKey && to && from) {
    try {
      await new Resend(resendKey).emails.send({
        from: from.includes("<") ? from : `EatoBiotics Monitoring <${from}>`,
        to,
        subject: `EatoBiotics daily digest — ${new Date().toISOString().slice(0, 10)}`,
        text,
      })
      emailed = true
    } catch (err) {
      console.error("[digest] email send failed:", err)
    }
  }

  return NextResponse.json({ ok: true, emailed, metrics })
}
