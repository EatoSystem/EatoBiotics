import { describe, it, expect } from "vitest"
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

import { renderCanonicalReportPdf } from "@/lib/report/delivery/pdf/render"
import { toPresentation } from "@/lib/report/presentation/model"

import { reportFor } from "./narrative-fixtures"

/**
 * Generate the canonical Report PDF for the visual gate — Phase 4B-S3A.
 *
 * ══ WHY GENERATION LIVES IN A SEPARATE FILE ═════════════════════════════════
 *
 * Because `tests/e2e/report-pdf-visual.spec.ts` cannot generate it itself.
 * Playwright's module loader cannot link `@react-pdf/primitives`, which is
 * ESM-only — `request for '@react-pdf/primitives' is from a module not been
 * linked` — so the renderer simply cannot be imported in that process.
 *
 * So the visual spec SPAWNS this file, pointing `CANONICAL_PDF_OUT` at a fresh
 * temporary directory it created and deletes afterwards.
 *
 * ══ WHY THAT MATTERS, RATHER THAN BEING PLUMBING ════════════════════════════
 *
 * The first version had the ordinary unit run write a gitignored artifact that
 * the visual gate read later. CI was safe only because it does a clean
 * checkout and runs the suites in that order — the PIPELINE was holding the
 * property, not the test. On a developer machine a stale PDF from an older
 * head survives, and the visual gate would happily pass against yesterday's
 * document while reporting on today's code.
 *
 * Writing into a directory the spec creates per run removes the failure mode
 * instead of making it unlikely: there is no file to go stale, and the bytes
 * are produced by the source currently on disk.
 *
 * Run on its own it still writes the default artifact, which is a convenience
 * for looking at the output by hand and is never what the gate reads.
 */

describe("the canonical Report PDF generates", () => {
  it(
    "renders through the real entry point and writes the bytes out",
    async () => {
      const projected = toPresentation(reportFor("family"))
      expect(projected.ok, projected.ok ? "" : projected.reason).toBe(true)
      if (!projected.ok) throw new Error(projected.reason)

      // The real entry point, so the font gate is exercised on the way.
      const result = await renderCanonicalReportPdf(projected.report)
      expect(result.ok, result.ok ? "" : result.reason).toBe(true)
      if (!result.ok) throw new Error(result.reason)

      expect(result.pdf.subarray(0, 5).toString()).toBe("%PDF-")
      expect(result.pdf.length).toBeGreaterThan(5000)

      const out =
        process.env.CANONICAL_PDF_OUT ??
        join(process.cwd(), "tests/.artifacts/canonical-report.pdf")
      mkdirSync(dirname(out), { recursive: true })
      writeFileSync(out, result.pdf)
    },
    60_000,
  )
})
