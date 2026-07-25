#!/usr/bin/env node
/**
 * CI guardrail: flag app/api/**\/route.ts files that read the current
 * user's identity (getUser()) and query the database with the service-role
 * client (getSupabase(), which bypasses RLS) but contain no visible
 * per-user scoping (.eq(...), .or(...), or the shared ownerOrFilter()
 * helper) anywhere in the file.
 *
 * This is a heuristic, not a type check: it can't see whether a `.eq(` call
 * actually scopes to the request's user vs. something else. It exists to
 * catch the *absence* of any scoping call at all in a route that clearly
 * needed one, not to fully verify correctness — see REVIEW.md's Second
 * Pass, which flagged the ~110 manually-scoped call sites (no RLS backstop
 * for the service-role client) as needing this kind of net.
 *
 * Routes that use a different auth model entirely (cron/webhook/admin) are
 * allowlisted below rather than flagged, since "getUser() + no .eq()" is
 * the wrong signal for them by design.
 */

import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")

/** Manual recursive walk — avoids fs.globSync, which needs Node 22+ (CI runs Node 20). */
function findRouteFilesUnder(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      out.push(...findRouteFilesUnder(full))
    } else if (entry === "route.ts") {
      out.push(full)
    }
  }
  return out
}

// Markers that mean "this route uses a non-user-session auth model" —
// getUser() may still appear in these files as an optional/secondary path,
// but the absence of .eq() isn't a scoping bug in that case.
const ALLOWLIST_MARKERS = [
  "verifyCronRequest",   // cron/webhook jobs, lib/cron-auth.ts
  "requireCmsAdmin",     // CMS admin routes, lib/cms/auth.ts
  "verifyAdminCookie",   // admin-cookie-gated routes, lib/admin-auth.ts
  "constructEvent",      // Stripe webhook signature verification
]

// .eq()/.or()/ownerOrFilter() cover the read-side scoping pattern; user_id:/
// owner_id: covers the write-side pattern (upsert/insert with the user's own
// id set directly in the payload, e.g. .upsert({ user_id: user.id, ... },
// { onConflict: "user_id" })) — a dry run against the real codebase found
// three genuinely-scoped routes (glp1/log, glp1/profile, plate/sync) that
// only use this write-side form, with no .eq() anywhere in the file.
const SCOPING_MARKERS = [".eq(", "ownerOrFilter(", ".or(", "user_id:", "owner_id:"]

function check() {
  const flagged = []
  const apiDir = path.join(repoRoot, "app/api")

  for (const file of findRouteFilesUnder(apiDir)) {
    const src = readFileSync(file, "utf8")
    const rel = path.relative(repoRoot, file)

    if (!src.includes("getSupabase(")) continue
    if (!src.includes("getUser(")) continue
    if (ALLOWLIST_MARKERS.some((m) => src.includes(m))) continue

    const hasScoping = SCOPING_MARKERS.some((m) => src.includes(m))
    if (!hasScoping) flagged.push(rel)
  }

  return flagged
}

const flagged = check()

if (flagged.length > 0) {
  console.error("Supabase scoping check failed.")
  console.error("The following routes call getUser() + getSupabase() but have no")
  console.error("visible .eq(...)/.or(...)/ownerOrFilter(...) scoping anywhere in the file:\n")
  for (const f of flagged) console.error(`  - ${f}`)
  console.error("\nIf this route genuinely doesn't need per-user scoping (e.g. it uses a")
  console.error("different auth model), add its allowlist marker to")
  console.error("scripts/check-supabase-scoping.mjs's ALLOWLIST_MARKERS instead of ignoring")
  console.error("this failure.")
  process.exit(1)
} else {
  console.log("Supabase scoping check passed — no unscoped getUser()+getSupabase() routes found.")
}
