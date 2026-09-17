import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { CanonicalReportDocument } from "@/components/report/canonical/canonical-report"
import { printMarker } from "@/components/report/canonical/print-markers"
import {
  knownContentPackVersions,
  presentationCopyFor,
} from "@/lib/report/presentation/frozen-copy"
import { toPresentation, type PresentationReport } from "@/lib/report/presentation/model"
import { isCanonicalReportPreviewEligible } from "@/lib/report/presentation/preview-policy"
import type { PersonalFoodSystemReportV1 } from "@/lib/report/deterministic/report-types"

import { reportFor } from "./narrative-fixtures"

/**
 * The canonical Report renderer — Phase 4B-S2.
 *
 * ══ THE PROPERTY THESE TESTS EXIST FOR ══════════════════════════════════════
 *
 * The renderer invents no customer-visible word. Everything a reader sees comes
 * off the Presentation Model, which in turn carries only the canonical Report's
 * own bytes and reviewed copy frozen for that Report's content-pack version.
 *
 * That is asserted two ways, because either alone is weak. An IMPORT FENCE
 * makes it structurally impossible for the renderer to reach behind the model,
 * and a TEXT EQUALITY makes it impossible for it to type a word of its own —
 * the fence alone would happily allow a hardcoded heading, and the text check
 * alone would pass on a renderer that read the live content pack directly.
 */

const DIR_CANONICAL = join(process.cwd(), "components/report/canonical")

const YOU = reportFor("you")
const FAMILY = reportFor("family")

/** A practical constraint: not safety, not a declined disclosure, not "none". */
const CONSTRAINTS_KNOWN = reportFor("you", {
  core_environment_constraints_v1: ["budget"],
})

/** A declined disclosure, which carries a reviewed safety note. */
const UNDISCLOSED = reportFor("you", {
  core_environment_constraints_v1: ["prefer-not-to-say"],
})

function present(report: PersonalFoodSystemReportV1): PresentationReport {
  const result = toPresentation(report)
  expect(result.ok, result.ok ? "" : result.reason).toBe(true)
  if (!result.ok) throw new Error(result.reason)
  return result.report
}

function render(
  report: PresentationReport,
  headingLevel?: 1 | 2,
): string {
  return renderToStaticMarkup(
    React.createElement(CanonicalReportDocument, { report, headingLevel }),
  )
}

/* ══ Reading the output ═══════════════════════════════════════════════════ */

/**
 * Everything a reader would see, as one collapsed string.
 *
 * Tags become a SPACE rather than nothing: elements sit flush against each
 * other in the serialised markup, so deleting them outright would glue a
 * step's label to its beat and make "Week 1" and "Try" indistinguishable from
 * a single invented string "Week 1Try".
 */
function visibleText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Every customer-visible string the model authorises, in document order.
 *
 * Built by walking the model's own blocks rather than by listing what the
 * renderer happens to emit — so a renderer that DROPPED a sentence fails here
 * exactly as loudly as one that added a word. A paid document losing a line
 * silently is the worse of the two.
 */
