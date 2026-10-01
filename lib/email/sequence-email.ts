// lib/email/sequence-email.ts
// Shared template builder for the EatoBiotics email nurture sequence.
// Uses the same inline-styles HTML table pattern as results-email.ts.

import { PILLAR_LABELS, pillarBehaviour } from "@/lib/pillars"
import { REPORT_OFFER_SENTENCE, REPORT_PRICE_EUR } from "@/lib/report/offer"

export interface SequenceEmailOpts {
  name: string
  email: string
  score: number
  profileType: string
  weakestPillar: "feed" | "seed" | "heal"
  /*
   * The three per-Biotic sub-scores used to arrive here and be rendered as
   * numbers and bars. They are gone from the CONTRACT, not just from the
   * markup — a field the template still accepted would be an invitation to
   * render it again, and that is exactly how this claim has returned before.
   */
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
  feed: "Your answers described how much fibre and plant variety reaches your gut. Gut bacteria ferment those fibres into short-chain fatty acids, which research associates with gut-lining integrity and inflammatory balance.",
  seed: "Your answers described how regularly foods transformed by fermentation appear in your week. Whether live microorganisms survive to be eaten depends on the food and how it is made — but regular intake of fermented foods is associated in studies with greater microbial diversity.",
  heal: "Your answers described your meal rhythm and the polyphenol-rich foods you eat. The gut keeps a daily rhythm, and regular meal timing is associated with better-anticipated digestion — which may help you get more from food you are already eating.",
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
  /*
   * The priority names the BEHAVIOUR, not the Biotic. "Your Postbiotics score
   * is holding you back" is a personal postbiotic state in an inbox, which
   * POSTBIOTICS_INFERENCE_BOUNDARY prohibits by name — and it is the same
   * claim Tranche 2A removed from the reveal, the result and the share card.
   * It survived here because no guard was reading email. Shared mapping, so
   * the reveal, the results page, /discover and this template cannot drift.
   */
  const priority = pillarBehaviour(pillarLabel) ?? "your food rhythm"
  const baseUrl = "https://eatobiotics.com"

