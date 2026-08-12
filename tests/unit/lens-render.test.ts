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

  /**
   * Safety before citations — on the web too, not only in the PDF.
   *
   * The web chapter used to close with the safety note, set small and grey
   * below the source list. For Glucose that put "does not measure blood
   * glucose" underneath three journal citations, which is past the point most
   * readers stop. Both renderers now lead with it, and both are asserted, so
   * neither can drift back on its own.
   */
  it.each(ADDON_KEYS)("%s: web safety note precedes the first citation", (addon) => {
    const report = reportFor(addon)
    const body = text(web(report))
    const safetyAt = body.indexOf(text(report.lens!.safetyNote))
    const firstCitationAt = body.indexOf(text(report.lens!.evidenceNotes[0].title))

    expect(safetyAt, "safety note missing from the web chapter").toBeGreaterThan(-1)
    expect(firstCitationAt, "citation missing from the web chapter").toBeGreaterThan(-1)
    expect(safetyAt, `${addon}: safety must come first`).toBeLessThan(firstCitationAt)
  })

  it("web glucose leads with 'does not measure blood glucose'", () => {
    const report = reportFor("glucose")
    const body = text(web(report))
    expect(body.indexOf("does not measure blood glucose")).toBeLessThan(
      body.indexOf(text(report.lens!.evidenceNotes[0].title)),
    )
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

/**
 * PDF page 2 — Evidence & Safety.
 *
 * The safety note used to render AFTER the source list. For Glucose that put
 * "does not measure blood glucose" below three citations, and for Mind it put
 * the non-diagnostic wording there — which is exactly the sentence a reader
 * most needs to reach. Order is therefore asserted, not just presence.
 */
describe("PDF page 2 puts safety before citations", () => {
  async function pdfOrdered(report: FoodSystemReport): Promise<string[]> {
    const React = (await import("react")).default
    const { FoodSystemPages } = await import("@/lib/pdf/food-system-pdf")
    return pdfStrings(React.createElement(FoodSystemPages, { report } as never))
  }

  it.each(ADDON_KEYS)("%s: the page is headed Evidence & Safety", async (addon) => {
    const pdf = (await pdfOrdered(reportFor(addon))).join(" ")
    expect(pdf).toContain("Evidence & Safety")
    expect(pdf).toContain("What this lens does not do")
  })

  it.each(ADDON_KEYS)("%s: safety text precedes the first citation title", async (addon) => {
    const report = reportFor(addon)
    const strings = await pdfOrdered(report)
    const joined = strings.join("\u0000")

    const safetyAt = joined.indexOf(report.lens!.safetyNote)
    const firstCitationAt = joined.indexOf(report.lens!.evidenceNotes[0].title)

    expect(safetyAt, "safety note missing").toBeGreaterThan(-1)
    expect(firstCitationAt, "citation missing").toBeGreaterThan(-1)
    expect(safetyAt, `${addon}: safety must come first`).toBeLessThan(firstCitationAt)
  })

  it("glucose leads with 'does not measure blood glucose'", async () => {
    const report = reportFor("glucose")
    const joined = (await pdfOrdered(report)).join("\u0000")
    const phraseAt = joined.indexOf("does not measure blood glucose")
    const firstCitationAt = joined.indexOf(report.lens!.evidenceNotes[0].title)
    expect(phraseAt).toBeGreaterThan(-1)
    expect(phraseAt).toBeLessThan(firstCitationAt)
  })

  it("mind leads with its non-diagnostic wording", async () => {
    const report = reportFor("mind")
    const joined = (await pdfOrdered(report)).join("\u0000")
    const phraseAt = joined.indexOf("does not diagnose, treat, cure, or prevent")
    const firstCitationAt = joined.indexOf(report.lens!.evidenceNotes[0].title)
    expect(phraseAt).toBeGreaterThan(-1)
    expect(phraseAt).toBeLessThan(firstCitationAt)
  })

  it.each(ADDON_KEYS)("%s: each source keeps its support and limitation", async (addon) => {
    const report = reportFor(addon)
    const joined = (await pdfOrdered(report)).join("\u0000")
    for (const n of report.lens!.evidenceNotes) {
      const t = joined.indexOf(n.title)
      const sup = joined.indexOf(n.whatItSupports)
      const lim = joined.indexOf(n.limitation)
      // Title, then its support, then its limitation — contiguous per source.
      expect(t).toBeLessThan(sup)
      expect(sup).toBeLessThan(lim)
    }
  })
})

/**
 * Page count, measured two ways — and both are needed.
 *
 * The declared count walks the element tree and counts <Page> elements. It is
 * cheap, but it is also structurally blind: it returns "+2" whether or not the
 * content fits, because the lens is written as two <Page> elements regardless.
 * That is precisely how lens page 1 came to overflow onto a third PHYSICAL page
 * — three bordered cards per group put eleven boxes on one page — while this
 * suite stayed green and the defect was found by counting pages in a viewer.
 *
 * So the second test renders the real PDF and counts the pages the reader
 * actually gets. It is the slower of the two (about a second per render) and
 * worth every millisecond: the two-page lens structure is a deliberate design
 * decision, and the spacing on lens page 1 now fits with roughly a third of a
 * row to spare. Any future copy change or margin bump that pushes it over will
 * fail here by name instead of shipping.
 */
describe("PDF page count", () => {
  /** Physical pages in the rendered PDF, read from its page tree. */
  async function renderedPageCount(report: FoodSystemReport): Promise<number> {
    const React = (await import("react")).default
    const { Document, renderToBuffer } = await import("@react-pdf/renderer")
    const { FoodSystemPages } = await import("@/lib/pdf/food-system-pdf")

    const doc = React.createElement(
      Document,
      null,
      React.createElement(FoodSystemPages, { report } as never),
    )
    const buffer = await renderToBuffer(doc as never)
    // "/Count N" on the page-tree node is the page total; take the largest,
    // since nested Pages nodes each carry their own subtree count.
    const counts = [...buffer.toString("latin1").matchAll(/\/Count\s+(\d+)/g)].map((m) =>
      Number(m[1]),
    )
    expect(counts.length, "no /Count in the rendered PDF").toBeGreaterThan(0)
    return Math.max(...counts)
  }

  it("a lens adds exactly two PHYSICAL pages — nothing overflows", async () => {
    const without = await renderedPageCount(reportFor(null))
    expect(without).toBeGreaterThan(1)
    for (const addon of ADDON_KEYS) {
      expect(
        await renderedPageCount(reportFor(addon)),
        `${addon}: lens page 1 has overflowed onto a third page`,
      ).toBe(without + 2)
    }
    // Family copy is longer than the individual voice in every lens, so it is
    // the case most likely to spill first.
    expect(await renderedPageCount(reportFor("mind", true)), "family mind").toBe(without + 2)
  }, 60_000)

  async function pageCount(report: FoodSystemReport): Promise<number> {
    const React = (await import("react")).default
    const { FoodSystemPages } = await import("@/lib/pdf/food-system-pdf")
    const tree = React.createElement(FoodSystemPages, { report } as never)

    let pages = 0
    const walk = (node: unknown): void => {
      if (!node || typeof node !== "object") return
      if (Array.isArray(node)) return void node.forEach(walk)
      const el = node as { type?: unknown; props?: { children?: unknown } }
      // react-pdf compiles <Page> to the host element type "PAGE" — not a
      // function component, which is what the first version of this walker
      // looked for, and why it counted zero.
      if (el.type === "PAGE") pages++
      if (el.props?.children !== undefined) walk(el.props.children)
      if (typeof el.type === "function") {
        try {
          walk((el.type as (p: unknown) => unknown)(el.props))
        } catch {
          /* ignore */
        }
      }
    }
    walk(tree)
    return pages
  }

  it("a lens declares exactly two pages", async () => {
    const without = await pageCount(reportFor(null))
    expect(without).toBeGreaterThan(3)
    for (const addon of ADDON_KEYS) {
      expect(await pageCount(reportFor(addon)), addon).toBe(without + 2)
    }
  })
})
