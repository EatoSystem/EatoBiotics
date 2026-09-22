/**
 * Which page routes the V1 launch product serves — V1 scope freeze, step 3.
 *
 * ══ WHAT THIS IS, AND WHAT IT IS NOT ════════════════════════════════════════
 *
 * This is a LAUNCH-SURFACE classification: a statement about which of the 237
 * page routes in this repository a launch customer is meant to be able to
 * enter. It is not an authorisation system and it must never be mistaken for
 * one. `/admin` and `/cms` are classified INTERNAL, which means "this gate has
 * no opinion" — their real protection is `verifyAdminCookieEdge` in proxy.ts,
 * the `app/cms/layout.tsx` gate and `requireCmsAdmin` on every `/api/cms`
 * route, and those remain authoritative. Weakening any of them would not be
 * compensated for here.
 *
 * ══ WHY SIXTEEN PAGES AND TWO HUNDRED AND THIRTY-SEVEN ROUTES BOTH FIT ══════
 *
 * "The launch product is sixteen pages" is not "the website is sixteen URLs".
 * EatoBiotics has a real public library — twenty-five book chapters, the food
 * profiles, the gut-brain and condition explainers — that is intentional
 * content and stays public and indexed. What stops at V1 is PRODUCT: a visitor
 * must not be invited into, or be able to type their way into, a food system
 * nobody can buy yet.
 *
 * So the classes are not "keep" and "delete". They are:
 *
 *   V1_CORE / V1_SUPPORTING  the sixteen. The launch product.
 *   V1_ESSENTIAL             not product pages, but the product breaks without
 *                            them: the auth callback, the email opt-out, the
 *                            offline shell, and the four routes proxy.ts
 *                            already allowlists through the private-beta gate.
 *   PUBLIC_CONTENT           intentional, indexed, not product.
 *   PUBLISHING_EXPORT        the chapter print/reedsy/substack variants. An
 *                            internal authoring surface: served only to an
 *                            authenticated admin (see `requiresAdminSurface`).
 *   INTERNAL                 admin and CMS. Their own gates decide.
 *   LEGACY_REDIRECT          a superseded door with a true V1 equivalent.
 *   FIXTURE_SELF_GATED       a fixture route whose own page already refuses
 *                            production, in a runtime that can read the
 *                            environment. This gate defers to it.
 *   POST_V1                  real work that is not part of the V1 promise.
 *   UNCLASSIFIED             a route nobody has classified yet.
 *
 * ══ WHY UNCLASSIFIED IS A SEPARATE CLASS FROM POST_V1 ═══════════════════════
 *
 * Because the two need opposite responses from the two audiences.
 *
 * At RUNTIME they are identical: `isServableInV1` refuses both, so a page added
 * next month is refused the moment it exists rather than quietly inheriting the
 * launch surface. Fail closed.
 *
 * In CI they must differ. If an unknown route simply returned POST_V1, adding a
 * page would be silently correct and the classification would rot into a rule
 * nobody maintains. `tests/unit/v1-surface.test.ts` walks `app/**` and fails on
 * any UNCLASSIFIED route, so a new page forces a decision — the same argument
 * `tests/unit/customer-surfaces.ts` makes for naming each surface rather than
 * walking the tree: every entry below is a decision someone made and a reviewer
 * can question.
 *
 * ══ NON-PAGE REQUESTS ══════════════════════════════════════════════════════
 *
 * `NOT_A_PAGE_ROUTE` is a pass-through, not an approval. API routes, Next
 * internals, static files and metadata images are none of this module's
 * business; gating them would take down `/api/health`, the Stripe webhook and
 * every share image. The V1 API surface is a separate question that steps 5–7
 * own.
 *
 * Pure: no imports, no environment, no request. Safe on the edge runtime and
 * readable from a test.
 */

export type V1SurfaceClass =
  | "V1_CORE"
  | "V1_SUPPORTING"
  | "V1_ESSENTIAL"
  | "PUBLIC_CONTENT"
  | "PUBLISHING_EXPORT"
  | "INTERNAL"
  | "LEGACY_REDIRECT"
  | "FIXTURE_SELF_GATED"
  | "POST_V1"
  | "UNCLASSIFIED"
  | "NOT_A_PAGE_ROUTE"

