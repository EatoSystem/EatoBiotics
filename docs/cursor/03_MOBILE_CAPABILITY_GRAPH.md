# Mobile capability graph — P0

Written against `docs/cursor/02_MOBILE_APP_BRIEF.md`. Native v1 is a **daily companion**, not the website in a WebView. This file is the graph; later phases may add rows, they may not widen authority.

Work lives on a branch off `claude/eatobiotics-experience-audit`. Not `main`. No migrations. No production writes.

---

## 1 · What native v1 owns

| capability | web counterpart | native write | authority |
|---|---|---|---|
| Today / current focus | `app/account/today` → `TodayClient` | none in v1 | **server-composed.** No client-side priority, no focus-today call |
| Meal scan and analysis | `/analyse` → `POST /api/analyse-meal` | `POST /api/analyse-meal` | server scores; app renders a **Meal** Biotics Score |
| Daily ritual / check-in | `daily-ritual.tsx` → `/api/twin-state` | `PUT /api/twin-state` | server validates every `RitualDay` key |
| Recent / this-week | `app/account/this-week` → `buildAccountTwin` | none | server-composed summary on the today payload |
| Authoritative Biotics Score™ | `profiles` / `leads` | none | one number, Assessment-earned, never a per-Biotic triple |

The app answers "what should I focus on today?" with **reviewed non-ranked material, a general next step, or truthful absence**. It does not compute a selector. `GET /api/fss/focus-today` stays fail-closed and is not a mobile route.

---

## 2 · What stays on the web (deep-link later; do not wrap)

- Food System Assessment
- €49 Report purchase and editorial Report reading
- membership, billing, account administration
- add-on purchases
- GLP-1, Stability, Family
- anything that would re-authenticate the existing API at large

Locked capabilities in the app show **locked state**. No in-app purchase. No button to a web checkout (App Store). Deep links to account administration are a later, guideline-checked decision — not P0.

---

## 3 · API graph

### 3.1 Call now (already bearer + gate-allowlisted)

| route | methods | app use | phase |
|---|---|---|---|
| `/api/twin-state` | GET, PUT | ritual hydrate / taps | P2 |
| `/api/analyse-meal` | POST | meal capture result | P3 |

Both already accept `Authorization: Bearer <supabase access token>` via `getUserFromRequest` and are on `proxy.ts`'s password-gate allowlist. Do not mobile-enable the other ~101 routes.

### 3.2 Implemented in P1

`GET /api/mobile/v1/today`

One versioned composed read. Zod contract: `packages/contracts/src/mobile-today.ts` (`mobileTodayResponseSchema`). Returns the already-composed, already claim-checked object:

- person-level Biotics Score™ (or null)
- streak + today's ritual taps
- recent-activity summary (meal rows carry a **Meal** Biotics Score, never a personal Biotic)
- next step: `reviewed-material` | `general-next-step` | `absence`
- resolved entitlement tier (`getUserMembershipTier()` on the server)

Explicitly absent from that payload: per-Biotic personal numbers, `weakest` / `strongest`, `orderedByNeed`, a focus-today verdict, Stripe objects.

P1 also adds `/api/feedback` to the `proxy.ts` allowlist (exact path; digest/retention stay off it). Cookie-only `/api/account/delete` and `/api/account/export` stay on `getUser()`.

### 3.3 Never a native route in v1

Checkout, portal, consult, report generation, assessment, CMS, crons, `focus-today`, account export/delete (store deletion path is P5 and reads the existing routes — do not call export until the `consultation_reports` activation note in CLAUDE.md is closed).

---

## 4 · Shared packages

```
packages/vocabulary   product names — the leaf; web re-exports from lib/product-vocabulary.ts
packages/contracts    zod request/response schemas (twin-state, analyse-meal, today)
packages/claims       PERSONAL_BIOTIC_STATE + RN visual dialect; tests import these
apps/mobile           Expo + React Native + TypeScript (iOS + Android)
```

The root Next.js app is not moved to `apps/web/`. Live 0R surfaces (`live-dashboard`, pricing, assessment results) are not rewritten in P0; they keep importing `@/lib/product-vocabulary`.

Scoring, selection, AI orchestration, payments and entitlement **decisions** stay on the server.

---

## 5 · Auth, payments, secrets

- P1: magic link (`/api/auth/send-magic-link` + `client=mobile`) hops through `/auth/callback` then `eatobiotics://auth/callback`. Refresh token in `expo-secure-store`.
- The session is the only credential in the bundle. No `SUPABASE_SERVICE_ROLE_KEY`, Stripe, Anthropic, or `CRON_SECRET`.
- Entitlement is a resolved tier string on the today payload. Stripe remains the source of truth. No IAP in v1.

---

## 6 · Claims guards (from the first meaningful file)

`MOBILE_SURFACES` in `tests/unit/customer-surfaces.ts` is a **named list**. The nine `PERSONAL_BIOTIC_STATE` rules run over it. `tests/unit/biotic-visual-encoding-rn.test.ts` is the RN form dialect (inline `width: \`${score}%\``, `transform: [{ scale }]`, `expo-linear-gradient` `colors`).

§5.3 demonstration: a per-Biotic bar in RN source **fails** that suite; the shipped `App.tsx` has none, so CI is green. Sabotage cases 1600–1605 (`tools/sabotage/run_mobile.py`) keep the guard load-bearing.

---

## 7 · Phasing vs this PR

| phase | in P0 #283? | in P1 #284? | in P2 #285? | in this P3 PR? |
|---|---|---|---|---|
| **P0** graph, packages, Expo scaffold, RN bar fails a test | **yes** | already on the branch | already on the branch | already on the branch |
| **P1** auth, `GET /api/mobile/v1/today`, Today screen, feedback allowlist | no | **yes** | already on the branch | already on the branch |
| **P2** Check-in writes via `PUT /api/twin-state`, visible sync | no | no | **yes** | already on the branch |
| **P3** Meal scan via `POST /api/analyse-meal` | no | no | no | **yes** |
| **P4** Progress / this-week | no | no | no | no |
| **P5** notifications, privacy manifests, store deletion path | no | no | no | no |

No Assessment/Report screens. No WebView wrap. No design-kit iOS mock. No screens that mention a personal Pre/Pro/Post state.
