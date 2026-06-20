import { PILLAR_LABELS as CORE_PILLAR_LABELS } from "@/lib/pillars"
import { renderBrandEmail, BRAND_GRADIENT, BRAND_GREEN } from "./brand-layout"

interface ResultsEmailOpts {
  name: string
  email?: string
  overall: number
  profileType: string
  tagline: string
  profileDescription?: string
  subScores: { [key: string]: number }
  /** Explicit, ordered pillar rows (Mind/Family pass their 5 native pillars here). */
  pillars?: { label: string; score: number }[]
  nextActions: string[]
  ageBracket?: string
  assessmentType?: "gut" | "mind" | "family"
}

// Email-safe hex palette for the five native pillars (CSS vars don't render in email).
const PILLAR_PALETTE = ["#7fc47e", "#4caf7d", "#3ab0a0", "#e6b84a", "#e07b4a"]
const PILLAR_BG_PALETTE = ["#f3faf3", "#f0faf5", "#f0f9f8", "#fdf8ee", "#fdf5f0"]

const PILLAR_LABELS: Record<string, string> = {
  // Current 3 Biotics + Feed/Seed/Heal aliases — from the canonical Food System Core
  ...CORE_PILLAR_LABELS,
  // Legacy keys (backward compat for old stored sub_scores)
  diversity: "Plant Diversity",
  feeding: "Feeding",
  adding: "Live Foods",
  consistency: "Consistency",
  feeling: "Feeling",
}

const PILLAR_COLORS: Record<string, string> = {
  prebiotics: "#7fc47e",
  probiotics: "#3ab0a0",
  postbiotics: "#e6b84a",
  feed: "#7fc47e",
  seed: "#3ab0a0",
  heal: "#e6b84a",
  diversity: "#7fc47e",
  feeding: "#4caf7d",
  adding: "#3ab0a0",
  consistency: "#e6b84a",
  feeling: "#e07b4a",
}

const PILLAR_BG: Record<string, string> = {
  prebiotics: "#f3faf3",
  probiotics: "#f0f9f8",
  postbiotics: "#fdf8ee",
  feed: "#f3faf3",
  seed: "#f0f9f8",
  heal: "#fdf8ee",
  diversity: "#f3faf3",
  feeding: "#f0faf5",
  adding: "#f0f9f8",
  consistency: "#fdf8ee",
  feeling: "#fdf5f0",
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"

function retestDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 75)
  return d.toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })
}

