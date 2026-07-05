# The EatoBiotics Product Constitution

> The Food System is the product. Everything else exists to help people
> understand it, strengthen it, and live with it.

This document is the standard every future feature is measured against. If a
proposal conflicts with a principle here, the proposal changes — or this
constitution is amended deliberately, in writing, before the code is.

---

## Article I — The Food System comes first

1. **The Food System comes before individual systems.** You, Family, Stability,
   Glucose, Mind, Performance, Recovery, Longevity, Pregnancy, Birth, Baby —
   every one of them is a *lens* on one living Food System, never a separate
   product. No system gets its own disconnected dashboard, score universe, or
   brand voice.
2. **One living Food System.** A member has exactly one. It persists across
   every system, page, report, and (eventually) sister platforms. Features that
   would fork it — a second score, a parallel profile, a system-local history —
   are wrong by definition.
3. **Foundation before Health. Health before Life.** The order is the
   architecture. Every non-foundation system inherits from a You or Family
   baseline; none runs standalone. This rule is enforced in code
   (`requiresFoundation`, the foundation guard) and must never be waived for a
   growth shortcut.

## Article II — The experience comes before the technology

4. **The user experience comes before technology.** The customer sees **Your
   Food System**. The Baseline, the Digital Twin, the Agent Loop, Food System
   Memory, and whichever AI provider runs underneath are internal machinery.
   Technology names never appear in customer copy; technology limits never
   dictate customer language.
5. **Technology should disappear.** Any feature that requires the member to
   understand *how it works* before they can feel *what it does* is unfinished.
6. **The product works without the model.** The Agent Loop runs
   deterministically with no LLM. AI enriches; it must never become a
   single point of failure for the core experience.

## Article III — Every screen educates

7. **Every screen should educate.** A page that only displays data has failed.
   Each surface teaches one thing about the member's Food System — what fed it,
   what strained it, what to do next, why.
8. **Visuals explain before text.** The body lights up before the sentence
   explains why. Show the probiotic pathway brighten, *then* say "kefir fed
   your probiotic network." Text confirms what the visual already taught.
9. **One next action.** The loop ends in exactly one recommendation — food-first,
   achievable, explained. Lists of ten tips are noise; one action is a habit.

## Article IV — The journey

10. **Reports begin the journey; they never end it.** A report is the gateway —
    assessment → report → curiosity → account → membership → daily engagement.
    Any report designed as a terminal deliverable is designed wrong.
11. **The first sixty seconds show the member themselves, not numbers.** A new
    member meets the living body before any score. Wonder first, metrics second.
12. **Progress is a story, not a chart.** Milestones, evolution stages, and the
    weekly story exist so a member six months in can *feel* "it knows me and
    I've changed."

## Article V — Integrity

13. **Never score fabricated data.** A system without a real assessment says
    "Coming soon." Planned systems ship as metadata, landing pages, and honest
    labels — never as invented numbers.
14. **Non-medical, always.** EatoBiotics educates about food patterns. It never
    diagnoses, treats, screens, or substitutes for professionals. Sensitive
    surfaces (Pregnancy, Birth, Baby) signpost qualified professionals on every
    page, carry the sensitive disclaimer, and stay out of search indexes until
    clinical/legal review clears them.
15. **Persisted state outlives refactors.** Renames and re-architectures never
    break a member's in-flight journey: wire keys, localStorage fields, Stripe
    metadata, and DB values are backward-compatible or migrated — never
    silently dropped.
16. **One source of truth per concern, guarded by tests.** The customer-facing
    catalog is `lib/systems.ts`; navigation, homepage, account, and menus are
    generated from it. Where parallel registries must exist (presentation /
    assessment behaviour / agent engine), consistency tests bind them.

## Article VI — The mission

17. **Build the Food System Inside You. Help build the Food System around you.**
    The personal mission scales outward — member → family → community → the
    global Food System. Features should make both directions stronger.

---

*Companion documents: [DESIGN_CONSTITUTION.md](./DESIGN_CONSTITUTION.md) ·
[MOTION_CONSTITUTION.md](./MOTION_CONSTITUTION.md) ·
[AI_CONSTITUTION.md](./AI_CONSTITUTION.md) · governed by
[MASTERPLAN.md](./MASTERPLAN.md).*