/* ── The launch product ─────────────────────────────────────────────────── */

/** The nine core pages: the free assessment, the €49 journey, the account. */
export const V1_CORE_ROUTES = [
  "/",
  "/assessment",
  "/assessment/you",
  "/assessment/results",
  "/pricing",
  "/assessment/deep",
  "/assessment/report",
  "/account",
  "/login",
] as const

/** The seven supporting pages: trust, legal, help, account mechanics. */
export const V1_SUPPORTING_ROUTES = [
  "/privacy",
  "/terms",
  "/about",
  "/method",
  "/help",
  "/account/settings",
  "/account/signin",
] as const

/**
 * Not product pages, but the product does not work without them.
 *
 * The last four are already allowlisted in proxy.ts's `isEnterRoute`: while
 * DEV_PASSWORD is set they are the only way into the site, and /unsubscribe
 * must answer even to someone with no access at all. Refusing them here would
 * break the private-beta gate and the email opt-out obligation in one move.
 */
export const V1_ESSENTIAL_ROUTES = [
  "/auth/callback",
  "/unsubscribe",
  "/offline",
  "/enter",
  "/preview-access",
  "/waitlist",
] as const

/* ── Intentional public content ─────────────────────────────────────────── */

/**
 * Public, indexed, and deliberately outside the funnel.
 *
 * The four condition pages are here on purpose. They are education, not
 * product — but each one used to hand the reader a CTA into the Mind
 * assessment, which V1 does not sell. The page stays; the door closes. An SEO
 * page must not be an accidental back way into a Post-V1 product.
 */
export const PUBLIC_CONTENT_ROUTES = [
  "/book",
  "/books",
  "/book-family",
  "/book-mind",
  "/food",
  "/biotics",
  "/podcast",
  "/eatosystem",
  "/roadmap",
  "/anxiety",
  "/adhd",
  "/depression",
  "/bipolar",
] as const

/** Chapters run 1..25; the numbers are literal directories under app/. */
export const BOOK_CHAPTER_COUNT = 25

/**
 * The chapter export variants.
 *
 * ══ WHAT THESE ARE, AFTER THE STEP 4 DEPENDENCY CHECK ═══════════════════════
 *
 * An authoring tool, not a product. The author opens a chapter's `substack` or
 * `reedsy` view, clicks the copy button and pastes the result into the
 * publishing platform; `print` is the same content laid out for a PDF. Nothing
 * automated consumes them — no script, no CI job, no external fetch — and
 * `docs/cms-chapter-import-spec.md` names them as public routes the CMS import
 * never touches, with `content/book/chapter-N.mdx` as the source of truth.
 *
 * ══ WHY THEY ARE NOT PUBLIC ═════════════════════════════════════════════════
 *
 * Step 3 left them serving on the inherited premise that they were "already
 * unindexed and unlinked from production UI". Half of that was wrong:
 * `components/book/chapter/chapter-nav.tsx` rendered Copy for Substack, Copy
 * for Reedsy and Print / PDF on all twenty-five public chapter pages, so an
 * internal tool was advertised to every reader of the book. `noindex` was
 * never an access control.
 *
 * They are kept — the author's workflow depends on them — and moved behind the
 * admin cookie the CMS boundary already uses. The author reaches them from
 * /admin/book-exports.
 */
export const PUBLISHING_EXPORT_VARIANTS = ["print", "reedsy", "substack"] as const

/* ── Superseded doors ───────────────────────────────────────────────────── */

/**
 * A legacy route kept alive only because it redirects somewhere a V1 customer
 * actually wants. `/reports` → `/pricing` qualifies: one-time report pricing
 * moved there.
 *
 * `/create-my-plate` deliberately does NOT qualify. It redirects to `/myplate`,
 * which is itself Post-V1, so honouring it would send a customer to a refusal
 * through an extra hop. A redirect has to preserve intent; when there is no
 * true equivalent, refusing is the honest answer.
 *
 * `/gut-brain` failed the same test, less obviously. It reads as a content
 * page — it was in the sitemap, in the Learn menu and linked from all four
 * condition pages — but its entire implementation is `redirect("/mind")`, and
 * /mind is a Food System V1 does not sell. The "Gut-Brain Science" content IS
 * the Mind landing page. It is Post-V1, and it was found by walking every
 * served route against a running server rather than by reading the classifier.
 */
