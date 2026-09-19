import { describe, it, expect, beforeAll, vi } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import React from "react"

import { fontsRegistered } from "@/lib/pdf/pdf-fonts"
import { breakProps, textOnTint, tint } from "@/lib/report/delivery/pdf/pdf-tokens"
import { renderCanonicalReportPdf } from "@/lib/report/delivery/pdf/render"
import { toPresentation, type PresentationReport } from "@/lib/report/presentation/model"
import type { PersonalFoodSystemReportV1 } from "@/lib/report/deterministic/report-types"

import { reportFor } from "./narrative-fixtures"
import { normaliseSpace, pdfPageCount, pdfVisibleText } from "./pdf-text"

/**
 * The canonical Report PDF — Phase 4B-S3A.
 *
 * ══ THE BINDING GATE IS THE REAL ARTIFACT ═══════════════════════════════════
 *
 * Text is extracted from the GENERATED PDF with pdfjs and must EQUAL the text
 * the Presentation Model authorises, in order, exactly. Not containment: an
 * added sentence, a dropped sentence, a duplicated sentence and a reordered
 * block each fail.
 *
 * An element-tree check is kept alongside it as the cheap secondary — when
 * both fail the fault is upstream of react-pdf, when only the PDF fails it is
 * in generation. That is its whole job; it is not the contract.
 *
 * ══ EVERY ABSENCE TEST IS GUARDED BY A PRESENCE TEST ════════════════════════
 *
 * The extractor returned nothing at all on the branded font path in an earlier
 * survey draft, which would have made every `not.toContain` pass while proving
 * nothing. So non-vacuity is asserted FIRST, in `beforeAll`, and again per
 * fixture. A gate that cannot see is a gate that is lying.
 */

const FIXTURES = {
  you: reportFor("you"),
  family: reportFor("family"),
  /** Practical constraint. The state with no reviewed sentence. */
  constraintsKnown: reportFor("you", { core_environment_constraints_v1: ["budget"] }),
  /** A declined disclosure, which DOES carry a reviewed safety note. */
  undisclosed: reportFor("you", { core_environment_constraints_v1: ["prefer-not-to-say"] }),
  /** Long free text, to force soft wrapping through the normaliser. */
  wrapping: reportFor("you", {
    // The bank's ONLY free-text question, and the only field long enough to
    // force a soft wrap. maxLength is 600.
    core_intentions_success_v1:
      "Fewer rushed mornings, more evenings where cooking does not feel like another " +
      "task at the end of a long day, and a weekend where I am not undoing everything " +
      "I managed during the week before it has even properly started again.",
  }),
} as const

function present(report: PersonalFoodSystemReportV1): PresentationReport {
  const result = toPresentation(report)
  expect(result.ok, result.ok ? "" : result.reason).toBe(true)
  if (!result.ok) throw new Error(result.reason)
  return result.report
}

/** Every customer-visible string the model authorises, in document order. */
function authorisedText(model: PresentationReport): string[] {
  const out: string[] = [model.documentTitle]
  for (const block of model.blocks) {
    switch (block.kind) {
      case "prose":
        out.push(block.title, ...block.lines.map((l) => l.text))
        break
      case "lever":
        out.push(block.title, block.line.text)
        break
      case "loop":
        out.push(block.title)
        for (const step of block.steps) out.push(step.label, step.beat, step.text)
        break
      case "note":
      case "quotation":
        out.push(block.text)
        break
    }
  }
  return out
}

/** Render, asserting success. A refusal here is a broken build, not an outcome. */
async function pdfFor(report: PersonalFoodSystemReportV1): Promise<Buffer> {
  const result = await renderCanonicalReportPdf(present(report))
  expect(result.ok, result.ok ? "" : result.reason).toBe(true)
  if (!result.ok) throw new Error(result.reason)
  return result.pdf
}

const TIMEOUT = 60_000

/* ══ The harness must work before anything it measures is trusted ═════════ */

