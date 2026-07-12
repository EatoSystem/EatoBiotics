import { describe, it, expect } from "vitest"
import { hidesSiteChrome } from "@/lib/nav"

/* Guards the /cms route-prefix match used by Nav and Footer to hide the
   public marketing chrome — presentation only, not a security boundary. */

describe("hidesSiteChrome", () => {
  it("hides chrome on /cms and its sub-routes", () => {
    expect(hidesSiteChrome("/cms")).toBe(true)
    expect(hidesSiteChrome("/cms/")).toBe(true)
    expect(hidesSiteChrome("/cms/create")).toBe(true)
    expect(hidesSiteChrome("/cms/library")).toBe(true)
    expect(hidesSiteChrome("/cms/media/example-id")).toBe(true)
  })

  it("keeps chrome on public routes, including near-miss slugs", () => {
    expect(hidesSiteChrome("/")).toBe(false)
    expect(hidesSiteChrome("/enter")).toBe(false)
    expect(hidesSiteChrome("/cms-example")).toBe(false)
    expect(hidesSiteChrome("/admin")).toBe(false)
  })
})
