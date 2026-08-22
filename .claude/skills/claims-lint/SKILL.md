---
name: claims-lint
description: Advisory review of health claims, safety language, and honesty labelling in any user-facing EatoBiotics content — pages, emails, report templates, AI prompts, marketing copy. Context-aware (negations and disclaimers are fine); verdicts are Pass / Pass with edits / Block / Requires clinical-legal review. Review-only — never wired into CI, never auto-blocks merges.
---

# claims-lint

## 1. Name

`claims-lint`

## 2. Purpose

Keep every piece of user-facing EatoBiotics content **educational, food-first, honest, and
non-diagnostic**. This skill reviews claims in context and returns an advisory verdict with
suggested edits. It protects the product's single biggest risk surface: regulatory/claims
drift, especially as content volume and AI-generated copy grow.

This skill is **advisory and review-oriented**. It does not modify CI, does not add
workflows, and does not automatically block merges. Humans act on its verdicts.

## 3. When to invoke

- Any change touching user-facing copy: pages, components with visible text, emails,
  report templates, PDF content, AI system prompts, metadata descriptions, OG images.
- New landing or concept pages (invoked by `concept-page`).
- Content-heavy trust fixes (invoked by `trust-fix` when the fix changes customer-facing
  wording, e.g. email copy or empty-state text).
- Before publishing marketing/launch material sourced from the repo.

## 4. When not to invoke

- Pure backend/logic changes with no user-visible text.
- Test-only or tooling-only changes.
- Code-correctness review — that is `verify-eatobiotics`'s job, not this skill's.
- When content is already flagged for clinical/legal review — escalate, don't re-review.

## 5. Pre-flight

1. Identify exactly which user-facing text changed (`git diff` scoped to the copy-bearing
   files; for a new page, the whole page).
2. Establish the surface's context: who sees it (public visitor, buyer, member), what the
   page is for, and whether it is production or a preview-only concept.
3. Have the honesty-label taxonomy at hand (see §7).

## 6. Workflow

1. **Extract claims.** List every statement that asserts what EatoBiotics *is*, *does*,
   *measures*, or *will do* — including claims implied by imagery captions, badges,
   example data, and stats.
2. **Classify each claim in context.** The unit of analysis is the sentence-in-context,
   never the isolated word:
   - ✅ "EatoBiotics does not diagnose conditions" — a negated disclaimer. **Pass.**
   - ❌ "EatoBiotics diagnoses digestive conditions" — a diagnostic claim. **Block.**
   - ✅ "Support steadier energy" — educational, hedged, food-first. **Pass.**
   - ❌ "Lowers your blood sugar" — therapeutic outcome claim. **Block.**
3. **Check honesty labels against repository evidence.** Anything presented as available
   must be verifiably live in code/tests/production; everything else must carry the right
   label (see §7). A route, table, or component existing is *not* evidence a capability is
   live for customers.