describe("the gate can actually see", () => {
  let text = ""

  beforeAll(async () => {
    text = await pdfVisibleText(await pdfFor(FIXTURES.you))
  }, TIMEOUT)

  it("exercises the BRANDED font path, not the fallback", () => {
    // If this ever goes false the whole suite silently starts testing a
    // document configuration production refuses to produce.
    expect(fontsRegistered).toBe(true)
  })

  it("recovers real text from a real generated PDF", () => {
    expect(text.length).toBeGreaterThan(200)
    expect(text).toContain("Personal Food System Report")
  })

  it("would notice a string that is genuinely absent", () => {
    // The other half of non-vacuity: the extractor distinguishes, rather than
    // returning something that happens to contain everything.
    expect(text).not.toContain("THIS_STRING_IS_NOT_IN_THE_REPORT_98765")
  })
})

/* ══ The binding gate ═════════════════════════════════════════════════════ */

describe("the PDF says exactly what the model authorises", () => {
  for (const [name, report] of Object.entries(FIXTURES)) {
    it(
      `${name}: extracted text equals the model's text, in order`,
      async () => {
        const model = present(report)
        const expected = normaliseSpace(authorisedText(model).join(" "))
        expect(expected.length, "the fixture authorises no text").toBeGreaterThan(100)
        expect(await pdfVisibleText(await pdfFor(report))).toBe(expected)
      },
      TIMEOUT,
    )
  }

  it(
    "the wrapping fixture really does wrap, so the normaliser is exercised",
    async () => {
      // Non-vacuity for the rule itself. Without this, the wrap fixture could
      // quietly stop wrapping and the normaliser would go untested while the
      // test kept passing.
      const model = present(FIXTURES.wrapping)
      const longest = Math.max(...authorisedText(model).map((s) => s.length))
      expect(longest, "nothing in this fixture is long enough to wrap").toBeGreaterThan(160)
      expect(await pdfVisibleText(await pdfFor(FIXTURES.wrapping))).toBe(
        normaliseSpace(authorisedText(model).join(" ")),
      )
    },
    TIMEOUT,
  )

  it(
    "an added word, a dropped sentence and a reordering would each fail",
    async () => {
      // Proves the comparison is equality rather than containment, without
      // mutating the renderer: perturb the EXPECTED side and require a
      // mismatch. A containment check would pass the first of these.
      const model = present(FIXTURES.you)
      const actual = await pdfVisibleText(await pdfFor(FIXTURES.you))
      const lines = authorisedText(model)

      expect(actual).not.toBe(normaliseSpace([...lines, "An extra sentence."].join(" ")))
      expect(actual).not.toBe(normaliseSpace(lines.slice(1).join(" ")))
      expect(actual).not.toBe(normaliseSpace([...lines].reverse().join(" ")))
      expect(actual).not.toBe(normaliseSpace([...lines, lines[1]].join(" ")))
    },
    TIMEOUT,
  )
})

describe("the element tree agrees with the model (secondary)", () => {
  /** Every string child of the react-pdf element tree, in order. */
  function treeText(node: unknown, out: string[] = []): string[] {
    if (node === null || node === undefined || node === false) return out
    if (typeof node === "string") {
      if (node.trim()) out.push(node)
      return out
    }
    if (Array.isArray(node)) {
      for (const child of node) treeText(child, out)
      return out
    }
    if (typeof node === "object" && "props" in (node as Record<string, unknown>)) {
      const element = node as { type?: unknown; props?: { children?: unknown } }
      // Function components have not run yet, so call them to reach their output.
      if (typeof element.type === "function") {
        const rendered = (element.type as (p: unknown) => unknown)(element.props ?? {})
        return treeText(rendered, out)
      }
      return treeText(element.props?.children, out)
    }
    return out
  }

  it("carries the same strings the PDF does, so a failure can be located", async () => {
    const { CanonicalReportPdf } = await import("@/lib/report/delivery/pdf/canonical-report-pdf")
    const model = present(FIXTURES.family)
    const tree = React.createElement(CanonicalReportPdf, { report: model })
    expect(normaliseSpace(treeText(tree).join(" "))).toBe(
      normaliseSpace(authorisedText(model).join(" ")),
    )
  })
})