function authorisedText(model: PresentationReport): string[] {
  const out: string[] = [model.documentTitle]
  for (const block of model.blocks) {
    switch (block.kind) {
      case "prose":
        out.push(block.title, ...block.lines.map((line) => line.text))
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

/* ══ The rule ═════════════════════════════════════════════════════════════ */

describe("the renderer invents no words", () => {
  for (const [name, report] of [
    ["you", YOU],
    ["family", FAMILY],
    ["constraints-known", CONSTRAINTS_KNOWN],
    ["undisclosed", UNDISCLOSED],
  ] as const) {
    it(`renders exactly the model's strings, in the model's order (${name})`, () => {
      const model = present(report)
      // Equality, not containment. `toContain` would pass on a renderer that
      // added a tagline above the title, which is the failure this guards.
      expect(visibleText(render(model))).toBe(authorisedText(model).join(" "))
    })
  }

  it("orders blocks exactly as the model does, and re-derives nothing", () => {
    const model = present(FAMILY)
    const html = render(model)
    const positions = model.blocks.map((block) => {
      const marker =
        block.kind === "quotation" || block.kind === "note" ? block.text : block.title
      const at = html.indexOf(marker)
      expect(at, `block ${block.key} is missing from the output`).toBeGreaterThan(-1)
      return at
    })
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })

  it("renders the family block for a household Report and not for a personal one", () => {
    const family = present(FAMILY)
    const familyBlock = family.blocks.find((b) => b.region === "family")
    expect(familyBlock, "the family fixture should carry a household block").toBeDefined()
    expect(render(family)).toContain(
      familyBlock && "title" in familyBlock ? familyBlock.title : "",
    )
    expect(present(YOU).blocks.some((b) => b.region === "family")).toBe(false)
  })

  it("renders the reviewed safety note when the Report carries one", () => {
    const model = present(UNDISCLOSED)
    const note = model.blocks.find((b) => b.kind === "note")
    expect(note, "the undisclosed fixture should carry a reviewed note").toBeDefined()
    expect(visibleText(render(model))).toContain(
      note && note.kind === "note" ? note.text : "",
    )
  })

  it("says nothing at all about a constraint the customer DID declare", () => {
    // Pinned, not patched. `constraints-known` is the one safety state with no
    // reviewed sentence: the fifteen constraint sentences are suppressed by the
    // open dietetic gate and `report-safety.ts` sets no note for this state, so
    // a customer who declared an allergy, a medical avoidance, a religious
    // requirement or a budget is told nothing about it.
    //
    // The renderer must NOT fill that silence. Inventing reassurance here would
    // assert something no reviewed content pack authorised, in the one place a
    // paid document cannot afford to be wrong. CLAUDE.md records it as a
    // pre-activation blocker for Phase 4A-S2R1; this asserts the renderer left
    // it alone.
    expect(CONSTRAINTS_KNOWN.safety.state).toBe("constraints-known")
    expect(CONSTRAINTS_KNOWN.safety.note).toBeUndefined()

    const model = present(CONSTRAINTS_KNOWN)
    expect(model.blocks.some((b) => b.kind === "note")).toBe(false)
    expect(model.blocks.some((b) => b.region === "constraints")).toBe(false)
    expect(visibleText(render(model))).toBe(authorisedText(model).join(" "))
  })
})

describe("finalisedAt is carried but never shown", () => {
  it("is on the model and absent from the markup", () => {
    const model = present(YOU)
    expect(model.finalisedAt).toBe(YOU.provenance.finalisedAt)

    const html = render(model)
    expect(html).not.toContain(model.finalisedAt)
    // Not merely the exact ISO string: no reformatted date either. The date
    // parts are what a renderer would print if it decided to be helpful.
    expect(html).not.toContain("2026-09-10")
    expect(html).not.toContain("September")
    expect(html).not.toContain("Sep 2026")
  })
})

describe("nothing from the engine room reaches the DOM", () => {
  it("carries no proposition id, template id or provenance field", () => {
    for (const report of [YOU, FAMILY, UNDISCLOSED]) {
      const html = render(present(report))
      for (const field of [
        "templateId",
        "sourceQuestionIds",
        "evidenceStatus",
        "bankFingerprint",
        "handoffId",
        "contentPackVersion",
        "composerVersion",
      ]) {
        expect(html, `${field} reached the markup`).not.toContain(field)
      }
      expect(html).not.toContain(report.provenance.handoffId)
      expect(html).not.toContain(report.provenance.bankFingerprint)
      expect(html).not.toContain(report.provenance.contentPackVersion)
      // The safety STATE decides which blocks exist and is never printed.
      expect(html).not.toContain(report.safety.state)
      for (const reason of report.safety.suppressionReasons) {
        expect(html).not.toContain(reason)
      }
    }
  })
})

/* ══ The fence ════════════════════════════════════════════════════════════ */

describe("the renderer cannot reach behind the Presentation Model", () => {
  const DIR = DIR_CANONICAL
  const STRIP_BLOCK = /\/\*[\s\S]*?\*\//g
  const STRIP_LINE = /(^|[^:])\/\/.*$/gm

  /**
   * Comments stripped first. This directory EXPLAINS at length what it must not
   * import and why, and a guard that matched its own explanation would be
   * "fixed" by deleting the explanation — which is the part that stops the next
   * person reintroducing the import. The same trap has been hit three times in
   * this codebase's guards; comment-stripping is the standing convention.
   */
  function code(file: string): string {
    return readFileSync(join(DIR, file), "utf8")
      .replace(STRIP_BLOCK, "")
      .replace(STRIP_LINE, "$1")
  }

  const FORBIDDEN = [
    // The canonical Report itself, and everything that produces it.
    "deterministic/report-types",
    "deterministic/compose",
    "deterministic/content-pack",
    "deterministic/proposition",
    "deterministic/report-safety",
    "PersonalFoodSystemReportV1",
    "STRUCTURAL_COPY",
    // The persisted wire and the frozen presentation copy. The renderer reads
    // the model; reaching the registry directly would let it select copy the
    // model did not project.
    "report/persisted",
    "presentation/frozen-copy",
    // The S1 authorisation layer. Dormant, and a renderer is not what wakes it.
    "report/access",
    // The customer's raw answers. The one source that could "compensate" for
    // the constraints-known silence, and must not.
    "consultation/finalisation",
    "trustedAnswers",
  ]

  it("no file under components/report/canonical imports any of them", () => {
    const files = readdirSync(DIR).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
    expect(files.length).toBeGreaterThanOrEqual(2)

    for (const file of files) {
      const source = code(file)
      for (const forbidden of FORBIDDEN) {
        expect(source.includes(forbidden), `${file} reaches ${forbidden}`).toBe(false)
      }
    }
  })

  it("the guard would catch a real import", () => {
    // Non-vacuity: comment-stripping must not have removed so much that nothing
    // could ever match. Assembled from pieces rather than written as a literal,
    // because a literal copy of a real import line is indistinguishable from a
    // real import line — the last edit to a guard like this rewrote the planted
    // string alongside the genuine one it was meant to catch.
    const path = ["@/lib", "report", "deterministic", "report-types"].join("/")
    const planted = `import type { ${"PersonalFoodSystemReport"}V1 } from "${path}"`
    const stripped = planted.replace(STRIP_BLOCK, "").replace(STRIP_LINE, "$1")
    expect(stripped.includes("deterministic/report-types")).toBe(true)
    expect(stripped.includes("PersonalFoodSystemReportV1")).toBe(true)
  })

  it("retypes no frozen presentation copy of its own", () => {
    /*
     * The gap the text-equality check cannot see.
     *
     * A renderer that writes `Week {step.week}` in JSX produces byte-identical
     * output to one that prints the model's composed `label` — same words, same
     * order, same everything a reader could observe. So equality passes, and
     * the copy-authoring site is back: "Week" now lives in JSX, outside the
     * version-bound snapshot, free to drift from the frozen value it duplicates
     * and invisible to every other guard here.
     *
     * A sabotage case proved exactly that before this test existed.
     *
     * So the rule is stated where it can be checked: frozen presentation copy
     * reaches the page THROUGH the model, and its words never appear as
     * literals in this directory. Comments stripped first, because the file
     * explains this rule by naming what it must not retype.
     */
    const frozen = knownContentPackVersions().flatMap((version) =>
      Object.values(presentationCopyFor(version)!),
    )
    expect(frozen.length).toBeGreaterThan(0)

    for (const file of readdirSync(DIR_CANONICAL)) {
      if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue
      const source = readFileSync(join(DIR_CANONICAL, file), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1")
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      for (const copy of frozen) {
        expect(source.includes(copy), `${file} retypes frozen copy: ${copy}`).toBe(false)
      }
    }
  })

  it("imports the Presentation Model as its only report input", () => {
    const source = code("canonical-report.tsx")
    expect(source).toContain("@/lib/report/presentation/model")
  })
})

/* ══ Structure and colour ═════════════════════════════════════════════════ */

describe("document structure", () => {
  it("has exactly one h1 and no skipped heading levels", () => {
    for (const report of [YOU, FAMILY, UNDISCLOSED]) {
      const html = render(present(report))
      const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]))
      expect(levels.filter((l) => l === 1)).toHaveLength(1)
      expect(levels[0]).toBe(1)
      let deepest = 0
      for (const level of levels) {
        expect(level, `heading jumped from h${deepest} to h${level}`).toBeLessThanOrEqual(
          deepest + 1,
        )
        deepest = Math.max(deepest, level)
      }
    }
  })

  it("shifts every heading down when the page already owns the h1", () => {
    const model = present(YOU)
    const embedded = render(model, 2)
    const levels = [...embedded.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]))
    expect(levels).not.toContain(1)
    expect(levels[0]).toBe(2)
    // Same words either way — the level is presentation, the copy is not.
    expect(visibleText(embedded)).toBe(visibleText(render(model, 1)))
  })

  it("never opens a main landmark of its own", () => {
    // app/layout.tsx provides the single `main` and the skip link that targets
    // it. A second one breaks both.
    expect(render(present(YOU))).not.toContain("<main")
  })
})

