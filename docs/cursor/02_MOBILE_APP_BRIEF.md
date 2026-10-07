# EatoBiotics mobile — iOS and Android daily companion

A brief for Cursor. Read [`00_PROJECT_BRIEF.md`](./00_PROJECT_BRIEF.md) first;
this document assumes the product rule, the programme state and the constraints.

The P0 capability graph (what native v1 owns, which bearer routes it may
call, and what this PR does not implement) is
[`03_MOBILE_CAPABILITY_GRAPH.md`](./03_MOBILE_CAPABILITY_GRAPH.md).

**Decisions already taken.** These are settled, not open for the brief to
revisit:

| | |
|---|---|
| **v1 scope** | **Daily companion.** `Today → Meal → Action → Check-in → Progress → Return tomorrow` |
| **Stack** | **Expo + React Native + TypeScript** |
| **Governing principle** | **Share contracts and truth definitions; centralise authority** |
| **Guards** | mobile source enters the same scanning system **from the first meaningful feature** |
| **Payments** | **no purchasing in-app.** Entitlement read-only; buying stays on web |
| **API** | define the minimal native capability graph **first**, then bearer-auth only what it needs |

---

## 1 · The product thesis

The goal is **not**:

> EatoBiotics website inside an app.

It is:

> **EatoBiotics as a native daily companion.**

Native navigation, gestures, camera, notifications, haptics and interaction
patterns should be designed specifically for iOS and Android. The app should not
visually imitate the website.

**What is shared is product meaning, not presentation.** The web and the app
agree on what a Biotics Score™ is, what a meal analysis may say, and what the
product is forbidden to claim. They need not agree on a card radius.

### The v1 success criterion

A member opens EatoBiotics on an ordinary Tuesday and immediately knows:

1. **What should I focus on today?**
2. **What should I eat or do?**
3. **What happened recently?**

If the app does that beautifully and reliably, v1 is a success. Assessment and
commercial parity come later.

---

## 2 · The capability graph — and nothing else

### Native v1 owns

| capability | web counterpart |
|---|---|
| Today / current focus | `app/account/today/page.tsx` → `TodayClient` |
| Meal scan and analysis | `/analyse` family → `app/api/analyse-meal/route.ts` |
| Daily ritual / check-in | `components/account/twin/daily-ritual.tsx` → `app/api/twin-state/route.ts` |
| Recent / this-week activity | `app/account/this-week/page.tsx` → `buildAccountTwin` |
| Viewing the current authoritative Biotics Score™ | `profiles` / `leads` via the agent loop |

### Web keeps, and the app deep-links to

- the initial **Food System Assessment**
- the **€49 Report purchase**
- editorial Report reading (until a native reading experience is justified)
- membership, billing and account administration
- add-on purchases
- anything that would require large-scale re-authentication of the existing API

### What this brief deliberately excludes from v1

Assessment, Report reading, commerce, GLP-1, Stability, Family.

**The reason matters more than the list:** authentication, truth model and
claims architecture are not yet mature enough on those surfaces to support a
second client. The Report is mid-programme (Experience 3, blocked on four human
reviews). The Assessment is Experience 1. Putting either in a native client now
would fork a moving target.

---

## 3 · The finding that most constrains v1

**"What should I focus on today?" has two implementations in this codebase, and
the better one is deliberately locked.**

### 3.1 `app/api/fss/focus-today/route.ts` — fail-closed

The FSS Intelligence-Boundary model call. It is **refused in production**, and
it carries its own copy of the preview predicate *on purpose*. Its own comment:

> these are INDEPENDENT gates on independent unfinished features, and a shared
> helper is a shared switch. One edit to make one preview reachable would
> silently make the others reachable too.

It is blocked on: five candidate domains with **no named reviewer**, weights
that are a `DEV_ONLY` fixture, and seven draft questions. `resolveWeights` would
refuse the fixture weights outside a non-production context anyway — "the braces
to this belt".

**Do not remove this gate. Do not route around it. Do not replicate its logic
in the app.**

### 3.2 `app/account/today/page.tsx` — live, and deliberately non-committal

0R-4 removed the false *"Your Focus Today"* conclusion from this surface. What
remains is a streak and a daily loop — **not** a personalised priority verdict.

### 3.3 What the app may therefore render

0R-6R's ruling is explicit and binding:

> **No authorised selector means no personalised selection** — not continued use
> of an invalid one.

