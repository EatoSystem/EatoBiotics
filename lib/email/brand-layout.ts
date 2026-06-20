/**
 * Shared EatoBiotics email shell. Every transactional email should wrap its
 * body in renderBrandEmail() so the header, footer, typography, and brand
 * colours stay consistent. Email-safe: tables + inline styles, solid colour
 * fallbacks behind every gradient (Outlook/Gmail strip CSS gradients).
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"

/** Full 5-stop brand gradient (matches .brand-gradient in app/globals.css). */
export const BRAND_GRADIENT =
  "linear-gradient(135deg,#A8E063 0%,#4CB648 25%,#2DAA6E 50%,#F5C518 75%,#F5A623 100%)"
/** Solid fallback for clients that drop gradients. */
export const BRAND_GREEN = "#4CB648"
export const BRAND_TEAL = "#2DAA6E"
export const BRAND_INK = "#1A2E12"
export const BRAND_MUTED = "#5A6E50"
/** Email-safe font stacks echoing Lora (serif) and DM Sans (sans). */
export const SERIF = "Georgia, 'Times New Roman', serif"
export const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"

export interface BrandEmailOpts {
  subject: string
  /** Hidden inbox preview text. */
  preheader?: string
  /** Inner HTML rendered inside the white card, below the brand header. */
  contentHtml: string
  /** Optional small print shown under the card, above the footer (e.g. a disclaimer). */
  footerNote?: string
}

export function renderBrandEmail({ subject, preheader, contentHtml, footerNote }: BrandEmailOpts): string {
  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0;">${preheader}</div>`
    : ""
  const footerNoteHtml = footerNote
    ? `<p style="margin:0 0 14px;font-size:11px;color:#9aa896;font-family:${SANS};line-height:1.6;text-align:center;">${footerNote}</p>`
    : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f1;font-family:${SANS};">
  ${preheaderHtml}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f1;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 6px 24px rgba(26,46,18,0.08);">

          <!-- Brand header -->
          <tr>
            <td style="background-color:${BRAND_GREEN};background-image:${BRAND_GRADIENT};padding:34px 40px;text-align:center;">
              <img src="${SITE_URL}/eatobiotics-icon.png" alt="EatoBiotics" width="48" height="48" style="display:inline-block;width:48px;height:48px;border-radius:12px;background:#ffffff;padding:6px;margin-bottom:12px;" />
              <h1 style="margin:0;font-size:24px;font-weight:bold;color:#ffffff;font-family:${SERIF};letter-spacing:-0.3px;">EatoBiotics</h1>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.92);font-family:${SANS};letter-spacing:0.2px;">The Food System Inside You</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:0;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f7f9f4;padding:22px 40px;text-align:center;border-top:1px solid #e8ece2;">
              ${footerNoteHtml}
              <p style="margin:0 0 4px;font-size:12px;font-weight:bold;color:${BRAND_INK};font-family:${SERIF};">EatoBiotics</p>
              <p style="margin:0;font-size:11px;color:#9aa896;font-family:${SANS};">
                The Food System Inside You &middot; <a href="${SITE_URL}" style="color:#9aa896;text-decoration:none;">eatobiotics.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
