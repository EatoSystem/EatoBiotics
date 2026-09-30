# V1 step 7 — the €49 commercial journey. Cases 900+.
#
# The invariants under test:
#   a paid row always carries the identity that makes it claimable later;
#   every row-CREATING writer goes through the one shared projection;
#   the idempotency store fails CLOSED on a read error;
#   the event is CLAIMED before any side effect, and the claim is RELEASED
#     when the handler fails, so Stripe's retry can take it;
#   the entitlement window is anchored to the purchase and never to `now`;
#   an unsettled session cannot satisfy the paid boundary;
#   a mock cannot make the branch it claims to cover unreachable.

SESSION = "lib/paid-report-session.ts"
WEBHOOK = "app/api/stripe/webhook/route.ts"
RECONCILE = "lib/auth/reconcile-account.ts"
ANCHOR = "lib/auth/entitlement-anchor.ts"
MEMBERSHIP = "lib/membership.ts"
QUESTIONS = "app/api/generate-deep-questions/route.ts"
CLAIM = "lib/consultation/session-claim.ts"
MOCKGUARD = "tests/unit/stripe-mock-coverage.test.ts"

JOURNEY = ["tests/unit/v1-paid-journey.test.ts"]
IDENTITY = ["tests/unit/v1-paid-identity.test.ts"]
TRIAL = ["tests/unit/reconcile-account.test.ts"]
MOCKS = ["tests/unit/stripe-mock-coverage.test.ts"]
CONVERGE = ["tests/unit/membership-convergence.test.ts"]