/* ══ Nothing from the engine room, and nothing invented ═══════════════════ */

describe("the PDF authors no word of its own", () => {
  const DIR = join(process.cwd(), "lib/report/delivery/pdf")
  const STRIP_BLOCK = /\/\*[\s\S]*?\*\//g
  const STRIP_LINE = /(^|[^:])\/\/.*$/gm

  function code(file: string): string {
    return readFileSync(join(DIR, file), "utf8")
      .replace(STRIP_BLOCK, "")
      .replace(STRIP_LINE, "$1")
  }

  function sources(): string[] {
    return readdirSync(DIR).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
  }

  it("retypes no frozen presentation copy", async () => {
    // Same rule the web renderer carries. Comments stripped, because these
    // files explain the rule by naming what they must not retype.
    const { knownContentPackVersions, presentationCopyFor } = await import(
      "@/lib/report/presentation/frozen-copy"
    )
    const frozen = knownContentPackVersions().flatMap((v) =>
      Object.values(presentationCopyFor(v)!),
    )
    expect(frozen.length).toBeGreaterThan(0)
    for (const file of sources()) {
      for (const value of frozen) {
        expect(code(file).includes(value), `${file} retypes ${value}`).toBe(false)
      }
    }
  })

  it(
    "shows no page number, date, footer prose or disclaimer",
    async () => {
      const text = await pdfVisibleText(await pdfFor(FIXTURES.you))
      const model = present(FIXTURES.you)

      // finalisedAt is carried on the model for delivery; it is not shown.
      expect(text).not.toContain(model.finalisedAt)
      expect(text).not.toContain("2026")
      // Page numbers are words too.
      expect(text).not.toMatch(/\bPage\b/i)
      expect(text).not.toMatch(/\bof\s+\d+\b/)
      for (const invented of ["EatoBiotics", "Confidential", "Generated", "Disclaimer", "©"]) {
        expect(text.includes(invented), `the PDF authored "${invented}"`).toBe(false)
      }
    },
    TIMEOUT,
  )

  it("uses no react-pdf page-number facility in the source", () => {
    // `render={({ pageNumber }) => …}` and `fixed` footers are one line each,
    // which is exactly why the absence is asserted rather than assumed.
    for (const file of sources()) {
      expect(code(file).includes("pageNumber"), file).toBe(false)
      expect(code(file).includes("totalPages"), file).toBe(false)
    }
  })

  it(
    "carries no engine-room value",
    async () => {
      for (const report of [FIXTURES.you, FIXTURES.family, FIXTURES.undisclosed]) {
        const text = await pdfVisibleText(await pdfFor(report))
        expect(text).not.toContain(report.provenance.handoffId)
        expect(text).not.toContain(report.provenance.bankFingerprint)
        expect(text).not.toContain(report.provenance.contentPackVersion)
        expect(text).not.toContain(report.safety.state)
        for (const reason of report.safety.suppressionReasons) {
          expect(text).not.toContain(reason)
        }
      }
    },
    TIMEOUT,
  )

  it(
    "keeps the quotation whole",
    async () => {
      const model = present(FIXTURES.you)
      const quotation = model.blocks.find((b) => b.kind === "quotation")
      expect(quotation?.kind).toBe("quotation")
      if (quotation?.kind !== "quotation") return
      expect(await pdfVisibleText(await pdfFor(FIXTURES.you))).toContain(
        normaliseSpace(quotation.text),
      )
      for (const file of sources()) expect(code(file).includes(".split(")).toBe(false)
    },
    TIMEOUT,
  )

  it(
    "says nothing at all when the customer declared a constraint",
    async () => {
      // Pinned, not patched — the pre-activation blocker for Phase 4A-S2R1.
      // The PDF must not fill a silence the content pack left.
      expect(FIXTURES.constraintsKnown.safety.state).toBe("constraints-known")
      expect(FIXTURES.constraintsKnown.safety.note).toBeUndefined()
      const model = present(FIXTURES.constraintsKnown)
      expect(model.blocks.some((b) => b.kind === "note")).toBe(false)
      expect(await pdfVisibleText(await pdfFor(FIXTURES.constraintsKnown))).toBe(
        normaliseSpace(authorisedText(model).join(" ")),
      )
    },
    TIMEOUT,
  )
})