So the app answers "what should I focus on today?" with **reviewed, non-ranked
material, a general next step, or truthful absence** — the same three options
the web now has. It must **not**:

- compute a priority client-side from sub-scores;
- rank the three pathways by any means;
- present a per-Biotic number, bar, band word, colour-state or body-state;
- synthesise a focus from a model call the web is not permitted to make.

Personalised priority may return **only** when there is an explicitly reviewed
decision rule over a construct the product is entitled to rank. Not before, and
not by relabelling.

> **A safer label does not legitimise an unsupported selector.** Renaming an
> argmin's output from "Probiotics" to "fermented foods" changes what the claim
> sounds like and nothing about whether the product was entitled to make it.

---

## 4 · Architecture — share contracts, centralise authority

### 4.1 What may move into shared packages

| may be shared | why it is safe |
|---|---|
| product contracts and types | definitions, not decisions |
| zod request/response schemas | one definition of a boundary, used both sides |
| canonical vocabulary (`lib/product-vocabulary.ts`) | pure, client-safe, zero imports — already designed for this |
| claims boundaries and the rules that express them | the whole point: one invariant, every client |
| genuinely client-safe deterministic logic | e.g. `lib/glp1.ts`'s target maths, `lib/stability/scoring.ts` — single clinical tuning points, already pure |
| auth / session contracts | shape only, never secrets |
| analytics event contracts | one event vocabulary across clients |

### 4.2 What stays server-side — without exception

| stays on the server | why |
|---|---|
| scoring authority | the score is the product; a client-computed score is a second source of truth |
| recommendation / selection authority | this is exactly what 0R-6R retired. A mobile selector is the same defect in a new client |
| AI orchestration | the Intelligence Boundary lives server-side (`lib/fss/system/ai-context.ts`, `toAiContext`, the `AiIntent` ceiling). A client that talks to a model directly has no boundary |
| payments and entitlement decisions | Stripe is the single source of truth; the app reads a resolved tier |
| protected business rules | membership gates, grace periods, cap enforcement |

> **TypeScript making code sharing possible is not a reason to share it.**
> Share contracts and truth definitions; centralise authority.

### 4.3 Repository shape

Recommended: evolve **this** repository toward a workspace with clearly
separated shared packages, rather than a second repository.

```
/                         the Next.js app (unchanged at the root for now)
  packages/
    contracts/            types + zod schemas, no runtime deps
    vocabulary/           product names, reviewed copy keys
    claims/               the rules, exported so both clients' tests import them
  apps/
    mobile/               Expo + React Native
```

**Why one repository:** the guards must be able to read the mobile source
(§5). A separate repository would mean either duplicating the guard
infrastructure or running it cross-repo — and the project's own history says a
guard that is awkward to extend is a guard that stops being extended.

**Do not** restructure the root app into `apps/web/` as part of this work. That
is a large, risky, zero-product-value move during an active integrity
programme. Add `packages/` and `apps/mobile/` beside the existing root.

**Migration discipline:** when a module moves into `packages/`, the web app
imports it from there — no copies. A duplicated contract is the failure this
architecture exists to prevent.

---

## 5 · Guard extension — from the first meaningful feature

**This is the single most important section of this brief.**

The claims guards are **path-scoped source scanners over a named corpus inside
this repository**. They cannot see a file they have not been told about. A new
React Native client is therefore a greenfield in which **every claim the 0R
programme removed is re-implementable with nothing failing.**

### 5.1 The requirement

Mobile source enters the same scanning system **as the first meaningful feature
lands** — not retrofitted, not audited afterwards.

Target state:

> A prohibited construct reintroduced in **Next.js web**, **React Native
> mobile**, or **PDF/report generation** fails the same governing invariant,
> wherever that is practical.

### 5.2 How to extend it

1. **Add a mobile corpus group to `tests/unit/customer-surfaces.ts`** — and make
   it a **named list, not a tree walker**, for the reason that file already
   states:

   > An automatic scanner would sweep in Family, Mind, the book, historical
   > demos and the retired report renderers, and the honest response to the
   > resulting failures would be to weaken the rules until they passed — which
   > is how a guard becomes decoration.

   `assertManifestIsReal()` already fails if a named path does not exist, so a
   rename cannot quietly empty the mobile group either.

2. **Run the existing nine `PERSONAL_BIOTIC_STATE` rules over it.** These are
   prose and structural rules over source text; they transfer directly, since RN
   components are TSX.

