import { Resend } from "resend"
import { rateLimit } from "@/lib/rate-limit"

/**
 * Server-side error reporter. Always logs; in production it also emails the
 * owner — throttled to at most 3 alerts per context per hour so a recurring
 * error can't flood the inbox. Never throws, so it's safe in any catch block.
 */
export async function reportError(context: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  console.error(`[${context}]`, message, stack ?? "")

  if (process.env.NODE_ENV !== "production") return

  const resendKey = process.env.RESEND_API_KEY
  const to = process.env.OWNER_EMAIL
  const from = process.env.EMAIL_FROM
  if (!resendKey || !to || !from) return

  // Throttle per context so repeated failures don't spam.
  if (!rateLimit(`error-alert:${context}`, 3, 60 * 60_000).allowed) return

  try {
    const resend = new Resend(resendKey)
    await resend.emails.send({
      from: from.includes("<") ? from : `EatoBiotics Monitoring <${from}>`,
      to,
      subject: `⚠️ EatoBiotics error: ${context}`,
      text: `Context: ${context}\nTime: ${new Date().toISOString()}\n\n${message}\n\n${stack ?? "(no stack)"}`,
    })
  } catch (e) {
    console.error("[report-error] failed to send alert email:", e)
  }
}
