# V1 step 6 — abuse protection on the five open endpoints. Cases 800+.
#
# The invariants under test:
#   both counters exist on each credential route, and the failure one counts
#     failures ONLY;
#   the password comparison is timing-safe at the use site;
#   a refusal does not say which check fired;
#   the money paths are limited BEFORE the expensive work, at their own numbers;
#   the unsubscribe secret cannot fall back to anything.

ADMIN = "app/api/admin/login/route.ts"
ENTER = "app/api/enter/route.ts"
CHECKOUT = "app/api/checkout/route.ts"
LEAD = "app/api/submit-lead/route.ts"
MAGIC = "app/api/auth/send-magic-link/route.ts"
UNSUB = "lib/email/unsubscribe.ts"

HARDENING = ["tests/unit/v1-endpoint-hardening.test.ts"]
UNSUBT = ["tests/unit/unsubscribe.test.ts"]

CASES = [
    (800, "the per-IP limit is deleted from admin sign-in", ADMIN,
     '    if (!rateLimit(`admin-login:${getClientIp(req)}`, PER_IP_LIMIT, PER_IP_WINDOW_MS).allowed) {\n'
     '      return refuse(req)\n'
     '    }\n',
     '',
     HARDENING),

    (801, "the endpoint-wide failure ceiling is deleted", ADMIN,
     '    if (isFailureCeilingReached(FAILURE_KEY, FAILURE_CEILING)) {\n'
     '      return refuse(req)\n'
     '    }\n',
     '',
     HARDENING),

    (802, "a successful sign-in also spends the failure budget", ADMIN,
     '    // Success spends no failure budget — deliberately, so an operator signing\n'
     '    // in normally can never be the reason the endpoint closes.\n'
     '    const res = NextResponse.redirect(new URL("/admin", req.url), { status: 303 })',
     '    recordFailedAttempt(FAILURE_KEY, FAILURE_WINDOW_MS)\n'
     '    const res = NextResponse.redirect(new URL("/admin", req.url), { status: 303 })',
     HARDENING),

    (803, "the admin password is compared with ordinary equality again", ADMIN,
     '    if (!adminPassword || !token || typeof password !== "string" ||\n'
     '        !timingSafeEqualStrings(password, adminPassword)) {',
     '    if (!adminPassword || !token || password !== adminPassword) {',
     HARDENING),

    (804, "the preview password is compared with ordinary equality again", ENTER,
     '  if (!timingSafeEqualStrings(submitted, devPassword)) {',
     '  if (submitted !== devPassword) {',
     HARDENING),

    (805, "the refusal reveals that it was the rate limit, not the password", ADMIN,
     '    if (!rateLimit(`admin-login:${getClientIp(req)}`, PER_IP_LIMIT, PER_IP_WINDOW_MS).allowed) {\n'
     '      return refuse(req)\n'
     '    }',
     '    if (!rateLimit(`admin-login:${getClientIp(req)}`, PER_IP_LIMIT, PER_IP_WINDOW_MS).allowed) {\n'
     '      return NextResponse.redirect(new URL("/admin?error=rate_limited", req.url), { status: 303 })\n'
     '    }',
     HARDENING),

    (806, "checkout is limited only after the Stripe session is created", CHECKOUT,
     '  const limit = rateLimit(`checkout:${getClientIp(req)}`, 20, 10 * 60_000)\n'
     '  if (!limit.allowed) {\n'
     '    const { body, init } = rateLimitResponse(limit)\n'
     '    return NextResponse.json(body, init)\n'
     '  }\n\n',
     '',
     HARDENING),

    (807, "submit-lead borrows the money path's generous allowance", LEAD,
     '  const limit = rateLimit(`submit-lead:${getClientIp(req)}`, 5, 10 * 60_000)',
     '  const limit = rateLimit(`submit-lead:${getClientIp(req)}`, 20, 10 * 60_000)',
     HARDENING),

    (808, "the sign-in link endpoint loses its limit", MAGIC,
     '    const limit = rateLimit(`send-magic-link:${getClientIp(req)}`, 5, 10 * 60_000)\n'
     '    if (!limit.allowed) {\n'
     '      const { body, init } = rateLimitResponse(limit)\n'
     '      return NextResponse.json(body, init)\n'
     '    }\n',
     '',
     HARDENING),

    (809, "the sign-in link endpoint stops validating the address", MAGIC,
     '    if (!email || !isValidEmail(email)) {',
     '    if (!email) {',
     HARDENING),

    (810, "the forgeable unsubscribe fallback secret is restored", UNSUB,
     'function secret(): string | null {\n  return process.env.UNSUBSCRIBE_SECRET || null\n}',
     'function secret(): string | null {\n  return process.env.UNSUBSCRIBE_SECRET || "eatobiotics-unsubscribe-fallback"\n}',
     UNSUBT),

    (811, "an unrelated admin secret is used to sign unsubscribe tokens", UNSUB,
     'function secret(): string | null {\n  return process.env.UNSUBSCRIBE_SECRET || null\n}',
     'function secret(): string | null {\n'
     '  return process.env.UNSUBSCRIBE_SECRET || process.env.ADMIN_SESSION_SECRET || null\n}',
     UNSUBT),

    (812, "a one-click header ships without a signed token", UNSUB,
     '  const oneClick = unsubscribeOneClickUrl(email)\n  if (!oneClick) return {}',
     '  const oneClick = unsubscribeOneClickUrl(email) ?? `${SITE_URL}/api/unsubscribe`',
     UNSUBT),

    (813, "the launch checklist stops requiring the signing secret", "GO-LIVE.md",
     '- [ ] `UNSUBSCRIBE_SECRET` — **required.**',
     '- [ ] `UNSUB_SECRET_OPTIONAL` — nice to have.',
     UNSUBT),
]
