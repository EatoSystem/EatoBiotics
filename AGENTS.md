# AGENTS.md

EatoBiotics is a Next.js 16 / React 19 / TypeScript application that measures a
person's **food system** from a questionnaire and meal photos, gives them a
**Biotics Score™**, teaches microbiome science, and sells a €49 Report and a
€24.99/month membership. ~177k lines across `app`, `components` and `lib`;
Supabase, Stripe, Anthropic, Resend. **Node 24 required.**

Its hardest engineering problem is not features — it is **not overclaiming**,
because the subject matter invites claims the instrument cannot support. A
nine-stage integrity programme is six-ninths done, and the enforcement holding
it in place is path-scoped source scanning plus fourteen differential-sabotage
suites. **A great deal of code here is a deliberate absence rather than a
missing feature.**

## The operative constraints live in `.cursor/rules/`

| | |
|---|---|
| `.cursor/rules/eatobiotics-core.mdc` | the permanent product rule, the hard constraints, the verification gate. Loads into every session |
| `.cursor/rules/eatobiotics-claims.mdc` | how the claims guards work and what to do when one fails |

If your tooling does not read `.cursor/rules/`, **read both files directly
before making any change.** They are short, and they are the fence rather than
the signpost.

## Reading order

1. **`docs/cursor/00_PROJECT_BRIEF.md`** — what the product is and sells, the
   permanent product rule and how it has been broken, the stack and measured
   scale, the four coexisting UI generations, the programme state, the hard
   constraints, how the guards work, how to run the gate.
2. `docs/cursor/01_REVIEW_AND_WORKFLOWS.md` — what is worth reviewing, the
   anti-goals, and nine repeatable workflows.
3. `docs/cursor/02_MOBILE_APP_BRIEF.md` — the iOS/Android daily companion.
4. `CLAUDE.md` — the authoritative architecture reference.
5. `docs/experience/DOCUMENTATION_MAP.md` — which documents are canonical, and
   three that are traps.

`lib/v1-surface.ts` is the **canonical** route inventory. No document is.

## The three things that would cost the most

1. **Adding a personal per-Biotic score, bar, band word or colour-state
   anywhere.** You have found the permanent product rule, not an oversight.
2. **Applying a database migration.** Production Supabase is read-only for
   agents; migrations are drafted and a human applies them.
3. **Weakening a failing guard to make a suite pass.** That is how a guard
   becomes decoration, and this project has the receipts.
