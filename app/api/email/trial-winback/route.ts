import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getSupabase } from "@/lib/supabase"
import { verifyCronRequest } from "@/lib/cron-auth"
import { buildTrialWinbackEmail } from "@/lib/email/trial-winback-email"
import { logServerEvent } from "@/lib/statsig-server"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"

const DAY = 86_400_000

/* ── Trial win-back cron ─────────────────────────────────────────────────
   Daily. Two touchpoints, each sent at most once per user (email_sends):
   - pre:  trial expires within the next ~3 days  → "keep your progress"
   - post: trial expired within the last ~3 days  → gentle come-back + fires
           the `trial_expired` revenue-analytics event.
   Trial state lives on profiles (membership_tier='trial' + trial_expires_at);
   expiry is computed at read time, so the column stays 'trial' after it lapses.
──────────────────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const unauthorised = verifyCronRequest(req)
  if (unauthorised) return unauthorised

  const resendKey = process.env.RESEND_API_KEY
  const emailFrom = process.env.EMAIL_FROM ?? "hello@eatobiotics.com"
  if (!resendKey) {
    console.warn("[trial-winback] RESEND_API_KEY not set — skipping run")
    return NextResponse.json({ skipped: true, reason: "No Resend key" })
  }

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const resend = new Resend(resendKey)
  const now = Date.now()

  // Trial accounts with a known expiry, within a window we might act on.
  const { data: profiles, error } = await sb
    .from("profiles")
    .select("id, email, name, trial_expires_at")
    .eq("membership_tier", "trial")
    .not("trial_expires_at", "is", null)
    .gte("trial_expires_at", new Date(now - 4 * DAY).toISOString())
    .lte("trial_expires_at", new Date(now + 4 * DAY).toISOString())

  if (error) {
    console.error("[trial-winback] profile fetch failed:", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  let pre = 0, post = 0, skipped = 0
  const errors: string[] = []

  for (const p of profiles ?? []) {
    const email = p.email as string | null
    if (!email) { skipped++; continue }
    const expiresMs = new Date(p.trial_expires_at as string).getTime()
    const msLeft = expiresMs - now

    // Decide phase: pre if expiring in (0, 3.5d], post if expired within last 3.5d.
    let phase: "pre" | "post" | null = null
    if (msLeft > 0 && msLeft <= 3.5 * DAY) phase = "pre"
    else if (msLeft <= 0 && msLeft >= -3.5 * DAY) phase = "post"
    if (!phase) { skipped++; continue }

    const kind = phase === "pre" ? "trial_winback_pre" : "trial_winback_post"

    // Idempotency — one of each kind per recipient.
    const { data: already } = await sb
      .from("email_sends")
      .select("id")
      .eq("email", email)
      .eq("kind", kind)
      .maybeSingle()
    if (already) { skipped++; continue }

    try {
      let mealsLogged = 0
      if (phase === "pre") {
        const { count } = await sb
          .from("analyses")
          .select("id", { count: "exact", head: true })
          .eq("user_id", p.id as string)
        mealsLogged = count ?? 0
      }

      const { subject, html } = buildTrialWinbackEmail({
        name: (p.name as string | null) ?? null,
        phase,
        daysLeft: Math.max(1, Math.ceil(msLeft / DAY)),
        mealsLogged,
        baseUrl: BASE_URL,
      })

      const { error: sendErr } = await resend.emails.send({
        from: `EatoBiotics <${emailFrom}>`,
        to: email,
        subject,
        html,
      })
      if (sendErr) throw new Error(sendErr.message)

      await sb.from("email_sends").insert({ email, kind, user_id: p.id as string })

      if (phase === "post") {
        await logServerEvent("trial_expired", p.id as string, { source: "trial_winback" })
        post++
      } else {
        pre++
      }
    } catch (err) {
      errors.push(`${email}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  console.log(`[trial-winback] pre=${pre} post=${post} skipped=${skipped} errors=${errors.length}`)
  return NextResponse.json({ ok: true, pre, post, skipped, errors: errors.length ? errors : undefined })
}
