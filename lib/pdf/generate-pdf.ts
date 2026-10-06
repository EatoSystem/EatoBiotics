// lib/pdf/generate-pdf.ts
// Server-only utility — wraps @react-pdf/renderer's renderToBuffer

import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import type { DocumentProps } from "@react-pdf/renderer"
import { ReportPDF } from "./report-pdf"
import type { ReportPDFProps } from "./report-pdf"

export { type ReportPDFProps }

/*
 * ══ 0R-6R · THIS BOUNDARY DROPS THE THREE PER-BIOTIC SCORES ════════════════
 *
 * `ReportPDFProps.freeScores` lost `subScores` when the legacy PDF's
 * "Your 3 Biotics" panel was deleted — name, number, per-Biotic colour and a
 * bar whose width was the score.
 *
 * Its one caller, `app/api/submit-deep-assessment/route.ts`, passes an OBJECT
 * LITERAL built from the assessment's `FreeScores`, so TypeScript's
 * excess-property check would reject the narrower shape there. That route is in
 * CLAUDE.md's "What NOT to Modify" list, so this module — which sits between
 * them and is not — takes the legacy shape and hands the component only what it
 * is allowed to see.
 *
 * Dropping the field HERE is better than widening the component's props to
 * tolerate it: the component cannot be handed the three scores at all, and the
 * discard is written down in one place instead of being an absence someone has
 * to notice.
 */
export type GeneratePdfInput = Omit<ReportPDFProps, "freeScores"> & {
  freeScores: ReportPDFProps["freeScores"] & {
    /** Accepted from legacy callers and deliberately NOT forwarded. */
    subScores?: unknown
  }
}

export async function generatePDF({ freeScores, ...rest }: GeneratePdfInput): Promise<Buffer> {
  const props: ReportPDFProps = {
    ...rest,
    freeScores: { overall: freeScores.overall, profile: freeScores.profile },
  }
  // React.createElement returns a FunctionComponentElement; cast to DocumentProps
  // element so renderToBuffer (which expects a Document root) is satisfied.
  const element = React.createElement(
    ReportPDF,
    props,
  ) as unknown as React.ReactElement<DocumentProps>
  return renderToBuffer(element) as Promise<Buffer>
}