  switch (dayOffset) {
    case 0:
      return {
        subject: `Your Biotics Score™ is ${score}/100`,
        headline: `${firstName}, your Biotics Score™ is ${score}/100`,
        /*
         * GATE 5 — describe the measurement, not the biology.
         *
         * This read: "your Biotics Score™ reflects something real about how
         * your food system is working right now". It turned a
         * questionnaire-derived number into an assertion about the person's
         * underlying system — the boundary several gates have been spent
         * tightening, in an inbox, where nobody reviews it twice.
         *
         * The score summarises ANSWERS. That is all it has ever seen. The rest
         * of this email is unchanged: the profile type, the Three Biotics
         * foundation line and the priority all stay as Tranche 2C left them,
         * because a correction is never an excuse to rewrite what was already
         * reviewed.
         */
        body: `You've completed your Food System Assessment, and your Biotics Score™ summarises patterns in the answers you gave about how you currently eat. Your profile is <strong>${profileType}</strong>.<br /><br />Prebiotics, Probiotics and Postbiotics are the foundation the score is built on. Right now the most useful place to start is <strong>${priority}</strong>.`,
        cta: "See My Score Breakdown",
        ctaUrl: `${baseUrl}/assessment`,
        showScores: true,
      }

    case 1:
      return {
        subject: `What your score of ${score} actually means`,
        headline: `${firstName}, here's what your ${score} means`,
        body: `A score of ${score} puts you in the <strong>${profileType}</strong> category. That means your food system has ${score >= 65 ? "strong foundations with clear refinement opportunities" : score >= 50 ? "a developing base that's ready to compound quickly with consistency" : "real room to grow, and a clear place to start"}.<br /><br />Your score isn't a verdict. It's a starting point. Focusing on one pathway first — rather than all three at once — is what makes a change easy enough to keep. Your biggest lever right now is <strong>${priority}</strong>.`,
        cta: `Begin My Consultation — €${REPORT_PRICE_EUR}`,
        ctaUrl: `${baseUrl}/assessment`,
        showScores: false,
      }

    case 2:
      return {
        subject: `The one thing worth changing first`,
        headline: `${priority.charAt(0).toUpperCase()}${priority.slice(1)}: the gap worth closing`,
        body: `${PILLAR_INSIGHT[weakestPillar]}<br /><br />Shifting ${priority} starts with a single daily habit rather than a complete overhaul. Here's the one we'd start with:<br /><br /><strong>${PILLAR_ACTIONS[weakestPillar]}</strong>`,
        cta: `Begin My Consultation — €${REPORT_PRICE_EUR}`,
        ctaUrl: `${baseUrl}/pricing`,
        showScores: false,
      }

    case 3:
      return {
        subject: "One food change. Real difference.",
        headline: `One change worth making today`,
        body: `${firstName}, here's something worth trying today: ${PILLAR_ACTIONS[weakestPillar].toLowerCase()}<br /><br />This isn't generic advice — it's specifically the right move for ${priority}, which your answers pointed to. Small and consistent beats sporadic and ambitious every time when it comes to gut health.`,
        cta: `Begin My Consultation — €${REPORT_PRICE_EUR}`,
        ctaUrl: `${baseUrl}/pricing`,
        showScores: false,
      }

    case 5:
      return {
        subject: "Why consistency beats perfection for your gut",
        headline: "Consistency is the most underrated gut health tool",
        body: `Research on diet and the gut tends to look at habits held over time rather than short bursts of effort — the same inputs at roughly the same times, day after day.<br /><br />That is the case for small consistent actions on ${priority} over occasional perfect days: they are the ones you can still be doing next month.<br /><br />If you tried the one action from day 3, you have the hard part done. Three more days and it stops being something you have to remember.`,
        cta: `Begin My Consultation — €${REPORT_PRICE_EUR}`,
        ctaUrl: `${baseUrl}/pricing`,
        showScores: false,
      }

    case 7:
      return {
        subject: `${firstName}, one week in — are you making progress?`,
        headline: "Week one check-in",
        body: `It's been a week since you got your Biotics Score of <strong>${score}</strong>. If you've made a start on ${priority}, that's the hard part — most people never get past reading the result.<br /><br />Your Personal Food System Consultation takes it further: ${REPORT_OFFER_SENTENCE}`,
        cta: `Begin My Consultation — €${REPORT_PRICE_EUR}`,
        ctaUrl: `${baseUrl}/pricing`,
        showScores: true,
      }

    case 10:
      return {
        subject: `${firstName}, your gut health window is open`,
        headline: "The gut-brain connection rewards early action",
        body: `Gut bacteria turn over continually, and what you eat is one of the things that shapes which populations are supported. That is why researchers describe diet as one of the more modifiable influences on the microbiome.<br /><br />It also means a plan is worth more than a single good week. The Food System Report sets out what to do and when, so a change has somewhere to go.`,
        cta: `Begin My Consultation — €${REPORT_PRICE_EUR}`,
        ctaUrl: `${baseUrl}/pricing`,
        showScores: false,
      }

    case 14:
      return {
        subject: "Two weeks in — the part most people skip",
        headline: "Two weeks of consistent input",
        body: `Two weeks is roughly the point at which a change stops being an experiment and starts being how you eat. Whether anything has shifted for you is something only you can say — some people report feeling steadier by now, and plenty notice nothing yet. Neither means it isn't working.<br /><br />Your Food System Report maps what to do next against your own Prebiotics, Probiotics and Postbiotics scores, rather than a general timeline.`,
        cta: `Begin My Consultation — €${REPORT_PRICE_EUR}`,
        ctaUrl: `${baseUrl}/pricing`,
        showScores: false,
      }

    case 21:
      return {
        subject: "Three weeks in: the EatoBiotics way",
        headline: "What three consistent weeks does for your gut",
        body: `Studies of sustained dietary change have observed shifts in microbial diversity and short-chain fatty acid production over a period of weeks. What that looks like in any one person varies, and nothing here has measured yours.<br /><br />What we can tell you is what to do next. The Food System Report is a concrete 30-day plan built around your own scores.<br /><br />Your score of ${score} has room to move. Retake the assessment in 30 days and you'll see where it actually went.`,
        cta: `Begin My Consultation — €${REPORT_PRICE_EUR}`,
        ctaUrl: `${baseUrl}/pricing`,
        showScores: false,
      }

    case 28:
      return {
        subject: "Last chance: your 30-day plan is waiting",
        headline: `${firstName}, your gut health window is closing`,
        body: `This is the last email in your EatoBiotics sequence. Your score of <strong>${score}</strong> — and everything your answers said about ${priority} — stays relevant as long as you act on it.<br /><br />The Food System Report is €${REPORT_PRICE_EUR}. ${REPORT_OFFER_SENTENCE}`,
        cta: `Begin My Consultation — €${REPORT_PRICE_EUR}`,
        ctaUrl: `${baseUrl}/pricing`,
        showScores: true,
      }

    default:
      return {
        subject: `Your Biotics Score™: ${score}/100`,
        headline: `${firstName}, your gut health update`,
        body: `Your Biotics Score™ is <strong>${score}/100</strong>. Your biggest opportunity is ${priority}. ${PILLAR_ACTIONS[weakestPillar]}`,
        cta: `Begin My Consultation — €${REPORT_PRICE_EUR}`,
        ctaUrl: `${baseUrl}/pricing`,
        showScores: false,
      }
  }
}

/* ── Main export ────────────────────────────────────────────────────── */

export function buildSequenceEmail(opts: SequenceEmailOpts): { subject: string; html: string } {
  const content = getEmailContent(opts)

  /*
   * ══ THE THREE BIOTICS ARE NAMED, NOT SCORED ═══════════════════════════════
   *
   * This rendered a number and a filled bar per Biotic — "Probiotics 54/100" —
   * into a customer's inbox. That is a personal biological state as a number,
   * which POSTBIOTICS_INFERENCE_BOUNDARY prohibits for Postbiotics by name and
   * which strict ISAPP definitions put out of reach of a questionnaire for all
   * three.
   *
   * It is the same artefact Tranche 1 removed from the reveal, Tranche 2A
   * removed from /assessment/you, the share card and the generated OG image —
   * and it was still being SENT, because no guard read lib/email. An email is
   * the least recoverable surface of the lot: once delivered it cannot be
   * re-rendered or corrected.
   *
   * The Biotics stay, named, with their colour, as the foundation the score is
   * built on. The overall Biotics Score™ is untouched: it is the product's
   * score and the arithmetic behind it has not changed.
   */
  const pillarsHtml = content.showScores
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
        ${(["feed", "seed", "heal"] as const)
          .map((key) => {
            const label = PILLAR_LABELS[key]
            const color = PILLAR_COLORS[key]
            return `
          <tr>
            <td style="padding: 4px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f7f7f7; border-radius: 8px; border-left: 3px solid ${color};">
                <tr>
                  <td style="padding: 10px 12px; font-size: 13px; font-weight: bold; color: #333333; font-family: Arial, sans-serif;">${label}</td>
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
