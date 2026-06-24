import { isOptedOut, unsubscribeHeaders } from "./unsubscribe"

/* ── Central email sender ────────────────────────────────────────────────────
   One place to get email compliance right: every marketing email goes through
   sendEmail(), which (1) skips opted-out recipients, (2) attaches the
   List-Unsubscribe one-click headers, then (3) sends via Resend.

   Transactional mail (magic links, payment receipts) may pass
   skipOptOutCheck:true so a user who opted out of marketing still gets the
   email they explicitly requested.
──────────────────────────────────────────────────────────────────────────── */

const DEFAULT_FROM = `EatoBiotics <${process.env.EMAIL_FROM ?? "hello@eatobiotics.com"}>`

export interface SendEmailArgs {
  to: string
  subject: string
  html: string
  from?: string
  bcc?: string[]
  headers?: Record<string, string>
  /** Set for transactional email that must bypass the marketing opt-out. */
  skipOptOutCheck?: boolean
}

export type SendEmailResult =
  | { ok: true }
  | { ok: false; skipped: "no_resend_key" | "opted_out"; error?: undefined }
  | { ok: false; error: string; skipped?: undefined }

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return { ok: false, skipped: "no_resend_key" }

  if (!args.skipOptOutCheck && (await isOptedOut(args.to))) {
    return { ok: false, skipped: "opted_out" }
  }

  try {
    const { Resend } = await import("resend")
    const resend = new Resend(resendKey)
    const { error } = await resend.emails.send({
      from: args.from ?? DEFAULT_FROM,
      to: args.to,
      bcc: args.bcc,
      subject: args.subject,
      html: args.html,
      headers: { ...unsubscribeHeaders(args.to), ...args.headers },
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}