/* ══ The import fence ═════════════════════════════════════════════════════ */

describe("the PDF target cannot reach behind the Presentation Model", () => {
  const DIR = join(process.cwd(), "lib/report/delivery/pdf")
  const STRIP_BLOCK = /\/\*[\s\S]*?\*\//g
  const STRIP_LINE = /(^|[^:])\/\/.*$/gm

  const FORBIDDEN = [
    "deterministic/report-types",
    "deterministic/compose",
    "deterministic/content-pack",
    "deterministic/proposition",
    "deterministic/report-safety",
    "PersonalFoodSystemReportV1",
    "STRUCTURAL_COPY",
    "report/persisted",
    "presentation/frozen-copy",
    "report/access",
    "consultation/finalisation",
    "trustedAnswers",
    // Legacy PDF machinery: precedent, never authority.
    "pdf/report-pdf",
    "pdf/food-system-pdf",
    "pdf/generate-pdf",
    "claude-report",
    "assessment-scoring",
    "report/subscores",
    "report/pdf-access",
    // I/O of every kind.
    "supabase",
    "stripe",
    "@supabase",
  ]

  it("imports none of them", () => {
    const files = readdirSync(DIR).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
    expect(files.length).toBeGreaterThanOrEqual(3)
    for (const file of files) {
      const source = readFileSync(join(DIR, file), "utf8")
        .replace(STRIP_BLOCK, "")
        .replace(STRIP_LINE, "$1")
      for (const forbidden of FORBIDDEN) {
        expect(source.toLowerCase().includes(forbidden.toLowerCase()), `${file} reaches ${forbidden}`).toBe(
          false,
        )
      }
    }
  })

  it("the guard would catch a real import", () => {
    // Assembled from pieces: a literal copy of a real import line is
    // indistinguishable from one, and an edit would rewrite both together.
    const path = ["@/lib", "report", "deterministic", "report-types"].join("/")
    const planted = `import type { ${"PersonalFoodSystemReport"}V1 } from "${path}"`
    const stripped = planted.replace(STRIP_BLOCK, "").replace(STRIP_LINE, "$1")
    expect(stripped.includes("deterministic/report-types")).toBe(true)
    expect(stripped.includes("PersonalFoodSystemReportV1")).toBe(true)
  })

  it("reads the Presentation Model, and that is its only Report input", () => {
    expect(readFileSync(join(DIR, "canonical-report-pdf.tsx"), "utf8")).toContain(
      "@/lib/report/presentation/model",
    )
  })

  it("persists nothing", () => {
    for (const file of readdirSync(DIR)) {
      const source = readFileSync(join(DIR, file), "utf8")
        .replace(STRIP_BLOCK, "")
        .replace(STRIP_LINE, "$1")
      for (const io of ["createSignedUrl", "storage", "upsert", "createHash", "sha256", "bucket"]) {
        expect(source.toLowerCase().includes(io.toLowerCase()), `${file} does ${io}`).toBe(false)
      }
    }
  })
})

/* ══ The font gate ════════════════════════════════════════════════════════ */