describe("colour is resolved against the ground it sits on", () => {
  /**
   * The raw brand hues run 1.55:1–2.96:1 on white and fail AA as copy; the
   * calibrated variants invert that on a dark ground. So a `color` declaration
   * naming a RAW hue is a contrast bug wherever it appears on a light surface,
   * and it has shipped twice before (#184, #187).
   *
   * Matched only where the property is exactly `color` — a raw hue as a
   * background, a border or a rule is the correct use and stays allowed.
   */
  it("sets no text colour to a raw brand hue", () => {
    for (const report of [YOU, FAMILY, UNDISCLOSED]) {
      const html = render(present(report))
      const raw = [...html.matchAll(/(?<![-a-z])color:var\(--icon-[a-z]+\)/g)]
      expect(raw.map((m) => m[0])).toEqual([])
    }
  })

  it("uses raw hues for fills, which is what they are for", () => {
    // Non-vacuity for the check above: if nothing used a raw hue at all, that
    // assertion would be trivially true and would keep passing after somebody
    // removed every accent from the document.
    expect(render(present(YOU))).toContain("background:var(--icon-")
  })

  it("names no brand hue as a text utility in the source", () => {
    // Assembled from pieces, never written as a literal class: Tailwind v4's
    // scanner reads test files too, and a literal spelling of the bracket form
    // once emitted invalid CSS that broke `next dev` while `next build` stayed
    // green (#217).
    const utility = ["text", "icon", ""].join("-")
    const bracketForm = `text-[${"var(--icon"}`
    for (const file of readdirSync(DIR_CANONICAL)) {
      if (!file.endsWith(".tsx") && !file.endsWith(".ts")) continue
      const source = readFileSync(join(DIR_CANONICAL, file), "utf8")
      expect(source.includes(utility), `${file} uses a raw hue text utility`).toBe(false)
      expect(source.includes(bracketForm), `${file} uses the bracket hue form`).toBe(false)
    }
  })
})