3. **Extend the form track (`biotic-visual-encoding.test.ts`) with an RN
   dialect.** What transfers and what does not, measured against how the rules
   are currently written:

   | sink | transfers? |
   |---|---|
   | derived extent — `width: \`${…}%\`` | **largely yes.** RN uses inline style objects, so the interpolated-extent rule matches the same shape |
   | colour — `backgroundColor`, `color`, gradient words | **mostly.** RN has no CSS `background`, and `expo-linear-gradient` introduces new prop names to add |
   | `strokeDasharray` | **yes** — `react-native-svg` uses the same prop |
   | `transform: scale(…)` | **needs work** — RN uses a transform array, not a CSS function string |
   | anatomical coordinate (`node: { x, y }`) | **yes**, unchanged |

   The `badgeNodes`-style whole-text-node comparison introduced at 0R-6R suits
   RN especially well, because RN forces text into `<Text>` nodes — a band word
   rendered as a badge really is a standalone node, which is exactly what that
   technique distinguishes from the same word inside a sentence.

4. **Add the behavioural guard.** The lesson recorded eleven times in this
   project: a source scan of the whole corpus catches **1 of 9** interpolated
   claims, because `${BIOTIC_LABELS[k]}` puts no Biotic word in any file. Any
   mobile module that *generates* customer-facing prose belongs in a test that
   **calls it and reads what it returns** — the `agent-loop-claims.test.ts`
   pattern.

5. **Add sabotage cases for the mobile surfaces**, in a new suite, from the
   first feature. The standing rule applies unchanged: when a case slips,
   **strengthen the test, never the case** — unless the case was aimed at the
   wrong thing.

### 5.3 The acceptance test for this section

Before the app ships a single screen that mentions Prebiotics, Probiotics or
Postbiotics, demonstrate this:

> Introduce a per-Biotic score with a bar into a React Native component.
> **A test must fail.** Then remove it and show the test passes.

If that demonstration cannot be made, the guard extension is not done,
regardless of how much of it is written.

---

## 6 · The API work, in the stated order

### 6.1 The rule

> Do not respond to "3 of 106 routes support bearer auth" by mobile-enabling all
> 106. First define the minimal native capability graph, then authenticate only
> the routes that graph genuinely requires. **Every route exposed to mobile
> becomes an additional security and product-contract surface.**

### 6.2 What already works

Exactly three routes accept `Authorization: Bearer <supabase access token>` via
`getUserFromRequest` (`lib/supabase-server.ts`), which fails closed:

| route | methods | notes |
|---|---|---|
| `/api/twin-state` | GET, PUT | daily ritual taps + milestone seen-set; PUT validated by `lib/account/twin-state-schema.ts`. **Already serves a companion client** |
| `/api/analyse-meal` | POST | meal analysis; same dual-surface auth |
| `/api/feedback` | POST | auth-optional; **not** in the `proxy.ts` allowlist — see below |

**Two steps are needed per newly exposed route**, and missing the second is the
easy mistake:

1. switch `getUser()` → `getUserFromRequest(req)`;
2. **add the path to `proxy.ts`'s gate allowlist** — a native client cannot hold
   the site password-gate cookie, so without this the route redirects to
   `/enter`. The existing comment explains why this is safe: the routes 401
   without a valid token, so the gate would only add a redirect, not protection.

`/api/feedback` currently has step 1 and not step 2. Fix that as part of this
work.

### 6.3 The recommended shape — one composed read endpoint

**Do not** expose five routes to assemble the Today screen. The server already
composes these objects for the web pages:

| composition | used by |
|---|---|
| `buildAccountTwin` + `getAccountTwinInput` (`lib/agent-loop/account-twin.ts`, `lib/account/twin-data.ts`) | `/account/this-week` |
| `computeStreak` (`lib/streak.ts`) + `DailyLoopData` | `/account/today` |

So the natural shape is a single versioned read endpoint —
`GET /api/mobile/v1/today` — returning the **already-composed, already
claim-checked** object: the authoritative score, the daily loop state, the
streak, the recent-activity summary, the reviewed next-step material, and the
resolved entitlement tier.

Three reasons this is the right shape here, not just a convenience:

1. **It is "centralise authority" in practice.** The decisions stay where they
   already are; the app renders a result it did not compute.
2. **It gives the guards one place to watch.** One composed response is one
   claim surface. Five routes assembled client-side means the *assembly* is
   client-side logic, and assembly is where selection hides.
