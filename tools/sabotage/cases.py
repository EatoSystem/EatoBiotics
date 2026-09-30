# Phase 4B-S2 sabotage cases — the canonical Report renderer.
#
# Numbering continues from the S1 set (247-309). Each tuple is
#   (number, name, file, find, replace, [test files])

RENDERER = "components/report/canonical/canonical-report.tsx"
MARKERS = "components/report/canonical/print-markers.ts"
MODEL = "lib/report/presentation/model.ts"
FROZEN = "lib/report/presentation/frozen-copy.ts"
POLICY = "lib/report/presentation/preview-policy.ts"
PAGE = "app/demo/food-system-report/page.tsx"

RENDERER_TESTS = ["tests/unit/report-canonical-renderer.test.ts"]
MODEL_TESTS = ["tests/unit/report-presentation-model.test.ts"]
BOTH = RENDERER_TESTS + MODEL_TESTS

CASES = [
    # ── The fence ────────────────────────────────────────────────────────────
    (
        310,
        "renderer imports the canonical Report type",
        RENDERER,
        'import type {\n  PresentationAccent,',
        'import type { PersonalFoodSystemReportV1 } from "@/lib/report/deterministic/report-types"\nimport type {\n  PresentationAccent,',
        RENDERER_TESTS,
    ),
    (
        311,
        "renderer reads the LIVE content pack for its loop heading",
        RENDERER,
        'import { printMarker } from "./print-markers"',
        'import { STRUCTURAL_COPY } from "@/lib/report/deterministic/content-pack"\nimport { printMarker } from "./print-markers"',
        RENDERER_TESTS,
    ),
    (
        312,
        "renderer reaches the frozen copy registry directly, past the model",
        RENDERER,
        'import { printMarker } from "./print-markers"',
        'import { presentationCopyFor } from "@/lib/report/presentation/frozen-copy"\nimport { printMarker } from "./print-markers"',
        RENDERER_TESTS,
    ),
    (
        313,
        "frozen copy imports the product vocabulary instead of transcribing it",
        FROZEN,
        'export interface FrozenPresentationCopy {',
        'import { PERSONAL_REPORT } from "@/lib/product-vocabulary"\n\nexport interface FrozenPresentationCopy {',
        MODEL_TESTS,
    ),
    # ── The renderer invents no words ────────────────────────────────────────
    (
        314,
        "renderer adds a standfirst nobody reviewed",
        RENDERER,
        "{report.documentTitle}\n          </Heading>",
        '{report.documentTitle}\n          </Heading>\n          <p className="mt-4 text-white">Here is what we found.</p>',
        RENDERER_TESTS,
    ),
    (
        315,
        "renderer assembles the week label itself instead of printing the model's",
        RENDERER,
        "{step.label}",
        "Week {step.week}",
        RENDERER_TESTS,
    ),
    (
        316,
        "renderer prints finalisedAt because the model happens to carry it",
        RENDERER,
        '<div className="biotic-pill mt-8"',
        '<p className="text-white">{report.finalisedAt}</p>\n          <div className="biotic-pill mt-8"',
        RENDERER_TESTS,
    ),
    (
        317,
        "renderer splits the atomic quotation to typeset the quoted half alone",
        RENDERER,
        "{block.text}\n        </blockquote>",
        '{block.text.split("\\u201c")[1]}\n        </blockquote>',
        RENDERER_TESTS,
    ),
    (
        318,
        "renderer drops a sentence from a prose chapter",
        RENDERER,
        "{block.lines.map((line) => (",
        "{block.lines.slice(1).map((line) => (",
        RENDERER_TESTS,
    ),
    (
        319,
        "renderer fills the constraints-known silence with reassurance",
        RENDERER,
        "<div className=\"mt-5 space-y-4\">",
        '<div className="mt-5 space-y-4"><p>We have taken your dietary needs into account.</p>',
        RENDERER_TESTS,
    ),
    # ── The model composes ───────────────────────────────────────────────────
    (
        320,
        "model freezes a second copy of the four loop beats",
        FROZEN,
        '    weekLabel: "Week",',
        '    weekLabel: "Week",\n    loopBeats: "Try",',
        MODEL_TESTS,
    ),
    (
        321,
        "model emits the raw week number as the label",
        MODEL,
        "label: `${weekLabel} ${step.week}`,",
        "label: `${step.week}`,",
        BOTH,
    ),
    (
        322,
        "model falls back to the newest frozen copy for an unknown pack version",
        MODEL,
        "  const copy = presentationCopyFor(report.provenance.contentPackVersion)\n  if (!copy) {",
        "  const copy =\n    presentationCopyFor(report.provenance.contentPackVersion) ??\n    presentationCopyFor(knownContentPackVersions()[0])\n  if (!copy) {",
        MODEL_TESTS,
    ),
    # ── Print ────────────────────────────────────────────────────────────────
    (
        323,
        "page-break intent stops producing a marker",
        MARKERS,
        '"page-before": "rpt-break-before",',
        '"page-before": "",',
        RENDERER_TESTS,
    ),
    (
        324,
        "dark hero stops declaring its own text colour, so print blacks it out",
        RENDERER,
        'style={{ background: "var(--foreground)", color: "#ffffff" }}\n      >\n        <div className="mx-auto max-w-2xl">',
        'style={{ background: "var(--foreground)" }}\n      >\n        <div className="mx-auto max-w-2xl">',
        RENDERER_TESTS,
    ),
    # ── Colour ───────────────────────────────────────────────────────────────
    (
        325,
        "a raw brand hue is used as body-copy colour",
        RENDERER,
        "return accent.intent === \"fill\" ? accentFill(accent.accent) : accentText(accent.accent)",
        "return accentFill(accent.accent)",
        RENDERER_TESTS,
    ),
    # ── The preview fence ────────────────────────────────────────────────────
    (
        326,
        "preview page becomes reachable in production",
        POLICY,
        'if (vercelEnv === "production") return false',
        'if (vercelEnv === "production") return true',
        RENDERER_TESTS,
    ),
    (
        327,
        "preview policy defaults to allow for anything it cannot prove",
        POLICY,
        "  // 4. An unknown VERCEL_ENV, or no VERCEL_ENV with NODE_ENV=production, is a\n  //    runtime we cannot prove is safe. Deny.\n  return false",
        "  return true",
        RENDERER_TESTS,
    ),
    (
        328,
        "preview page stops checking the fence at all",
        PAGE,
        "if (!isCanonicalReportPreviewEligible()) notFound()",
        "// fence removed",
        RENDERER_TESTS,
    ),
    (
        329,
        "preview page is prerendered, freezing the build machine's answer",
        PAGE,
        'export const dynamic = "force-dynamic"',
        'export const revalidate = 3600',
        RENDERER_TESTS,
    ),
]