describe("no emoji anywhere in the document", () => {
  it("the report model deleted emoji on purpose, and the renderer keeps it that way", () => {
    const EMOJI = /\p{Extended_Pictographic}/u
    for (const report of [YOU, FAMILY, UNDISCLOSED]) {
      expect(EMOJI.test(render(present(report)))).toBe(false)
    }
    for (const file of readdirSync(DIR_CANONICAL)) {
      expect(EMOJI.test(readFileSync(join(DIR_CANONICAL, file), "utf8")), file).toBe(false)
    }
  })
})

/* ══ Print ════════════════════════════════════════════════════════════════ */

describe("print break intent travels as a marker", () => {
  it("emits the marker the model asked for, on every block that asked", () => {
    const model = present(FAMILY)
    const html = render(model)
    let asserted = 0
    for (const block of model.blocks) {
      const marker = printMarker(block.printBreak)
      if (!marker) continue
      asserted += 1
      expect(
        html.indexOf(marker),
        `${block.key} lost its ${block.printBreak} marker`,
      ).toBeGreaterThan(-1)
    }
    expect(asserted).toBeGreaterThan(2)
    expect(html).toContain("rpt-break-before")
    expect(html).toContain("rpt-keep")
  })

  it("the markers it emits are actually styled for print", () => {
    // A marker class nothing styles is a decoration that looks like a decision.
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8")
    expect(css).toContain(".rpt-break-before")
    expect(css).toContain(".rpt-keep")
    expect(css).toContain(".rpt-hero")
    expect(css).toContain(".rpt-quote")
  })

  it("dark bands declare their own text colour, so print cannot black them out", () => {
    // The print sheet forces `color: inherit` inside a dark band. With no colour
    // declared on the band itself that inherits from `body`, which print sets to
    // the same dark green as the band's background — invisible on paper only,
    // and only for a customer.
    const html = render(present(YOU))
    const hero = html.slice(html.indexOf("rpt-hero"), html.indexOf("section-divider"))
    expect(hero).toContain("color:#ffffff")
    const quote = html.slice(html.indexOf("rpt-quote"))
    expect(quote).toContain("color:#ffffff")
  })

  it("none means no marker, rather than a class that does nothing", () => {
    expect(printMarker("none")).toBe("")
    expect(printMarker("page-before")).toBe("rpt-break-before")
    expect(printMarker("avoid-inside")).toBe("rpt-keep")
  })
})

