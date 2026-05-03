// lib/email/sequence-email.ts
// Shared template builder for the EatoBiotics email nurture sequence.
// Uses the same inline-styles HTML table pattern as results-email.ts.

export interface SequenceEmailOpts {
  name: string
  email: string
  score: number
  profileType: string
  weakestPillar: "feed" | "seed" | "heal"
  feedScore: number
  seedScore: number
  healScore: number
  dayOffset: number // 0, 1, 2, 3, 5, 7, 10, 14, 21, 28
}

/* ── Pillar helpers ─────────────────────────────────────────────────── */

const PILLAR_LABELS: Record<string, string> = {
  feed: "Prebiotics",
  seed: "Probiotics",
  heal: "Postbiotics",
}

const PILLAR_COLORS: Record<string, string> = {
  feed: "#7fc47e",
  seed: "#3ab0a0",
  heal: "#e6b84a",
}

const PILLAR_ACTIONS: Record<string, string> = {
  feed: "Add one fibre-rich plant to every main meal this week — oats, lentils, garlic, or sweet potato all count.",
  seed: "Add one fermented food to at least one meal each day — kefir, live yoghurt, miso, kimchi, or sauerkraut.",
  heal: "Set three anchor meal times and protect them. Your gut's recovery system runs on rhythm.",
}

const PILLAR_INSIGHT: Record<string, string> = {
  feed: "Your Prebiotics score reflects how much fibre and plant diversity you're giving your gut bacteria. These are the raw materials your microbiome uses to produce short-chain fatty acids — the molecules that protect your gut lining and regulate inflammation.",
  seed: "Your Probiotics score reflects how regularly you introduce live, fermented foods. These foods directly seed your gut with beneficial bacteria — the fastest dietary route to improving microbial diversity and mood stability.",
  heal: "Your Postbiotics score reflects your meal rhythm and polyphenol intake. Consistent meal timing synchronises your circadian clock, regulates cortisol, and lets your gut prepare digestive enzymes in advance — delivering more benefit from the food you're already eating.",
}

/* ── Day-specific email content ─────────────────────────────────────── */

interface EmailContent {
  subject: string
  headline: string
  body: string
  cta: string
  ctaUrl: string
  showScores?: boolean
}

