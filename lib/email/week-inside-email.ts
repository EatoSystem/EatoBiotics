/**
 * "Your Food System This Week" — the Monday story, as an email.
 *
 * Renders the member's WeekStorySlide[] (lib/account/week-story — the same
 * slides the in-app story shows) into a dark-stage-styled HTML email with a
 * single CTA into /account/twin. Marketing category: sent via sendEmail()
 * WITHOUT skipOptOutCheck so opt-outs are honoured.
 */

import type { WeekStorySlide } from "@/lib/account/week-story"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

export function buildWeekInsideEmail(firstName: string | null, slides: WeekStorySlide[]): { subject: string; html: string; text: string } {
  const subject = "Your Food System This Week — what your Food System learned"

  const slideHtml = slides
    .map(
      (s) => `
      <tr><td style="padding:0 28px 22px 28px;">
        <p style="margin:0;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${s.accent};font-family:Arial,sans-serif;">${esc(s.eyebrow)}</p>
        ${s.stat ? `<p style="margin:6px 0 0 0;font-size:44px;line-height:1;font-weight:bold;color:${s.accent};font-family:Georgia,serif;">${esc(s.stat)}</p>` : ""}
        <p style="margin:6px 0 0 0;font-size:20px;line-height:1.3;font-weight:bold;color:#FDFBF7;font-family:Georgia,serif;">${esc(s.title)}</p>
        <p style="margin:6px 0 0 0;font-size:14px;line-height:1.5;color:rgba(253,251,247,0.65);font-family:Arial,sans-serif;">${esc(s.detail)}</p>
      </td></tr>`,
    )
    .join("")

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#F4F8EC;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F8EC;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:linear-gradient(175deg,#0B1607 0%,#122208 60%,#16290F 100%);background-color:#0B1607;border-radius:16px;overflow:hidden;">
  <tr><td style="height:4px;background:linear-gradient(90deg,#A8E063,#4CB648,#2DAA6E,#F5C518,#F5A623);font-size:0;">&nbsp;</td></tr>
  <tr><td style="padding:30px 28px 8px 28px;">
    <p style="margin:0;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#A8E063;font-family:Arial,sans-serif;">Your Food System This Week</p>
    <p style="margin:8px 0 0 0;font-size:24px;line-height:1.25;font-weight:bold;color:#FDFBF7;font-family:Georgia,serif;">
      ${firstName ? esc(firstName) + ", h" : "H"}ere's what your Food System learned this week.
    </p>
  </td></tr>
  ${slideHtml}
  <tr><td align="center" style="padding:6px 28px 30px 28px;">
    <a href="${BASE_URL}/account/twin" style="display:inline-block;background:#4CB648;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;padding:13px 28px;border-radius:999px;">Open your Food System →</a>
  </td></tr>
  <tr><td style="padding:0 28px 26px 28px;">
    <p style="margin:0;font-size:11px;line-height:1.5;color:rgba(253,251,247,0.4);font-family:Arial,sans-serif;">
      EatoBiotics provides food-first guidance for general wellbeing and is not medical advice.
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`

  const text =
    `Your Food System This Week — what your Food System learned\n\n` +
    slides.map((s) => `${s.eyebrow.toUpperCase()}\n${s.stat ? s.stat + " — " : ""}${s.title}\n${s.detail}\n`).join("\n") +
    `\nOpen your Food System: ${BASE_URL}/account/twin\n\n` +
    `EatoBiotics provides food-first guidance for general wellbeing and is not medical advice.`

  return { subject, html, text }
}
