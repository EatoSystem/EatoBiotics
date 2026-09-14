import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { ADMIN_COOKIE, verifyAdminCookie } from "@/lib/admin-auth"
import { logServerEvent } from "@/lib/statsig-server"
import { foundingInviteEmail } from "@/lib/email/founding-invite-email"
import { sendEmail } from "@/lib/email/send"

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_COOKIE)?.value
  if (!verifyAdminCookie(cookie)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const db = getSupabase()
  if (!db) return NextResponse.json({ error: "Not configured" }, { status: 503 })

  const { id, status } = (await req.json()) as { id?: string; status?: "admitted" | "rejected" | "waitlist" }
  if (!id || !status) return NextResponse.json({ error: "Missing id or status" }, { status: 400 })

  // Load the application
  const { data: app, error: selErr } = await db
    .from("founding_applications")
    .select("id, email, name, status, admit_token")
    .eq("id", id)
    .limit(1)
    .maybeSingle()
  if (selErr || !app) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Admitting: ensure a token exists
  let admitToken = app.admit_token
  if (status === "admitted" && !admitToken) {
    admitToken = crypto.randomUUID().replace(/-/g, "")
  }

  // Update status (and token when admitted)
  const update: Record<string, unknown> = { status }
  if (status === "admitted") {
    update.admit_token = admitToken
    update.admitted_at = new Date().toISOString()
  }
  const { error: updErr } = await db
    .from("founding_applications")
    .update(update)
    .eq("id", id)
  if (updErr) return NextResponse.json({ error: "Update failed" }, { status: 500 })

  if (status === "admitted") {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://eatobiotics.com"
    const unlockUrl = `${baseUrl}/api/founding/unlock?token=${admitToken}`
    await logServerEvent("founding_admit", "anonymous", { email: app.email })

    // Attempt to email; always return the unlockUrl so the admin can copy as fallback
    let emailResult: Awaited<ReturnType<typeof sendEmail>> | null = null
    try {
      const { subject, html } = foundingInviteEmail(app.name, unlockUrl)
      emailResult = await sendEmail({ to: app.email, subject, html, skipOptOutCheck: true })
      if (emailResult.ok) {
        await db.from("founding_applications").update({ invited_email_sent_at: new Date().toISOString() }).eq("id", id)
      }
    } catch (err) {
      console.warn("[founding/admin/status] Email error:", err)
    }
    return NextResponse.json({ ok: true, unlockUrl, email: emailResult })
  }

  return NextResponse.json({ ok: true })
}