export const LEGACY_REDIRECT_ROUTES = ["/reports", "/trilogy"] as const

/* ── Fixture routes that own their own production policy ────────────────── */

/**
 * Routes this gate deliberately does NOT decide, because something stricter
 * already does — in a runtime that can actually read the answer.
 *
 * ══ WHY THIS CLASS EXISTS AT ALL ════════════════════════════════════════════
 *
 * /demo/food-system-report is the canonical Report preview: a fixture document
 * that the accessibility scan and the print check both render, and that
 * `lib/report/presentation/preview-policy.ts` already refuses in production
 * with no flag, header or query parameter that can say otherwise. Refusing it
 * here as well would not make it safer. It would make it untestable, because
 * the suites need it to render in preview and this gate cannot tell preview
 * from production.
 *
 * ══ WHY THIS GATE CANNOT TELL ═══════════════════════════════════════════════
 *
 * Found the hard way, and worth writing down. proxy.ts runs in the EDGE
 * runtime, and Next compiles `process.env` into the edge bundle at BUILD time.
 * A first attempt gave this class an `isNonProductionRuntime(process.env)`
 * check of exactly the preview-policy shape; `next start` with
 * VERCEL_ENV=preview then 404'd the preview page anyway, because the value the
 * edge bundle carried was the one present when `next build` ran. The page
 * itself is a server component in the Node runtime and reads the same variable
 * correctly — which is why preview-policy.ts has always worked and why the
 * decision belongs there, not here.
 *
 * So: the proxy passes these through, and the page refuses. The test suite
 * proves each one actually has such a refusal, because "something else handles
 * it" is only true while it remains so.
 *
 * Every OTHER demo and fixture route — /demo, /demo/account*, /demo/analyse,
 * /demo/assessment, /analyse-demo, /assessment/demo, /assessment/preview,
 * /account/report/demo, /account-you* — is POST_V1 and refused everywhere,
 * including in development. None of them is needed by any suite, and
 * robots.txt was never a control.
 */
export const FIXTURE_SELF_GATED_ROUTES = ["/demo/food-system-report"] as const

/* ── Out of the V1 launch product ───────────────────────────────────────── */

/**
 * Real work that is not part of what V1 sells. Nothing here is deleted: the
 * pages, components, APIs and tests all survive, so reinstating one after
 * launch is a classification change and a navigation entry, not a rewrite.
 *
 * Grouped by what they belong to, because that is how they will come back.
 */
export const POST_V1_ROUTES = [
  // Food Systems that are not sold in V1 — landings and their assessments.
  // Each one's primary call to action starts an assessment for a product with
  // no price, so the landing page is a product door, not a content page.
  "/you",
  "/family",
  "/food-systems",
  "/stability",
  "/stability/assessment",
  "/stability/insights",
  "/stability/report",
  "/stability/results",
  "/stability/tracker",
  "/glucose",
  "/glucose/assessment",
  "/glucose/glp1",
  "/glucose/glp1/check",
  "/mind",
  "/gut-brain",
  "/assessment-mind",
  "/performance",
  "/performance-assessment",
  "/recovery",
  "/longevity",
  "/pregnancy",
  "/pregnancy/assessment",
  "/birth",
  "/baby",
  "/assessment/family",
  "/assessment/add/[addon]",

  // Living Twin — the daily ritual surfaces. `twin_state` is applied in
  // production and `/api/twin-state` also serves the mobile companion app, so
  // the API is deliberately untouched; only the web pages close.
  "/account/today",
  "/account/this-week",
  "/account/twin",
  "/today",
  "/weekly",
  "/live",
  "/digital-twin",

  // Account capabilities that belong to legacy tiers or are unfinished.
  // `/account/report/[id]` is the weekly check-in report (`weekly_checkins`),
  // NOT the €49 Personal Food System Report — that is `/assessment/report`,
  // which stays. No money path is refused here.
  "/account/consult",
  "/account/consult/deep-dive",
  "/account/doctor-report",
  "/account/family",
  "/account/glp1",
  "/account/goals",
  "/account/intelligence",
  "/account/meal-plan",
  "/account/monthly-review",
  "/account/story",
  "/account/report/[id]",

  // Meal analysis.
  "/analyse",
  "/analyse/result/[hash]",
  "/share",

  // Plate Builder and its entry points.
  "/myplate",
  "/build-plate",
  "/create-my-plate",
  "/living-plate",
  "/energy-plate",
  "/food-system-bowl",
  "/plate-builder",
  "/weekly-recipes",
  "/food-system-loop",

  // Demo and test experiences. Absence from robots.txt was never a control;
  // these refuse at runtime, in every environment. The one exception is
  // /demo/food-system-report — see FIXTURE_SELF_GATED_ROUTES above.
  "/demo",
  "/demo/account",
  "/demo/account/[tier]",
  "/demo/account/consult",
  "/demo/account/twin",
  "/demo/analyse",
  "/demo/assessment",
  "/demo/create-my-plate",
  "/analyse-demo",
  "/assessment/demo",
  "/assessment/preview",
  "/account/report/demo",
  "/account-you",
  "/account-you/[tier]",
  "/account-you-live",

  // Superseded product doors with no true V1 equivalent.
  "/report",
  "/report-you",
  "/report-mind",
  "/report-family",
  "/start",
  "/start-mind",
  "/start-family",
  "/app",
  "/course",
  "/eatobiotic",
] as const

