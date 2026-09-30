# V1 scope freeze, step 2 — feedback capture out of the V1 surface. Cases 400+.

LAYOUT = "app/layout.tsx"
DASH = "components/account/live-dashboard.tsx"
FB = "app/api/feedback/route.ts"
RV = "app/api/reviews/route.ts"
ADMIN = "app/admin/feedback/page.tsx"
SCOPE = "lib/v1-scope.ts"
RETENTION = "app/api/feedback/retention/route.ts"

T = ["tests/unit/v1-surface-feedback.test.ts"]

CASES = [
    (400, "the widget is remounted site-wide in the root layout", LAYOUT,
     "          <Toaster position=\"bottom-center\" richColors />",
     "          <FeedbackWidget />\n          <Toaster position=\"bottom-center\" richColors />",
     T),
    (401, "the rating prompt is remounted in the live dashboard", DASH,
     "            <GutTrend history={scoreHistory} />",
     "            <GutTrend history={scoreHistory} />\n            <FeedbackPrompt source=\"account\" />",
     T),
    (402, "the scope constant is flipped back on without review", SCOPE,
     "export const FEEDBACK_CAPTURE_ENABLED = false",
     "export const FEEDBACK_CAPTURE_ENABLED = true",
     T),
    (403, "the feedback gate is removed entirely", FB,
     "  if (!FEEDBACK_CAPTURE_ENABLED) return new NextResponse(null, { status: 404 })",
     "  // gate removed",
     T),
    (404, "the reviews gate is removed entirely", RV,
     "  if (!FEEDBACK_CAPTURE_ENABLED) return new NextResponse(null, { status: 404 })",
     "  // gate removed",
     T),
    (405, "the feedback gate refuses with a retryable 503 instead of 404", FB,
     "  if (!FEEDBACK_CAPTURE_ENABLED) return new NextResponse(null, { status: 404 })",
     "  if (!FEEDBACK_CAPTURE_ENABLED) return new NextResponse(null, { status: 503 })",
     T),
    (406, "the admin dashboard stops refusing", ADMIN,
     "  if (!FEEDBACK_CAPTURE_ENABLED) notFound()",
     "  // no longer gated",
     T),
    # Anchor repaired in step 5, which narrowed the list to the one live table
    # and gave the declaration an explicit type. The driver reported ANCHOR
    # MISSING rather than SLIPPED — the guard never went quiet. The mutation is
    # unchanged in intent: empty the sweep list, so the job runs and deletes
    # nothing while still reporting success.
    (407, "the retention sweep is disabled as if it were a feedback job", RETENTION,
     "export const RETAINED_TABLES: readonly RetainedTable[] = [",
     "export const RETAINED_TABLES: readonly RetainedTable[] = []\nconst _UNUSED = [",
     T),
]

# ── Exact-head review repair (PR #275) ──────────────────────────────────────
# The realistic mutation the enumeration-based guard could not see: consume the
# request BEFORE the scope gate. `req.text()` was never on the blacklist, so the
# endpoint did work before refusing and the old guard stayed green.
CASES += [
    (408, "feedback consumes the request before the scope gate", FB,
     "  if (!FEEDBACK_CAPTURE_ENABLED) return new NextResponse(null, { status: 404 })",
     "  const _raw = await req.text()\n  if (!FEEDBACK_CAPTURE_ENABLED) return new NextResponse(null, { status: 404 })",
     T),
    (409, "reviews does unrelated work before the scope gate", RV,
     "  if (!FEEDBACK_CAPTURE_ENABLED) return new NextResponse(null, { status: 404 })",
     "  const _started = Date.now()\n  if (!FEEDBACK_CAPTURE_ENABLED) return new NextResponse(null, { status: 404 })",
     T),
]
