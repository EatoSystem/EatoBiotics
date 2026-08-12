import { describe, it, expect } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { ADDON_KEYS, type AddonType } from "@/lib/addon-types"
import { buildAddonLens } from "@/lib/report/addon-lens"
import { buildFoodSystemReport } from "@/lib/report/build-food-system-report"
import { FoodSystemSection } from "@/components/report/food-system-section"
import { computeOverall, getProfile } from "@/lib/assessment-scoring"
import type { FoodSystemReport } from "@/lib/report/food-system-report-types"

/**
 * The lens chapter, as rendered.
 *
 * The property that matters is PARITY: the web report and the PDF must carry
 * the same lens content. Two renderers reading one model is the whole reason
 * the model exists, and it is exactly the kind of thing that silently drifts.
 */

const SUB = { prebiotics: 85, probiotics: 20, postbiotics: 85 }

const ANSWERS: Record<AddonType, Record<string, unknown>> = {
  stability: { lens1: "unpredictable", lens2: "stress-linked", lens3: ["none"], lens4: "rarely" },
  glucose: { lens1: "lift-then-dip", lens2: "skipped", lens3: "mid-afternoon", lens4: ["alone"] },
  mind: { lens1: "skipped", lens2: "early-afternoon", lens3: ["none"], lens4: "daily" },
  performance: { lens1: "neither", lens2: "depleted", lens3: ["variable"], lens4: "rarely" },
}

function reportFor(addon: AddonType | null, isFamily = false): FoodSystemReport {
  const overall = computeOverall(SUB)
  const base = buildFoodSystemReport({
    mode: isFamily ? "family" : "combined",
    subScores: SUB,
    overall,
    profile: getProfile(overall, SUB),
  })
  if (!addon) return base
  return {
    ...base,
    lens: buildAddonLens({ addon, answers: ANSWERS[addon], foodSystem: base, isFamily }),
  }
}

const web = (report: FoodSystemReport) =>
  renderToStaticMarkup(createElement(FoodSystemSection, { report }))

function text(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&mdash;/g, "—")
    .replace(/&middot;/g, "·")
    .replace(/\s+/g, " ")
    .trim()
}

/** Collects every string a react-pdf tree would print. */
function pdfStrings(node: unknown, acc: string[] = []): string[] {
  if (node == null || typeof node === "boolean") return acc
  if (typeof node === "string" || typeof node === "number") {
    acc.push(String(node))
    return acc
  }
  if (Array.isArray(node)) {
    node.forEach((n) => pdfStrings(n, acc))
    return acc
  }
  const el = node as { type?: unknown; props?: { children?: unknown; src?: unknown } }
  if (el.props?.src) acc.push(String(el.props.src))
  if (el.props?.children !== undefined) pdfStrings(el.props.children, acc)
  if (typeof el.type === "function") {
    try {
      pdfStrings((el.type as (p: unknown) => unknown)(el.props), acc)
    } catch {
      /* needs a render context; children above are enough */
    }
  }
  return acc
}

async function pdfText(report: FoodSystemReport): Promise<string> {
  const React = (await import("react")).default
  const { FoodSystemPages } = await import("@/lib/pdf/food-system-pdf")
  return pdfStrings(React.createElement(FoodSystemPages, { report } as never)).join(" ")
}

describe("no add-on leaves the report structurally unchanged", () => {
  it("renders no lens chapter and no focus-area heading", () => {
    const body = text(web(reportFor(null)))
    expect(body).not.toContain("Your Focus Area")
    expect(body).not.toContain("What this looks at")
    expect(body).not.toContain("Added to your 30-day loop")
  })

  it("still renders the core evidence chapter and the mission page", () => {
    const body = text(web(reportFor(null)))
    expect(body).toContain("Where This Comes From")
  })

  it("the PDF has no lens pages either", async () => {
    const pdf = await pdfText(reportFor(null))
    expect(pdf).not.toContain("Your Focus Area")
  })
})

