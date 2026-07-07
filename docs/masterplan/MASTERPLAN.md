# EatoBiotics Product Masterplan v1.0

> **Build the Food System Inside You. Watch it learn. See it improve. Feel the
> difference.**

This is the operating system for EatoBiotics product development. Every future
page, feature, assessment, report, animation, and AI capability is measured
against this document and its four constitutions:

- [PRODUCT_CONSTITUTION.md](./PRODUCT_CONSTITUTION.md) — what we build and refuse to build
- [DESIGN_CONSTITUTION.md](./DESIGN_CONSTITUTION.md) — how it looks and feels
- [MOTION_CONSTITUTION.md](./MOTION_CONSTITUTION.md) — how it moves and teaches
- [AI_CONSTITUTION.md](./AI_CONSTITUTION.md) — how it thinks and behaves

Deep-dive companions (this document supersedes them where they conflict):
`docs/food-system-experience/*` (the five experience design docs) and
`AGENT_LOOP_ARCHITECTURE.md` (the internal engine).

---

## 1. Mission

EatoBiotics exists to help people **understand and improve their Food System
throughout life** — to build the Food System inside them, watch it learn, see
it improve, and feel the difference. Everything the company ships must make
that mission truer.

## 2. Product philosophy

**The Food System is the product.**

Not the assessment. Not the report. Not the AI. Not the dashboard. Those are
doors, mirrors, and teachers. The thing a member owns, grows, and returns to is
one living Food System — theirs, learning, changing with every meal, habit,
and stage of life.

Practical consequence: every roadmap question reduces to *"does this make the
member's one Food System more understandable, stronger, or more alive?"* If a
feature is impressive but doesn't, it's out of scope.

## 3. Technology philosophy

The customer experiences exactly one thing: **Your Food System.**

Underneath, the machinery is real and deliberately invisible:

| Internal layer | What it is | Where it lives |
|---|---|---|
| Food System Baseline | The permanent parent record created by a foundation assessment | `lib/agent-loop/types.ts` (`FoodSystemBaseline`) |
| Food System Digital Twin | The living read-model rendered as the body on stage | `lib/agent-loop/account-twin*`, twin components |
| Agent Loop | Assess → Understand → Observe → Analyse → Recommend → Improve → Learn → Repeat | `lib/agent-loop/*`, `AGENT_LOOP_ARCHITECTURE.md` |
| Food System Memory | What the system learned (completed/ignored actions, preferences) | `FoodSystemMemory` in the loop |
| AI providers | Interchangeable engines behind one interface; deterministic-first | `lib/agent-loop/providers/*`, Claude + OpenAI split |

**Technology should disappear.** None of these names belong in customer copy.
"Digital Twin" survives today on the public `/digital-twin` page as legacy
positioning — see the critical review (§12.2) for the recommendation.

## 4. Product architecture

One catalog is law: **`lib/systems.ts`** drives the mega menu, footer,
homepage, `/food-systems`, and the account explorer. Systems are lenses on one
Food System, in three families plus a documented future.

### Foundation Systems — *create the Food System Baseline*

| System | Status | Purpose |
|---|---|---|
| **You** | Live | Your personal Food System baseline — score, report, priorities |
| **Family** | Live | The household Food System — shared routines and priorities |

Everything begins here. Every other system inherits from a completed You or
Family foundation (`requiresFoundation: true`, enforced by the foundation
guard and the agent loop). This rule is never waived.

### Health Systems — *strengthen specific parts of the Food System*

| System | Status | Purpose |
|---|---|---|
| **Stability** | Live (assessed) | Digestive comfort, consistency, rhythm |
| **Glucose** | Live (assessed) | Steadier energy, cravings, glucose-supportive patterns (GLP-1 lives inside as a use case) |
| **Mind** | Live (assessed) | Mood and focus through the gut–brain connection |
| **Performance** | Live (assessed) | Fuel and recovery for training |
| **Recovery** | Scaffold | Replenishment and resilience after exertion |
| **Longevity** | Scaffold | Long-term diversity and ageing-well patterns |

### Life Systems — *support important life transitions*

| System | Status | Purpose | Future bridge |
|---|---|---|---|
| **Pregnancy** | Live (assessed, `noindex` pending clinical/legal review) | Food-first, non-diagnostic general-wellbeing patterns in pregnancy | PregMonth |
| **Birth** | Scaffold | Nourishment, hydration, rhythm around birth and recovery | PregMonth |
| **Baby** | Scaffold | Gentle food education for parents and families | DevelopMonth |