export function buildResultsEmail(opts: ResultsEmailOpts): {
  subject: string
  html: string
} {
  const { name, email, overall, profileType, tagline, profileDescription, subScores, pillars, nextActions, ageBracket, assessmentType } = opts

  const variant = assessmentType === "mind" ? "mind" : assessmentType === "family" ? "family" : "gut"
  const scoreNoun = variant === "mind" ? "Mind" : variant === "family" ? "Family Food System" : "Food System"
  const subjectPrefix = variant === "mind" ? "Mind " : variant === "family" ? "Family " : ""
  const subject = `Your EatoBiotics ${subjectPrefix}Score: ${overall}/100 — ${profileType}`

  // Normalised, sorted (highest-first) pillar rows. Mind/Family pass explicit
  // pillars (coloured from the fixed palette by index); gut derives from subScores.
  type Row = { label: string; score: number; color: string; bg: string }
  const rows: Row[] =
    pillars && pillars.length
      ? pillars.map((p, i) => ({
          label: p.label,
          score: p.score,
          color: PILLAR_PALETTE[i % PILLAR_PALETTE.length],
          bg: PILLAR_BG_PALETTE[i % PILLAR_BG_PALETTE.length],
        }))
      : Object.entries(subScores).map(([key, score]) => ({
          label: PILLAR_LABELS[key] ?? key,
          score,
          color: PILLAR_COLORS[key] ?? "#4caf7d",
          bg: PILLAR_BG[key] ?? "#f9f9f9",
        }))
  const sortedRows = [...rows].sort((a, b) => b.score - a.score)
  const strongest = sortedRows[0]
  const focus = sortedRows[sortedRows.length - 1]
  const strongestLabel = strongest.label
  const strongestScore = strongest.score
  const focusLabel = focus.label
  const focusScore = focus.score
  const strongestColor = strongest.color
  const focusColor = focus.color

  // Pillar rows — colored left-border table rows
  const pillarsHtml = sortedRows
    .map((row) => {
      const { label, color, bg } = row
      const score = row.score
      const pct = Math.round(score)
      const isStrength = score >= 65
      const badge = isStrength
        ? `<span style="font-size: 10px; font-weight: bold; color: #4caf7d; background: #edf8f0; border-radius: 20px; padding: 2px 8px; margin-left: 6px;">Strength</span>`
        : score < 50
        ? `<span style="font-size: 10px; font-weight: bold; color: #e07b4a; background: #fdf2ec; border-radius: 20px; padding: 2px 8px; margin-left: 6px;">Focus area</span>`
        : ""
      return `
        <tr>
          <td style="padding: 5px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${bg}; border-radius: 10px; border-left: 4px solid ${color}; overflow: hidden;">
              <tr>
                <td style="padding: 10px 14px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="font-size: 13px; font-weight: bold; color: #333333; font-family: Arial, sans-serif;">${label}${badge}</td>
                      <td style="text-align: right; font-size: 15px; font-weight: bold; color: ${color}; font-family: Arial, sans-serif; white-space: nowrap;">${pct}<span style="font-size: 11px; color: #aaaaaa;">/100</span></td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding-top: 6px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="background: #e8e8e8; border-radius: 4px; height: 6px; overflow: hidden;">
                              <div style="background: ${color}; width: ${pct}%; height: 6px; border-radius: 4px;"></div>
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
    .join("")

  // Callout boxes
  const calloutsHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding: 0 0 8px 0; width: 50%; padding-right: 6px; vertical-align: top;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f3faf3; border-radius: 10px; border: 1px solid #d4edda;">
            <tr>
              <td style="padding: 14px 16px;">
                <p style="margin: 0 0 4px; font-size: 10px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; color: ${strongestColor}; font-family: Arial, sans-serif;">⭐ Your Strongest Pillar</p>
                <p style="margin: 0; font-size: 15px; font-weight: bold; color: #222222; font-family: Arial, sans-serif;">${strongestLabel}</p>
                <p style="margin: 2px 0 0; font-size: 13px; color: ${strongestColor}; font-family: Arial, sans-serif; font-weight: bold;">${strongestScore}/100</p>
              </td>
            </tr>
          </table>
        </td>
        <td style="padding: 0 0 8px 0; width: 50%; padding-left: 6px; vertical-align: top;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #fdf5f0; border-radius: 10px; border: 1px solid #f5d5c5;">
            <tr>
              <td style="padding: 14px 16px;">
                <p style="margin: 0 0 4px; font-size: 10px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; color: ${focusColor}; font-family: Arial, sans-serif;">🎯 Your Focus Area</p>
                <p style="margin: 0; font-size: 15px; font-weight: bold; color: #222222; font-family: Arial, sans-serif;">${focusLabel}</p>
                <p style="margin: 2px 0 0; font-size: 13px; color: ${focusColor}; font-family: Arial, sans-serif; font-weight: bold;">${focusScore}/100</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`

  // Actions
  const actionsHtml = nextActions
    .slice(0, 3)
    .map(
      (action, i) => `
        <tr>
          <td style="padding: 8px 0; vertical-align: top;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="width: 32px; vertical-align: top; padding-top: 1px;">
                  <span style="display: inline-block; width: 26px; height: 26px; background: linear-gradient(135deg, #7fc47e, #3ab0a0); border-radius: 50%; text-align: center; line-height: 26px; font-size: 13px; font-weight: bold; color: white; font-family: Arial, sans-serif;">${i + 1}</span>
                </td>
                <td style="font-size: 14px; color: #333333; font-family: Arial, sans-serif; line-height: 1.6; padding-left: 10px;">${action}</td>
              </tr>
            </table>
          </td>
        </tr>`
    )
    .join("")

  const ageBracketLine = ageBracket
    ? `<p style="margin: 4px 0 0; font-size: 13px; color: #888888; font-family: Arial, sans-serif;">Age bracket: ${ageBracket}</p>`
    : ""

  const profileDescHtml = profileDescription
    ? `<p style="margin: 12px 0 0; font-size: 14px; color: #555555; font-family: Arial, sans-serif; line-height: 1.6; font-style: italic;">${profileDescription}</p>`
    : ""

  const retestDateStr = retestDate()

  const contentHtml = `
        <table width="100%" cellpadding="0" cellspacing="0" border="0">

          <!-- Title -->
          <tr>
            <td style="padding: 32px 40px 0; text-align: center;">
              <h2 style="margin: 0; font-size: 22px; font-weight: bold; color: #1A2E12; font-family: Georgia, serif;">Your ${scoreNoun} Score</h2>
            </td>
          </tr>

          <!-- Score hero -->
          <tr>
            <td style="padding: 20px 40px 0; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 15px; color: #666666; font-family: Arial, sans-serif;">Hi ${name}, your assessment is ready.</p>
              ${ageBracketLine}
              <div style="margin: 20px auto 0;">
                <p style="margin: 0; font-size: 76px; font-weight: bold; color: #222222; line-height: 1; font-family: Georgia, serif;">${overall}<span style="font-size: 30px; color: #aaaaaa;">/100</span></p>
              </div>
              <p style="margin: 10px 0 4px; font-size: 20px; font-weight: bold; color: #3ab0a0; font-family: Georgia, serif;">${profileType}</p>
              <p style="margin: 0 0 4px; font-size: 14px; color: #666666; font-family: Arial, sans-serif; font-style: italic;">${tagline}</p>
              ${profileDescHtml}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 0;" />
            </td>
          </tr>

          <!-- Callout boxes -->
          <tr>
            <td style="padding: 24px 40px 0;">
              ${calloutsHtml}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 20px 40px 0;">
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 0;" />
            </td>
          </tr>

          <!-- Pillar scores -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <p style="margin: 0 0 12px; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; color: #999999; font-family: Arial, sans-serif;">${variant === "gut" ? "Prebiotics · Probiotics · Postbiotics" : "Your 5 Pillars"}</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${pillarsHtml}
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 0;" />
            </td>
          </tr>

          <!-- Next actions -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <p style="margin: 0 0 12px; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; color: #999999; font-family: Arial, sans-serif;">Your Top 3 Actions This Week</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${actionsHtml}
              </table>
            </td>
          </tr>

          <!-- Retest nudge -->
          <tr>
            <td style="padding: 20px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f7f7f7; border-radius: 10px;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <p style="margin: 0; font-size: 13px; color: #666666; font-family: Arial, sans-serif;">
                      📅 <strong style="color: #333333;">Recommended retest:</strong> ${retestDateStr} — give your habits 75 days to compound, then measure your progress.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 32px 40px; text-align: center;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #333333; font-family: Georgia, serif; font-style: italic;">Ready to see exactly what to eat, what to add, and a 30-day plan?</p>
              <a href="${SITE_URL}/assessment" style="display: inline-block; background-color: ${BRAND_GREEN}; background-image: ${BRAND_GRADIENT}; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; font-family: Arial, sans-serif; padding: 14px 32px; border-radius: 50px;">Unlock Your Full Report →</a>
            </td>
          </tr>

          <!-- Account save CTA -->
          <tr>
            <td style="padding: 0 40px 24px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 13px; color: #888888; font-family: Arial, sans-serif;">
                Want to access your results anytime?
              </p>
              <a href="${SITE_URL}/account/signin${email ? `?email=${encodeURIComponent(email)}` : ``}"
                 style="display: inline-block; border: 1.5px solid #4caf7d; color: #4caf7d; text-decoration: none; font-size: 13px; font-weight: bold; font-family: Arial, sans-serif; padding: 10px 24px; border-radius: 50px;">
                Save to your account →
              </a>
            </td>
          </tr>

          <!-- Mission note -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <div style="background: #f9fdf9; border-left: 3px solid #4caf7d; border-radius: 8px; padding: 16px 20px;">
                <p style="margin: 0; font-size: 13px; color: #555555; font-family: Arial, sans-serif; line-height: 1.6;">
                  <strong style="color: #333333;">Build the food system inside you — and help build the food system around you.</strong><br />
                  Every EatoBiotics report supports the wider EatoSystem mission: a connected, seasonal food future for every community.
                </p>
              </div>
            </td>
          </tr>

        </table>`

  const html = renderBrandEmail({
    subject,
    preheader: `Your ${scoreNoun} score: ${overall}/100 — ${profileType}`,
    contentHtml,
    footerNote: "This assessment is for educational purposes and is not medical advice.",
  })

  return { subject, html }
}
