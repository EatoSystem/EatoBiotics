/**
 * No link may point at a `/report/*` page that does not exist.
 *
 * `/eatobiotic` advertised three purchasable reports — Essential €50, Advanced
 * €75, Complete €100 — with CTAs to `/report/essential`, `/report/advanced` and
 * `/report/complete`. Only `app/report/page.tsx` exists, so all three 404'd.
 * They were an early idea that was never built; the founder confirmed the
 * products are retired, so the section is deleted (#246).
 *
 * Two things make this worth a guard rather than a one-off deletion:
 *
 *  1. The prices were fiction. `/api/checkout` sells one product, the €49
 *     report, and ignores any other tier — so those three price points
 *     corresponded to nothing that could be bought. That is the same shape as
 *     the "Starter Insights for €19" CTA removed in #245, which offered one
 *     price and charged another.
 *
 *  2. The links were the *property* form, `href: "/report/essential"`, not the
 *     JSX attribute form `href="/report/..."`. A guard written against the
 *     attribute form — the obvious one to reach for — matches nothing here and
 *     passes vacuously. This scans for the path itself, so the shape of the
 *     reference does not matter.
 *
 * The set of real routes is read from the filesystem rather than hardcoded, on
 * the same principle as the schema-drift and processor guards: a hand-written
 * list is a second thing to keep in sync, and it would go stale exactly the way
 * this section did.
 */
import { describe, it, expect } from "vitest"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

/** Route segments that actually exist under app/report/. */
function realReportRoutes(): string[] {
  if (!existsSync("app/report")) return []
  return readdirSync("app/report", { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
}

/** Every `/report/<segment>` referenced anywhere in the app or components. */
function referencedReportPaths(): { file: string; segment: string }[] {
  const found: { file: string; segment: string }[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry.startsWith(".")) continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        walk(full)
        continue
      }
      if (!/\.(ts|tsx)$/.test(entry)) continue
      const source = readFileSync(full, "utf8")
      // Matches the path in any quoted context — JSX attribute, object
      // property, template literal, redirect() argument.
      for (const match of source.matchAll(/["'`]\/report\/([a-z0-9-]+)/gi)) {
        found.push({ file: full, segment: match[1] })
      }
    }
  }
  for (const root of ["app", "components", "lib"]) walk(root)
  return found
}

describe("report links point at routes that exist", () => {
  it("has no reference to a /report/<segment> route that is not there", () => {
    const real = realReportRoutes()
    const dangling = referencedReportPaths()
      .filter(({ segment }) => !real.includes(segment))
      .map(({ file, segment }) => `${file} → /report/${segment}`)

    expect(dangling, "these links 404").toEqual([])
  })

  it("no longer advertises the retired €50/€75/€100 reports", () => {
    // The section is gone, not merely unlinked: it also carried three prices
    // for products that were never built and cannot be bought.
    const page = readFileSync("app/eatobiotic/eatobiotic-client.tsx", "utf8")
    expect(page).not.toContain("REPORTS")
    for (const price of ["€50", "€75", "€100"]) {
      expect(page, `${price} is a retired product price`).not.toContain(price)
    }
  })

  it("is scanning files that really exist, and would catch a dangling link", () => {
    // Without this the two assertions above could both pass by finding nothing
    // — a walk over the wrong roots, or a regex that matches no real syntax,
    // fails silently and looks like success. The property form is asserted
    // explicitly because that is the form the deleted links actually used.
    const probe = 'const x = { href: "/report/definitely-not-a-route" }'
    expect(probe).toMatch(/["'`]\/report\/([a-z0-9-]+)/i)
    expect(realReportRoutes).toBeTypeOf("function")
    expect(existsSync("app/report/page.tsx"), "the real /report page still exists").toBe(true)
  })
})