/* ══ The preview page ═════════════════════════════════════════════════════ */

describe("the preview page is fenced to non-production runtimes", () => {
  /**
   * `NodeJS.ProcessEnv` requires NODE_ENV, and half of these cases are ABOUT
   * NODE_ENV being absent — so the cast is what lets the absent cases be
   * written at all. Same helper as `consultation-activation-policy.test.ts`.
   */
  function env(overrides: Record<string, string | undefined>): NodeJS.ProcessEnv {
    return overrides as NodeJS.ProcessEnv
  }

  it("denies production outright", () => {
    expect(isCanonicalReportPreviewEligible(env({ VERCEL_ENV: "production" }))).toBe(false)
    // Including when a dev-looking NODE_ENV is also present. VERCEL_ENV wins.
    expect(
      isCanonicalReportPreviewEligible(env({ VERCEL_ENV: "production", NODE_ENV: "development" })),
    ).toBe(false)
  })

  it("allows Vercel's non-production deployments", () => {
    expect(isCanonicalReportPreviewEligible(env({ VERCEL_ENV: "preview" }))).toBe(true)
    expect(isCanonicalReportPreviewEligible(env({ VERCEL_ENV: "development" }))).toBe(true)
  })

  it("allows a local dev server or a test runner, positively identified", () => {
    expect(isCanonicalReportPreviewEligible(env({ NODE_ENV: "development" }))).toBe(true)
    expect(isCanonicalReportPreviewEligible(env({ NODE_ENV: "test" }))).toBe(true)
  })

  it("denies everything it cannot prove", () => {
    // Absence of a Vercel variable is not evidence of safety.
    expect(isCanonicalReportPreviewEligible(env({}))).toBe(false)
    expect(isCanonicalReportPreviewEligible(env({ NODE_ENV: "production" }))).toBe(false)
    expect(isCanonicalReportPreviewEligible(env({ VERCEL_ENV: "staging" }))).toBe(false)
    expect(isCanonicalReportPreviewEligible(env({ VERCEL_ENV: "" }))).toBe(false)
  })

  it("reads nothing a client could set", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/report/presentation/preview-policy.ts"),
      "utf8",
    ).replace(/\/\*[\s\S]*?\*\//g, "")
    for (const escape of ["searchParams", "headers(", "cookies(", "NEXT_PUBLIC_", "request"]) {
      expect(source.includes(escape), `the policy reads ${escape}`).toBe(false)
    }
  })

  it("the page fails closed and touches nothing real", () => {
    const page = readFileSync(
      join(process.cwd(), "app/demo/food-system-report/page.tsx"),
      "utf8",
    )
    const code = page.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")

    // The CALL, matched as a statement — not the bare identifier, which also
    // appears in the import line and therefore survives deleting the guard
    // entirely. A sabotage case replaced the whole check with a comment and
    // this assertion still passed, because the import was enough to satisfy it.
    const FENCE = /if\s*\(\s*!\s*isCanonicalReportPreviewEligible\s*\(\s*\)\s*\)\s*\{?\s*notFound\s*\(\s*\)/
    expect(code, "the preview page no longer refuses an ineligible runtime").toMatch(FENCE)

    // Non-vacuity, assembled from pieces so an edit to the real guard cannot
    // quietly rewrite the planted copy of it alongside.
    const planted = `if (!isCanonicalReportPreview${"Eligible"}()) notFound()`
    expect(FENCE.test(planted)).toBe(true)

    // And the refusal on an unpresentable Report is still its own branch.
    expect(code).toContain("notFound()")
    // No database, no authority layer, no persistence, no payment.
    for (const forbidden of [
      "supabase",
      "getUser",
      "stripe",
      "ensurePersistedConsultationReport",
      "report/access",
      "deep_assessments",
    ]) {
      expect(code.toLowerCase().includes(forbidden.toLowerCase()), forbidden).toBe(false)
    }
    // Rendered per request: a prerendered page would carry the BUILD machine's
    // eligibility answer into whatever deployment served it.
    expect(code).toContain('dynamic = "force-dynamic"')
    expect(page).toContain('robots: "noindex"')
  })

  it("nothing links to it", () => {
    const path = "/demo/food-system-report"
    for (const file of ["app/sitemap.ts", "lib/nav.ts"]) {
      expect(readFileSync(join(process.cwd(), file), "utf8").includes(path), file).toBe(false)
    }
  })
})
