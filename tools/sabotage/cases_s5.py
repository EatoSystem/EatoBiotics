# V1 scope freeze, step 5 — scheduled automation reduced to the V1 minimum.
# Cases 700+.
#
# The invariants under test:
#   the scheduled set is exactly two, and fails in BOTH directions;
#   the retention sweep still sweeps paid_report_intents;
#   a missing table is skipped, but a real database error is not;
#   the route sweeps the configured list, not a literal;
#   an unscheduled route is dormant, not unguarded.

VERCEL = "vercel.json"
RET = "app/api/feedback/retention/route.ts"
DIGEST = "app/api/feedback/digest/route.ts"

CRON = ["tests/unit/v1-cron-surface.test.ts"]
RETENTION = ["tests/unit/feedback-retention.test.ts"]
BOTH = CRON + RETENTION + ["tests/unit/v1-surface-feedback.test.ts"]

CASES = [
    # Anchors re-cut for the one-entry file after the review repair
    # (email/sequence was a scope regression and is unscheduled).
    (700, "a removed cron is put back on the schedule", VERCEL,
     '    {\n      "path": "/api/feedback/retention",\n      "schedule": "0 3 * * *"\n    }\n',
     '    {\n      "path": "/api/glp1/reminder",\n      "schedule": "0 18 * * *"\n    },\n    {\n      "path": "/api/feedback/retention",\n      "schedule": "0 3 * * *"\n    }\n',
     CRON),

    # The case the reviewer named explicitly: this exact cron, by name.
    (709, "email/sequence is put back on the schedule", VERCEL,
     '    {\n      "path": "/api/feedback/retention",\n      "schedule": "0 3 * * *"\n    }\n',
     '    {\n      "path": "/api/email/sequence",\n      "schedule": "0 9 * * *"\n    },\n    {\n      "path": "/api/feedback/retention",\n      "schedule": "0 3 * * *"\n    }\n',
     CRON),

    (701, "the retention sweep is dropped from the schedule", VERCEL,
     '    {\n      "path": "/api/feedback/retention",\n      "schedule": "0 3 * * *"\n    }\n',
     '',
     CRON),

    (702, "a kept cron is quietly rescheduled", VERCEL,
     '"path": "/api/feedback/retention",\n      "schedule": "0 3 * * *"',
     '"path": "/api/feedback/retention",\n      "schedule": "0 3 1 1 *"',
     CRON),

    (703, "an unapplied table is put back at the front of the sweep list", RET,
     '  { table: "paid_report_intents", keyColumn: "token" },',
     '  { table: "feedback", keyColumn: "id" },\n'
     '  { table: "paid_report_intents", keyColumn: "token" },',
     RETENTION),

    (704, "the only live table is dropped from the sweep list", RET,
     '  { table: "paid_report_intents", keyColumn: "token" },',
     '',
     BOTH),

    (705, "a missing table becomes fatal again", RET,
     '        if (isMissingTable(readError)) {',
     '        if (false) {',
     RETENTION),

    (706, "every database error is treated as a missing table", RET,
     'function isMissingTable(error: { code?: string }): boolean {\n'
     '  return error.code === "PGRST205" || error.code === "42P01"\n'
     '}',
     'function isMissingTable(error: { code?: string }): boolean {\n'
     '  return true\n'
     '}',
     RETENTION),

    (707, "the route sweeps an inline literal instead of the configured list", RET,
     '  return sweepTables(RETAINED_TABLES)\n}\n\nexport async function POST',
     '  return sweepTables([{ table: "feedback", keyColumn: "id" }])\n}\n\nexport async function POST',
     RETENTION),

    # Anchor corrected: this route names the variable `denied`, not
    # `unauthorised`. count=1 in the driver mutates only the first handler,
    # which is enough — the guard requires EVERY exported handler to call it.
    # DISAMBIGUATED in Gate 3.7. `verifyCronRequest(req)` is called twice in
    # this route — once in GET, once in POST — so the bare line matched both and
    # the case did not say which handler it was breaking. It mutated GET only
    # (run.py caps at one replacement) while reading as though it covered the
    # route, so the POST handler's check was never the subject of any case. The
    # anchor now names GET explicitly; the invariant tested is unchanged.
    (708, "a dormant route's GET handler loses its fail-closed cron check", DIGEST,
     'export async function GET(req: NextRequest) {\n  const denied = verifyCronRequest(req)',
     'export async function GET(req: NextRequest) {\n  const denied = null',
     CRON),
]
