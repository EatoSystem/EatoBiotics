import { MEMBER_PRICE_EUR } from "@/lib/membership-tiers"

interface TrialWinbackOpts {
  name?: string | null
  /** "pre" = a few days before expiry, "post" = just expired. */
  phase: "pre" | "post"
  daysLeft?: number
  mealsLogged?: number
  baseUrl: string
}

/**
 * Win-back email for the 30 days included with the Consultation. Two phases:
 *  - pre:  a few days before the included 30 days end ("keep your progress")
 *  - post: just after they ended (gentle come-back)
 * Plain table-based HTML for broad client support.
 *
 * The customer never bought a "free trial" — they bought a €49 Consultation
 * that includes 30 days of EatoBiotics access. Calling that a trial made the
 * paid thing sound free and the included thing sound conditional. The INTERNAL
 * `trial` tier, the `trial_expires_at` column and the `phase` values are
 * unchanged; only what the reader is told changed.
 */
export function buildTrialWinbackEmail(opts: TrialWinbackOpts): { subject: string; html: string } {
  const { name, phase, daysLeft = 3, mealsLogged = 0, baseUrl } = opts
  const firstName = name ? name.split(" ")[0] : null
  const link = `${baseUrl}/pricing`

  const subject = phase === "pre"
    ? `Your EatoBiotics access ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`
    : "Your food system is waiting — pick up where you left off"

  const headline = phase === "pre"
    ? `${firstName ? `${firstName}, your` : "Your"} 30 days are almost up`
    : `${firstName ? `${firstName}, come` : "Come"} back to your food system`

  const body = phase === "pre"
    ? `The 30 days included with your Consultation end in <strong>${daysLeft} day${daysLeft === 1 ? "" : "s"}</strong>. ${
        mealsLogged > 0
          ? `You've logged <strong>${mealsLogged} meal${mealsLogged === 1 ? "" : "s"}</strong> — keep that momentum and your full history going.`
          : `Keep your score history, streaks, and personalised plan going.`
      } Continue as an EatoBiotics Member for €${MEMBER_PRICE_EUR}/month — cancel any time.`
    : `Your included 30 days have ended, but your score history and plan are still here. Pick up where you left off as an EatoBiotics Member for €${MEMBER_PRICE_EUR}/month — and keep building your Food System. Cancel any time.`

  const html = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f8f0; padding: 24px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border-radius: 16px; overflow:hidden; box-shadow: 0 2px 12px rgba(26,46,18,0.08);">
        <tr><td style="height:5px; background: linear-gradient(90deg,#9bd14a,#4cb648,#2e8c2a);"></td></tr>
        <tr><td style="padding: 28px 32px;">
          <p style="margin:0 0 4px; font-size:11px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#2e8c2a; font-family: Arial, sans-serif;">EatoBiotics${phase === "pre" ? " · Member" : ""}</p>
          <h1 style="margin:0 0 12px; font-size:22px; color:#1a2e12; font-family: Georgia, serif;">${headline}</h1>
          <p style="margin:0 0 18px; font-size:15px; line-height:1.55; color:#555555; font-family: Arial, sans-serif;">${body}</p>
          <table cellpadding="0" cellspacing="0" border="0" style="margin: 4px 0;">
            <tr><td style="border-radius: 999px; background: linear-gradient(135deg,#4cb648,#0a7d6b);">
              <a href="${link}" style="display:inline-block; padding: 13px 30px; font-size:15px; font-weight:bold; color:#ffffff; text-decoration:none; font-family: Arial, sans-serif;">Continue as an EatoBiotics Member &rarr;</a>
            </td></tr>
          </table>
          <p style="margin:18px 0 0; font-size:12px; color:#999999; font-family: Arial, sans-serif;">No commitment — cancel any time from your account.</p>
        </td></tr>
      </table>
      <p style="margin:14px 0 0; font-size:11px; color:#aaaaaa; font-family: Arial, sans-serif;">EatoBiotics · You receive this because your Personal Food System Consultation included 30 days of EatoBiotics access.</p>
    </td></tr>
  </table>`

  return { subject, html }
}
