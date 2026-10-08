# V1 scope freeze, step 3 — the customer-facing launch surface. Cases 500+.
#
# The invariants under test:
#   the gate is called, and called in the right place;
#   the classification is complete and nobody can quietly widen it;
#   public content and the publishing exports are not caught by it;
#   navigation, redirects and the sitemap cannot point into a refusal;
#   a page added tomorrow fails CI rather than inheriting the launch surface.

SURF = "lib/v1-surface.ts"
PROXY = "proxy.ts"
NAV = "lib/nav.ts"
SITEMAP = "app/sitemap.ts"
HELP = "app/help/page.tsx"
REPORTS = "app/reports/page.tsx"

T = ["tests/unit/v1-surface.test.ts"]

GATE = """  if (!isServableInV1(pathname)) {
    return v1Unavailable(request)
  }
"""
PASSWORD_GATE_HEAD = """  // Site password check. During redevelopment, DEV_PASSWORD enables the gate.
  if (isPasswordGateEnabled()) {"""

CASES = [
    (500, "a Post-V1 food system is put back in the header and footer", NAV,
     '      { href: "/food", label: "Food Library", description: "Every food profiled for your gut", icon: UtensilsCrossed },',
     '      { href: "/food", label: "Food Library", description: "Every food profiled for your gut", icon: UtensilsCrossed },\n'
     '      { href: "/stability", label: "Stability", description: "Digestive comfort and rhythm", icon: UtensilsCrossed },',
     T),

    (501, "the gate is deleted from proxy.ts, leaving the import behind", PROXY,
     GATE,
     "  // gate removed\n",
     T),

    # Anchor repaired in step 4: the admin-surface check now sits between
    # the V1 gate and the divider, so the original anchor stopped existing.
    # The driver reported ANCHOR MISSING rather than SLIPPED, which is the
    # distinction that matters — the guard never went quiet. The mutation is
    # unchanged in intent: put the whole launch-surface block below the
    # password gate, where it would run after a redirect has already been
    # decided.
    (502, "the gate is moved below the password gate", PROXY,
     '  if (!isServableInV1(pathname)) {\n    return v1Unavailable(request)\n  }\n\n  // The publishing exports are an internal authoring surface, not product and\n  // not public content. They pass the check above — they are kept, and an\n  // author still uses them in production — but only with the admin cookie the\n  // /cms default-deny at the top of this function already relies on. Same\n  // mechanism, same fail-closed behaviour when no admin secret is configured;\n  // no second authentication system, and no per-page check across 76 files.\n  //\n  // The refusal is the ordinary 404, so an anonymous visitor cannot tell an\n  // export route from any other route outside the launch surface.\n  if (requiresAdminSurface(pathname)) {\n    const authed = await verifyAdminCookieEdge(request.cookies.get("admin_auth")?.value)\n    if (!authed) return v1Unavailable(request)\n  }\n  // ────────────────────────────────────────────────────────────────────────\n\n  // Site password check. During redevelopment, DEV_PASSWORD enables the gate.\n  if (isPasswordGateEnabled()) {',
     '  // Site password check. During redevelopment, DEV_PASSWORD enables the gate.\n  if (isPasswordGateEnabled()) {\n  if (!isServableInV1(pathname)) {\n    return v1Unavailable(request)\n  }\n\n  // The publishing exports are an internal authoring surface, not product and\n  // not public content. They pass the check above — they are kept, and an\n  // author still uses them in production — but only with the admin cookie the\n  // /cms default-deny at the top of this function already relies on. Same\n  // mechanism, same fail-closed behaviour when no admin secret is configured;\n  // no second authentication system, and no per-page check across 76 files.\n  //\n  // The refusal is the ordinary 404, so an anonymous visitor cannot tell an\n  // export route from any other route outside the launch surface.\n  if (requiresAdminSurface(pathname)) {\n    const authed = await verifyAdminCookieEdge(request.cookies.get("admin_auth")?.value)\n    if (!authed) return v1Unavailable(request)\n  }\n  // ────────────────────────────────────────────────────────────────────────\n\n',
     T),

    (503, "the gate is hoisted above the per-country rewrite", PROXY,
     "  const seg = pathname.slice(1).toLowerCase()",
     GATE + "  const seg = pathname.slice(1).toLowerCase()",
     T),

    (504, "a demo experience is reclassified as public content", SURF,
     '  "/demo",\n  "/demo/account",',
     '  "/demo/account",',
     T),

    (505, "the book's chapter range is narrowed, blocking real chapters", SURF,
     "export const BOOK_CHAPTER_COUNT = 25",
     "export const BOOK_CHAPTER_COUNT = 5",
     T),

    (506, "a V1 core page is dropped out of the launch surface", SURF,
     '  "/pricing",\n  "/assessment/deep",',
     '  "/assessment/deep",',
     T),

    (507, "the sitemap re-advertises a refused product page", SITEMAP,
     '  { path: "/pricing",           priority: 0.9, changeFrequency: "monthly" },',
     '  { path: "/pricing",           priority: 0.9, changeFrequency: "monthly" },\n'
     '  { path: "/glucose/glp1",      priority: 0.7, changeFrequency: "monthly" },',
     T),

    # Retargeted. The first version inserted `href: "/analyse"` as an object
    # property in the FAQ array — not a link at all, and not something any
    # renderer would turn into one, so it slipped a guard that was right to
    # ignore it. The realistic mutation is a real JSX link on a served page.
    (508, "a served page links into a refused product again", HELP,
     '        <Link href="/pricing" className="underline hover:opacity-80">Pricing</Link>',
     '        <Link href="/analyse" className="underline hover:opacity-80">Score My Meal</Link>',
     T),

    (509, "a legacy redirect is repointed into a refused route", REPORTS,
     'redirect("/pricing")',
     'redirect("/myplate")',
     T),

    (510, "the refusal becomes a redirect into an unrelated V1 page", PROXY,
     "  return NextResponse.rewrite(url, { status: 404 })",
     "  return NextResponse.redirect(url)",
     T),
]

# ── 511 is not a find/replace: it CREATES a page ────────────────────────────
# The realistic mutation is not "somebody edited the classifier", it is
# "somebody added a page and never thought about the launch surface". The
# driver replaces text in an existing file, so this one is run by run_s3.py
# with its own create/delete lifecycle and its own byte-level restore check.
NEW_PAGE = (
    511,
    "a new page is added and nobody classifies it",
    "app/a-brand-new-product/page.tsx",
    'export default function Page() {\n  return <main>new</main>\n}\n',
    T,
)