/* ── Classification ─────────────────────────────────────────────────────── */

const CORE = new Set<string>(V1_CORE_ROUTES)
const SUPPORTING = new Set<string>(V1_SUPPORTING_ROUTES)
const ESSENTIAL = new Set<string>(V1_ESSENTIAL_ROUTES)
const CONTENT = new Set<string>(PUBLIC_CONTENT_ROUTES)
const LEGACY = new Set<string>(LEGACY_REDIRECT_ROUTES)
const POST_V1 = new Set<string>(POST_V1_ROUTES)
const SELF_GATED = new Set<string>(FIXTURE_SELF_GATED_ROUTES)
const EXPORT_VARIANTS = new Set<string>(PUBLISHING_EXPORT_VARIANTS)

/** Metadata files Next serves beside a route; never page routes. */
const METADATA_SEGMENTS = new Set(["opengraph-image", "twitter-image", "icon", "apple-icon"])

/** `/book-chapter-7` → 7, anything else → null. */
function chapterNumber(segment: string): number | null {
  const m = /^book-chapter-(\d{1,2})$/.exec(segment)
  if (!m) return null
  const n = Number(m[1])
  return n >= 1 && n <= BOOK_CHAPTER_COUNT ? n : null
}

/**
 * Classify one request pathname.
 *
 * Dynamic routes are matched by shape rather than by re-implementing Next's
 * matcher: `/food/kefir` and `/food/[slug]` are the same two-segment shape
 * under `/food`, and that is all this needs to know. Tests pass the literal
 * `[slug]` form, the runtime passes a real slug, and both land in the same
 * place.
 */