4. **Check guardrails.** Health-adjacent surfaces need the educational/non-diagnostic
   framing and, where symptoms are discussed, the red-flag→GP direction (see the Stability
   module's pattern: `components/stability/{MedicalDisclaimer,RedFlagWarning}.tsx`).
5. **Check score honesty.** The Food System Score is derived from self-reported food
   patterns. Copy must never present it as a biological measurement, a diagnosis, or a
   guaranteed-to-improve number. Progress framing must allow flat/declining outcomes
   ("direction, not judgement" — never "your score will improve").
6. **Return the verdict and findings** (see §10).

## 7. Scope rules

- **Single responsibility:** claims, safety language, and honesty labelling only. No code
  review, no build/test verification, no design review.
- **Advisory only:** never add CI workflows, merge blocks, or automated gates.
- **Do not edit files** unless the requester explicitly asks for the suggested edits to be
  applied.
- **Honesty-label taxonomy** (use these exact classifications):
  - **Available now** — repo evidence + tests + known verified behaviour support it.
  - **Needs manual production verification** — code exists; live behaviour unproven.
  - **In development** — meaningful implementation exists, incomplete.
  - **Our direction** — approved vision, not materially implemented.
  - **Future** — longer-term concept.
- **Contextual watch-list** (flag for review in context — not banned words): diagnose,
  treat, cure, prevent, reverse (of any condition); named-condition outcomes ("lowers
  blood sugar", "fixes IBS"); "heal your gut/microbiome" as a product promise (the *Heal*
  pillar name is acceptable — it is defined in-product as supporting routines and
  environment, "no single food does this on its own"); guaranteed outcomes or guaranteed
  score improvement; detox; calorie/body-weight framing; supplement-led solutions;
  presenting questionnaire outputs as biological measurements; future features written in
  the present tense as if live.
- Locked brand lines ("The Food System Inside You", "Your family has a food system too.",
  "The science is global. The food is local.", "Understand within. Improve daily.
  Participate outward.") are pre-approved verbatim — do not flag or rewrite them.

## 8. Review requirements

Every reviewed claim must have: its location (file/section), the claim text, its
classification (educational / disclaimer / availability / outcome / measurement), and a
finding. Availability claims must cite the repository evidence consulted (or its absence).

## 9. Stop conditions

- A claim's acceptability turns on clinical or legal judgement (e.g. a specific-condition
  statement, jurisdiction-specific wording, anything about medication) → verdict
  **Requires clinical-legal review**, name the claim, and stop. Do not guess.
- The task drifts into code correctness or visual review → hand off to
  `verify-eatobiotics` and stop.
- Asked to weaken a safety disclaimer or remove an honesty label → refuse and flag.

## 10. Output format

```
## claims-lint review — <surface> (<branch/PR>)

| Location | Claim | Classification | Finding | Suggested edit |
|---|---|---|---|---|

Overall verdict: Pass | Pass with edits | Block | Requires clinical-legal review
Rationale: <2-3 sentences>
```

Verdict meanings: **Pass** — publishable as-is. **Pass with edits** — publishable once the
listed edits are applied; nothing is dangerous. **Block** — contains a diagnostic,
therapeutic, guaranteed-outcome, or false-availability claim; do not publish until fixed.
**Requires clinical-legal review** — outside this skill's competence; route to a human
expert before publishing.

## 11. Common failure modes

- **Banning negations:** flagging "does not diagnose" because it contains "diagnose".
  Always classify the full sentence.
- **Passing future-as-live:** a feature written in the present tense ("photograph a meal
  and see…") with no availability label. Check tense against the taxonomy.
- **Missing implied claims:** example scores, illustrative insights, imagery captions, and
  status pills make claims too ("Seed · sauerkraut spotted" implies image recognition —
  fine only under an explicit concept/illustrative label).
- **Flagging quoted or historical text** (e.g. book excerpts describing what others claim)
  as product claims.
- **Treating the score as clinical:** letting copy imply the questionnaire measures
  biology.

## 12. Repository-specific examples

- `/newhome` (concept): "Illustrative example — not your data" on the score card, the
  "Concept illustration — not a live feature" badge on Meal Map, and the five-way
  availability split are the reference implementations of honest labelling — **Pass**.
- The pre-fix account dashboard told zero-purchase users they had "2 assessment snapshots
  of your Food System so far" (fake data as personal history) — the canonical **Block**
  case (fixed in PR #123).
- The pre-fix paid-report email claimed a PDF was "attached to this email" when none was —
  a false-capability claim (**Block**; fixed in PR #121).
- `lib/stability/*` + `components/stability/MedicalDisclaimer.tsx`: the reference pattern
  for non-diagnostic framing ("possible contributor", "may be associated with") and
  red-flag→GP direction.
- The score explainer on `/newhome` ("based on your self-reported food patterns… not a
  biological measurement, and not a diagnosis") is the reference score-honesty sentence.
