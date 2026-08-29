import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { buildPaidReportEmail } from "@/lib/email/paid-report-email"
import { ADDON_KEYS, type AddonType } from "@/lib/addon-types"
import { SYSTEMS } from "@/lib/systems"
import { CLAIMS, DENIAL_BOILERPLATE } from "./helpers/marketing-language"

const base = {
  name: "Sam",
  tier: "personal" as const,
  overall: 72,
  profileType: "Balanced Builder",
  tagline: "On track.",
  subScores: { feed: 70, seed: 65, heal: 80 },
  topTrigger: "Fibre variety",
  topTriggerExplanation: "You'd benefit from more plant diversity.",
  sessionId: "sess_123",
}

describe("buildPaidReportEmail — PDF note copy", () => {
  it("pdfUrl present: no false 'attached' claim, a real download link, 7-day expiry mentioned, permanent CTA still present", () => {
    const pdfUrl = "https://storage.example.com/pdf-reports/sess_123.pdf?token=abc"
    const { html } = buildPaidReportEmail({ ...base, pdfUrl })

    expect(html).not.toContain("attached to this email")
    expect(html).toContain(`href="${pdfUrl}"`)
    expect(html).toContain("Download it here")
    expect(html).toMatch(/7 days/)
    expect(html).toContain('href="https://eatobiotics.com/assessment/report?session_id=sess_123"')
    expect(html).toContain("View Your Report")
  })

  it("pdfUrl null: points to the durable report page instead of promising a re-email", () => {
    const { html } = buildPaidReportEmail({ ...base, pdfUrl: null })

    // Copy corrected: the old line promised the download would "appear as soon
    // as it is ready", which is not something the pipeline can guarantee — the
    // PDF may have failed, not merely be slow.
    expect(html).toContain("Your full report is ready to read online")
    expect(html).toContain("check there whether the PDF download is available")
    // The old copy promised a re-email that nothing ever sends — that lie is gone.
    expect(html).not.toContain("will be emailed to you shortly")
    expect(html).not.toContain("attached to this email")
    expect(html).not.toContain("Download it here")
  })

  it("no 'attached' wording anywhere in the email output, in either pdfUrl state", () => {
    const withPdf = buildPaidReportEmail({ ...base, pdfUrl: "https://storage.example.com/x.pdf" })
    const withoutPdf = buildPaidReportEmail({ ...base, pdfUrl: null })

    expect(withPdf.html.toLowerCase()).not.toContain("attached")
    expect(withoutPdf.html.toLowerCase()).not.toContain("attached")
  })
})

/**
 * The purchased lens, acknowledged in the delivery email.
 *
 * Before this, a customer who paid extra for a lens received an email
 * byte-identical to one who did not. The only way to discover the lens was to
 * open the report and reach chapter 07 — which reads, reasonably, as the add-on
 * having been lost.
 */