# ── Review repair (PR #273, comment 5726620099) ─────────────────────────────
#
# Two blockers, both real:
#   1. print could hide unrevealed Report blocks
#   2. the renderer re-decided page-break semantics inside the 30-day loop
#
# These cases exist because the fixes are only worth what a guard can prove.

GLOBALS = "app/globals.css"

CASES += [
    (
        330,
        "renderer hardcodes a loop step's keep-together class again",
        RENDERER,
        '''className={section(
                step.printBreak,
                "rounded-2xl border border-border bg-background px-5 py-5 sm:px-7 sm:py-6",
              )}''',
        '''className="rpt-keep rounded-2xl border border-border bg-background px-5 py-5 sm:px-7 sm:py-6"''',
        RENDERER_TESTS,
    ),
    (
        331,
        "model stops carrying a loop step's break intent",
        MODEL,
        'printBreak: "avoid-inside" as const,',
        'printBreak: "none" as const,',
        RENDERER_TESTS + MODEL_TESTS,
    ),
    (
        332,
        "renderer wears the legacy hero band class, importing a break-after-page it never asked for",
        RENDERER,
        'data-band="opening"\n        className="px-5 py-16 sm:py-24"',
        'data-band="opening"\n        className="rpt-hero px-5 py-16 sm:py-24"',
        RENDERER_TESTS,
    ),
    (
        333,
        "renderer wears the legacy quote band class, importing a break-inside-avoid it never asked for",
        RENDERER,
        'className={section(block.printBreak, "px-5 py-14 sm:py-20")}',
        'className={section(block.printBreak, "rpt-quote px-5 py-14 sm:py-20")}',
        RENDERER_TESTS,
    ),
    (
        334,
        "print stops un-hiding scroll reveals, so unscrolled blocks print blank",
        GLOBALS,
        '''  .sr-reveal,
  .js .sr-reveal,
  .js .sr-reveal[data-revealed="false"] {
    opacity: 1 !important;
    transform: none !important;
  }''',
        "  /* reveal rule removed */",
        RENDERER_TESTS,
    ),
    (
        335,
        "print reveal rule loses its !important, so the base opacity-0 rule wins",
        GLOBALS,
        '''  .js .sr-reveal[data-revealed="false"] {
    opacity: 1 !important;
    transform: none !important;
  }''',
        '''  .js .sr-reveal[data-revealed="false"] {
    opacity: 1;
    transform: none;
  }''',
        RENDERER_TESTS,
    ),
]