Life systems live inside EatoBiotics today and later become foundational
systems inside **PregMonth** and **DevelopMonth**. The bridge exists only as
`futureBridge` metadata — it is architecture, not marketing, and must not be
sold before those platforms exist. All Life systems are `sensitive`: the
professional-signposting disclaimer appears on every surface, red flags route
to professionals, and nothing is indexed before sign-off.

### Future Life Systems — *documented, not available*

**Child · Teen · Adult · Healthy Ageing** exist as `FutureLifeSystemKey` +
`FUTURE_LIFE_SYSTEMS` metadata and as clearly-chipped "Future" cards on
`/food-systems`. They have no routes, no links, no implied availability.

## 5. The product journey

The ideal journey, mapped to what exists today:

| Step | Today's reality | Gap |
|---|---|---|
| Visitor → **Homepage** | Live; hero → ecosystem → CTA | — |
| → **Food Systems** | `/food-systems` flagship + mega menu | — |
| → **Assessment** | Foundation chooser → You/Family → optional system | Four route naming patterns (§12.3) |
| → **Food System Report** | Free combined report + €49 personal report + email | Report ≠ the premium vision yet (§12.6) |
| → **Your Food System** | Account: stage, Today / This Week / My Food System | Still part-dashboard (§12.7) |
| → **Membership** | Tiers live (Stripe, portal, gating) | Value story lives mostly on /pricing |
| → **Daily Learning** | Meal Reveal, ritual, learned feed, Inside You | — |
| → **Health Systems** | 4 assessed, 2 scaffold | Recovery/Longevity assessments unbuilt (by design) |
| → **Life Systems** | Pregnancy assessed; Birth/Baby scaffold | Clinical/legal gate before public |
| → **Lifetime Food System** | Evolution stages, milestones, weekly story | The decades-long arc is v2 territory (P8–P9) |

The funnel's spine is healthy. The two weakest links are the report experience
(§12.6) and the leap from report to membership value.

## 6. The Living Food System

**The body becomes the interface. The body learns. The body changes. The body
teaches.** This is the core differentiator — competitors ship dashboards;
EatoBiotics ships a living body that responds to what you eat.

Every meal affects the body visually, in one consistent vocabulary taught on
marketing pages and repaid in the product:

- **Kefir** → probiotic pathways brighten
- **Beans** → prebiotic pathways expand
- **Berries / plants** → diversity glints across the upper body
- **Poor sleep** → energy dims
- **Ultra-processed meal** → strain pathways pulse amber

Shipped today: the Meal Reveal on the stage, habit signals that keep pathways
lit, the 24-hour meal journey on the body, the interactive Inside You journey,
reaction cards that teach the vocabulary publicly, and evolution stages that
make six months of change visible. The rule going forward: **any new data the
product learns must eventually be expressible on the body.** If it can't be
felt on the stage, question whether it belongs.

## 7. Reports — the gateway, not the destination

Old model: assessment → report → done. New model:

**Assessment → Food System Report → curiosity → account → membership → daily
engagement.**

A report's job is to make the member need to see their Food System *live*.
Every report therefore ends in the account, not in a PDF graveyard.

**Evolution target:** reports become premium educational experiences — the
Apple-keynote / National Geographic / premium-annual bar. Concretely, over
P3 (§11):

1. **From document to experience** — the on-site report becomes a scrolled,
   animated chapter of the member's body (score draws itself, pathways light
   as they're explained), with the PDF demoted to a beautiful keepsake export.
2. **From generic to owned** — the member's own figure, colours, and history
   in every visual; the report reads as *their* biography, not a template.
3. **From one-off to annual rhythm** — the "Your Food System, Year One"
   publication: the retention artifact that makes membership feel like a
   subscription to their own story.
4. **From verdict to invitation** — every section closes with the one next
   action and the door it opens in the account.

## 8. Your Food System — the logged-in experience

The account must feel like opening **My Food System**, never a dashboard. The
shipped spine is right: **Today** (the stage + ritual + one next action) ·
**This Week** (the cinematic weekly story) · **My Food System** (journey,
milestones, evolution, memory) — plus Meals, Reports, and the Explore lenses.

Review by surface:

| Surface | State | Verdict / improvement |
|---|---|---|
| Today (stage, reveal, ritual) | Strong — the body is the centrepiece; meals and habits visibly land on it | Keep as the model for everything else |
| Next Best Action | One action, explained | Guard the "one" — never let it become a list |
| This Week | Cinematic story page | Good; tie more tightly to the milestone rail |
| Journey / Memory | Milestone rail + evolution pips + learned feed | Memory should become more visible and inspectable ("what I've learned about you") |
| Meals | Log + history | History is the most dashboard-like remnant — restyle as the body's diary (§12.7) |
| Reports | Listed + viewable | Inherits the §7 evolution |
| Explore lenses | Catalog-driven | Good; keep lenses, resist per-system dashboards |

## 9. Food Systems — ten-year scalability review

**The architecture holds.** Foundation → Health → Life with a typed catalog,
status lifecycle (`scaffold → live`), safety levels, inheritance enforcement,
and future-bridge metadata scales to new systems without structural change:
adding a system is one catalog entry + one landing + (when real) one
assessment + registry adapter — proven twice (V17 scaffolds, V18 Pregnancy).

**Gaps identified:**

1. **Sleep and Heart** exist as planned systems in the agent-loop engine but
   not in the customer catalog. Decide their fate: absorb into the catalog as
   scaffold Health systems (recommended, keeps engine and catalog congruent)
   or remove from the engine until real.
2. **Family depth.** Family is a foundation, but household members are thin
   sub-profiles. A ten-year platform likely needs Family to mature toward
   per-member lenses without violating "one Food System per person."
3. **The DB enum lags the catalog.** `leads.assessment_type` still checks
   `gut|mind|family|waitlist`; new assessments are localStorage-first by
   design, but any future server persistence of new systems needs a deliberate
   schema story, not an incremental CHECK patch.
4. **Naming debt** (legacy "eatobetics"/"eatosports" asset and storage names,
   four assessment route shapes) is cosmetic today, confusing at 2× the system
   count — see §12.3.

## 10. Navigation review

**Does it explain the product?** Yes — the header *is* the architecture now:
Home · Food Systems (mega menu: Foundation | Health | Life) · Food · Learn ·
Pricing · About · CTA. **Does it educate?** The mega menu teaches the taxonomy
with one-line taglines and honest "Soon" chips. **Does it inspire?** The
flagship `/food-systems` page carries the inspiration load and the menu feeds
it. **Does it scale?** New systems appear automatically from the catalog; the
three-family grid absorbs growth without redesign.

**Before merging PR #113:** merge-ready. Two named nits, neither blocking:

1. *"Your Food System" (Learn → `/digital-twin`) sits adjacent to "Food
   Systems"* — near-identical labels for different pages. Recommendation in
   §12.2; acceptable to merge and resolve in the follow-up.
2. The homepage Ecosystem section and the `/food-systems` hero share the
   headline "One Food System. Many ways to support it." Intentional echo, but
   consider retitling the homepage section eyebrow so the flagship owns the
   line.

## 11. Long-term roadmap (phases, not dates)

| Phase | Name | Meaning | State |
|---|---|---|---|
| **P1** | Foundation Product | Assessments, baseline, score, account, payments | ✅ Substantially built |
| **P2** | Living Food System | Body-as-interface: stage, reveal, signals, evolution | ✅ Substantially built; deepen per §6 |
| **P3** | Reports | Gateway model + premium-publication experience | ◑ Pipeline built; experience evolution ahead (§7) |
| **P4** | Membership | Tiers, gating, daily-engagement value | ◑ Infrastructure live; value story to deepen |
| **P5** | Life Systems | Pregnancy → Birth → Baby as real (post sign-off) | ◑ Pregnancy assessed; gated on clinical/legal review |
| **P6** | PregMonth | Life systems become foundational in a sister platform | Future — bridge metadata only |
| **P7** | DevelopMonth | Baby/child development platform | Future — bridge metadata only |
| **P8** | Food System Intelligence | Memory-rich, provider-agnostic intelligence; the system that truly *knows* you across years | Future |
| **P9** | Global Food System | Member → family → community → global; the outward mission | Future |

Exit test per phase: P3 exits when a member calls their report "beautiful"
unprompted; P4 when weekly retention is driven by the daily loop, not the
report; P5 when a clinician has signed the copy and `noindex` is removed.

## 12. Critical review — honest

### 12.1 Registry / catalog duplication *(architectural risk)*
Three parallel system registries exist: `lib/systems.ts` (presentation),
`lib/assessment/registry.ts` (assessment behaviour), `lib/agent-loop/systems.ts`
(engine). Consistency tests bind them, and each has a distinct concern — but
three places must change to make a system fully real, the engine knows systems
the catalog doesn't (sleep, heart), and drift pressure grows with every new
system. **Recommendation:** make `lib/systems.ts` the single declaration point
and derive/validate the other two from it; short of that, extend the
consistency tests to cover the engine registry too.