describe("buildPaidReportEmail — the purchased lens", () => {
  const NAMES: Record<AddonType, string> = {
    stability: "Stability",
    glucose: "Glucose",
    mind: "Mind",
    performance: "Performance",
  }

  it.each(ADDON_KEYS)("%s is named next to the report CTA", (addon) => {
    const { html } = buildPaidReportEmail({ ...base, pdfUrl: null, selectedAddon: addon })

    expect(html).toContain(`<strong style="color: #2f7f6f;">${NAMES[addon]}</strong> lens is included`)
    // Beside the CTA, not buried after the footer.
    expect(html.indexOf("View Your Report")).toBeLessThan(html.indexOf("lens is included"))
    // The name matches the catalogue the report chapter itself uses.
    expect(NAMES[addon]).toBe(SYSTEMS[addon].label)
  })

  it.each(ADDON_KEYS)("%s claims nothing beyond inclusion", (addon) => {
    const { html } = buildPaidReportEmail({ ...base, pdfUrl: null, selectedAddon: addon })
    const line = html.slice(html.indexOf("lens is included") - 400, html.indexOf("lens is included") + 200)

    // No second report, no measurement, no diagnosis, no promised outcome.
    expect(line).not.toMatch(/separate report|second report|your results? for/i)
    expect(line).not.toMatch(/measure|reading|level|score/i)
    expect(line).not.toMatch(/diagnos|treat|cure/i)
    expect(line).not.toMatch(/will (improve|fix|reduce|increase)|guarantee/i)
  })

  it("no add-on renders no lens block at all", () => {
    const { html } = buildPaidReportEmail({ ...base, pdfUrl: null })
    expect(html).not.toContain("lens is included")
    expect(html).not.toMatch(/undefined|\[object Object\]/)
  })

  it("no add-on output is byte-identical to a null add-on", () => {
    const omitted = buildPaidReportEmail({ ...base, pdfUrl: null })
    const explicitNull = buildPaidReportEmail({ ...base, pdfUrl: null, selectedAddon: null })
    expect(explicitNull.html).toBe(omitted.html)
    expect(explicitNull.subject).toBe(omitted.subject)
  })

  it.each([
    ["unknown key", "recovery"],
    ["empty string", ""],
    ["nonsense", "'; DROP TABLE--"],
    ["numeric", 7 as unknown as string],
    ["object", { evil: true } as unknown as string],
  ])("malformed metadata (%s) behaves exactly like no add-on", (_label, value) => {
    const omitted = buildPaidReportEmail({ ...base, pdfUrl: null })
    const { html } = buildPaidReportEmail({ ...base, pdfUrl: null, selectedAddon: value })

    expect(html).toBe(omitted.html)
    expect(html).not.toContain("lens is included")
    expect(html).not.toMatch(/undefined|null|\[object Object\]|recovery/)
  })

  it("the subject line is untouched by the add-on", () => {
    const plain = buildPaidReportEmail({ ...base, pdfUrl: null }).subject
    for (const addon of ADDON_KEYS) {
      expect(buildPaidReportEmail({ ...base, pdfUrl: null, selectedAddon: addon }).subject).toBe(plain)
    }
  })

  it.each(ADDON_KEYS)("%s keeps both the durable report link and the 7-day PDF link", (addon) => {
    const pdfUrl = "https://storage.example.com/pdf-reports/sess_123.pdf?token=abc"
    const { html } = buildPaidReportEmail({ ...base, pdfUrl, selectedAddon: addon })

    expect(html).toContain('href="https://eatobiotics.com/assessment/report?session_id=sess_123"')
    expect(html).toContain(`href="${pdfUrl}"`)
    expect(html).toMatch(/7 days/)
  })

  /**
   * The real marketing-language corpus, over the new wording. This is the same
   * guard the report copy runs under — a health claim is no less a claim for
   * being in an email.
   */
  it.each(ADDON_KEYS)("%s: the real CLAIMS rules pass over the new wording", (addon) => {
    const { html, subject } = buildPaidReportEmail({ ...base, pdfUrl: null, selectedAddon: addon })

    // Scoped to the lens line specifically, so a failure names the new wording
    // rather than anything else in the email. The whole-email version now runs
    // too — see "the whole email is now CLAIMS-clean in both PDF states".
    const lensLine = html.slice(
      Math.max(0, html.indexOf("lens is included") - 300),
      html.indexOf("lens is included") + 200,
    )
    const plain = `${subject} ${lensLine.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")}`
      .replace(DENIAL_BOILERPLATE, " ")

    const hits: string[] = []
    for (const [rule, pattern] of CLAIMS) {
      const m = plain.match(pattern)
      if (m) hits.push(`${rule}: "${m[0]}"`)
    }
    expect(hits, hits.join("\n")).toEqual([])
  })

  it("adding a lens introduces no new CLAIMS hit anywhere in the email", () => {
    const flags = (h: string) => {
      const plain = h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(DENIAL_BOILERPLATE, " ")
      return CLAIMS.filter(([, p]) => p.test(plain)).map(([r]) => r).sort()
    }
    const without = flags(buildPaidReportEmail({ ...base, pdfUrl: null }).html)
    for (const addon of ADDON_KEYS) {
      const withLens = flags(buildPaidReportEmail({ ...base, pdfUrl: null, selectedAddon: addon }).html)
      // Whatever the baseline already trips, the lens must not add to it.
      expect(withLens, addon).toEqual(without)
    }
  })

  /**
   * The PDF-unavailable copy, corrected.
   *
   * It used to say "the PDF download will appear there as soon as it is ready",
   * which promises an automatic recovery nothing guarantees — the PDF may have
   * failed outright, not merely be slow. It is now factual: read the report
   * online, and check there whether a download is available. Deliberately NOT
   * silenced via KNOWN_FALSE_POSITIVES; the copy changed instead.
   */
  it("the PDF-unavailable note promises no automatic recovery", () => {
    const { html } = buildPaidReportEmail({ ...base, pdfUrl: null })

    expect(html).not.toContain("will appear there as soon as it is ready")
    expect(html).not.toMatch(/will (appear|be ready|be available|arrive|be sent|be emailed)/i)
    expect(html).toContain("check there whether the PDF download is available")
    // The durable report link survives — that is the whole point of the note.
    expect(html).toContain('href="https://eatobiotics.com/assessment/report?session_id=sess_123"')
  })

  it("the ready state still offers the direct 7-day PDF link", () => {
    const pdfUrl = "https://storage.example.com/pdf-reports/sess_123.pdf?token=abc"
    const { html } = buildPaidReportEmail({ ...base, pdfUrl })
    expect(html).toContain(`href="${pdfUrl}"`)
    expect(html).toContain("Download it here")
    expect(html).toMatch(/7 days/)
    expect(html).toContain('href="https://eatobiotics.com/assessment/report?session_id=sess_123"')
  })

  it("the whole email is now CLAIMS-clean in both PDF states", () => {
    for (const pdfUrl of [null, "https://storage.example.com/x.pdf"]) {
      for (const selectedAddon of [undefined, ...ADDON_KEYS]) {
        const { html, subject } = buildPaidReportEmail({ ...base, pdfUrl, selectedAddon })
        const plain = `${subject} ${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")}`
          .replace(DENIAL_BOILERPLATE, " ")
        const hits = CLAIMS.filter(([, p]) => p.test(plain)).map(([r]) => r)
        expect(hits, `${selectedAddon ?? "none"}/${pdfUrl ? "ready" : "pending"}: ${hits.join(", ")}`).toEqual([])
      }
    }
  })

  it("there is no plain-text variant to keep in sync", () => {
    // buildPaidReportEmail returns { subject, html } only. If a text/ variant is
    // ever added, the lens line has to be added there too — this pins that.
    const out = buildPaidReportEmail({ ...base, pdfUrl: null, selectedAddon: "mind" })
    expect(Object.keys(out).sort()).toEqual(["html", "subject"])
  })
})

