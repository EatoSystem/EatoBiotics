/**
 * lib/email/combined-report-email.ts — branded email for the foundation→add-on
 * combined report. Mirrors the visual language of the magic-link / results emails.
 */

import type { AssessmentSummary } from "@/lib/assessment/registry"

function scoreChip(label: string, score: number, color: string): string {
  return `<td style="padding:0 6px;">
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 10px;text-align:center;">
      <div style="font-size:30px;font-weight:800;color:${color};line-height:1;">${score}</div>
      <p style="margin:6px 0 0;font-size:11px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:.06em;">${label}</p>
    </div>
  </td>`
}

function bullets(items: string[]): string {
  if (!items.length) return ""
  return `<ul style="margin:8px 0 0;padding-left:18px;color:#374151;font-size:14px;line-height:1.6;">
    ${items.slice(0, 5).map((i) => `<li style="margin-bottom:6px;">${i}</li>`).join("")}
  </ul>`
}

export function buildCombinedReportEmail({
  name,
  foundation,
  addon,
  reportUrl,
}: {
  name?: string
  foundation: AssessmentSummary
  addon: AssessmentSummary | null
  reportUrl: string
}): { subject: string; html: string } {
  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi there,"
  const reportTitle = addon
    ? `Your Food System + ${addon.label} Report`
    : `Your ${foundation.label === "Family" ? "Family " : ""}Food System Report`
  const subject = reportTitle

  const priorities = [...foundation.priorities, ...(addon?.priorities ?? [])]
  const sevenDay = [...foundation.sevenDay, ...(addon?.sevenDay ?? [])]

  const scoresRow = addon
    ? `<tr>${scoreChip("Food System", foundation.score, "#15803d")}${scoreChip(addon.label, addon.score, "#0e7490")}</tr>`
    : `<tr>${scoreChip("Food System", foundation.score, "#15803d")}</tr>`

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${reportTitle}</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;max-width:560px;width:100%;">
      <tr><td style="background:linear-gradient(135deg,#7bc67e,#56C135);padding:32px 40px;text-align:center;">
        <div style="font-size:30px;margin-bottom:10px;">🌿</div>
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${reportTitle}</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,.9);font-size:13px;">${addon ? `${foundation.label} foundation · ${addon.label} focus` : `${foundation.label} foundation`}</p>
      </td></tr>
      <tr><td style="padding:32px 40px;">
        <p style="margin:0 0 18px;color:#111827;font-size:16px;font-weight:600;">${greeting}</p>
        <p style="margin:0 0 22px;color:#374151;font-size:15px;line-height:1.65;">Here's your${addon ? " combined" : ""} Food System report. Your system score builds on your foundation — together they show where to start.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">${scoresRow}</table>
        ${foundation.bandDescription ? `<p style="margin:0 0 18px;color:#374151;font-size:14px;line-height:1.6;"><strong style="color:#111827;">${foundation.bandLabel}.</strong> ${foundation.bandDescription}</p>` : ""}
        ${priorities.length ? `<p style="margin:18px 0 0;color:#111827;font-size:14px;font-weight:700;">Priority areas</p>${bullets(priorities)}` : ""}
        ${sevenDay.length ? `<p style="margin:18px 0 0;color:#111827;font-size:14px;font-weight:700;">Your 7-day actions</p>${bullets(sevenDay)}` : ""}
        <table cellpadding="0" cellspacing="0" style="margin:28px auto 8px;"><tr>
          <td style="background:linear-gradient(135deg,#7bc67e,#56C135);border-radius:12px;">
            <a href="${reportUrl}" style="display:block;padding:15px 36px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">View your full report →</a>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
        <p style="margin:0;color:#9ca3af;font-size:11px;">EatoBiotics · The Food System Inside You · <a href="https://eatobiotics.com" style="color:#9ca3af;text-decoration:none;">eatobiotics.com</a></p>
        <p style="margin:8px 0 0;color:#c4c8cd;font-size:10px;line-height:1.5;">Educational guidance only — not medical advice, diagnosis, or treatment.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`

  return { subject, html }
}
