/**
 * "Food System Mini Report" — sent when someone completes the quick quiz and
 * joins the waitlist. Explains their result (type, three engines, biggest
 * opportunity), teases what the full EatoBiotics report adds (the advert), and
 * links to their shareable web mini report. Built on the shared brand wrapper;
 * email-safe (hex colours, tables, inline styles).
 */
import { renderBrandEmail, BRAND_INK, BRAND_MUTED, SERIF, SANS } from "./brand-layout"
import { getPercentile } from "@/lib/percentile"
import type { AssessmentResult } from "@/lib/assessment-scoring"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"

// Email-safe (hex) engine palette — CSS vars don't render in email clients.
const ENGINE_HEX: Record<"prebiotics" | "probiotics" | "postbiotics", { label: string; color: string }> = {
  prebiotics: { label: "Prebiotics", color: "#4CB648" },
  probiotics: { label: "Probiotics", color: "#2DAA6E" },
  postbiotics: { label: "Postbiotics", color: "#F5A623" },
}

export function waitlistResultEmail(
  result: AssessmentResult,
  name?: string,
  shareCode?: string
): { subject: string; html: string } {
  const { profile, overall, subScores, insights } = result
  const greeting = name ? `Hi ${name},` : "Hi there,"
  const percentile = getPercentile(overall)
  const weakest = insights[0]
  const reportUrl = shareCode ? `${SITE_URL}/discover/${shareCode}` : `${SITE_URL}/enter`
  const subject = `Your Food System Type: ${profile.type} 🌱`

  const engineRow = (key: "prebiotics" | "probiotics" | "postbiotics") => {
    const { label, color } = ENGINE_HEX[key]
    const v = Math.max(0, Math.min(100, subScores[key] ?? 0))
    return `
      <tr>
        <td style="padding:0 0 12px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="font-size:13px;font-weight:bold;color:${color};font-family:${SANS};padding-bottom:5px;">${label}</td>
              <td align="right" style="font-size:13px;font-weight:bold;color:${BRAND_INK};font-family:${SANS};padding-bottom:5px;">${v}/100</td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef2e9;border-radius:999px;">
            <tr><td style="padding:0;">
              <table width="${v}%" cellpadding="0" cellspacing="0" border="0" style="min-width:6%;">
                <tr><td style="background:${color};height:8px;border-radius:999px;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
            </td></tr>
          </table>
        </td>
      </tr>`
  }

  const contentHtml = `
    <div style="padding:34px 40px 8px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND_MUTED};font-family:${SANS};">Your Food System Type</p>
      <h2 style="margin:0 0 4px;font-size:28px;font-weight:bold;color:${BRAND_INK};font-family:${SERIF};">${profile.type}</h2>
      <p style="margin:0 0 18px;font-size:14px;color:${BRAND_MUTED};font-family:${SANS};">
        Overall ${overall}/100 · higher than ${percentile}% of people with typical eating habits
      </p>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#374151;font-family:${SANS};">
        ${greeting} ${profile.tagline} ${profile.description}
      </p>

      <p style="margin:0 0 10px;font-size:12px;font-weight:bold;letter-spacing:0.6px;text-transform:uppercase;color:${BRAND_INK};font-family:${SANS};">Your three engines</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:22px;">
        ${engineRow("prebiotics")}
        ${engineRow("probiotics")}
        ${engineRow("postbiotics")}
      </table>

      ${weakest ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f9ee;border-radius:14px;margin-bottom:24px;">
        <tr><td style="padding:16px 18px;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:bold;color:${BRAND_INK};font-family:${SANS};">Your biggest opportunity: ${weakest.label}</p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;font-family:${SANS};">${weakest.action}</p>
        </td></tr>
      </table>` : ""}

      <p style="margin:0 0 10px;font-size:12px;font-weight:bold;letter-spacing:0.6px;text-transform:uppercase;color:${BRAND_INK};font-family:${SANS};">What your full report adds at launch</p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#374151;font-family:${SANS};">
        Your top foods to prioritise, easy swaps, a 30-day plan built around your weakest engine, pillar deep-dives, AI meal scoring and recipes — the complete EatoBiotics experience. Join the waitlist for early access.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
        <tr><td align="center">
          <a href="${reportUrl}" style="display:inline-block;background-color:#4CB648;background-image:linear-gradient(135deg,#A8E063,#4CB648,#2DAA6E);color:#ffffff;font-size:15px;font-weight:bold;font-family:${SANS};text-decoration:none;padding:14px 34px;border-radius:999px;">View your mini report &rarr;</a>
        </td></tr>
      </table>
      <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:${BRAND_MUTED};font-family:${SANS};text-align:center;">
        Know someone who'd want to meet their food system? Share your mini report — it only takes 60 seconds to discover theirs.
      </p>
    </div>`

  return {
    subject,
    html: renderBrandEmail({
      subject,
      preheader: `You're a ${profile.type} — ${overall}/100. Here's your food system mini report.`,
      contentHtml,
      footerNote: "This snapshot is for education and isn't medical advice. The full personalised report unlocks at launch.",
    }),
  }
}
