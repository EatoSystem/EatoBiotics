// lib/pdf/generate-pdf.ts
// Server-only utility — wraps @react-pdf/renderer's renderToBuffer

import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import type { DocumentProps } from "@react-pdf/renderer"
import { ReportPDF } from "./report-pdf"
import type { ReportPDFProps } from "./report-pdf"

export { type ReportPDFProps }

export async function generatePDF(props: ReportPDFProps): Promise<Buffer> {
  // React.createElement returns a FunctionComponentElement; cast to DocumentProps
  // element so renderToBuffer (which expects a Document root) is satisfied.
  const element = React.createElement(
    ReportPDF,
    props,
  ) as unknown as React.ReactElement<DocumentProps>
  return renderToBuffer(element) as Promise<Buffer>
}