describe("branded fonts are mandatory", () => {
  const DIR = join(process.cwd(), "lib/report/delivery/pdf")

  it("refuses rather than degrading when the brand fonts are missing", async () => {
    // The gate is what makes "no production Helvetica fallback" true. Proven by
    // running the real entry point against a module whose registration failed,
    // not by reading the source and hoping.
    vi.resetModules()
    vi.doMock("@/lib/pdf/pdf-fonts", () => ({
      fontsRegistered: false,
      FONT: {
        serif: "Helvetica", serifBold: "Helvetica-Bold", serifItalic: "Helvetica-Oblique",
        sans: "Helvetica", sansBold: "Helvetica-Bold", sansItalic: "Helvetica-Oblique",
      },
    }))
    const { renderCanonicalReportPdf: gated } = await import(
      "@/lib/report/delivery/pdf/render"
    )
    const result = await gated(present(FIXTURES.you))
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("the font gate let a Helvetica document through")
    expect(result.reason).toBe("pdf-font-assets-unavailable")
    vi.doUnmock("@/lib/pdf/pdf-fonts")
    vi.resetModules()
  })

  it("the gate is checked BEFORE anything is rendered", () => {
    // Ordering matters: a check after renderToBuffer would still return the
    // refusal, having already spent the work and — worse — having produced the
    // degraded document that something could later be tempted to use.
    const source = readFileSync(join(DIR, "render.ts"), "utf8")
    const gateAt = source.indexOf("if (!fontsRegistered)")
    const renderAt = source.indexOf("renderToBuffer(")
    expect(gateAt, "no font gate in the entry point").toBeGreaterThan(-1)
    expect(renderAt).toBeGreaterThan(-1)
    expect(gateAt).toBeLessThan(renderAt)
  })

  it("the document is not a second production entry point", () => {
    /*
     * Anything importing the document directly renders past the font gate.
     *
     * The first version of this guard searched for the literal
     * "delivery/pdf/canonical-report-pdf", which catches an aliased import and
     * MISSES the two spellings most likely to appear — `./canonical-report-pdf`
     * from a sibling in the same directory, and `../pdf/canonical-report-pdf`
     * from next door. It could have reported "only render.ts imports it" with a
     * real bypass sitting beside it.
     *
     * So specifiers are RESOLVED rather than matched. Any spelling that points
     * at the same file is the same import, which is the property the guard was
     * always trying to express.
     */
    const ROOT = process.cwd()
    const DOCUMENT = join(ROOT, "lib/report/delivery/pdf/canonical-report-pdf")
    const ENTRY = join(ROOT, "lib/report/delivery/pdf/render.ts")

    /** Every module specifier in a file: static, dynamic and require. */
    function specifiers(source: string): string[] {
      const found: string[] = []
      for (const re of [
        /\bfrom\s*["']([^"']+)["']/g,
        /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
        /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
        /\bimport\s+["']([^"']+)["']/g,
      ]) {
        for (const match of source.matchAll(re)) found.push(match[1])
      }
      return found
    }

    /** Absolute, extension-stripped, or null for a bare package specifier. */
    function resolveSpecifier(fromFile: string, specifier: string): string | null {
      let absolute: string
      if (specifier.startsWith("@/")) absolute = join(ROOT, specifier.slice(2))
      else if (specifier.startsWith(".")) absolute = resolve(dirname(fromFile), specifier)
      else return null
      return absolute.replace(/\.(ts|tsx|js|jsx|mjs)$/, "")
    }

    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (["node_modules", ".next", ".git", "tests"].includes(entry.name)) continue
        const full = join(dir, entry.name)
        if (entry.isDirectory()) {
          walk(full)
          continue
        }
        if (!/\.(ts|tsx)$/.test(entry.name)) continue
        if (full === ENTRY) continue
        if (full === `${DOCUMENT}.tsx`) continue

        for (const specifier of specifiers(readFileSync(full, "utf8"))) {
          if (resolveSpecifier(full, specifier) === DOCUMENT) {
            offenders.push(`${full.slice(ROOT.length + 1)} -> ${specifier}`)
          }
        }
      }
    }
    for (const top of ["app", "lib", "components", "scripts"]) walk(join(ROOT, top))
    expect(offenders, "these bypass the font gate").toEqual([])

    // Non-vacuity, in all three spellings the resolver must treat alike.
    const sibling = join(ROOT, "lib/report/delivery/pdf/pdf-tokens.ts")
    expect(resolveSpecifier(sibling, "./canonical-report-pdf")).toBe(DOCUMENT)
    expect(resolveSpecifier(sibling, "../pdf/canonical-report-pdf")).toBe(DOCUMENT)
    expect(resolveSpecifier(sibling, "@/lib/report/delivery/pdf/canonical-report-pdf")).toBe(
      DOCUMENT,
    )
    // …and a bare package is not mistaken for one.
    expect(resolveSpecifier(sibling, "@react-pdf/renderer")).toBeNull()
  })

  it("no operational failure is thrown across the boundary", () => {
    const source = readFileSync(join(DIR, "render.ts"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1")
    expect(source).toContain("catch")
    expect(source.includes("throw ")).toBe(false)
  })

  it("a render failure carries no Report text", () => {
    // The caught error is discarded rather than attached: react-pdf messages
    // can quote the text being laid out, and that text is the customer's own
    // words. The reason code says what happened; it never says what they wrote.
    const source = readFileSync(join(DIR, "render.ts"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1")
    expect(source).toMatch(/catch\s*\{/)
    expect(source.includes("console.")).toBe(false)
    expect(source.includes("String(err")).toBe(false)
    expect(source.includes("error.message")).toBe(false)
  })
})

/* ══ Pagination comes only from the model ═════════════════════════════════ */

describe("the PDF decides no page break", () => {
  const DIR = join(process.cwd(), "lib/report/delivery/pdf")
  const STRIP = (s: string) =>
    s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")

  it("maps each intent to exactly one react-pdf instruction", () => {
    expect(breakProps("page-before")).toEqual({ break: true })
    expect(breakProps("avoid-inside")).toEqual({ wrap: false })
    // Not `{ wrap: true }` and not `{ wrap: false }` — "no opinion" is its own
    // answer, and conflating it with wrap:false makes every unmarked block
    // unsplittable.
    expect(breakProps("none")).toEqual({})
  })

  it("writes no break or wrap instruction inline", () => {
    const document = STRIP(readFileSync(join(DIR, "canonical-report-pdf.tsx"), "utf8"))
    expect(document).not.toMatch(/\bbreak(\s*=\s*\{?\s*true|\s*\/?>)/)
    expect(document).not.toMatch(/wrap\s*=\s*\{/)
    // Every pagination instruction travels through the one mapping.
    expect(document).toContain("breakProps(block.printBreak)")
    expect(document).toContain("breakProps(step.printBreak)")
  })

  it("has no cover page and no forced break after the opening", () => {
    // Asserted on the title band's OPENING TAG rather than on a slice of the
    // file: the first version sliced from the stylesheet and swept up the
    // closing band's legitimate break intent, which is the shape of guard that
    // passes for the wrong reason the day it stops being true.
    const document = STRIP(readFileSync(join(DIR, "canonical-report-pdf.tsx"), "utf8"))
    expect(
      document,
      "the title band carries a prop beyond its style — a cover break would look exactly like this",
    ).toContain("<View style={styles.band}>")

    // And the page itself starts nothing.
    const page = document.slice(document.indexOf("<Page"), document.indexOf(">", document.indexOf("<Page")))
    expect(page).not.toContain("break")
  })

  it(
    "loop steps really are kept whole on the page",
    async () => {
      const model = present(FIXTURES.you)
      const loop = model.blocks.find((b) => b.kind === "loop")
      if (loop?.kind !== "loop") throw new Error("no loop block")
      expect(loop.steps.every((s) => s.printBreak === "avoid-inside")).toBe(true)
      expect(loop.printBreak).toBe("page-before")
      // And the intent survives into a document that actually paginates.
      expect(await pdfPageCount(await pdfFor(FIXTURES.you))).toBeGreaterThan(1)
    },
    TIMEOUT,
  )
})

/* ══ Colour ═══════════════════════════════════════════════════════════════ */

describe("colour is solid and resolved against its ground", () => {
  it("every mixed value is an opaque hex", () => {
    // A translucent border renders as an unrelated hue in react-pdf — a faint
    // green came out salmon, twice. Solidity is a correctness property here.
    for (const value of [tint("green", 8), tint("lime", 14), textOnTint("green"), textOnTint("lime")]) {
      expect(value, value).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it("the source contains no alpha colour at all", () => {
    const DIR = join(process.cwd(), "lib/report/delivery/pdf")
    for (const file of readdirSync(DIR)) {
      const source = readFileSync(join(DIR, file), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1")
      expect(source.includes("rgba("), file).toBe(false)
      expect(source.includes("withAlpha"), file).toBe(false)
      expect(source, file).not.toMatch(/#[0-9a-fA-F]{8}\b/)
    }
  })

  it("a tint really is lighter than its accent, and text on tint darker", () => {
    // Non-vacuity: a mix that returned its input unchanged would satisfy the
    // shape assertions above while producing an unreadable document.
    const lum = (hex: string) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16)
    expect(lum(tint("green", 8))).toBeGreaterThan(lum("#4CB648"))
    expect(lum(textOnTint("green"))).toBeLessThan(lum("#398133"))
  })
})

/* ══ The extractors are test tooling, not product ═════════════════════════ */

describe("the PDF extractor stays out of the application", () => {
  const ROOT = process.cwd()

  /*
   * Assembled from pieces, never written as literals.
   *
   * The first version of this guard spelled both package names out and then
   * scanned for them — and found itself, reporting this file as an offender.
   * A guard that matches its own text is the trap this repository keeps
   * relearning; the convention is to take the name apart rather than to add an
   * exclusion, because an exclusion also hides a real future offender with the
   * same path.
   */
  const LIBRARIES = [["pdfjs", "dist"].join("-")]

  it("are devDependencies, not dependencies", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    for (const name of LIBRARIES) {
      expect(pkg.devDependencies?.[name], `${name} must be a devDependency`).toBeTruthy()
      expect(pkg.dependencies?.[name], `${name} leaked into dependencies`).toBeUndefined()
    }
  })

  it("no application module imports them", () => {
    // The assertion that actually matters. A devDependency that something
    // under app/ or lib/ imports would still be bundled — and would fail in
    // production, where devDependencies are not installed.
    //
    // Deliberately NOT asserted against `.next` output: the build inlines
    // package.json, so every devDependency NAME appears there — the Playwright
    // and Vitest entries do too — while none of the library's code does. A
    // grep over build artifacts would read that manifest as an inclusion.
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (["node_modules", ".next", ".git"].includes(entry.name)) continue
        const full = join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (/\.(ts|tsx)$/.test(entry.name)) {
          const source = readFileSync(full, "utf8")
          if (LIBRARIES.some((name) => source.includes(name))) {
            offenders.push(full.slice(ROOT.length + 1))
          }
        }
      }
    }
    for (const top of ["app", "lib", "components", "scripts"]) walk(join(ROOT, top))
    expect(offenders, "these would ship a test-only library to production").toEqual([])
  })

  it("is named in exactly two places, both of them tests", () => {
    // The text helper, and the browser-side visual gate. Pinned so a third
    // user has to be argued for here rather than appearing.
    const users: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (/\.(ts|tsx)$/.test(entry.name)) {
          const source = readFileSync(full, "utf8")
          if (LIBRARIES.some((name) => source.includes(name))) {
            users.push(full.slice(join(ROOT, "tests").length + 1))
          }
        }
      }
    }
    walk(join(ROOT, "tests"))
    expect(users.sort()).toEqual(["e2e/report-pdf-visual.spec.ts", "unit/pdf-text.ts"])
  })

  it("is pinned to an exact version the project's Node can run", () => {
    // Not a range. pdfjs 6.x requires Node >= 22.13 and calls
    // `Promise.withResolvers`, which Node 20 does not have — the version this
    // PR first carried passed locally on Node 22 and took CI down on Node 20.
    // A caret would let that back in on the next lockfile refresh.
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      devDependencies?: Record<string, string>
      engines?: { node?: string }
    }
    const pinned = pkg.devDependencies?.[LIBRARIES[0]]
    expect(pinned, "the extractor must be pinned exactly").toMatch(/^\d+\.\d+\.\d+$/)
    // And the project still declares the Node it actually targets.
    expect(pkg.engines?.node).toBe(">=20 <21")
  })
})

/* ══ The visual gate inspects THIS head ═══════════════════════════════════ */

describe("the visual gate cannot validate a stale document", () => {
  /**
   * The property, expressed where the sabotage harness can reach it.
   *
   * The visual gate itself runs under Playwright, and the differential suite
   * drives vitest — so a case that broke the gate's freshness would not be
   * caught by breaking the gate. These assertions put the property in the unit
   * suite instead, so it has a guard that can fail.
   *
   * What went wrong before: the unit run wrote a gitignored PDF and the visual
   * gate read it later. CI was safe only because a clean checkout runs the
   * suites in that order — the pipeline held the property, not the test. A
   * stale artifact on a developer machine would have been inspected happily,
   * and the gate would have reported on code that was not there any more.
   * Proven by planting a good artifact, breaking the band colour and watching
   * the repaired gate fail anyway.
   */
  const SPEC = readFileSync(join(process.cwd(), "tests/e2e/report-pdf-visual.spec.ts"), "utf8")
  const CODE = SPEC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")

  it("generates the document it inspects, rather than reading one", () => {
    /*
     * Asserted at the CALL, not by the symbol appearing somewhere in the file.
     *
     * The first version checked that the generator's path and `execFileSync`
     * were each present anywhere in the source. Sabotage 366 replaced the spawn
     * with `execFileSync("true", [])` and the guard passed, because the path
     * still sat in a `const` declaration above it — the same shape of hole the
     * review found in the font-gate guard, which matched one spelling instead
     * of resolving the import.
     */
    const call = CODE.slice(CODE.indexOf("execFileSync("))
    const args = call.slice(0, call.indexOf("})"))
    expect(args, "the gate no longer spawns anything").toContain("execFileSync(")
    expect(args, "the spawn does not run the generator").toContain("GENERATOR")
    expect(args, "the spawn does not run the test runner").toContain("vitest")
    expect(args, "the spawn does not direct output at this run").toContain("CANONICAL_PDF_OUT")
  })

  it("writes into a directory it creates for the run, and removes it", () => {
    // Again at the use site: `mkdtempSync` in the import list is not evidence
    // that the workspace is per-run. Sabotage 368 pointed the workspace at the
    // shared directory and the import kept the old assertion green.
    const workspace = CODE.split("\n").find((line) => line.includes("const workspace"))
    expect(workspace, "no workspace is created").toBeDefined()
    expect(workspace!, "the workspace is not per-run").toContain("mkdtempSync")
    expect(workspace!, "the workspace is not a temporary directory").toContain("tmpdir()")
    expect(CODE, "the workspace is never removed").toContain("rmSync(workspace")
  })

  it("never reads its input from the shared artifacts directory", () => {
    // PNGs may be WRITTEN there for review. The PDF under inspection may not
    // be read from there — that is precisely the stale path.
    const reads = [...CODE.matchAll(/readFileSync\(([^)]*)\)/g)].map((m) => m[1])
    expect(reads.length).toBeGreaterThan(0)
    for (const argument of reads) {
      expect(argument.includes("ARTIFACTS"), `reads its input from ${argument}`).toBe(false)
    }
  })

  it("the generator honours the per-run output path, through the real entry point", () => {
    const source = readFileSync(
      join(process.cwd(), "tests/unit/canonical-pdf-fixture.test.ts"),
      "utf8",
    )
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")

    expect(code).toContain("process.env.CANONICAL_PDF_OUT")

    // The AWAITED CALL, not the import. Sabotage 370 swapped the render for a
    // fabricated buffer and left the import in place, which satisfied a
    // whole-file check while the font gate stopped being exercised at all.
    expect(code, "the generator no longer renders through the gated entry point").toMatch(
      /await\s+renderCanonicalReportPdf\(/,
    )
    // And it must not reach the document directly, which would render past the
    // font gate exactly as a production caller would.
    expect(code.includes("canonical-report-pdf"), "the generator bypasses the font gate").toBe(
      false,
    )
  })
})
