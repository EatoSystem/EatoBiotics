/* ── Durable PDF access: the minting rules ────────────────────────────────
   The delivery email's 7-day signed URL used to be the customer's ONLY route
   to their €49 PDF. The fix mints a fresh short-lived URL on every authorised
   report view, from the deterministic object path (`pdf-reports/{session}.pdf`)
   — never from the persisted, possibly-expired URL.

   Three layers of proof here:
   1. The availability rule (when may storage be touched at all).
   2. The minting helper against a stubbed client — including that a poisoned
      persisted URL can never be what the caller receives, and that storage is
      never called for unavailable rows.
   3. Source-structural checks on the page, in the redirect-swallow-guard
      style: the mint call sits inside the authorised, report-bearing branch,
      and the stale pdf_url is never handed to the client component. The page
      itself is unrenderable in tests (Stripe + Supabase + getUser), so
      structure is the only honest way to pin its wiring.
──────────────────────────────────────────────────────────────────────── */
import { describe, it, expect, vi } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  PDF_BUCKET,
  PDF_URL_TTL_SECONDS,
  freshPdfUrl,
  pdfIsAvailable,
  pdfObjectPath,
  type PdfStorageClient,
} from "@/lib/report/pdf-access"

function stubClient(result: string | null | Error) {
  const createSignedUrl = vi.fn(async () => {
    if (result instanceof Error) throw result
    return { data: result ? { signedUrl: result } : null, error: null }
  })
  const from = vi.fn(() => ({ createSignedUrl }))
  const client: PdfStorageClient = { storage: { from } }
  return { client, from, createSignedUrl }
}

describe("pdfIsAvailable", () => {
  it("accepts an uploaded row", () => {
    expect(pdfIsAvailable({ pdf_status: "uploaded", pdf_url: null })).toBe(true)
  })

  it.each(["pending", "failed", "upload_failed", "generated"])(
    "rejects pdf_status=%s even when a stale url is persisted",
    (status) => {
      // A non-uploaded status is authoritative: an old URL from a previous
      // successful run does not resurrect a row whose latest state failed.
      expect(pdfIsAvailable({ pdf_status: status, pdf_url: "https://old" })).toBe(false)
    },
  )

  it("accepts a legacy row: null status but a persisted url proves the upload happened", () => {
    expect(pdfIsAvailable({ pdf_status: null, pdf_url: "https://x/signed" })).toBe(true)
    expect(pdfIsAvailable({ pdf_url: "https://x/signed" })).toBe(true)
  })

  it("rejects a row with neither signal", () => {
    expect(pdfIsAvailable({ pdf_status: null, pdf_url: null })).toBe(false)
    expect(pdfIsAvailable({})).toBe(false)
    expect(pdfIsAvailable({ pdf_status: null, pdf_url: "" })).toBe(false)
  })
})

describe("freshPdfUrl", () => {
  it("never touches storage when the row is unavailable", async () => {
    const { client, from } = stubClient("https://fresh")
    const url = await freshPdfUrl(client, "cs_x", { pdf_status: "failed", pdf_url: null })
    expect(url).toBeNull()
    expect(from).not.toHaveBeenCalled()
  })

  it("mints from the deterministic object path with the short TTL", async () => {
    const { client, from, createSignedUrl } = stubClient("https://fresh/signed")
    const url = await freshPdfUrl(client, "cs_live_123", { pdf_status: "uploaded" })
    expect(url).toBe("https://fresh/signed")
    expect(from).toHaveBeenCalledWith(PDF_BUCKET)
    expect(createSignedUrl).toHaveBeenCalledWith(pdfObjectPath("cs_live_123"), PDF_URL_TTL_SECONDS)
    expect(pdfObjectPath("cs_live_123")).toBe("cs_live_123.pdf")
    // Short-lived means short-lived: an hour, not the delivery email's week.
    expect(PDF_URL_TTL_SECONDS).toBeLessThanOrEqual(60 * 60)
  })

  it("a poisoned persisted URL can never be the result", async () => {
    const POISON = "https://expired.example/EXPIRED-SIGNED-URL"
    const { client } = stubClient("https://fresh/signed")
    const url = await freshPdfUrl(client, "cs_x", { pdf_status: "uploaded", pdf_url: POISON })
    expect(url).toBe("https://fresh/signed")
    expect(url).not.toContain("EXPIRED")

    // Even on the legacy path, where pdf_url is the availability EVIDENCE,
    // the output is the freshly minted URL — or null if minting fails — and
    // never the evidence itself.
    const failing = stubClient(null)
    const legacy = await freshPdfUrl(failing.client, "cs_y", { pdf_status: null, pdf_url: POISON })
    expect(legacy).toBeNull()
  })

  it("degrades to null on a storage error instead of throwing into the page", async () => {
    const { client } = stubClient(new Error("storage down"))
    await expect(
      freshPdfUrl(client, "cs_x", { pdf_status: "uploaded" }),
    ).resolves.toBeNull()
  })
})

describe("the report page's wiring (source-structural)", () => {
  const src = readFileSync(join(process.cwd(), "app/assessment/report/page.tsx"), "utf8")

  it("mints only inside the authorised, report-bearing branch", () => {
    // Order in the source: the Stripe settle check, then the report-bearing
    // condition, then the mint. An unauthorised session redirects before any
    // of this; a report-less row never reaches the call.
    const settle = src.indexOf("isCheckoutSessionSettled(session)")
    const branch = src.indexOf('viewState !== "resume_questionnaire"')
    const mint = src.indexOf("freshPdfUrl(")
    expect(settle).toBeGreaterThan(-1)
    expect(branch).toBeGreaterThan(settle)
    expect(mint).toBeGreaterThan(branch)
  })

  it("never hands the persisted pdf_url to the client component", () => {
    // The stale URL may be read (it is legacy-availability evidence inside
    // freshPdfUrl) but must never be rendered. The only pdfUrl prop the
    // client receives is the freshly minted local.
    expect(src).not.toMatch(/pdfUrl=\{data[^}]*pdf_url/)
    expect(src).toMatch(/pdfUrl=\{pdfUrl\}/)
  })

  it("the submit route uploads to the same bucket and path the mint reads from", () => {
    const route = readFileSync(
      join(process.cwd(), "app/api/submit-deep-assessment/route.ts"),
      "utf8",
    )
    // Both sites import the shared constants — a drifted literal fails here.
    expect(route).toMatch(/from\(PDF_BUCKET\)[\s\S]{0,80}\.upload\(pdfObjectPath\(sessionId\)/)
    expect(route).not.toMatch(/"pdf-reports"/)
    expect(route).not.toMatch(/`\$\{sessionId\}\.pdf`/)
  })
})
