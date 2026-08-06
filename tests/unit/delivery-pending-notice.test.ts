/* ── The partial-delivery notice actually reaches the reader ──────────────
   `reportViewState` is unit tested in report-status.test.ts, but a correct
   decision that renders nothing is still a buyer staring at an unexplained
   report. These assertions cover the other half: that the state the helper
   returns turns into visible copy, and that the other two states stay silent.

   Why a component rather than the page: app/assessment/report/page.tsx is an
   async server component behind Stripe, Supabase and getUser(), and nothing in
   this repo renders an app/ page — so the notice is hoisted into
   components/assessment/delivery-pending-notice.tsx, where it can be rendered
   directly. The page mounts it unconditionally, so this file covers the whole
   state -> visibility rule rather than a slice of it.

   Test env is `environment: "node"` with no jsdom, and vitest's include is
   tests/**\/*.test.ts — hence createElement + renderToStaticMarkup rather than
   JSX, matching food-system-section.test.ts and system-disclaimer.test.ts.
──────────────────────────────────────────────────────────────────────── */
import { describe, it, expect } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { DeliveryPendingNotice } from "@/components/assessment/delivery-pending-notice"
import { reportViewState } from "@/lib/report-status"

/** Whitespace-normalised, because the copy wraps across three source lines.
 *  A raw substring match against the rendered string returns a false zero —
 *  the same trap that made a line-based grep report a fixed claim as absent. */
function render(viewState: Parameters<typeof DeliveryPendingNotice>[0]["viewState"]) {
  return renderToStaticMarkup(createElement(DeliveryPendingNotice, { viewState })).replace(
    /\s+/g,
    " ",
  )
}

describe("DeliveryPendingNotice", () => {
  /* The states are derived through the real helper rather than written as
     literals. If reportViewState's mapping ever changes, these move with it
     instead of quietly asserting against a copy of a rule that no longer
     matches the one the page uses. */
  const pending = reportViewState("partial", true)
  const complete = reportViewState("complete", true)
  const noReport = reportViewState("partial", false)

  it("derives the three states from the helper the page uses", () => {
    expect(pending).toBe("view_delivery_pending")
    expect(complete).toBe("view")
    expect(noReport).toBe("resume_questionnaire")
  })

  it("shows the buyer why their PDF or email has not arrived", () => {
    const html = render(pending)
    expect(html).toContain("Your report is ready below.")
    expect(html).toContain(
      "Your PDF download or email copy may still be on its way — everything is also available any time from your account.",
    )
  })

  it("renders nothing for a fully delivered report", () => {
    expect(render(complete)).toBe("")
  })

  it("renders nothing when there is no report to explain", () => {
    expect(render(noReport)).toBe("")
  })

  /* The house rule from app/globals.css:28-36 — the raw brand hues run
     1.55:1-2.96:1 on white, so they are legal as a tint or a border and never
     as copy. The notice reads `color: var(--foreground)`; this fails if a
     future edit reaches for the orange hue for the text instead. */
  it("keeps the raw brand hue out of the text colour", () => {
    const html = render(pending)
    expect(html).toContain("color:var(--foreground)")
    expect(html).not.toMatch(/color:\s*var\(--icon-[a-z]+\)/)
  })
})
