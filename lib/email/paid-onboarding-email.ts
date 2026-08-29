/* ── Paid-member onboarding sequence (D1 / D3 / D7 / D14) ─────────────────
   Sent by app/api/email/paid-onboarding/route.ts (daily cron) to members in
   their first two weeks of a paid subscription — the highest-churn window.
   Table-based HTML for broad email-client support, matching the visual
   language of the free nurture sequence (app/api/email/nurture/route.ts).
──────────────────────────────────────────────────────────────────────── */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"

const TIER_LABELS: Record<string, string> = {
  grow:      "Grow",
  member:    "Member",
  restore:   "Restore",
  transform: "Transform",
}

function baseTemplate(body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e5e5;max-width:560px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#A8E063,#4CB648,#2DAA6E);padding:28px 40px 24px;text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.7);font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">EatoBiotics</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.5);font-size:11px;">The Food System Inside You</p>
          </td>
        </tr>
        <tr><td style="padding:36px 40px;">${body}</td></tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f3f3f3;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:11px;">
              EatoBiotics &middot; <a href="${SITE_URL}/account" style="color:#4CB648;text-decoration:none;">View your account</a> &middot;
              <a href="${SITE_URL}/unsubscribe" style="color:#9ca3af;text-decoration:none;">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function ctaButton(href: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
    <tr><td style="background:linear-gradient(135deg,#A8E063,#4CB648);border-radius:50px;">
      <a href="${href}" style="display:block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:-0.1px;">${label} →</a>
    </td></tr>
  </table>`
}

function calloutBox(label: string, text: string, color = "#4CB648"): string {
  return `<div style="background:${color}18;border-left:3px solid ${color};border-radius:0 10px 10px 0;padding:14px 16px;margin:20px 0;">
    <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:1px;">${label}</p>
    <p style="margin:0;font-size:14px;color:#1A2E12;line-height:1.6;">${text}</p>
  </div>`
}

const greet = (name: string | null) => (name ? `Hi ${name.split(" ")[0]},` : "Hi there,")

export interface PaidOnboardingOpts {
  name: string | null
  tier: string
  /** Meals analysed so far (used in D7 recap). */
  mealsLogged?: number
  /** Latest overall Biotics score, if assessed. */
  latestScore?: number | null
}

/* D1 — you're set up: drive the first meal log */
export function paidDay1Email(opts: PaidOnboardingOpts): { subject: string; html: string } {
  const tierLabel = TIER_LABELS[opts.tier] ?? opts.tier
  return {
    subject: "Day 1 — set your baseline in 30 seconds",
    html: baseTemplate(`
      <p style="margin:0 0 6px;color:#1A2E12;font-size:16px;font-weight:600;">${greet(opts.name)}</p>
      <p style="margin:0 0 20px;color:#5A6E50;font-size:15px;line-height:1.7;">
        Your <strong>${tierLabel}</strong> membership is active. Everything from here is built one meal at a time — and the first log sets your baseline.
      </p>
      ${calloutBox("Today's one thing", "Analyse one meal — breakfast, lunch, whatever's next. It takes about 30 seconds and starts your streak.")}
      ${ctaButton(`${SITE_URL}/analyse`, "Analyse your first meal")}
      <p style="margin:20px 0 0;color:#5A6E50;font-size:13px;line-height:1.7;">
        Prefer to start with your gut's stability? The <a href="${SITE_URL}/stability/assessment" style="color:#4CB648;text-decoration:none;font-weight:600;">3-minute Stability check</a> is included too.
      </p>
    `),
  }
}

/* D3 — feature discovery, tier-aware */
export function paidDay3Email(opts: PaidOnboardingOpts): { subject: string; html: string } {
  const featureBlock =
    opts.tier === "transform"
      ? calloutBox("Have you tried your AI consultant?", `Transform includes one-to-one AI consultations about your gut, your scores, and your plan. Ask it anything — it knows your data. <a href="${SITE_URL}/account/consult" style="color:#4CB648;font-weight:600;text-decoration:none;">Start a consultation →</a>`)
      : opts.tier === "grow"
      ? calloutBox("Your streak is the engine", `Grow gives you unlimited meal analyses and a daily streak. Logging a few meals in week one is what gives your score something to compare against. <a href="${SITE_URL}/analyse" style="color:#4CB648;font-weight:600;text-decoration:none;">Log today's meal →</a>`)
      : calloutBox("Two member tools worth meeting", `Your plan includes the <a href="${SITE_URL}/account/glp1" style="color:#4CB648;font-weight:600;text-decoration:none;">GLP-1 Companion</a> (protein + muscle tracking) and the monthly <a href="${SITE_URL}/stability/report" style="color:#4CB648;font-weight:600;text-decoration:none;">Stability Report</a>. If either fits your life, they're already unlocked.`)

  return {
    subject: "Day 3 — the feature most members miss",
    html: baseTemplate(`
      <p style="margin:0 0 6px;color:#1A2E12;font-size:16px;font-weight:600;">${greet(opts.name)}</p>
      <p style="margin:0 0 20px;color:#5A6E50;font-size:15px;line-height:1.7;">
        Three days in. Most members use one feature and never meet the rest — here's the one we'd point you to first.
      </p>
      ${featureBlock}
      ${ctaButton(`${SITE_URL}/account`, "Open your dashboard")}
    `),
  }
}

/* D7 — first-week recap with their actual numbers */
export function paidDay7Email(opts: PaidOnboardingOpts): { subject: string; html: string } {
  const meals = opts.mealsLogged ?? 0
  const recap =
    meals > 0
      ? `You analysed <strong style="color:#4CB648;">${meals} meal${meals === 1 ? "" : "s"}</strong> in your first week${opts.latestScore != null ? `, and your latest Biotics score is <strong style="color:#4CB648;">${opts.latestScore}/100</strong>` : ""}. That's a real baseline — week two is where the trend line starts meaning something.`
      : `You haven't logged a meal yet — which means week one's data is still waiting to exist. One log today gives week two something to compare against.`

  return {
    subject: meals > 0 ? "Your first week, in numbers" : "Week one's data is still waiting",
    html: baseTemplate(`
      <p style="margin:0 0 6px;color:#1A2E12;font-size:16px;font-weight:600;">${greet(opts.name)}</p>
      <p style="margin:0 0 20px;color:#5A6E50;font-size:15px;line-height:1.7;">${recap}</p>
      ${calloutBox("This week", meals > 0 ? "Keep the rhythm: aim for one log a day. Watch your weakest pillar — that's where the movement shows first." : "Start small: analyse one meal today. The score takes 30 seconds and sets your baseline.")}
      ${ctaButton(meals > 0 ? `${SITE_URL}/account` : `${SITE_URL}/analyse`, meals > 0 ? "See your week" : "Analyse a meal now")}
    `),
  }
}

/* D14 — habit + value reinforcement */
export function paidDay14Email(opts: PaidOnboardingOpts): { subject: string; html: string } {
  return {
    subject: "Two weeks in — what your logs show",
    html: baseTemplate(`
      <p style="margin:0 0 6px;color:#1A2E12;font-size:16px;font-weight:600;">${greet(opts.name)}</p>
      <p style="margin:0 0 20px;color:#5A6E50;font-size:15px;line-height:1.7;">
        Two weeks is long enough for a change to stop being an experiment and start being a habit. Whether you can feel a difference yet varies a lot from person to person — what's in your control is whether there's a record of it, and that comes from logging.
      </p>
      ${calloutBox("Worth 5 minutes this week", `Your <a href="${SITE_URL}/account/doctor-report" style="color:#4CB648;font-weight:600;text-decoration:none;">clinician report</a> turns everything you've tracked into a printable summary you can bring to your GP. It gets better with every week of data.`)}
      <p style="margin:0 0 8px;color:#5A6E50;font-size:14px;line-height:1.7;">
        Check your pillar breakdown — it's the clearest view of where two weeks of effort has gone.
      </p>
      ${ctaButton(`${SITE_URL}/account`, "Check your progress")}
    `),
  }
}

/* Cancellation — sent from the Stripe webhook when a subscription ends */
export function cancellationEmail(opts: { name: string | null; tier: string }): { subject: string; html: string } {
  const tierLabel = TIER_LABELS[opts.tier] ?? "membership"
  return {
    subject: "Your EatoBiotics membership has ended",
    html: baseTemplate(`
      <p style="margin:0 0 6px;color:#1A2E12;font-size:16px;font-weight:600;">${greet(opts.name)}</p>
      <p style="margin:0 0 20px;color:#5A6E50;font-size:15px;line-height:1.7;">
        Your ${tierLabel} membership has ended. No hard feelings — and nothing you tracked is lost.
      </p>
      <p style="margin:0 0 12px;color:#1A2E12;font-size:15px;font-weight:600;">What you still have, free</p>
      <p style="margin:0 0 20px;color:#5A6E50;font-size:14px;line-height:1.7;">
        Your account, your score history, the free assessment, the daily Stability tracker, and the Food Library all stay open. Your data picks up exactly where it left off if you return.
      </p>
      ${calloutBox("If something wasn't working", `Reply to this email and tell us — we read every one. If it was price or timing, membership is one click away whenever it fits again.`, "#F5A623")}
      ${ctaButton(`${SITE_URL}/pricing`, "Rejoin any time")}
    `),
  }
}