function getEmailContent(opts: SequenceEmailOpts): EmailContent {
  const { name, score, profileType, weakestPillar, dayOffset } = opts
  const firstName = name.split(" ")[0] || "there"
  const pillarLabel = PILLAR_LABELS[weakestPillar] ?? "Seed"
  const baseUrl = "https://eatobiotics.com"

  switch (dayOffset) {
    case 0:
      return {
        subject: `Your EatoBiotics Score is ${score}/100`,
        headline: `${firstName}, your EatoBiotics Score is ${score}/100`,
        body: `You've completed the EatoBiotics Assessment and your score reflects something real about how your food system is working right now. Your profile is <strong>${profileType}</strong> — and below you'll see exactly how your three Biotics compare.<br /><br />Prebiotics, Probiotics, and Postbiotics each measure a different dimension of your food system. The one with the lowest score is where you'll see the fastest improvement with a small, consistent change.`,
        cta: "See My Score Breakdown",
        ctaUrl: `${baseUrl}/assessment`,
        showScores: true,
      }

    case 1:
      return {
        subject: `What your score of ${score} actually means`,
        headline: `${firstName}, here's what your ${score} means`,
        body: `A score of ${score} puts you in the <strong>${profileType}</strong> category. That means your food system has ${score >= 65 ? "strong foundations with clear refinement opportunities" : score >= 50 ? "a developing base that's ready to compound quickly with consistency" : "real room to grow — and the improvements from here will be fast and felt"}.<br /><br />Your score isn't a verdict. It's a starting measurement. The people who improve fastest are the ones who focus on just one pillar first — not all three at once. Your <strong>${pillarLabel}</strong> score is your biggest lever right now.`,
        cta: "Unlock My 30-Day Plan — €49",
        ctaUrl: `${baseUrl}/assessment`,
        showScores: false,
      }

    case 2:
      return {
        subject: `Your ${pillarLabel} score is holding you back`,
        headline: `Your ${pillarLabel} score: the gap worth closing`,
        body: `${PILLAR_INSIGHT[weakestPillar]}<br /><br />The fastest way to move your ${pillarLabel} score is a single daily habit — not a complete overhaul. Here's the one that makes the most difference:<br /><br /><strong>${PILLAR_ACTIONS[weakestPillar]}</strong><br /><br />Most people notice a difference within 2 weeks of making this consistent.`,
        cta: "Get My Personal Report — €49",
        ctaUrl: `${baseUrl}/pricing`,
        showScores: false,
      }

    case 3:
      return {
        subject: "One food change. Real difference.",
        headline: `One change for your ${pillarLabel} score`,
        body: `${firstName}, here's something worth trying today: ${PILLAR_ACTIONS[weakestPillar].toLowerCase()}<br /><br />This isn't generic advice — it's specifically the right move for your ${pillarLabel} score of ${opts[`${weakestPillar}Score` as keyof SequenceEmailOpts] as number}. Small and consistent beats sporadic and ambitious every time when it comes to gut health.`,
        cta: "Get My 30-Day Plan — €49",
        ctaUrl: `${baseUrl}/pricing`,
        showScores: false,
      }

    case 5:
      return {
        subject: "Why consistency beats perfection for your gut",
        headline: "Consistency is the most underrated gut health tool",
        body: `The gut microbiome doesn't respond well to bursts of effort. It responds to rhythm — the same inputs at roughly the same times, day after day.<br /><br />That's why your ${pillarLabel} score moves faster from consistent small actions than from occasional perfect days. Your microbiome needs predictability to recalibrate its bacterial populations.<br /><br />If you've tried the one action from day 3, you've already started the process. Three more days of it and your gut is already adapting.`,
        cta: "Unlock My Full Plan — €49",
        ctaUrl: `${baseUrl}/pricing`,
        showScores: false,
      }

    case 7:
      return {
        subject: `${firstName}, one week in — are you making progress?`,
        headline: "Week one check-in",
        body: `It's been a week since you got your EatoBiotics Score of <strong>${score}</strong>. If you've been working on your ${pillarLabel} score, you're already in the top 20% of people who actually act on their results.<br /><br />Your Personal Report takes everything further — a full 30-day plan built around your specific scores, your top 10 foods, and a week-by-week guide that adapts to where you are in the process. Most people who get it see a score improvement of 8–18 points within 30 days.`,
        cta: "Get My Personal Report — €49",
        ctaUrl: `${baseUrl}/pricing`,
        showScores: true,
      }

    case 10:
      return {
        subject: `${firstName}, your gut health window is open`,
        headline: "The gut-brain connection rewards early action",
        body: `Your gut microbiome has a renewal window. The bacteria that drive your energy, mood, and immunity are constantly turning over — the ones you feed survive, the ones you don't are replaced.<br /><br />That's why the next 30 days are your highest-leverage moment. The changes you make now compound. The Personal Report gives you exactly what to do, when — so none of that momentum is wasted.`,
        cta: "Get My 30-Day Plan — €49",
        ctaUrl: `${baseUrl}/pricing`,
        showScores: false,
      }

    case 14:
      return {
        subject: "What happens to your gut after 14 days of change",
        headline: "14 days of consistent input — what's happening inside",
        body: `At the 14-day mark, your gut microbiome has had enough consistent input to start shifting its bacterial composition. The species you're feeding are multiplying. The species you're not feeding are declining.<br /><br />This is the window where people start noticing: clearer energy in the afternoon, less bloating, more stable mood. Not dramatic — just less friction.<br /><br />Your Personal Report maps this process specifically for your Prebiotics, Probiotics, and Postbiotics scores — so you know exactly what's happening and what to do next.`,
        cta: "Get My Personal Report — €49",
        ctaUrl: `${baseUrl}/pricing`,
        showScores: false,
      }

    case 21:
      return {
        subject: "Three weeks in: the EatoBiotics way",
        headline: "What three consistent weeks does for your gut",
        body: `By week three, the gut microbiome changes are measurable. Microbial diversity has increased. Short-chain fatty acid production is up. The gut-brain signalling pathways are more active.<br /><br />The people making the most progress right now are the ones with a Personal Report — a concrete 30-day plan that tells them exactly what to do each week, with their specific food recommendations and score targets.<br /><br />Your score of ${score} has real room to move. The next version of it is 8–18 points higher — and it's available in 30 days.`,
        cta: "Get My Plan Now — €49",
        ctaUrl: `${baseUrl}/pricing`,
        showScores: false,
      }

    case 28:
      return {
        subject: "Last chance: your 30-day plan is waiting",
        headline: `${firstName}, your gut health window is closing`,
        body: `This is the last email in your EatoBiotics sequence. Your score of <strong>${score}</strong> — and everything it tells you about your ${pillarLabel} gap — stays relevant as long as you act on it.<br /><br />The Personal Report is €49. It gives you a full 30-day plan, your top 10 foods, a weekly shopping framework, and a free 30-day account to follow the plan. Most people who get it improve their score by 8–18 points within a month.<br /><br />If €49 isn't right for you today, the Starter Insights (€19) gives you your key action and a 7-day kickstart — a meaningful step for a smaller commitment.`,
        cta: "Get My Personal Report — €49",
        ctaUrl: `${baseUrl}/pricing`,
        showScores: true,
      }

    default:
      return {
        subject: `Your EatoBiotics Score: ${score}/100`,
        headline: `${firstName}, your gut health update`,
        body: `Your EatoBiotics Score is <strong>${score}/100</strong>. Your ${pillarLabel} score is your biggest opportunity. ${PILLAR_ACTIONS[weakestPillar]}`,
        cta: "Get My Personal Report — €49",
        ctaUrl: `${baseUrl}/pricing`,
        showScores: false,
      }
  }
}

