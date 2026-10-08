# V1 scope freeze, step 4 — the publishing exports as an internal authoring
# surface. Cases 600+.
#
# The invariants under test:
#   the admin check is called, once, and in the right place in the chain;
#   it actually verifies the cookie rather than merely running;
#   the export class cannot be quietly widened or narrowed;
#   public chapter pages are neither gated nor re-linked to the exports;
#   a new export variant fails CI rather than inheriting access.

SURF = "lib/v1-surface.ts"
PROXY = "proxy.ts"
NAV = "components/book/chapter/chapter-nav.tsx"

T = ["tests/unit/v1-surface.test.ts"]

ADMIN_GATE = """  if (requiresAdminSurface(pathname)) {
    const authed = await verifyAdminCookieEdge(request.cookies.get("admin_auth")?.value)
    if (!authed) return v1Unavailable(request)
  }
"""
V1_GATE = """  if (!isServableInV1(pathname)) {
    return v1Unavailable(request)
  }
"""

CASES = [
    (600, "the admin check is deleted, leaving the import behind", PROXY,
     ADMIN_GATE,
     "  // admin check removed\n",
     T),

    (601, "the admin check runs before the launch-surface gate", PROXY,
     V1_GATE + "\n",
     ADMIN_GATE + V1_GATE + "\n",
     T),

    (602, "the admin check runs but never reads the cookie", PROXY,
     ADMIN_GATE,
     "  if (requiresAdminSurface(pathname)) {\n"
     "    // trust the caller\n"
     "  }\n",
     T),

    (603, "the export predicate is narrowed to admit everyone", SURF,
     'export function requiresAdminSurface(pathname: string): boolean {\n'
     '  return classifyPageRoute(pathname) === "PUBLISHING_EXPORT"\n'
     '}',
     'export function requiresAdminSurface(pathname: string): boolean {\n'
     '  return false\n'
     '}',
     T),

    (604, "an export variant is reclassified as public content", SURF,
     'export const PUBLISHING_EXPORT_VARIANTS = ["print", "reedsy", "substack"] as const',
     'export const PUBLISHING_EXPORT_VARIANTS = ["print", "reedsy"] as const',
     T),

    (605, "the export links are put back on every public chapter page", NAV,
     "      {/* Substack CTA — white card matching site style */}",
     '      <Link href={`/book-chapter-${current.number}/substack`}>Copy for Substack</Link>\n'
     "      {/* Substack CTA — white card matching site style */}",
     T),

    (606, "the public chapter pages are swept into the admin gate", SURF,
     "    if (segments.length === 1) return \"PUBLIC_CONTENT\"",
     "    if (segments.length === 1) return \"PUBLISHING_EXPORT\"",
     T),
]

# ── 607 creates a file, like 511 ───────────────────────────────────────────
# The realistic mutation is not an edit to the classifier, it is somebody
# adding a fourth export view and never thinking about who may reach it.
NEW_VARIANT = (
    607,
    "a new export variant is added and nobody classifies it",
    "app/book-chapter-7/newsletter/page.tsx",
    'export default function Page() {\n  return <main>newsletter export</main>\n}\n',
    T,
)
