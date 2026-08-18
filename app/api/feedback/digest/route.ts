import { NextRequest, NextResponse } from "next/server"
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic"
import { getSupabase } from "@/lib/supabase"
import { verifyCronRequest } from "@/lib/cron-auth"
import { sendEmail } from "@/lib/email/send"
import { DIGEST_SYSTEM, buildDigestUser, digestEmailHtml } from "@/lib/feedback/prompts"
import type { FeedbackRow } from "@/lib/feedback/types"

/* ── Weekly feedback digest (cron) ────────────────────────────────────────
   Pulls the last 7 days of feedback, has Claude synthesise a decision-ready
   report, and emails it to the owner. Fails safe: no feedback → a short "quiet
   week" note; no AI key → the raw rows are still summarised structurally.
   Cron-authed (verifyCronRequest) — not user-triggerable.
──────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

async function runDigest(): Promise<NextResponse> {
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const { data, error } = await supabase
    .from("feedback")
    .select("id, user_id, source_page, rating, message, category, sentiment, severity, feature_area, summary, suggested_improvement, status, created_at")
    .gte("created_at", since.toISOString())
    // Redundant while the window is 7 days and retention is 90 — but that makes
    // it safe by ACCIDENT. Widening this digest to a month or a quarter would
    // otherwise start surfacing text the retention policy says is deleted.
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[feedback/digest] read failed:", error.message)
    return NextResponse.json({ error: "Read failed" }, { status: 500 })
  }

  const rows = (data ?? []) as FeedbackRow[]

  // Synthesise the report. If the AI call fails, fall back to the structural
  // summary (buildDigestUser output) so the owner still gets the raw signal.
  let reportMarkdown: string
  try {
    if (rows.length === 0) {
      reportMarkdown = "**Headline** — A quiet week: no customer feedback was submitted. Nothing to action."
    } else {
      const res = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1500,
        temperature: 0.3,
        system: [{ type: "text", text: DIGEST_SYSTEM, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: buildDigestUser(rows) }],
      })
      reportMarkdown = res.content[0]?.type === "text" ? res.content[0].text : buildDigestUser(rows)
    }
  } catch (err) {
    console.error("[feedback/digest] synthesis failed, sending raw:", err)
    reportMarkdown = `**Headline** — Auto-synthesis was unavailable this week; raw feedback below.\n\n${buildDigestUser(rows)}`
  }

  const owner = process.env.OWNER_EMAIL
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"
  const rangeLabel = `${since.toLocaleDateString("en-IE", { day: "numeric", month: "short" })} – ${new Date().toLocaleDateString("en-IE", { day: "numeric", month: "short" })}`

  let emailed = false
  if (owner) {
    const result = await sendEmail({
      to: owner,
      subject: `📊 EatoBiotics feedback digest — ${rows.length} this week`,
      html: digestEmailHtml({ reportMarkdown, count: rows.length, rangeLabel, adminUrl: `${site}/admin/feedback` }),
      skipOptOutCheck: true, // internal ops email, not marketing
    })
    emailed = result.ok
    if (!result.ok) console.error("[feedback/digest] email failed:", result.error ?? result.skipped)
  }

  return NextResponse.json({ ok: true, count: rows.length, emailed })
}

export async function GET(req: NextRequest) {
  const denied = verifyCronRequest(req)
  if (denied) return denied
  return runDigest()
}

export async function POST(req: NextRequest) {
  const denied = verifyCronRequest(req)
  if (denied) return denied
  return runDigest()
}
