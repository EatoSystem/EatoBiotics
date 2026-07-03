import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { verifyCronRequest } from "@/lib/cron-auth"
import { sendEmail } from "@/lib/email/send"
import { buildWeekInsideEmail } from "@/lib/email/week-inside-email"
import { getAccountTwinInput } from "@/lib/account/twin-data"
import { buildAccountTwin } from "@/lib/agent-loop/account-twin"
import { buildWeekStory } from "@/lib/account/week-story"

/* ── "Your Food System This Week" Monday story email ─────────────────────
   Weekly cron (0 9 * * 1). For each active/trial member, renders the same
   This Week story the app shows into an email. Skips quiet weeks (no meals
   AND no score movement). Idempotent per user + ISO week via email_sends
   (kind "week_inside_<isoWeek>"). Marketing category → opt-outs honoured by
   sendEmail. Fail-closed on CRON_SECRET via verifyCronRequest.
──────────────────────────────────────────────────────────────────────── */

function isoWeekKey(d = new Date()): string {
  // ISO week number (Mon-based) — stable idempotency key per weekly run.
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`
}

export async function GET(req: NextRequest) {
  const unauthorised = verifyCronRequest(req)
  if (unauthorised) return unauthorised

  if (!process.env.RESEND_API_KEY) {
    console.warn("[week-inside] RESEND_API_KEY not set — skipping run")
    return NextResponse.json({ skipped: true, reason: "No Resend key" })
  }
  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const kind = `week_inside_${isoWeekKey()}`

  const { data: profiles, error } = await sb
    .from("profiles")
    .select("id, email, name, membership_tier, membership_status")
    .in("membership_tier", ["trial", "member", "grow", "restore", "transform"])
    .neq("membership_status", "cancelled")
    .not("email", "is", null)
    .limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const p of profiles ?? []) {
    const email = p.email as string
    try {
      const { data: already } = await sb
        .from("email_sends")
        .select("id")
        .eq("email", email)
        .eq("kind", kind)
        .maybeSingle()
      if (already) {
        skipped++
        continue
      }

      const input = await getAccountTwinInput(p.id as string, email)
      // Quiet week (no meals in 7 days) AND no score movement → don't email.
      const weekAgo = Date.now() - 7 * 86_400_000
      const weekMeals = input.meals.filter((m) => new Date(m.createdAt).getTime() >= weekAgo)
      const moved = input.previousScore != null && input.score != null && input.score !== input.previousScore
      if (weekMeals.length === 0 && !moved) {
        skipped++
        continue
      }

      const { twin } = await buildAccountTwin(input)
      const slides = buildWeekStory(twin)
      const firstName = ((p.name as string | null) ?? "").split(" ")[0] || null
      const { subject, html, text } = buildWeekInsideEmail(firstName, slides)

      const result = await sendEmail({ to: email, subject, html, text })
      if (result.ok) {
        await sb.from("email_sends").insert({ email, kind, user_id: p.id as string })
        sent++
      } else if (result.skipped === "opted_out") {
        skipped++
      } else {
        failed++
      }
    } catch (err) {
      console.error("[week-inside]", email, err)
      failed++
    }
  }

  return NextResponse.json({ sent, skipped, failed, kind })
}