CASES = [
    # ── Defect 1: durable identity ──────────────────────────────────────────
    (900, "the shared projection stops carrying the buyer's address", SESSION,
     '    email: normalisePaidEmail(summary.email),\n',
     '',
     IDENTITY),

    (901, "the questionnaire builds the paid row by hand instead of the projection",
     QUESTIONS,
     '        const { error } = await supabase.from("deep_assessments").insert({\n'
     '          stripe_session_id: sessionId,\n'
     '          ...owned,\n',
     '        const { error } = await supabase.from("deep_assessments").insert({\n'
     '          stripe_session_id: sessionId,\n'
     '          tier: owned.tier,\n'
     '          free_scores: owned.free_scores,\n',
     IDENTITY),

    (902, "the Consultation claimer builds the paid row by hand", CLAIM,
     '        ...ownedPaidAssessmentFields(summary),\n',
     '        tier: summary.tier,\n'
     '        free_scores: { overall: summary.overall },\n',
     IDENTITY),

    (903, "an address is accepted without normalising, so linking misses on case",
     SESSION,
     '  const trimmed = value.toLowerCase().trim()\n',
     '  const trimmed = value\n',
     IDENTITY),

    # ── Defect 4: the idempotency read fails OPEN again ─────────────────────
    (904, "a failed idempotency read is treated as 'not yet processed'", WEBHOOK,
     '  if (idempotencyReadError) {\n'
     '    console.error("[webhook] idempotency read failed:", idempotencyReadError.message)\n'
     '    return NextResponse.json({ error: "Idempotency store unavailable" }, { status: 500 })\n'
     '  }\n\n',
     '',
     JOURNEY),

    # ── Defect 3: the claim ─────────────────────────────────────────────────
    (905, "the event is no longer claimed before the side effects run", WEBHOOK,
     '  const { error: claimError } = await supabase\n'
     '    .from("stripe_processed_events")\n'
     '    .insert({ event_id: event.id, event_type: event.type })\n',
     '  const { error: claimError } = { error: null as { code?: string; message?: string } | null }\n',
     JOURNEY),

    (906, "a lost claim race continues anyway instead of stopping", WEBHOOK,
     '    if (claimError.code === "23505") {\n'
     '      return NextResponse.json({ received: true, deduped: true })\n'
     '    }\n',
     '    if (claimError.code === "23505") {\n'
     '      // fall through and process it too\n'
     '    }\n',
     JOURNEY),

    (907, "a failed handler keeps the claim, so Stripe can never retry", WEBHOOK,
     '    const { error: releaseError } = await supabase\n'
     '      .from("stripe_processed_events")\n'
     '      .delete()\n'
     '      .eq("event_id", event.id)\n',
     '    const { error: releaseError } = { error: null as { message?: string } | null }\n',
     JOURNEY),

    # ── Finding 5: the entitlement window ───────────────────────────────────
    (908, "the trial expiry is computed from now + 30 days again", RECONCILE,
     '  const proposed = anchor + THIRTY_DAYS_MS\n',
     '  const proposed = now + THIRTY_DAYS_MS\n',
     TRIAL),

    (909, "an elapsed window is revived by signing in", RECONCILE,
     '  if (proposed <= now) return { activate: false }\n',
     '',
     TRIAL),

    (910, "the webhook anchors the entitlement at now instead of the checkout",
     WEBHOOK,
     '        const anchorAt = entitlementAnchorFromSession(session)\n',
     '        const anchorAt = new Date().toISOString()\n',
     JOURNEY),

    (911, "the earliest purchase wins instead of the most recent", RECONCILE,
     '    if (Number.isNaN(ms) || ms <= latestMs) continue\n',
     '    if (Number.isNaN(ms) || (latest !== null && ms >= latestMs)) continue\n',
     TRIAL),

    # ── The paid boundary ───────────────────────────────────────────────────
    (912, "an unpaid session is treated as settled", SESSION,
     '  return session.payment_status === "paid" || session.payment_status === "no_payment_required"\n',
     '  return session.payment_status !== "no_such_status"\n',
     JOURNEY),

    # ── The mock-coverage guard itself ──────────────────────────────────────
    (913, "the mock-coverage guard stops reading a route's named imports",
     MOCKGUARD,
     '        if (!el.isTypeOnly) out.add((el.propertyName ?? el.name).text)\n',
     '        if (false) out.add((el.propertyName ?? el.name).text)\n',
     MOCKS),

    (914, "the mock-coverage guard stops reporting a vacuous file", MOCKGUARD,
     '  if (mocks.size === 0) problems.push("vacuous: this file mocks nothing")\n',
     '',
     MOCKS),

    (915, "the mock-coverage guard stops reporting a file that exercises no route",
     MOCKGUARD,
     '  if (routes.length === 0) problems.push("vacuous: this file exercises no route")\n',
     '',
     MOCKS),

    # ── Review repair: the entitlement anchor ───────────────────────────────
    (916, "the entitlement falls back to the ROW's created_at — the blocker this review found",
     RECONCILE,
     '  for (const sessionId of sessionIds) {\n',
     '  for (const row of rows ?? []) {\n'
     '    if (row?.stripe_session_id === undefined) continue\n'
     '    const rowAny = row as { created_at?: string | null }\n'
     '    if (rowAny.created_at) return rowAny.created_at\n'
     '  }\n'
     '  for (const sessionId of sessionIds) {\n',
     IDENTITY),

    (917, "the entitlement falls back to now when the purchase cannot be resolved",
     RECONCILE,
     '  if (anchorAt === null || anchorAt === undefined) return { activate: false }\n',
     '  if (anchorAt === null || anchorAt === undefined) anchorAt = Date.now()\n',
     TRIAL),

    (918, "the resolver stops requiring the checkout to have settled", ANCHOR,
     '    if (!isCheckoutSessionSettled(session)) return null\n',
     '',
     ["tests/unit/entitlement-anchor.test.ts"]),

    (919, "reconciliation resolves the purchase even for a paying subscriber",
     RECONCILE,
     '      rows.length > 0 && TRIAL_ELIGIBLE_TIERS.includes(tier) && resolve\n',
     '      rows.length > 0 && resolve\n',
     IDENTITY),

    # ── Review repair: subscription convergence ─────────────────────────────
    (920, "`updated` stops deriving founding-member status from Stripe", WEBHOOK,
     '          is_founding_member:     isFoundingMember(new Date(sub.created * 1000)),\n',
     '',
     JOURNEY),

    (921, "`updated` stops recording when the membership started", WEBHOOK,
     '          membership_started_at:  new Date(sub.created * 1000).toISOString(),\n',
     '',
     JOURNEY),

    (922, "`updated` stops recording the subscription id", WEBHOOK,
     '          stripe_subscription_id: sub.id,\n',
     '',
     JOURNEY),

    (923, "an active membership is no longer bounded by what was paid for",
     MEMBERSHIP,
     '    return paidThrough.getTime() + RENEWAL_GRACE_MS > Date.now() ? tier : "free"\n',
     '    return tier\n',
     CONVERGE),

    (924, "the renewal grace is widened so a membership never lapses", MEMBERSHIP,
     'const RENEWAL_GRACE_MS = 3 * 24 * 60 * 60 * 1000\n',
     'const RENEWAL_GRACE_MS = 365 * 100 * 24 * 60 * 60 * 1000\n',
     CONVERGE),

    (925, "a cancellation clears a separately-bought report entitlement", WEBHOOK,
     '        if (status === "active") updates.trial_expires_at = null\n',
     '        updates.trial_expires_at = null\n',
     ["tests/unit/v1-paid-journey.test.ts", "tests/unit/membership-convergence.test.ts"]),

    # ── Repair 2: the buyer can never get less than 30 days ─────────────────
    (926, "the clock starts when checkout STARTED, so a late finisher gets 29 days",
     ANCHOR,
     '  const anchorMs = expiresMs ?? (createdMs !== null ? createdMs + MAX_SESSION_LIFETIME_MS : null)\n',
     '  const anchorMs = createdMs\n',
     ["tests/unit/entitlement-anchor.test.ts"]),

    (927, "the clock starts now, untethered from the checkout entirely", ANCHOR,
     '  const anchorMs = expiresMs ?? (createdMs !== null ? createdMs + MAX_SESSION_LIFETIME_MS : null)\n',
     '  const anchorMs = Date.now()\n',
     ["tests/unit/entitlement-anchor.test.ts"]),

    (928, "the fallback is widened past the documented maximum session lifetime",
     ANCHOR,
     'const MAX_SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000\n',
     'const MAX_SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000\n',
     ["tests/unit/entitlement-anchor.test.ts"]),

    (929, "the webhook stops sharing the rule and anchors at `created` again",
     WEBHOOK,
     '        const anchorAt = entitlementAnchorFromSession(session)\n',
     '        const anchorAt = typeof session.created === "number"\n'
     '          ? new Date(session.created * 1000).toISOString()\n'
     '          : null\n',
     JOURNEY),
]