export function classifyPageRoute(pathname: string): V1SurfaceClass {
  if (!pathname.startsWith("/")) return "UNCLASSIFIED"

  // A query string or fragment is not part of the route. The runtime passes
  // `nextUrl.pathname`, which never has either, but a caller reading a literal
  // href out of source does — and a `/enter?from=%2F` that classified as
  // "nobody decided about this" would be a false alarm about a route that is
  // plainly in the list.
  const bare = pathname.split(/[?#]/)[0]

  // Normalise a trailing slash, but never turn "/" into "".
  const path = bare.length > 1 && bare.endsWith("/") ? bare.slice(0, -1) : bare
  const segments = path === "/" ? [] : path.slice(1).split("/")
  const last = segments[segments.length - 1] ?? ""

  /* Not ours: APIs, Next internals, files, metadata images. */
  if (path === "/api" || path.startsWith("/api/")) return "NOT_A_PAGE_ROUTE"
  if (path.startsWith("/_next/") || path === "/_not-found") return "NOT_A_PAGE_ROUTE"
  if (path.startsWith("/.well-known/") || path === "/monitoring") return "NOT_A_PAGE_ROUTE"
  if (last.includes(".")) return "NOT_A_PAGE_ROUTE"
  if (METADATA_SEGMENTS.has(last)) return "NOT_A_PAGE_ROUTE"

  /* Internal tooling — its own auth decides, not this gate. */
  if (segments[0] === "admin" || segments[0] === "cms") return "INTERNAL"

  /* The book: a chapter is content, its export variants are Step 4's. */
  const chapter = chapterNumber(segments[0] ?? "")
  if (chapter !== null) {
    if (segments.length === 1) return "PUBLIC_CONTENT"
    if (segments.length === 2 && EXPORT_VARIANTS.has(segments[1])) return "PUBLISHING_EXPORT"
    return "UNCLASSIFIED"
  }
  if (path === "/book/print") return "PUBLISHING_EXPORT"

  /* Dynamic public content and public entry points, matched by shape. */
  if (segments[0] === "food") {
    if (segments.length === 2) return "PUBLIC_CONTENT"                                  // /food/<slug>
    if (segments.length === 3 && segments[1] === "for") return "PUBLIC_CONTENT"          // /food/for/<goal>
  }
  if (segments[0] === "recipe" && segments.length === 2) return "PUBLIC_CONTENT"         // /recipe/<slug>
  if (segments[0] === "c" && segments.length === 2) return "V1_ESSENTIAL"                // /c/<country>
  if (segments[0] === "discover" && segments.length === 2) return "V1_ESSENTIAL"         // /discover/<code>

  /* Dynamic Post-V1 shapes. Listed as patterns above; matched as shapes here. */
  if (segments[0] === "account-you" && segments.length === 2) return "POST_V1"           // /account-you/<tier>
  if (segments[0] === "demo" && segments[1] === "account" && segments.length === 3) {
    return "POST_V1"                                                                     // /demo/account/<tier>
  }
  if (segments[0] === "assessment" && segments[1] === "add" && segments.length === 3) {
    return "POST_V1"                                                                     // /assessment/add/<addon>
  }
  if (segments[0] === "analyse" && segments[1] === "result" && segments.length === 3) {
    return "POST_V1"                                                                     // /analyse/result/<hash>
  }
  if (segments[0] === "account" && segments[1] === "report" && segments.length === 3) {
    // Both /account/report/demo and /account/report/<id> are out: the first
    // is a fixture, the second the weekly check-in report.
    return "POST_V1"
  }

  /* Named routes. */
  if (CORE.has(path)) return "V1_CORE"
  if (SUPPORTING.has(path)) return "V1_SUPPORTING"
  if (ESSENTIAL.has(path)) return "V1_ESSENTIAL"
  if (CONTENT.has(path)) return "PUBLIC_CONTENT"
  if (LEGACY.has(path)) return "LEGACY_REDIRECT"
  if (SELF_GATED.has(path)) return "FIXTURE_SELF_GATED"
  if (POST_V1.has(path)) return "POST_V1"

  /* Nobody has decided about this route. Refuse it and make CI say so. */
  return "UNCLASSIFIED"
}

/**
 * May V1 serve this request?
 *
 * The single predicate proxy.ts asks. POST_V1 and UNCLASSIFIED are both false:
 * a deliberate exclusion and an undecided route look the same to a customer,
 * which is the point of failing closed. FIXTURE_SELF_GATED is true here and
 * refused by the page — see that list for why the decision cannot live in the
 * edge runtime.
 */
export function isServableInV1(pathname: string): boolean {
  const cls = classifyPageRoute(pathname)
  return cls !== "POST_V1" && cls !== "UNCLASSIFIED"
}

/**
 * Does this route require an authenticated admin, on top of passing the launch
 * surface?
 *
 * Only the publishing exports. `/admin` and `/cms` are NOT here on purpose:
 * they are classified INTERNAL and their own controls — proxy.ts's `/cms`
 * default-deny, `app/cms/layout.tsx`, `requireCmsAdmin`, and the
 * `verifyAdminCookie` check at the top of every `/admin/*` page — decide them.
 * Naming them twice would create a second opinion about who may enter, and the
 * weaker opinion always wins an argument like that.
 *
 * Separate from `isServableInV1` deliberately: that question is about the
 * launch surface and is answerable from the pathname alone, while this one is
 * the trigger for a check that needs the request. proxy.ts asks them in that
 * order, so an export route that were ever moved out of the launch surface
 * would be refused before the cookie was even read.
 */
export function requiresAdminSurface(pathname: string): boolean {
  return classifyPageRoute(pathname) === "PUBLISHING_EXPORT"
}