/* ── Main export ────────────────────────────────────────────────────── */

export function buildSequenceEmail(opts: SequenceEmailOpts): { subject: string; html: string } {
  const content = getEmailContent(opts)
  const { feedScore, seedScore, healScore } = opts

  const pillarsHtml = content.showScores
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
        ${(["feed", "seed", "heal"] as const)
          .map((key) => {
            const score = key === "feed" ? feedScore : key === "seed" ? seedScore : healScore
            const label = PILLAR_LABELS[key]
            const color = PILLAR_COLORS[key]
            const pct = Math.round(score)
            return `
          <tr>
            <td style="padding: 4px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f7f7f7; border-radius: 8px; border-left: 3px solid ${color};">
                <tr>
                  <td style="padding: 8px 12px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size: 12px; font-weight: bold; color: #333333; font-family: Arial, sans-serif;">${label}</td>
                        <td style="text-align: right; font-size: 13px; font-weight: bold; color: ${color}; font-family: Arial, sans-serif;">${pct}/100</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 4px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="background: #e0e0e0; border-radius: 4px; height: 5px;">
                                <div style="background: ${color}; width: ${pct}%; height: 5px; border-radius: 4px;"></div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
          })
          .join("")}
      </table>`
    : ""

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${content.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f0; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f0; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7fc47e 0%, #3ab0a0 100%); padding: 20px 40px; text-align: center;">
              <p style="margin: 0; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.8); font-family: Arial, sans-serif;">EatoBiotics</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px 0;">
              <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: bold; color: #222222; font-family: Georgia, serif; line-height: 1.3;">${content.headline}</h1>
              ${pillarsHtml}
              <p style="margin: 0; font-size: 14px; color: #444444; font-family: Arial, sans-serif; line-height: 1.7;">${content.body}</p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 28px 40px 0; text-align: center;">
              <a href="${content.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #7fc47e 0%, #3ab0a0 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; font-family: Arial, sans-serif; padding: 14px 32px; border-radius: 50px;">${content.cta}</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f9f9f9; padding: 20px 40px; margin-top: 24px; text-align: center; border-top: 1px solid #eeeeee; margin-top: 32px;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #aaaaaa; font-family: Arial, sans-serif;">© EatoBiotics · <a href="https://eatobiotics.com" style="color: #aaaaaa; text-decoration: none;">eatobiotics.com</a></p>
              <p style="margin: 0; font-size: 11px; color: #cccccc; font-family: Arial, sans-serif;">Educational content — not medical advice. <a href="https://eatobiotics.com/unsubscribe?email=${encodeURIComponent(opts.email)}" style="color: #cccccc;">Unsubscribe</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject: content.subject, html }
}
