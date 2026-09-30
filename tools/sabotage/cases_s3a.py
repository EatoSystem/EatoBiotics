# Phase 4B-S3A — canonical PDF target. Cases 336+.
#
# Numbering continues from S2 (310-335). Same rule as always: when a case
# slips, the TEST gets stronger, never the case.

DOC = "lib/report/delivery/pdf/canonical-report-pdf.tsx"
TOKENS = "lib/report/delivery/pdf/pdf-tokens.ts"
RENDER = "lib/report/delivery/pdf/render.ts"
TEXT = "tests/unit/pdf-text.ts"
PAGE = "app/demo/food-system-report/page.tsx"

T = ["tests/unit/report-canonical-pdf.test.ts"]

CASES = [
    # ── The fence ────────────────────────────────────────────────────────────
    (336, "PDF imports the canonical Report type", DOC,
     'import type { PresentationBlock, PresentationReport } from "@/lib/report/presentation/model"',
     'import type { PersonalFoodSystemReportV1 } from "@/lib/report/deterministic/report-types"\nimport type { PresentationBlock, PresentationReport } from "@/lib/report/presentation/model"',
     T),
    (337, "PDF imports the legacy scored ReportPDF", DOC,
     'import { FONT } from "@/lib/pdf/pdf-fonts"',
     'import { ReportPDF } from "@/lib/pdf/report-pdf"\nimport { FONT } from "@/lib/pdf/pdf-fonts"',
     T),
    (338, "PDF reaches the frozen copy registry directly", DOC,
     'import { accentColour, breakProps, fill, textOnTint, tint } from "./pdf-tokens"',
     'import { presentationCopyFor } from "@/lib/report/presentation/frozen-copy"\nimport { accentColour, breakProps, fill, textOnTint, tint } from "./pdf-tokens"',
     T),
    (339, "PDF imports Supabase storage", RENDER,
     'import { fontsRegistered } from "@/lib/pdf/pdf-fonts"',
     'import { getSupabase } from "@/lib/supabase"\nimport { fontsRegistered } from "@/lib/pdf/pdf-fonts"',
     T),

    # ── The PDF authors no word ──────────────────────────────────────────────
    (340, "PDF adds a page-number footer", DOC,
     '        <View style={styles.band}>',
     '        <Text fixed render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />\n        <View style={styles.band}>',
     T),
    (341, "PDF adds a brand footer line", DOC,
     '          <Text style={styles.bandTitle}>{report.documentTitle}</Text>',
     '          <Text style={styles.bandTitle}>{report.documentTitle}</Text>\n          <Text>EatoBiotics</Text>',
     T),
    (342, "PDF displays finalisedAt", DOC,
     '          <View style={[styles.pill, { backgroundColor: fill("lime") }]} />',
     '          <Text>{report.finalisedAt}</Text>\n          <View style={[styles.pill, { backgroundColor: fill("lime") }]} />',
     T),
    (343, "PDF drops a sentence from a prose chapter", DOC,
     '      {block.lines.map((line) => (',
     '      {block.lines.slice(1).map((line) => (',
     T),
    (344, "PDF duplicates the loop steps", DOC,
     '      {block.steps.map((step) => (',
     '      {[...block.steps, ...block.steps].map((step, dupIndex) => (',
     T),
    (345, "PDF reorders the blocks", DOC,
     '        {report.blocks.map((block) => {',
     '        {[...report.blocks].reverse().map((block) => {',
     T),
    (346, "PDF splits the atomic quotation", DOC,
     '      <Text style={styles.quote}>{block.text}</Text>',
     '      <Text style={styles.quote}>{block.text.split("\\u201c")[1]}</Text>',
     T),

    # ── Pagination is the model's ────────────────────────────────────────────
    (347, "PDF hardcodes a cover-page break", DOC,
     '        <View style={styles.band}>',
     '        <View style={styles.band} break>',
     T),
    (348, "PDF ignores a loop step's break intent", DOC,
     '        <View key={step.key} style={styles.step} {...breakProps(step.printBreak)}>',
     '        <View key={step.key} style={styles.step}>',
     T),
    (349, "break intent stops producing an instruction", TOKENS,
     '    case "page-before":\n      return { break: true }',
     '    case "page-before":\n      return {}',
     T),
    (350, "no-opinion becomes wrap:false, making every block unsplittable", TOKENS,
     '    case "none":\n      return {}',
     '    case "none":\n      return { wrap: false }',
     T),

    # ── Fonts ────────────────────────────────────────────────────────────────
    (351, "font gate removed — Helvetica ships to a paying customer", RENDER,
     '  if (!fontsRegistered) return { ok: false, reason: "pdf-font-assets-unavailable" }',
     '  // gate removed',
     T),
    (352, "font gate moved AFTER the render", RENDER,
     '  if (!fontsRegistered) return { ok: false, reason: "pdf-font-assets-unavailable" }\n\n  try {',
     '  try {',
     T),
    (353, "letterSpacing returns, and the document stops being checkable", DOC,
     '  stepLabel: { fontFamily: FONT.sansBold, fontSize: 8 },',
     '  stepLabel: { fontFamily: FONT.sansBold, fontSize: 8, letterSpacing: 1.6 },',
     T),

    # ── Colour ───────────────────────────────────────────────────────────────
    (354, "a translucent border returns — the salmon defect", DOC,
     '        <View style={[styles.leverRule, { backgroundColor: fill(block.accent.accent) }]} />',
     '        <View style={[styles.leverRule, { backgroundColor: "rgba(76, 182, 72, 0.25)" }]} />',
     T),
    (355, "the tint mix returns its input, so text sits on a raw hue", TOKENS,
     '  return `#${toHex(r1 * p + r2 * q)}${toHex(g1 * p + g2 * q)}${toHex(b1 * p + b2 * q)}`',
     '  return colour',
     T),

    # ── The harness itself ───────────────────────────────────────────────────
    (356, "the extractor returns nothing — every absence test goes vacuous", TEXT,
     '  return normaliseSpace(pages.join(" "))',
     '  return ""',
     T),
    (357, "the extractor drops the item-boundary space, welding wrapped words", TEXT,
     '        .join(" "),',
     '        .join(""),',
     T),
    (358, "the extractor reads only the first page, hiding everything after it", TEXT,
     '  for (let page = 1; page <= doc.numPages; page += 1) {',
     '  for (let page = 1; page <= 1; page += 1) {',
     T),

    # ── Reachability ─────────────────────────────────────────────────────────
    (359, "a production page imports the document, bypassing the font gate", PAGE,
     'import { CanonicalReportDocument } from "@/components/report/canonical/canonical-report"',
     'import { CanonicalReportPdf } from "@/lib/report/delivery/pdf/canonical-report-pdf"\nimport { CanonicalReportDocument } from "@/components/report/canonical/canonical-report"',
     T),
]

