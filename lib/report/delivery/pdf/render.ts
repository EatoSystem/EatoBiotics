import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import type { DocumentProps } from "@react-pdf/renderer"

import { fontsRegistered } from "@/lib/pdf/pdf-fonts"
import type { PresentationReport } from "@/lib/report/presentation/model"

import { CanonicalReportPdf } from "./canonical-report-pdf"

/**
 * The ONE way production code turns a prepared Report into PDF bytes —
 * Phase 4B-S3A.
 *
 * ══ WHY THIS EXISTS RATHER THAN CALLING THE DOCUMENT DIRECTLY ═══════════════
 *
 * Because of the font gate below, which cannot live inside the document
 * component: by the time react-pdf is rendering, the decision has been made.
 *
 * `lib/pdf/pdf-fonts.ts` registers Lora and DM Sans if the files are present
 * and otherwise exports Helvetica names, so that a deploy which loses
 * `public/fonts/` produces "a plainer PDF instead of no PDF". That is a
 * deliberate and correct choice for the legacy report. It is NOT the standard
 * for the canonical €49 artifact.
 *
 * A silently plainer document is a different document. The customer cannot
 * tell they received a degraded one, and neither can we after the fact. So
 * this refuses, and says why. The Report itself is unaffected — the canonical
 * persisted Report is the authority and the web target still serves it, so a
 * missing font file becomes "the PDF is briefly unavailable" rather than "your
 * Report is quietly not the document we designed".
 *
 * A caller that imported `canonical-report-pdf` directly would render straight
 * past this. A guard asserts that only this file and the tests do so.
 *
 * ══ FAILURES ARE VALUES ═════════════════════════════════════════════════════
 *
 * Nothing operational throws across this boundary, following the rule
 * `lib/report/persisted/outcomes.ts` sets: a thrown error makes "this build
 * cannot produce a PDF" indistinguishable from a crash, at a boundary that
 * decides whether a customer gets a document or an apology.
 *
 * ══ NOTHING IS PERSISTED ════════════════════════════════════════════════════
 *
 * No storage, no table, no status column, no digest, no signed URL, no object
 * path. The immutable canonical Report is the authority and this is a
 * projection of it, generated on demand. PDF byte identity is deliberately NOT
 * an integrity signal: a react-pdf upgrade, a font revision or embedded
 * metadata all move the bytes without moving a single word, so a stored hash
 * would alarm on changes that mean nothing and say nothing about the ones that
 * do.
 */

export type CanonicalPdfRenderResult =
  | { readonly ok: true; readonly pdf: Buffer }
  | {
      readonly ok: false
      readonly reason: "pdf-font-assets-unavailable" | "pdf-render-failed"
    }

export async function renderCanonicalReportPdf(
  report: PresentationReport,
): Promise<CanonicalPdfRenderResult> {
  // The gate. Before any element is built, let alone rendered.
  if (!fontsRegistered) return { ok: false, reason: "pdf-font-assets-unavailable" }

  try {
    const element = React.createElement(CanonicalReportPdf, {
      report,
    }) as unknown as React.ReactElement<DocumentProps>
    const pdf = (await renderToBuffer(element)) as Buffer
    return { ok: true, pdf }
  } catch {
    /*
     * The caught error is deliberately DISCARDED rather than attached, logged
     * or re-thrown.
     *
     * A react-pdf failure message can quote the text it was laying out, and the
     * text it was laying out is the customer's Report — their own words in the
     * quotation, what they told us about how they eat. That belongs in the
     * document and nowhere else: not in an error string, not in a log line, not
     * in an exception that some upstream handler serialises into telemetry.
     *
     * The reason code says what happened. Where it happened is recoverable from
     * the fixtures and the sabotage suite, neither of which contains anybody's
     * real answers.
     */
    return { ok: false, reason: "pdf-render-failed" }
  }
}
