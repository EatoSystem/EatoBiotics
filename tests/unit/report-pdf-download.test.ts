/* ── The download action is visible, honest, and never a dead link ────────
   Same shape as delivery-pending-notice.test.ts: the state check lives inside
   the component so the whole state -> UI rule is a testable unit, because the
   report page that mounts it cannot be rendered in tests.
──────────────────────────────────────────────────────────────────────── */
import { describe, it, expect } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { ReportPdfDownload } from "@/components/assessment/report-pdf-download"

function render(pdfUrl: string | null, pdfStatus: string | null) {
  return renderToStaticMarkup(createElement(ReportPdfDownload, { pdfUrl, pdfStatus })).replace(
    /\s+/g,
    " ",
  )
}

describe("ReportPdfDownload", () => {
  it("ready: renders the download action pointing at the fresh URL", () => {
    const html = render("https://fresh.example/signed?token=abc", "uploaded")
    expect(html).toContain("Download PDF")
    expect(html).toContain('href="https://fresh.example/signed?token=abc"')
    expect(html).toContain("freshly generated")
  })

  it("pending/failed: honest status copy with no anchor anywhere", () => {
    for (const status of ["pending", "failed", "upload_failed", "generated"]) {
      const html = render(null, status)
      expect(html, status).toContain("Your PDF is still being prepared.")
      expect(html, status).toContain("available on this page now")
      expect(html, `${status} must not contain a link`).not.toContain("<a ")
      expect(html, status).not.toContain("Download")
    }
  })

  it("absent: legacy rows with no PDF at all render nothing", () => {
    expect(render(null, null)).toBe("")
  })

  it("a URL always wins over a stale status — never both states at once", () => {
    // If a fresh URL was minted, the row was available; showing the pending
    // copy alongside the button would contradict it.
    const html = render("https://fresh.example/x", "pending")
    expect(html).toContain("Download PDF")
    expect(html).not.toContain("still being prepared")
  })
})