CASES += [
    (360, "a production module imports the test-only PDF library", RENDER,
     'import { renderToBuffer } from "@react-pdf/renderer"',
     'import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"\nimport { renderToBuffer } from "@react-pdf/renderer"',
     T),
    (361, "the extractor library is promoted to a runtime dependency", "package.json",
     '    "react-dom": "19.2.0",',
     '    "react-dom": "19.2.0",\n    "pdfjs-dist": "^6.3.289",',
     T),
]


# ── Review Repair 1 (PR #274, comment 5740249500) ───────────────────────────
CASES += [
    (362, "the document is imported by a same-directory RELATIVE specifier",
     TOKENS,
     'import { BRAND, type BrandAccent } from "@/lib/pdf/pdf-brand"',
     'import { CanonicalReportPdf } from "./canonical-report-pdf"\nimport { BRAND, type BrandAccent } from "@/lib/pdf/pdf-brand"',
     T),
    (363, "the document is imported by a sibling-relative specifier", TOKENS,
     'import type { PresentationAccent, PrintBreak } from "@/lib/report/presentation/model"',
     'import { CanonicalReportPdf } from "../pdf/canonical-report-pdf"\nimport type { PresentationAccent, PrintBreak } from "@/lib/report/presentation/model"',
     T),
    (364, "the extractor is unpinned to a caret range", "package.json",
     '"pdfjs-dist": "4.10.38"',
     '"pdfjs-dist": "^6.3.289"',
     T),
    (365, "the project quietly widens its Node engine to suit a test tool", "package.json",
     '"node": ">=20 <21"',
     '"node": ">=20"',
     T),
]

# ── Review Repair 2 (PR #274, comment 5740777112) ───────────────────────────
VISUAL = "tests/e2e/report-pdf-visual.spec.ts"
GENERATOR = "tests/unit/canonical-pdf-fixture.test.ts"

CASES += [
    (366, "the visual gate goes back to reading a persistent artifact", VISUAL,
     '    execFileSync("npx", ["vitest", "run", "--reporter=dot", GENERATOR], {',
     '    execFileSync("true", [], {',
     T),
    (367, "the visual gate reads its input from the shared artifacts directory", VISUAL,
     '    pdf = readFileSync(generated)',
     '    pdf = readFileSync(join(ARTIFACTS, "canonical-report.pdf"))',
     T),
    (368, "the per-run temp directory becomes a fixed shared path", VISUAL,
     '  const workspace = mkdtempSync(join(tmpdir(), "canonical-report-pdf-"))',
     '  const workspace = ARTIFACTS',
     T),
    (369, "the generator ignores the per-run output path", GENERATOR,
     '        process.env.CANONICAL_PDF_OUT ??',
     '        undefined ??',
     T),
    (370, "the generator stops going through the font-gated entry point", GENERATOR,
     '      const result = await renderCanonicalReportPdf(projected.report)',
     '      const { CanonicalReportPdf } = await import("@/lib/report/delivery/pdf/canonical-report-pdf")\n      const result = { ok: true as const, pdf: Buffer.from("%PDF-fake") , _: CanonicalReportPdf }',
     T),
]
