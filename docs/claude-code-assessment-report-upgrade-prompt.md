# Claude Code Prompt: Assessment And Report Upgrade

> **Provenance.** Recreated in-repo from the text pasted into the Claude Code
> session of 2026-07-31, not copied from a local working file. If the original
> has been edited since, diff before treating this as authoritative.
>
> That risk has already materialised once: the first commit of this file opened
> with a paragraph belonging to a different task ("Please make a focused update
> to the current homepage only…"), which contradicted the whole document. It was
> caught by diffing against the original and removed. Worth re-checking the rest
> against your copy rather than assuming this one is faithful.

Use this prompt in Claude Code.

Required attachment/context file:

- `docs/assessment-report-improvement-brief-for-claude.md`

## Prompt

You are working in the EatoBiotics repo. Your task is to upgrade the assessment
and report experience so it becomes a premium, highly educational Food System
reporting product.

Before coding, read the attached brief in full:

- `docs/assessment-report-improvement-brief-for-claude.md`

Also read these supporting files:

- `docs/masterplan/MASTERPLAN.md`
- `docs/masterplan/PRODUCT_CONSTITUTION.md`
- `docs/assessment-refactor.md`
- `app/globals.css`
- `lib/assessment-report.ts`
- `lib/assessment-scoring.ts`
- `lib/claude-report.ts`
- `app/api/generate-report/route.ts`
- `app/api/submit-deep-assessment/route.ts`
- `components/assessment/assessment-results.tsx`
- `components/assessment/full-report-client.tsx`
- `components/assessment/paid-report-client.tsx`
- `lib/pdf/report-pdf.tsx`
- `components/report/report-pdf.tsx`
- `lib/family-assessment-data.ts`
- `components/family-assessment/family-assessment-client.tsx`
- `lib/family-assessment-scoring.ts`
- `components/family-assessment/family-assessment-results.tsx`
- `components/mind-assessment/mind-assessment-results.tsx`
- `components/digital-twin/parts.tsx`
- `components/account/twin/meet-body-hero.tsx`
- `lib/account/twin-figure.ts`

## Core Goal

Turn EatoBiotics reports from scorecards and food lists into beautiful,
professional, educational Food System reports.

The customer should finish the report understanding:

1. What their Food System is like right now.
2. Why it is currently that way, based on their answers or their family's
   answers.
3. How the internal system works: inputs, microbes, outputs, body signals, and
   improvement loops.
4. Which parts are strong, which parts are under-supported, and what pathway
   matters first.
5. How specific food-first actions can improve the system over time.
6. How building the Food System inside them connects to building the Food
   System around them.

The report should feel like a guided tour of the customer's inner food
ecosystem, not a generic wellness PDF.

## Non-Negotiables

- Remove food emoji graphics from live assessment-result and report surfaces.
- Remove `emoji` from Claude report schemas and generated report contracts.
- Replace emoji with professional visual tokens: brand-colour accents, lucide
  icon names, body zones, biotic capsules, pathway graphics, and optional
  approved image assets.
- Use the EatoBiotics brand colours from `app/globals.css`.
- Use the existing body/twin graphics throughout the web report and PDF report.
- Make reports highly educational before they recommend actions.
- Keep all health language educational, careful, non-diagnostic, and
  non-medical.
- Fix the legacy score mismatch in `/api/generate-report` or retire that
  endpoint.
- Wire Family context questions into the Family assessment flow.
- Make web and PDF reports render from one structured report model where
  practical.
- Add a final report page with this headline:

```text
Build the Food System
inside you
- and help build the Food System
around you.
```

Do not make unrelated homepage, pricing, membership, navigation, or brand
positioning changes.

## Design Direction

Use the product's existing visual language. The body should teach before text
explains.

Use these colours:

- Prebiotics: `#A8E063`
- Probiotics: `#2DAA6E`
- Postbiotics: `#F5A623`
- Core brand action: `#4CB648`
- Energy/warmth/supporting highlights: `#F5C518`

Use these visual assets and components where appropriate:

- `/images/twin-male.png`
- `/images/twin-female.png`
- `/images/couple-hero.png`
- `/images/assessment-hero.png`
- `/images/family-hero.png`
- `/images/hero-gut.png`
- `/images/mind-hero.png`
- `/images/3-biotics-infographic.png`
- `DigitalTwinFigure`
- `LivingImage`
- `twinFigureSrc`

The report should use:

- Lora for headings.
- DM Sans for body text.
- Colour-coded 3-Biotics pathways.
- Body overlays or static body panels.
- Lucide icons for functional/report labels.
- Professional food cards that explain mechanism, not emoji.

## Content Direction

Every major section must teach one concept before recommending action.

Required report chapters:

1. Food System snapshot.
2. How your Food System works.
3. Your 3-Biotics engine.
4. What your answers reveal.
5. Body signal map.
6. Your priority lever.
7. Food tools, not food emojis.
8. 30-day improvement loop.
9. Family variant, where applicable.
10. Final inside-out mission page.

The final page must connect:

- You.
- Family.
- Community.
- County or place.
- Country.
- The wider Food System.

Suggested final-page copy direction:

```text
This report starts inside you: your inputs, microbes, outputs, signals, and
next action. But food never stays only inside one person. The meals you repeat
shape your household, your shopping patterns, your local food culture, and the
Food System around you.

Build the system inside you first. Then help make the system around you
healthier, more resilient, and more connected.
```

## Health And Safety Language

Use:

- "Your answers suggest..."
- "This may support..."
- "This is associated with..."
- "This can help create the conditions for..."
- "Use this as an educational snapshot..."

Avoid:

- "You have..."
- "This treats..."
- "This cures..."
- "This directly reduces..."
- "You are deficient..."
- "Your body is producing too little..."
- "Clinical research consistently shows..." unless paired with a specific
  evidence note and cautious framing.

Add a consistent safety footer:

```text
This report is educational and based on your food-pattern answers. It is not a
diagnosis, treatment plan, or substitute for medical advice. If you have a
medical condition, are pregnant, are immunocompromised, are making major diet
changes, or are concerned about symptoms, speak with a qualified health
professional.
```

## Implementation Plan

Work in phases. Keep changes scoped and commit-ready.

### Phase 1: Stop Current Quality Leaks

1. Remove `emoji` from `lib/claude-report.ts`.
2. Remove `emoji` from Claude prompt schemas in
   `app/api/submit-deep-assessment/route.ts`.
3. Replace `food.emoji`, `identityLabel.emoji`, and other visible emoji in live
   report/result components.
4. Fix `/api/generate-report` so it accepts canonical 3-Biotics scores or
   retire it if it is no longer used.
5. Update fallback report data to the new non-emoji structure.
6. Wire `FAMILY_CONTEXT_QUESTIONS` into the Family assessment flow.
7. Add a quick regression check so generated prompts never include
   `undefined/100`.

### Phase 2: Add Shared Educational Report Model

Create or update a shared report schema, ideally around:

- `lib/report/food-system-report-types.ts`
- `lib/report/report-theme.ts`

The schema should support:

- Report mode: You, Family, Mind, Combined.
- Confidence label: Snapshot, Pattern, Tracked.
- Overall score.
- 3-Biotics scores.
- System snapshot.
- Visual theme.
- Food System map.
- Educational modules.
- Body signal map.
- Priority lever.
- Food tools.
- 30-day loop.
- Family context.
- Evidence notes.
- Safety footer.
- Closing mission page.

Use Zod or the repo's existing validation pattern for generated Claude JSON
where practical.

### Phase 3: Upgrade Claude Prompts And Fallbacks

Claude should generate structured educational report data, not just prose.

Prompt Claude to:

- Teach the Food System first.
- Explain why the customer's answers create the current pattern.
- Show how the system can improve.
- Produce professional visual tokens instead of emoji.
- Include a body signal map.
- Include a single priority lever.
- Include the inside-out closing mission page.
- Include evidence notes for major educational claims.
- Use careful non-medical language.

Fallback reports must follow the same data contract.

### Phase 4: Rebuild Web Report Presentation

Update web report components so the first viewport feels premium and
educational.

The report should include:

- A body-led hero.
- Score and confidence label.
- 3-Biotics pathway summary.
- Educational system map.
- Body signal map.
- Priority lever.
- Food tools with mechanism and usage.
- 30-day improvement loop.
- Evidence and safety notes.
- Final inside-out mission page.

Avoid nested card-heavy layouts. Use full-width report bands, clean sections,
body visuals, pathway graphics, brand swatches, and precise typography.

### Phase 5: Upgrade PDF Report Presentation

The live PDF renderer is `lib/pdf/report-pdf.tsx`.

Use `components/report/report-pdf.tsx` as the stronger prototype, but remove
its emoji before porting ideas.

The live PDF should:

- Use Lora and DM Sans.
- Use exact brand colours.
- Support current 3-Biotics score keys.
- Avoid iterating arbitrary subscore keys without label/colour mapping.
- Include body visuals or static body panels.
- Include the same educational chapters as the web report.
- Include the final inside-out mission page.
- Include evidence and safety notes.

### Phase 6: Tests And Verification

Add tests or checks for:

- No `undefined/100` in generated prompts.
- No `emoji` fields in generated report schemas.
- No food emoji rendering in live report/result components.
- Family context questions are presented and passed into scoring/reporting.
- Report schema validation accepts fallback and generated reports.

Run:

```powershell
npm run build
rg -n "food[.]emoji|identityLabel[.]emoji|emoji|\\p{Extended_Pictographic}" components app lib
```

The `rg` command should only return approved mock/demo exceptions, not live
customer report or assessment-result surfaces.

## Acceptance Criteria

The implementation is successful when:

1. Reports are highly educational and explain the customer's current Food
   System in detail.
2. Reports explain how the system can improve, not just what foods to eat.
3. No live customer report or assessment-result surface uses food emojis.
4. Claude schemas no longer ask for emoji.
5. Generated prompts never contain `undefined/100`.
6. Family reports use household context.
7. The body visual appears in the report hero/cover.
8. 3-Biotics pathways are colour-coded and explained.
9. Web and PDF reports share the same educational structure.
10. Health claims are careful, educational, and non-medical.
11. Full, premium, and family reports end with:

```text
Build the Food System
inside you
- and help build the Food System
around you.
```

## Delivery Notes

After implementation, summarize:

- Files changed.
- Report schema changes.
- UI/report presentation changes.
- Claude prompt changes.
- Family assessment changes.
- Safety/evidence changes.
- Verification commands run and results.

Do not make a commit unless explicitly asked.
