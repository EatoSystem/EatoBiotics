import { describe, it, expect } from "vitest"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { SystemDisclaimer } from "@/components/systems/system-disclaimer"
import {
  GLOBAL_DISCLAIMER,
  LIFE_SYSTEM_DISCLAIMER,
  SYSTEM_SUPPORT_DISCLAIMER,
} from "@/lib/assessment-disclaimers"

/**
 * SystemDisclaimer's optional `note` must stay opt-in.
 *
 * Six pages render this component without a note (/birth, /baby, /performance,
 * /longevity, /recovery, /pregnancy). #202 added the prop for /you and proved
 * they were unaffected with a throwaway render check that was then deleted —
 * so nothing stopped a later edit leaking a note into all of them. This is that
 * check, made permanent.
 *
 * Paragraph counts rather than snapshots: the assertion is about how many lines
 * of safety copy each caller gets, which is the thing that must not drift.
 */

const paragraphs = (html: string) => (html.match(/<p /g) ?? []).length
const render = (props: Parameters<typeof SystemDisclaimer>[0]) =>
  renderToStaticMarkup(React.createElement(SystemDisclaimer, props))

describe("SystemDisclaimer note prop is opt-in", () => {
  it("standard without a note renders one paragraph", () => {
    const html = render({ level: "standard" })
    expect(paragraphs(html)).toBe(1)
    expect(html).toContain(SYSTEM_SUPPORT_DISCLAIMER)
    expect(html).not.toContain(GLOBAL_DISCLAIMER)
    expect(html).not.toContain(LIFE_SYSTEM_DISCLAIMER)
  })

  it("sensitive without a note renders two, unchanged", () => {
    const html = render({ level: "sensitive" })
    expect(paragraphs(html)).toBe(2)
    expect(html).toContain(SYSTEM_SUPPORT_DISCLAIMER)
    expect(html).toContain(LIFE_SYSTEM_DISCLAIMER)
    expect(html).not.toContain(GLOBAL_DISCLAIMER)
  })

  it("only the caller that passes a note gets the extra line", () => {
    const html = render({ level: "standard", note: GLOBAL_DISCLAIMER })
    expect(paragraphs(html)).toBe(2)
    expect(html).toContain(SYSTEM_SUPPORT_DISCLAIMER)
    expect(html).toContain(GLOBAL_DISCLAIMER)
  })
})
