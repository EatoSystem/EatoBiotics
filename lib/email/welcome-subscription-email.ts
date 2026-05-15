// lib/email/welcome-subscription-email.ts
// Branded welcome email sent when a user subscribes to a paid plan.

interface WelcomeSubscriptionEmailOpts {
  name: string | null
  tier: string  // "grow" | "restore" | "transform"
  dashboardUrl?: string
}

const TIER_LABELS: Record<string, string> = {
  grow:      "Grow",
  restore:   "Restore",
  transform: "Transform",
}

const TIER_FEATURES: Record<string, string[]> = {
  grow: [
    "Unlimited AI meal analysis",
    "Full Biotics score breakdown after every meal",
    "Your gut health timeline and streak tracking",
    "Access to your personal dashboard",
  ],
  restore: [
    "Everything in Grow",
    "Weekly food system reports every Monday",
    "Your personalised monthly gut plan",
    "Priority access to new features",
  ],
  transform: [
    "Everything in Restore",
    "AI consultation — ask questions about any report",
    "Deep weekly narrative with pattern detection",
    "Your personal gut health coach, always on",
  ],
}

const TIER_HEADLINE: Record<string, string> = {
  grow:      "Your gut health journey starts now.",
  restore:   "Your weekly food system reports are ready.",
  transform: "Your personal AI gut health coach is live.",
}

export function welcomeSubscriptionEmailHtml(opts: WelcomeSubscriptionEmailOpts): string {
  const { name, tier, dashboardUrl = "https://eatobiotics.com/account" } = opts

  const firstName = name?.split(" ")[0] ?? "there"
  const tierLabel = TIER_LABELS[tier] ?? tier
  const features  = TIER_FEATURES[tier] ?? TIER_FEATURES.grow
  const headline  = TIER_HEADLINE[tier] ?? TIER_HEADLINE.grow

  const featureRows = features
    .map(
      (f) => `
      <tr>
        <td style="padding:4px 0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="24" style="vertical-align:top;padding-top:2px;">
                <div style="width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,#A8E063,#4CB648);display:flex;align-items:center;justify-content:center;font-size:10px;color:white;font-weight:bold;text-align:center;line-height:16px;">✓</div>
              </td>
              <td style="font-size:14px;color:#333333;line-height:1.5;">${f}</td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join("")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to EatoBiotics ${tierLabel}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f0;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Card -->
        <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Gradient header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6aab28 0%,#2e8c2a 40%,#c49610 75%,#c47010 100%);padding:36px 36px 32px;">
              <!-- Logo row -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:700;color:white;letter-spacing:-0.5px;">EatoBiotics</span>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;background:rgba(255,255,255,0.20);color:white;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:20px;">${tierLabel}</span>
                  </td>
                </tr>
              </table>

              <!-- Hero text -->
              <p style="margin:24px 0 4px;font-size:28px;font-weight:800;color:white;line-height:1.2;">
                Welcome, ${firstName}! 🎉
              </p>
              <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.80);line-height:1.5;">
                ${headline}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">

              <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
                Your <strong>${tierLabel}</strong> plan is now active. Here's what you have access to:
              </p>

              <!-- Feature list -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fdf4;border-radius:12px;padding:16px;margin-bottom:24px;">
                <tr><td style="padding:0 16px 4px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    ${featureRows}
                  </table>
                </td></tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <a href="${dashboardUrl}"
                      style="display:inline-block;background:linear-gradient(135deg,#4CB648,#2DAA6E);color:white;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:50px;box-shadow:0 4px 14px rgba(45,170,110,0.30);">
                      Go to your dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- First step hint -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%"
                style="background:#fffbeb;border-left:4px solid #F5C518;border-radius:0 10px 10px 0;padding:14px 16px;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#a05a0a;text-transform:uppercase;letter-spacing:0.5px;">Your first step</p>
                    <p style="margin:0;font-size:14px;color:#444444;line-height:1.5;">
                      Log your next meal using the <strong>Analyse a meal</strong> button on your dashboard. Your Biotics score is built one meal at a time — the first log sets your baseline.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#888888;line-height:1.6;">
                If you have any questions, just reply to this email — we read every one.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f7;border-top:1px solid #eeeeee;padding:20px 36px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <p style="margin:0;font-size:12px;color:#aaaaaa;">
                      © 2025 EatoBiotics ·
                      <a href="https://eatobiotics.com/privacy" style="color:#aaaaaa;">Privacy Policy</a> ·
                      <a href="https://eatobiotics.com/terms" style="color:#aaaaaa;">Terms of Service</a>
                    </p>
                    <p style="margin:6px 0 0;font-size:11px;color:#bbbbbb;">
                      EatoBiotics is a food-tracking tool and does not provide medical advice.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`
}