### 12.2 `/digital-twin` vs `/food-systems` overlap *(brand + UX risk)*
Two flagship pages now tell overlapping platform stories, and their nav labels
("Your Food System" vs "Food Systems") differ by one word. **Recommendation:**
give each a single job — `/food-systems` owns *the architecture* (what exists,
how it connects), `/digital-twin` becomes *the experience* story (what it feels
like inside, the living body) and should eventually be renamed customer-side
(e.g. "Inside Your Food System") to retire "Digital Twin" from public
vocabulary per §3.

### 12.3 Assessment route inconsistency *(UX + maintenance)*
Four shapes coexist: `/stability/assessment`, `/glucose/assessment`,
`/assessment-mind`, `/performance-assessment` (+ `/pregnancy/assessment`).
Cosmetic today; confusing for SEO, analytics, and humans tomorrow.
**Recommendation:** converge on `/{system}/assessment` with permanent
redirects, as a deliberate small migration (registry routes make this cheap).

### 12.4 Medical-adjacent risk — Pregnancy / Birth / Baby *(brand + compliance)*
The most sensitive surface in the product. Mitigations shipped: food-first
non-diagnostic copy, exact-string-tested disclaimers, red-flag →
midwife/GP/maternity signposting before any guidance, `noindex`, no data
capture beyond localStorage. **The hard gate stands: no public indexing, no
promotion, and no PregMonth/DevelopMonth marketing until qualified clinical
and legal review signs the copy.** This is a launch blocker by design, and the
same gate applies to Birth and Baby when they become real.

### 12.5 localStorage / cross-device limitations *(technical + UX)*
Assessments are localStorage-first: excellent for anonymous, instant,
consent-light onboarding; fragile across devices, browsers, and clearing. The
summary-cache sync (`eb_assessment_summaries_v1` + server hydrate) papers over
report continuity for signed-in members, but raw answers remain
device-bound. **Recommendation:** keep localStorage-first as the anonymous
default, but make "signed-in ⇒ server-persisted, any device" a P4 membership
promise — a deliberate migration, not an accident of history.

### 12.6 Reports don't yet match the vision *(product risk)*
The pipeline is robust (generation, fallback, PDF, email, status tracking),
but the artifact is still closer to a good document than the Apple/NatGeo
experience §7 demands. The report is the first paid moment — if the gateway
underwhelms, the funnel pays for it everywhere downstream. **Recommendation:**
P3 is the next major build after the current review pause.

### 12.7 The account is still part-dashboard *(experience risk)*
Today's stage-led Overview is genuinely alive, but tabs like Meals/history and
some card-grid moments still read as admin panels. The bar from
`PRODUCT_EXPERIENCE.md` — "opening My Food System should feel like checking on
something you're growing" — is met on Today and missed on the periphery.
**Recommendation:** apply the Today treatment outward: history becomes the
body's diary; settings-adjacent surfaces stay plain (honesty over theatre),
everything member-facing gets the living treatment.

### 12.8 Smaller debts (tracked, not urgent)
- Dual membership fields (`membership` referral vs `membership_tier`
  subscription) — deliberate, but must be documented every time gating logic
  is touched.
- Retired report tiers (`starter|full|premium`) linger in types and prompts.
- Legacy asset/storage naming ("eatobetics", "eatosports",
  `performance-assessment` LS key) — rename opportunistically, never breaking
  persisted keys (Constitution Art. V §15).
- GLP-1 discoverability now rests on the Glucose landing — watch search/entry
  analytics; if GLP-1 is a major acquisition door, give it landing-page SEO,
  not a nav label.

## 13. Success criteria

A developer joining EatoBiotics who reads this document set should be able to
answer, without help:

- **What EatoBiotics is** — one living Food System per person (§1–2).
- **Why it exists** — the mission (§1).
- **How the product works** — architecture + machinery (§3–4).
- **How every page fits together** — the journey map (§5) and nav (§10).
- **How future features are evaluated** — the constitutions + §2's single question.
- **How reports evolve** — §7.
- **How the account evolves** — §8, §12.7.
- **How Food Systems evolve** — §4, §9, and the future families.
- **How the platform scales over a decade** — §9, §11.

If any answer requires tribal knowledge, this document has a bug — fix the
document.

---

*v1.0 — consolidated after the V17–V19 builds (Systems architecture, Pregnancy
assessment, Food Systems navigation + flagship page), during the PR #113
review pause. Amend deliberately; never drift.*