/* ── Phase 0 · P0.11 — the bars name pathways, not actions ──────────────── */

describe("the paid email renders exactly the three pathways", () => {
  const base = {
    name: "Test",
    tier: "personal" as const,
    overall: 56,
    profileType: "Emerging Balance",
    tagline: "Building blocks are there.",
    topTrigger: "Live cultures are the gap.",
    topTriggerExplanation: "Your answers point at fermented foods first.",
    sessionId: "cs_1",
    pdfUrl: null,
    reportUrl: "https://eatobiotics.com/assessment/report?session_id=cs_1",
  }

  /** Count how many score rows the email rendered. */
  // Count BAR ROWS, not occurrences of the word: the panel header now reads
  // "Prebiotics · Probiotics · Postbiotics", so a bare `>label` match would
  // count the header too and let a genuinely missing bar pass.
  const barCount = (html: string, label: string) =>
    html.split(`color: #333333; font-family: Arial, sans-serif;">${label}`).length - 1

  it("uses Prebiotics / Probiotics / Postbiotics — never Feed, Seed or Regenerate", () => {
    const { html } = buildPaidReportEmail({
      ...base,
      subScores: { prebiotics: 62, probiotics: 38, postbiotics: 67 },
    })

    for (const pathway of ["Prebiotics", "Probiotics", "Postbiotics"]) {
      expect(html, `${pathway} bar missing`).toContain(pathway)
    }
    // Feed · Seed · Regenerate is the ACTION vocabulary. A score bar labelled
    // "Regenerate" asserts that Regenerate is Postbiotics renamed, which is
    // exactly the equivalence the product model forbids.
    for (const action of [">Feed<", ">Seed<", ">Regenerate<", ">Heal<"]) {
      expect(html, `${action} must not label a score`).not.toContain(action)
    }
  })

  it("maps no pathway key to an action word, reachable or not", () => {
    // Asserted against the SOURCE, not the rendered output, because the bars
    // now derive from normalizeToBiotics and therefore only ever look up the
    // canonical keys. That makes the feed/seed/heal label entries unreachable
    // on the live path — so a rendering test passes no matter what they say,
    // and a sabotage that set `heal: "Regenerate"` went undetected.
    //
    // The mapping is still the thing the rule is about: Feed · Seed ·
    // Regenerate is the action vocabulary and must never name a score, however
    // it is reached.
    const source = readFileSync("lib/email/paid-report-email.ts", "utf8")
    const labelMap = source
      .slice(source.indexOf("const PILLAR_LABELS"), source.indexOf("const PILLAR_COLORS"))
      // Comments out: the block above the map explains what the labels used to
      // say, and quotes them. Asserting over the explanation would fail on the
      // documentation of the fix rather than on the code.
      .split("\n")
      .filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*"))
      .join("\n")
    expect(labelMap.length).toBeGreaterThan(100)
    for (const action of ['"Feed"', '"Seed"', '"Regenerate"', '"Heal"']) {
      expect(labelMap, `${action} must not be a score label`).not.toContain(action)
    }
    // And the pathway names are present, so this cannot pass on an empty slice.
    for (const pathway of ['"Prebiotics"', '"Probiotics"', '"Postbiotics"']) {
      expect(labelMap).toContain(pathway)
    }
  })

  it("renders three bars from a stored report carrying legacy aliases too", () => {
    // A You-flow report stores canonical AND feed/seed/heal. Enumerating the
    // object gave six bars for three pathways; normalising gives three.
    const { html } = buildPaidReportEmail({
      ...base,
      subScores: { prebiotics: 62, probiotics: 38, postbiotics: 67, feed: 62, seed: 38, heal: 67 },
    })

    expect(barCount(html, "Prebiotics")).toBe(1)
    expect(barCount(html, "Probiotics")).toBe(1)
    expect(barCount(html, "Postbiotics")).toBe(1)
  })

  it("reads a legacy-only stored report through the aliases", () => {
    // Reports persisted before the canonical keys existed carry only the
    // aliases. They must still render, under the pathway names.
    const { html } = buildPaidReportEmail({
      ...base,
      subScores: { feed: 62, seed: 38, heal: 67 },
    })

    expect(html).toContain("Prebiotics")
    expect(html).toContain("Probiotics")
    expect(html).toContain("Postbiotics")
    expect(html).not.toContain(">Regenerate<")
  })

  it("renders no bars rather than a hole when a pathway is missing", () => {
    // normalizeToBiotics returns null if any pathway is unresolvable. Half a
    // score panel is worse than none — it reads as a real, low score.
    const { html } = buildPaidReportEmail({
      ...base,
      subScores: { prebiotics: 62, probiotics: 38 },
    })

    // Assert on the BAR structure, not the word: "Prebiotics" also appears in
    // the email's prose, so a bare substring check would fail on copy rather
    // than on a rendered score.
    expect(barCount(html, "Prebiotics")).toBe(0)
    expect(barCount(html, "Probiotics")).toBe(0)
    expect(barCount(html, "Postbiotics")).toBe(0)
    // The overall Biotics Score still renders — dropping the pathway panel is
    // not the same as dropping the email, and the score is not in doubt.
    expect(html).toContain("56")
  })

  it("leaves a legacy-tier report describing the model it was sold under", () => {
    // Re-sending an old Family-shaped report must not restate it in today's
    // vocabulary — that would misdescribe what the buyer actually received.
    const { html } = buildPaidReportEmail({
      ...base,
      tier: "full",
      subScores: { diversity: 70, feeding: 55, adding: 40, consistency: 60, feeling: 65 },
    })
    expect(html).toContain("Plant Diversity")
  })
})