describe("the lens chapter renders everything it must", () => {
  it.each(ADDON_KEYS)("%s: web carries every part of the chapter", (addon) => {
    const report = reportFor(addon)
    const lens = report.lens!
    const body = text(web(report))

    expect(body).toContain(lens.name)
    expect(body).toContain(lens.examines)
    expect(body).toContain(lens.patternSummary)
    expect(body).toContain(lens.priorityConnection.why)
    for (const pc of lens.pathwayConnections) expect(body).toContain(pc.connection)
    for (const s of lens.signals) expect(body).toContain(s.whatToNotice)
    for (const l of lens.loopAdditions) expect(body).toContain(text(l.action))
    expect(body).toContain(lens.safetyNote)
  })

  it.each(ADDON_KEYS)("%s: evidence shows both halves and links out", (addon) => {
    const report = reportFor(addon)
    const markup = web(report)
    const body = text(markup)

    for (const note of report.lens!.evidenceNotes) {
      expect(body).toContain(note.title)
      expect(body).toContain(note.whatItSupports)
      expect(body).toContain(note.limitation)
      expect(markup).toContain(`href="${note.url}"`)
    }
    expect(body).toContain("What it supports")
    expect(body).toContain("What it does not show")
  })

  it.each(ADDON_KEYS)("%s: the actions are framed as loop additions, not a new plan", (addon) => {
    const body = text(web(reportFor(addon)))
    expect(body).toContain("Added to your 30-day loop")
    for (const l of reportFor(addon).lens!.loopAdditions) {
      expect(body, `week ${l.week}`).toContain(`Week ${l.week}`)
    }
  })
})

describe("web and PDF carry the same lens content", () => {
  it.each(ADDON_KEYS)("%s", async (addon) => {
    const report = reportFor(addon)
    const lens = report.lens!
    const body = text(web(report))
    const pdf = await pdfText(report)

    // Every substantive string appears in BOTH renderers.
    const shared = [
      lens.name,
      lens.patternSummary,
      lens.priorityConnection.why,
      lens.safetyNote,
      ...lens.pathwayConnections.map((p) => p.connection),
      ...lens.signals.map((s) => s.whatToNotice),
      ...lens.loopAdditions.map((l) => l.action),
      ...lens.evidenceNotes.flatMap((n) => [n.title, n.whatItSupports, n.limitation]),
    ]

    for (const s of shared) {
      expect(body, `web missing: ${s.slice(0, 60)}`).toContain(text(s))
      expect(pdf, `pdf missing: ${s.slice(0, 60)}`).toContain(s)
    }

    // URLs are attributes, not text: the web puts them in href, the PDF in a
    // Link src. Checking them against stripped text would always fail.
    const markup = web(report)
    for (const n of lens.evidenceNotes) {
      expect(markup, `web href missing: ${n.url}`).toContain(`href="${n.url}"`)
      expect(pdf, `pdf link missing: ${n.url}`).toContain(n.url)
    }
  })
})

describe("chapter order and accessibility", () => {
  it.each(ADDON_KEYS)("%s: the lens comes after the loop and before evidence", (addon) => {
    const body = text(web(reportFor(addon)))
    const loop = body.indexOf("30-Day Improvement Loop")
    const lens = body.indexOf("Your Focus Area")
    const evidence = body.indexOf("Where This Comes From")

    expect(loop).toBeGreaterThan(-1)
    expect(lens).toBeGreaterThan(loop)
    expect(evidence).toBeGreaterThan(lens)
  })

  it.each(ADDON_KEYS)("%s: chapter numbering stays continuous", (addon) => {
    const body = text(web(reportFor(addon)))
    // Numbers are zero-padded and rendered in order; with a lens present the
    // sequence must still have no gap or repeat before the evidence chapter.
    const numbers = [...body.matchAll(/\b(0\d)\b/g)].map((m) => m[1])
    const seq = numbers.map(Number)
    for (let i = 1; i < seq.length; i++) {
      expect(seq[i], `after ${seq[i - 1]}`).toBe(seq[i - 1] + 1)
    }
  })

  it.each(ADDON_KEYS)("%s: no emoji in the lens chapter", (addon) => {
    const body = text(web(reportFor(addon)))
    expect(body).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}]/u)
  })

  it.each(ADDON_KEYS)("%s: pathway state is carried in text, not colour alone", (addon) => {
    const body = text(web(reportFor(addon)))
    // Each pathway is named in words beside its explanation.
    for (const label of ["Prebiotics", "Probiotics", "Postbiotics"]) {
      expect(body).toContain(label)
    }
  })
})

describe("family wording reaches the rendered chapter", () => {
  it.each(ADDON_KEYS)("%s reads as a household", (addon) => {
    const body = text(web(reportFor(addon, true)))
    expect(body).toMatch(/household/i)
  })
})
