import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { createElement } from "react"
import { ReportPDF } from "@/components/report/report-pdf"
import type { DemoReportData } from "@/components/report/demo-report"

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as DemoReportData

    if (!data?.theme?.title || !data?.score) {
      return NextResponse.json({ error: "Invalid report data" }, { status: 400 })
    }

    // Render to buffer server-side
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(createElement(ReportPDF, { data }) as any)

    const slug = data.theme.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    return new Response(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="eatobiotics-${slug}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[report-pdf]", err)
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 })
  }
}