3. **It versions cleanly.** `/v1/` in the path means an app in the wild keeps
   working when the web product moves — which it will, through Experiences 1–5.

Writes stay granular and reuse what exists: `PUT /api/twin-state` for the
ritual, `POST /api/analyse-meal` for a meal.

### 6.4 Also worth knowing

- **There is no CORS configuration anywhere in the repository.** Irrelevant for
  a native client (CORS is a browser concern) but it will block an Expo-web
  target or any browser-origin debugging client. Add it deliberately and
  narrowly if needed — not as a wildcard.
- The response contract belongs in `packages/contracts` as a zod schema, parsed
  on **both** sides. The programme has a specific scar here: zod `.strip()`
  silently dropped two `RitualDay` keys from cross-device sync, so
  `lib/account/twin-state-schema.ts` must list every key. Expect the same class
  of bug and write the same kind of test.

---

## 7 · Authentication

Supabase Auth, as the web uses it: magic link (`/api/auth/send-magic-link`) plus
the OAuth callback (`/api/auth/callback`).

The native client holds a Supabase session and sends
`Authorization: Bearer <access token>`. `getUserFromRequest` parses the bearer
header, verifies against Supabase, and fails closed.

Specifics to get right:

- **Deep links** for magic-link completion — an `expo-linking` scheme plus
  Universal Links / App Links so the email lands back in the app, not Safari.
- **Token refresh** — Supabase access tokens are short-lived; use the SDK's
  refresh with secure storage (`expo-secure-store`), never `AsyncStorage`, for
  the refresh token.
- **The session is the only credential the app holds.** No service-role key, no
  Stripe key, no `CRON_SECRET`, no Anthropic key reaches the bundle. Anything in
  an Expo build is public; treat `EXPO_PUBLIC_*` as printed on a billboard.

---

## 8 · Payments and entitlement — read-only

**The app never sells anything.** Decision taken, and it preserves 100% of
revenue plus every piece of Stripe logic already built — including the
webhook-driven subscription lifecycle and the entitlement anchoring done at S7R.

What that means concretely:

- Entitlement is **read** from the existing resolved tier
  (`getUserMembershipTier()` in `lib/membership.ts`, which enforces the
  `past_due` grace period). The app receives a resolved tier string; it does not
  interpret Stripe state.
- **Stripe remains the single source of truth.** No second entitlement source,
  no receipt reconciliation, no `profiles.membership_tier` writes from a mobile
  path.
- Locked capabilities show **locked state**. Under App Store rules the app also
  may not *link out* to purchase, so the pattern is: show what the capability is,
  say it is available to members, and stop. No button to a web checkout.
- Deep links to web **account administration** (billing portal, cancellation)
  are a different matter from purchase links and are generally permitted — but
  confirm against current guidelines before shipping, as this is the boundary
  most likely to have moved.

**Recorded as a separate, later decision, not part of v1:** StoreKit 2 / Google
Play Billing at 15–30% commission, or Apple's **External Purchase Link
Entitlement** (available in the EU under the DMA; EatoBiotics is Irish). Both
need a deliberate commercial decision and, for IAP, a solution to having two
entitlement sources of truth. Neither is in v1 scope.

---

## 9 · Store readiness

### 9.1 Health positioning — get this right early

EatoBiotics is explicitly **not a medical device** and makes no diagnostic or
treatment claim. The repository already encodes this and the app must inherit
it rather than reinvent it:

- non-diagnostic copy throughout ("possible contributor", "may be associated
  with");
- **red-flag symptoms route to a GP** — see
  `components/stability/RedFlagWarning.tsx` and `MedicalDisclaimer.tsx` for the
  established pattern;
- no claim that the product measures a biological state — which is the permanent
  product rule, and which store reviewers also read as a health claim.

This is both a product-integrity requirement and the thing most likely to draw
review scrutiny on a food-and-gut-health app.

### 9.2 The rest

| | |
|---|---|
| **Guideline 4.2 (minimum functionality)** | the native-first decision exists partly to satisfy this. A WebView wrapper would be at risk; a native daily companion with camera, notifications and offline state is not |
| **Privacy manifests** | iOS `PrivacyInfo.xcprivacy` + Google Play Data Safety. Declare: camera (meal photos), health-adjacent self-report, analytics |
| **Data deletion** | Apple and Google both require an in-app account-deletion path. The routes exist: `app/api/account/delete/route.ts` and `app/api/account/export/route.ts`. **Note:** the export route has a recorded pre-activation prerequisite about `consultation_reports` — read `CLAUDE.md`'s activation note before touching it |
| **Permission strings** | camera usage description must say *why* — meal photos — not just *that* |
| **Offline** | a daily companion is opened on trains and in kitchens. Local-first with background sync is the right default, and the web app already has the pattern twice (`lib/stability/storage.ts`, `lib/account/twin-state-sync.ts`) |

**One scar worth inheriting from those sync modules:** both fail *silently* when
offline or unauthenticated. A live read during the audit found `twin_state` had
never been created in production, so cross-device ritual sync was
non-functional for an unknown period and nothing surfaced it. **Build
observability into the mobile sync from day one** — a visible last-synced state,
and an error path that reaches a log rather than a `catch {}`.

---

## 10 · Phasing

Each phase names what must be true before the next begins.

| phase | work | gate |
|---|---|---|
| **P0** | Capability graph written down; `packages/contracts` + `packages/vocabulary` extracted with the web app importing from them; Expo scaffold; **guard extension with the §5.3 demonstration** | the demonstration passes: a per-Biotic bar in RN fails a test. Web gate unchanged — 232 files / 6648 tests / eslint 96 |
| **P1** | Supabase auth in the app (magic link + deep link + secure refresh); `GET /api/mobile/v1/today` with its zod contract; `/api/feedback` added to the `proxy.ts` allowlist | a member signs in on a device and receives a parsed, schema-valid today payload. Route has an auth-posture comment and a test |
| **P2** | **Today** and **Check-in** screens, native. Ritual writes via `PUT /api/twin-state`; offline-first with visible sync state | the Tuesday test: open the app, know what to focus on and what happened. No personal per-Biotic state rendered anywhere — proved by the extended guards |
| **P3** | **Meal scan** — camera, upload, `POST /api/analyse-meal`, result screen | a meal is captured offline and syncs. The result screen states a **Meal** Biotics Score, never the person's Biotics Score™ |
| **P4** | **Progress / this-week** | recent activity renders from server-composed data with no client-side aggregation that could constitute a claim |
| **P5** | Notifications (local-first, respecting `email_optouts`-equivalent consent), polish, store submission | both stores accepted; privacy manifests and deletion path verified |

**Suggested first deliverable before any code:** the capability graph and the API
contract as a written document, reviewed against this brief. The project's own
method is *measure and specify first*, and the one thing that would most damage
this effort is a mobile app that ships a screen before the guards can read it.

---

## 11 · The five things most likely to go wrong

Ranked by cost, from the perspective of someone who has just spent six tranches
removing claims from this product:

1. **The app renders a personal per-Biotic state** because no guard could see
   the file. Mitigation: §5, done first, with the §5.3 demonstration.
2. **The app computes a priority client-side** because "Today" seemed to demand
   one and the server would not provide it. Mitigation: §3 — the honest answer
   is reviewed non-ranked material or truthful absence.
3. **A second entitlement source of truth** appears via IAP or a cached tier.
   Mitigation: §8 — read-only, resolved server-side, every time.
4. **A contract is duplicated rather than shared**, and the two drift. Mitigation:
   §4.3 — when a module moves to `packages/`, the web imports it from there.
5. **Silent sync failure**, exactly as happened to `twin_state` on the web.
   Mitigation: §9.2 — visible sync state and a real error path.

---

## 12 · Sources

Everything in this brief is traceable to the repository:

| claim | source |
|---|---|
| the three bearer routes | `grep -rn "getUserFromRequest" app/api` |
| the gate allowlist | `proxy.ts` |
| focus-today is fail-closed | `app/api/fss/focus-today/route.ts` header comment |
| no personalised selection | `docs/experience/EATOBIOTICS_SCIENTIFIC_UI_DEBT.md`, 0R-6R close record |
| the corpus is a named list by design | `tests/unit/customer-surfaces.ts` header |
| interpolation blindness, 1 of 9 | `CLAUDE.md`, permanent product rule section |
| the zod `.strip()` sync scar | `CLAUDE.md`, Living Twin tables; `lib/account/twin-state-schema.ts` |
| `twin_state` never created in production | `docs/experience/AUDIT_BASELINE.md`; `CLAUDE.md` Living Twin note |
| entitlement resolution and grace period | `lib/membership.ts` |
| the export route's activation prerequisite | `CLAUDE.md`, `consultation_reports` section |
