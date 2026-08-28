// lib/email/sequence-email.ts
// Shared template builder for the EatoBiotics email nurture sequence.
// Uses the same inline-styles HTML table pattern as results-email.ts.

import { PILLAR_LABELS } from "@/lib/pillars"
import { REPORT_OFFER_SENTENCE, REPORT_PRICE_EUR } from "@/lib/report/offer"

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
  feed: "Your Prebiotics score reflects how much fibre and plant diversity you're giving your gut bacteria. Gut bacteria ferment these fibres into short-chain fatty acids, which research associates with gut-lining integrity and inflammatory balance.",
  seed: "Your Probiotics score reflects how regularly you introduce live, fermented foods. They carry live cultures, and regular intake of fermented foods is associated in studies with greater microbial diversity.",
  heal: "Your Postbiotics score reflects your meal rhythm and polyphenol intake. The gut keeps a daily rhythm, and regular meal timing is associated with better-anticipated digestion — which may help you get more from food you are already eating.",
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
        body: `You've completed the EatoBiotics Assessment and your score reflects something real about how your food system is working right now. Your profile is <strong>${profileType}</strong> — and below you'll see exactly how your three Biotics compare.<br /><br />Prebiotics, Probiotics, and Postbiotics each measure a different dimension of your food system. The one with the lowest score is usually the most useful place to start.`,
        cta: "See My Score Breakdown",
        ctaUrl: `${baseUrl}/assessment`,
        showScores: true,
      }

    case 1:
      return {
        subject: `What your score of ${score} actually means`,
        headline: `${firstName}, here's what your ${score} means`,
        body: `A score of ${score} puts you in the <strong>${profileType}</strong> category. That means your food system has ${score >= 65 ? "strong foundations with clear refinement opportunities" : score >= 50 ? "a developing base that's ready to compound quickly with consistency" : "real room to grow, and a clear place to start"}.<br /><br />Your score isn't a verdict. It's a starting point. Focusing on one pillar first — rather than all three at once — is what makes a change easy enough to keep. Your <strong>${pillarLabel}</strong> score is your biggest lever right now.`,
        cta: "Unlock My 30-Day Plan — €49",
        ctaUrl: `${baseUrl}/assessment`,
        showScores: false,
      }

    case 2:
      return {
        subject: `Your ${pillarLabel} score is holding you back`,
        headline: `Your ${pillarLabel} score: the gap worth closing`,
        body: `${PILLAR_INSIGHT[weakestPillar]}<br /><br />Moving your ${pillarLabel} score starts with a single daily habit rather than a complete overhaul. Here's the one we'd start with:<br /><br /><strong>${PILLAR_ACTIONS[weakestPillar]}</strong>`,
        cta: "Get My Food System Report — €49",
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
        body: `It's been a week since you got your EatoBiotics Score of <strong>${score}</strong>. If you've made a start on your ${pillarLabel} score, that's the hard part — most people never get past reading the result.<br /><br />Your Food System Report takes it further: ${REPORT_OFFER_SENTENCE}`,
        cta: "Get My Food System Report — €49",
        ctaUrl: `${baseUrl}/pricing`,
        showScores: true,
      }

    case 10:
      return {
        subject: `${firstName}, your gut health window is open`,
        headline: "The gut-brain connection rewards early action",
        body: `Gut bacteria turn over continually, and what you eat is one of the things that shapes which populations are supported. That is why researchers describe diet as one of the more modifiable influences on the microbiome.<br /><br />It also means a plan is worth more than a single good week. The Food System Report sets out what to do and when, so a change has somewhere to go.`,
        cta: "Get My 30-Day Plan — €49",
        ctaUrl: `${baseUrl}/pricing`,
        showScores: false,
      }

    case 14:
      return {
        subject: "Two weeks in — the part most people skip",
        headline: "Two weeks of consistent input",
        body: `Two weeks is roughly the point at which a change stops being an experiment and starts being how you eat. Whether anything has shifted for you is something only you can say — some people report feeling steadier by now, and plenty notice nothing yet. Neither means it isn't working.<br /><br />Your Food System Report maps what to do next against your own Prebiotics, Probiotics and Postbiotics scores, rather than a general timeline.`,
        cta: "Get My Food System Report — €49",
        ctaUrl: `${baseUrl}/pricing`,
        showScores: false,
      }

    case 21:
      return {
        subject: "Three weeks in: the EatoBiotics way",
        headline: "What three consistent weeks does for your gut",
        body: `Studies of sustained dietary change have observed shifts in microbial diversity and short-chain fatty acid production over a period of weeks. What that looks like in any one person varies, and nothing here has measured yours.<br /><br />What we can tell you is what to do next. The Food System Report is a concrete 30-day plan built around your own scores.<br /><br />Your score of ${score} has room to move. Retake the assessment in 30 days and you'll see where it actually went.`,
        cta: "Get My Plan Now — €49",
        ctaUrl: `${baseUrl}/pricing`,
        showScores: false,
      }

    case 28:
      return {
        subject: "Last chance: your 30-day plan is waiting",
        headline: `${firstName}, your gut health window is closing`,
        body: `This is the last email in your EatoBiotics sequence. Your score of <strong>${score}</strong> — and everything it tells you about your ${pillarLabel} gap — stays relevant as long as you act on it.<br /><br />The Food System Report is €${REPORT_PRICE_EUR}. ${REPORT_OFFER_SENTENCE}`,
        cta: "Get My Food System Report — €49",
        ctaUrl: `${baseUrl}/pricing`,
        showScores: true,
      }

    default:
      return {
        subject: `Your EatoBiotics Score: ${score}/100`,
        headline: `${firstName}, your gut health update`,
        body: `Your EatoBiotics Score is <strong>${score}/100</strong>. Your ${pillarLabel} score is your biggest opportunity. ${PILLAR_ACTIONS[weakestPillar]}`,
        cta: "Get My Food System Report — €49",
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
