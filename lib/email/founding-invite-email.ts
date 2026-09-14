export function foundingInviteEmail(recipientName: string | null, unlockUrl: string) {
  const friendlyName = recipientName?.trim() || null
  const subject = "You're invited — Founding 100 access"
  const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
    <h1 style="font-size: 20px; margin: 0 0 12px 0;">You're admitted to the Founding 100</h1>
    <p style="margin: 0 0 12px 0;">${friendlyName ? `${friendlyName}, ` : ""}welcome — you’re one of the first 100 people to use EatoBiotics.</p>
    <p style="margin: 0 0 16px 0;">Click below to unlock access. You’ll be able to take your Food System Assessment and get your Biotics Score™ across Prebiotics, Probiotics, and Postbiotics.</p>
    <p>
      <a href="${unlockUrl}" style="display: inline-block; background: #2BB673; color: white; text-decoration: none; padding: 10px 16px; border-radius: 999px; font-weight: 600;">Unlock founder access</a>
    </p>
    <p style="margin-top: 20px; font-size: 12px; color: #64748b;">
      If the button doesn’t work, copy and paste this link into your browser:<br />
      <a href="${unlockUrl}" style="color: #2BB673;">${unlockUrl}</a>
    </p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
    <p style="font-size: 12px; color: #64748b; margin: 0;">
      Educational tool — not medical advice. Unlock link works on one device; if you need help, reply to this email.
    </p>
  </div>
  `
  return { subject, html }
}

