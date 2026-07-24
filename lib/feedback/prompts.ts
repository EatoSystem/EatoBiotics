/* ── Feedback bot — prompt + email builders (pure) ────────────────────────
   No Anthropic import here on purpose: the actual Claude calls live in the
   route files so the AI cost-guard check (scripts/check-ai-guard.mjs) can see
   the marker and enforce a cap. These are just string builders, unit-testable
   in isolation.
──────────────────────────────────────────────────────────────────────── */

import type { FeedbackRow } from "./types"

/* ── 1. Extraction (single call at submit time) ──────────────────────────── */

export const EXTRACTION_SYSTEM = `You are the triage layer for EatoBiotics, a gut-health web app (meal analysis, assessments, GLP-1 companion, memberships). A customer just sent feedback. Turn it into a single valid JSON object — no markdown, no prose, no extra text.

Return exactly this shape:
{
  "category": "bug|feature|ux|pricing|content|praise|other",
  "sentiment": "positive|neutral|negative",
  "severity": "low|medium|high|null",   // only for bug/ux; null otherwise
  "feature_area": "<short area name or null>",  // e.g. "meal analysis", "assessment", "GLP-1", "pricing", "sign-in"
  "summary": "<one neutral sentence capturing the point>",
  "suggested_improvement": "<one concrete sentence: what change would address this, or null if pure praise>",
  "follow_up": "<one short, warm follow-up question that would sharpen this feedback, or null>"
}

Rules:
- Be faithful to the customer's words; do not invent problems they didn't raise.
- severity high = blocks the core task or loses data; medium = notable friction; low = minor.
- Never include medical advice or diagnosis in any field — this is product triage only.
- If the message is empty or meaningless, return category "other", sentiment "neutral", everything else null.`

export function buildExtractionUser(message: string, rating: number | null, sourcePage: string | null): string {
  const parts = [`Feedback: ${message}`]
  if (rating != null) parts.push(`Star rating given: ${rating}/5`)
  if (sourcePage) parts.push(`Sent from page: ${sourcePage}`)
  return parts.join("\n")
}

/* ── 2. Weekly digest (synthesis over the week's rows) ────────────────────── */

export const DIGEST_SYSTEM = `You are the product-insight analyst for EatoBiotics, a gut-health web app. You are given a week of raw customer feedback. Write a concise, decision-ready report for the founder — no fluff, no restating the brief.

Structure the report in GitHub-flavoured markdown with these sections:
1. **Headline** — 2–3 sentences: the single most important thing this week.
2. **Sentiment** — rough split (positive/neutral/negative) and any shift in tone.
3. **Top themes** — a ranked list. For each: a short title, how many mentions, and the severity/impact. Rank by frequency × impact, not just count.
4. **Verbatims worth reading** — 3–5 short direct quotes that best capture the week.
5. **Recommended next moves** — a prioritised, numbered action list. For each item say what to build/fix and which customer-journey stage it serves (Awareness, Education, Acquisition, Product, Onboarding, Usage, Support, Loyalty).

Be specific and honest. If the week is quiet or the signal is thin, say so plainly rather than padding. Never include medical claims.`

export function buildDigestUser(rows: FeedbackRow[]): string {
  if (rows.length === 0) return "No feedback was submitted this week."
  const lines = rows.map((r, i) => {
    const bits = [
      `#${i + 1}`,
      r.rating != null ? `${r.rating}★` : "no rating",
      r.category ?? "uncategorised",
      r.sentiment ?? "",
      r.severity ? `severity:${r.severity}` : "",
      r.feature_area ? `area:${r.feature_area}` : "",
      r.source_page ? `page:${r.source_page}` : "",
    ].filter(Boolean).join(" · ")
    return `${bits}\n   "${r.message.replace(/\s+/g, " ").trim().slice(0, 600)}"`
  })
  return `Here is this week's customer feedback (${rows.length} submissions):\n\n${lines.join("\n\n")}`
}

/* ── 3. Digest email HTML ─────────────────────────────────────────────────── */

/** Minimal markdown → HTML for the digest email (headings, bold, lists). */
function miniMarkdown(md: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const lines = md.split("\n")
  const out: string[] = []
  let inList = false
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`(.+?)`/g, "<code>$1</code>")
  for (const raw of lines) {
    const line = raw.trimEnd()
    const listMatch = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)$/)
    if (listMatch) {
      if (!inList) { out.push("<ul style='margin:8px 0;padding-left:20px'>"); inList = true }
      out.push(`<li style='margin:4px 0'>${inline(listMatch[1])}</li>`)
      continue
    }
    if (inList) { out.push("</ul>"); inList = false }
    if (!line) { out.push("<div style='height:10px'></div>"); continue }
    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      const sz = [22, 18, 16, 15][h[1].length - 1]
      out.push(`<div style='font-size:${sz}px;font-weight:800;margin:16px 0 6px;color:#1B2A20'>${inline(h[2])}</div>`)
      continue
    }
    out.push(`<p style='margin:6px 0;line-height:1.5;color:#2b382f'>${inline(line)}</p>`)
  }
  if (inList) out.push("</ul>")
  return out.join("\n")
}

export function digestEmailHtml(opts: {
  reportMarkdown: string
  count: number
  rangeLabel: string
  adminUrl: string
}): string {
  return `<!doctype html><html><body style="margin:0;background:#F2F5EE;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e3e9dd">
    <div style="height:6px;background:linear-gradient(90deg,#A8E063,#4CB648,#2DAA6E,#F5C518,#F5A623)"></div>
    <div style="padding:28px 32px">
      <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#4CB648;font-weight:700">EatoBiotics · Customer Feedback</div>
      <div style="font-size:24px;font-weight:800;color:#1B2A20;margin:6px 0 2px">Weekly feedback digest</div>
      <div style="font-size:14px;color:#6b7a70">${opts.rangeLabel} · ${opts.count} submission${opts.count === 1 ? "" : "s"}</div>
      <hr style="border:none;border-top:1px solid #eef2ea;margin:18px 0"/>
      ${miniMarkdown(opts.reportMarkdown)}
      <hr style="border:none;border-top:1px solid #eef2ea;margin:20px 0"/>
      <a href="${opts.adminUrl}" style="display:inline-block;background:linear-gradient(135deg,#8BC34A,#4CAF50);color:#fff;text-decoration:none;font-weight:700;padding:11px 22px;border-radius:100px;font-size:14px">Open the feedback dashboard →</a>
    </div>
  </div>
</body></html>`
}
