# Assessment And Report Improvement Brief For Claude

> **Provenance.** Recreated in-repo from the text pasted into the Claude Code
> session of 2026-07-31, not copied from a local working file. If the original
> has been edited since, diff before treating this as authoritative.
>
> **Editor's note — read before acting on the audit below.** The findings in this
> brief were written from a code read and were checked against the codebase during
> Phase 1 (PR #190). Most held. Three things did not, and the brief is left
> unedited as a record of what was believed at the time:
>
> 1. **The two PDF renderers.** Section 4 describes `lib/pdf/report-pdf.tsx` as the
>    live paid renderer and `components/report/report-pdf.tsx` as a prototype. Both
>    are live, but for different flows: `lib/pdf/report-pdf.tsx` serves the paid
>    deep-assessment PDF via `lib/pdf/generate-pdf.ts`, while
>    `components/report/report-pdf.tsx` serves `/api/report-pdf` — which has **no
>    callers** — and takes `DemoReportData` from the public sample pages. They have
>    different data contracts, so the "port the prototype" instruction is a
>    schema-bridged rewrite, not a copy.
> 2. **A bug the brief does not mention.** The paid PDF was not merely dated — it
>    **never rendered at all**. `pullQuoteText` asked for `Helvetica-Bold` with
>    `fontStyle: "italic"`, which react-pdf's base-14 built-ins cannot resolve, so
>    every paid PDF threw. `submit-deep-assessment` caught it and marked
>    `pdf_status: "failed"`, making the failure invisible.
> 3. **Two more legacy-pillar sites.** Beyond `/api/generate-report`, the same
>    mistake existed in the PDF score panel and in the free report's food swaps —
>    the latter returning identical swaps to 100% of customers.
>
> See PR #190 for what Phase 1 actually changed.

Date: 2026-07-31

Owner intent: the assessments and reports need to feel premium, educational,
beautiful, and specific to the customer's Food System. Customers should leave
knowing how the Food System inside them, their mind, or their family works,
where it is strong, where it is constrained, and what food-first action will
improve it. Remove food emoji graphics from report and assessment-result
surfaces. Use the EatoBiotics brand colours, body graphics, and a more
professional visual language.

## Executive Summary

The scoring foundations are usable, and the repo already contains strong brand
assets for the "Food System inside you" idea. The current report experience
does not yet deliver that promise. It is still too card-heavy, too food-list
heavy, and too dependent on emoji placeholders. It explains what to eat more
than it teaches how the customer's internal Food System works.

The biggest blockers are:

1. The live report schemas still require `emoji` fields, and several renderers
   display `food.emoji`.
2. The old `/api/generate-report` prompt expects five legacy pillar scores even
   though newer flows pass 3-Biotics scores, which can produce undefined score
   context for Claude.
3. The live paid PDF renderer uses old font and colour choices and assumes old
   subscore labels. It is far behind the richer report prototype already in the
   repo.
4. Family context questions exist but are not currently presented by the Family
   assessment client, so the report cannot learn enough about the household.
5. Several sample/report claims are too deterministic for an educational,
   non-medical product. They should be rewritten with clearer evidence framing.
6. Body graphics and "Food System inside you" visuals exist but are not being
   used as the report's main explanatory device.

The target direction: reports should become a premium educational chapter about
the customer's living Food System. The score is the doorway, not the product.

## Product Standard

Use the masterplan and constitution as the north star:

- `docs/masterplan/MASTERPLAN.md` says the report should be a gateway, not a
  terminal deliverable. It should make the member want to see their Food System
  live in the account.
- `docs/masterplan/PRODUCT_CONSTITUTION.md` says every screen should educate,
  visuals should explain before text, and EatoBiotics must remain non-medical.
- `docs/assessment-refactor.md` says scores are behaviour-based educational
  support scores, never medical measurements.

The customer should learn these five things:

1. What their Food System is: inputs, microbes, outputs, body signals, and
   feedback loops.
2. Which internal pathways are strong or constrained: Prebiotics, Probiotics,
   Postbiotics, and add-on systems where relevant.
3. Why their answers imply those patterns.
4. Which one lever matters first.
5. How specific foods and routines change the system over time.

## Audit Findings

### 1. Free And Paid Report Content Is Still Food-List First

Evidence:

- `lib/assessment-report.ts` defines food recommendations with `emoji` at lines
  10, 29, 70-210, 231-246, 360, 437, and seasonal food `emoji` fields at
  521-526.
- `components/assessment/assessment-results.tsx` displays
  `identityLabel.emoji` at line 291 and `food.emoji` at line 742.
- `components/assessment/full-report-client.tsx` displays `food.emoji` at
  lines 141 and 290 and has a calendar emoji at line 367.
- `components/assessment/paid-report-client.tsx` displays an emoji-style key
  insight label at line 68, `food.emoji` at line 339, and a calendar emoji at
  line 586.
- `components/mind-assessment/mind-assessment-results.tsx` displays
  `food.emoji` at line 329.
- `components/family-assessment/family-assessment-results.tsx` displays
  `food.emoji` at line 363.

Why this matters:

The reports currently feel like a colourful checklist. The customer needs a
clear internal model of what is happening inside them or their household. Foods
should be framed as "system tools", not cute icons.

Fix:

- Remove `emoji` from customer-facing report data models and renderers.
- Replace emoji with a structured visual token: biotic colour, lucide icon name,
  body zone, food group, or optional real image asset.
- Add education sections before food recommendations so the customer learns the
  internal mechanism before seeing the action list.

### 2. Claude Schemas Still Ask For Emoji

Evidence:

- `lib/claude-report.ts` requires `specificFoodList[].emoji` at lines 100-122.
- `app/api/submit-deep-assessment/route.ts` asks Claude to return
  `specificFoodList` items with `emoji` at lines 131 and 164.
- `lib/fallback-paid-report.ts` includes `emoji` values at lines 220-244.
- `lib/pdf/report-pdf.tsx` renders food-card emoji at lines 707-719 and passes
  `item.emoji` at lines 930-934.

Why this matters:

Even if the UI is redesigned, Claude will continue to produce emoji-shaped data
until the schema changes. The data contract itself must become professional.

Fix:

- Change the Claude JSON schema and TypeScript types from:
  - `emoji: string`
- To:
  - `biotic: "prebiotics" | "probiotics" | "postbiotics" | "synbiotic"`
  - `visualToken: { type, accent, iconName, bodyZone, assetSlug }`
  - `mechanism: string`
  - `howToUse: string`
  - `whyForThisCustomer: string`

### 3. Legacy Score Mismatch Can Confuse Generated Reports

Evidence:

- `app/api/generate-report/route.ts` defines `SubScores` as legacy keys:
  `diversity`, `feeding`, `adding`, `consistency`, `feeling` at lines 5-11.
- The same prompt asks Claude for "Diversity Score", "Microbe Feeding Score",
  and other legacy labels at line 46 onward.
- Newer report clients and scoring use 3-Biotics keys or derived 3-Biotics
  fields. `app/api/submit-deep-assessment/route.ts` has a newer
  `getBioticScores` helper at lines 69-83.

Why this matters:

Claude can receive `undefined/100` values in the prompt when the three-biotic
result is passed into an endpoint that expects five old pillars. This weakens
or corrupts personalization.

Fix:

- Either retire `/api/generate-report` in favour of
  `/api/submit-deep-assessment`, or normalize every incoming result to canonical
  3-Biotics before prompt construction.
- Never expose old pillar names to Claude unless the assessment actually uses
  them.
- Add a test that fails if any generated prompt contains `undefined/100`.

### 4. Paid PDF Renderer Is Behind The Premium Vision

Evidence:

- `lib/pdf/report-pdf.tsx` uses built-in `Helvetica` and `Helvetica-Bold` in
  many styles, including lines 87, 102, 108, 130, 138, 145, 158, and onward.
- It defines old `PILLAR_COLORS` and `PILLAR_LABELS` at lines 62-76.
- `PillarScoresSection` iterates `Object.entries(subScores)` at line 526,
  which is risky when the incoming subscore object has new keys.
- It renders `FoodCard` emoji at lines 703-719.
- A richer prototype exists in `components/report/report-pdf.tsx`, including
  registered Lora and DM Sans fonts at lines 17-24, a "Gut Intelligence Report"
  cover at line 247, contents at lines 334-362, shopping list at line 1413,
  power combinations at line 1488, and final thoughts at line 1567.

Why this matters:

The paid PDF should feel premium. The prototype proves the right direction
exists, but the live renderer still looks more generic and less educational.

Fix:

- Port the richer prototype structure into the live paid renderer in
  `lib/pdf/report-pdf.tsx`.
- Keep the good parts: cover, contents, educational chapters, 3-Biotics pages,
  system map, timeline, shopping list, pairings, and closing action.
- Remove all emoji from the prototype before porting.
- Register and use Lora for headings and DM Sans for body copy.
- Use the exact brand tokens from `app/globals.css`.

### 5. Family Assessment Has Context Questions But Does Not Use Them

Evidence:

- `lib/family-assessment-data.ts` exports `FAMILY_CONTEXT_QUESTIONS` at line
  239.
- `components/family-assessment/family-assessment-client.tsx` imports only
  `FAMILY_QUESTIONS` at line 12.
- The client computes the result with `computeResult(answers)` at line 107,
  without passing family context.
- `lib/family-assessment-scoring.ts` can produce `contextTips` when context is
  present at line 311.

Why this matters:

Family reports should teach the household Food System. Without ages, budget,
time, picky eating, school meals, and family goals, the output is too generic.

Fix:

- Add a second assessment phase after scored questions: "Household context".
- Ask the existing `FAMILY_CONTEXT_QUESTIONS`.
- Pass answers into `computeResult(answers, context)` or the current expected
  context shape.
- Surface context-specific tips in the free Family result and paid Family
  report.
- For paid reports, add a family system map: shared table, weekday rhythm,
  exposure loop, member differences, and one household lever.

### 6. Some Health Education Claims Are Too Strong

Evidence examples:

- `lib/assessment-scoring.ts` line 212 says one fermented serving "makes a
  measurable difference within weeks".
- `components/report/report-pdf.tsx` lines 633, 693, 716, 783, 787, 793, 1193,
  1490, and 1649 include deterministic or medical-sounding statements.
- `app/report-mind/page.tsx` lines 24-267 contain several strong gut-brain,
  serotonin, anxiety, sleep, depression, and inflammation claims.
- `app/report-family/page.tsx` lines 26, 54, 64, and 184 include strong child
  microbiome and immune claims.
- `lib/assessment-report.ts` lines 89, 132, 138, 144, 205, 241, 245, and 271
  include claims that should be softened or cited.

Why this matters:

EatoBiotics is educational and non-medical. Customers can learn more without
the product implying diagnosis, treatment, guaranteed outcomes, or direct
clinical effects.

Fix:

- Use "your answers suggest", "may support", "is associated with", "can help
  create the conditions for", and "educational snapshot".
- Avoid "will", "directly reduces", "significantly below optimal", "clinical
  research consistently shows", and exact timelines unless presented with clear
  caveats and source context.
- Add report footnotes or "Evidence notes" for educational claims.
- Include a safety footer in every report: not a diagnosis, not medical advice,
  speak with a qualified professional for health conditions, pregnancy,
  immunocompromise, infants, or major diet changes.

### 7. Brand And Body Assets Are Underused

Evidence:

- Brand colour tokens exist in `app/globals.css` lines 30-34:
  - `--icon-lime: #A8E063`
  - `--icon-green: #4CB648`
  - `--icon-teal: #2DAA6E`
  - `--icon-yellow: #F5C518`
  - `--icon-orange: #F5A623`
- Brand gradients exist in `app/globals.css` lines 89, 93, and 102.
- The design system maps those colours to biotic meaning in
  `eatobiotics-design-system/project/README.md` lines 101-105.
- The design system says food emoji placeholders are only for app mock screens
  and never marketing surfaces at lines 71-72 and 181.
- Body assets are available through `lib/account/twin-figure.ts` lines 12-19:
  `/images/couple-hero.png`, `/images/twin-male.png`,
  `/images/twin-female.png`.
- `components/digital-twin/parts.tsx` exports `DigitalTwinFigure` at line 57
  and `LivingImage` at line 138.
- `components/account/twin/meet-body-hero.tsx` uses `DigitalTwinFigure` and
  says "Meet the Food System inside you" at lines 55 and 83.

Why this matters:

The report should visually teach before text explains. The body should be the
central report object, with pathways, glows, labels, and food-system loops.

Fix:

- Use body graphics throughout web reports.
- For PDFs, generate or compose static body-system panels using the same assets.
- Create new visual variants if needed:
  - Prebiotic feed stream: lime plant/fibre pathways entering the gut.
  - Probiotic seed cloud: teal live-culture pathway around the gut.
  - Postbiotic output glow: orange/yellow metabolites radiating to body zones.
  - Family system map: household table plus multiple pathway rings.
- Use lucide icons for functional UI and report labels. Use branded capsules,
  swatches, simple charts, and body overlays for meaning.

## Target Report Experience

Every report should read like a premium educational chapter, not a receipt.
It should be interesting enough that the customer wants to keep reading, and
clear enough that they can explain their Food System to someone else after
finishing it.

### Educational Depth Standard

Every report must answer three questions in detail:

1. What is my Food System like right now?
2. Why is it this way, based on my answers or my family's answers?
3. How can it improve, and what will each improvement change inside the system?

Claude should write the report as a guided tour of the customer's internal food
ecosystem. The report should connect scores, answer patterns, body signals,
food inputs, microbial pathways, daily constraints, and improvement actions
into one story.

The report should not just say:

- "Eat more fibre."
- "Add fermented foods."
- "Try these five foods."

It should explain:

- What those foods do inside the system.
- Which part of the system is currently strong or under-supported.
- Why the customer's current pattern produced the score.
- How one repeated food habit can change the input -> microbe -> output loop.
- What the customer or family should watch for over the next 30 days.

### Chapter 1: Your Food System Snapshot

Goal: make the customer feel seen before showing detail.

Include:

- Personal or family title.
- Date, report type, and confidence label: Snapshot, Pattern, or Tracked.
- Overall score as a simple entry point.
- Personalized body figure using `twinFigureSrc` or the relevant family image.
- One-line system story:
  - "Your answers suggest a strong plant-feeding base, with the biggest lift
    coming from more consistent live-food exposure."
- Three pathway bars:
  - Prebiotics: what feeds your microbes.
  - Probiotics: what seeds or refreshes microbial exposure.
  - Postbiotics: what your system produces and how well it recovers.

### Chapter 2: How Your Food System Works

Goal: teach the mental model.

Use a visual loop:

Input -> Microbes -> Outputs -> Body signals -> Next action

Teach:

- Inputs: plants, fibre, fermented foods, meal rhythm, diversity, protein,
  hydration, and stress/sleep context.
- Microbes: living communities that respond to repeated inputs.
- Outputs: short-chain fatty acids and other metabolites, framed carefully.
- Signals: digestion, energy, comfort, mood/focus, recovery, and family rhythm.
- Improvement loop: small repeated changes matter more than a one-off perfect
  meal.

### Chapter 3: Your 3-Biotics Engine

Goal: make the score meaningful.

For each biotic:

- What it does.
- What the customer's answers suggest.
- What high/low can look like in everyday life.
- One food-first lever.
- One body visual.

Use brand colours:

- Prebiotics: `#A8E063`
- Probiotics: `#2DAA6E`
- Postbiotics: `#F5A623`
- Core brand and CTA: `#4CB648`
- Energy and warmth: `#F5C518`

### Chapter 4: What Your Answers Reveal

Goal: connect assessment answers to insight.

Do not just summarize scores. Translate answer patterns into the internal
system.

Example:

- "You already give your microbiome regular plant fuel, but your live-food
  exposure is intermittent. That means your report is not asking you to change
  everything. It is asking you to add a reliable seeding habit to an existing
  base."

### Chapter 5: Body Signal Map

Goal: show how the Food System connects to the body without making medical
claims.

Use body zones:

- Gut comfort and rhythm.
- Energy steadiness.
- Mood and focus, when relevant.
- Immune/recovery resilience, carefully phrased.
- Sleep/stress context, when relevant.

Use wording:

- "Your answers suggest this signal may be worth watching."
- "This is not a diagnosis. It is a food-pattern clue."

### Chapter 6: Your Priority Lever

Goal: reduce noise.

Give one primary lever:

- What to add.
- Why it matters for their system.
- How to start.
- What to notice.
- How to keep it realistic.

Secondary actions can exist, but the report should make the first action
obvious.

### Chapter 7: Food Tools, Not Food Emojis

Goal: make food recommendations feel premium and educational.

Each food should show:

- Food name.
- Biotic role.
- System mechanism.
- Why it fits this customer.
- How to use it.
- Swap or family adaptation.
- Colour-coded visual token, not emoji.

Example shape:

```ts
{
  food: "Oats",
  biotic: "prebiotics",
  visualToken: {
    type: "biotic-capsule",
    accent: "lime",
    iconName: "Wheat"
  },
  mechanism: "Provides beta-glucan fibre that can support fermentation by gut microbes.",
  whyForThisCustomer: "Your answers suggest plant-fibre consistency is a strength, so oats are a low-friction way to protect that base.",
  howToUse: "Use as breakfast oats or add two tablespoons to yoghurt."
}
```

### Chapter 8: 30-Day Improvement Loop

Goal: make improvement feel trackable.

Structure:

- Week 1: install the smallest habit.
- Week 2: increase variety or frequency.
- Week 3: combine a feed food with a seed food.
- Week 4: review signals and retake.

Use "may notice" rather than "will experience".

### Chapter 9: Family Variant

For Family reports, teach the household system:

- Shared table: what everyone eats repeatedly.
- Exposure loop: how repeated low-pressure exposure builds familiarity.
- Weekday rhythm: breakfast, school/work lunches, dinners, snacks.
- Member differences: ages, preferences, picky eating, goals.
- One household lever: the most realistic change for the next seven days.

The Family report should not be "an individual report with plural wording".
It should feel like a map of a household food environment.

### Chapter 10: Build The Food System Inside And Around You

Every full, premium, and family report should end with a dedicated mission page.
This is not a generic CTA. It is the emotional and educational close: the
customer has learned about the Food System inside them, and now sees how that
connects to the Food System around them.

Required page headline:

**Build the Food System**
**inside you**
**- and help build the Food System**
**around you.**

Page purpose:

- Bring the report back to the EatoBiotics mission.
- Explain that personal food habits are not isolated: they affect the body,
  the family table, shopping choices, local food culture, and eventually the
  wider food system.
- Show a simple inside-out visual:
  - You.
  - Family.
  - Community.
  - County or place.
  - Country.
  - The Food System.
- Give one next action inside the account or membership experience.

Suggested copy direction:

- "This report starts inside you: your inputs, microbes, outputs, signals, and
  next action. But food never stays only inside one person. The meals you repeat
  shape your household, your shopping patterns, your local food culture, and
  the Food System around you."
- "Build the system inside you first. Then help make the system around you
  healthier, more resilient, and more connected."

Visual direction:

- Use the body figure at the centre.
- Add expanding rings using the brand gradient:
  lime -> green -> teal -> yellow -> orange.
- For Family reports, place the household/table visual in the second ring.
- Do not use marketing-style generic graphics. The page should feel like the
  natural final chapter of the customer's report.

## New Shared Report Schema

Create a shared report model so the web report and PDF render the same
educational structure.

Recommended file:

- `lib/report/food-system-report-types.ts`

Suggested shape:

```ts
export type BioticKey = "prebiotics" | "probiotics" | "postbiotics"
export type ReportMode = "you" | "family" | "mind" | "combined"
export type ReportConfidence = "snapshot" | "pattern" | "tracked"

export type VisualAccent = "lime" | "green" | "teal" | "yellow" | "orange"

export interface ReportVisualToken {
  type: "biotic-capsule" | "body-zone" | "habit" | "food-group" | "family-rhythm"
  accent: VisualAccent
  iconName?: string
  assetPath?: string
  bodyZone?: "gut" | "brain" | "energy" | "immune" | "sleep" | "whole-body" | "family-table"
}

export interface FoodSystemNode {
  id: string
  label: string
  state: "strong" | "building" | "strained" | "unknown"
  score?: number
  explanation: string
  visualToken: ReportVisualToken
}

export interface EducationModule {
  title: string
  visualToken: ReportVisualToken
  plainEnglish: string
  whyItMatters: string
  whatYourAnswersSuggest: string
  actionBridge: string
}

export interface ReportFoodTool {
  food: string
  biotic: BioticKey | "synbiotic"
  visualToken: ReportVisualToken
  mechanism: string
  whyForThisCustomer: string
  howToUse: string
  swap?: string
  familyAdaptation?: string
}

export interface FoodSystemReport {
  mode: ReportMode
  title: string
  subtitle: string
  generatedAt: string
  confidence: ReportConfidence
  overallScore: number
  bioticScores: Record<BioticKey, number>
  systemSnapshot: {
    oneLine: string
    strongestPathway: BioticKey
    priorityPathway: BioticKey
    dominantPattern: string
    mainLever: string
  }
  visualTheme: {
    primaryAccent: VisualAccent
    bodyAssetPath: string
    gradient: VisualAccent[]
  }
  foodSystemMap: FoodSystemNode[]
  educationModules: EducationModule[]
  bodySignalMap: FoodSystemNode[]
  priorityLever: {
    title: string
    whyThisFirst: string
    firstStep: string
    whatToNotice: string
  }
  foodTools: ReportFoodTool[]
  thirtyDayLoop: Array<{
    week: number
    focus: string
    action: string
    why: string
  }>
  closingMissionPage: {
    headlineLines: [
      "Build the Food System",
      "inside you",
      "- and help build the Food System",
      "around you."
    ]
    insideYou: string
    aroundYou: string
    nextAction: string
    visualToken: ReportVisualToken
  }
  familyContext?: {
    householdPattern: string
    constraints: string[]
    memberNotes: string[]
    sharedLever: string
  }
  evidenceNotes: Array<{
    claim: string
    sourceTitle: string
    sourceUrl: string
  }>
  safetyFooter: string
}
```

## Claude Prompt Rules

Use these rules in both report generation endpoints.

### Content Rules

- Teach first, recommend second.
- Explain the internal Food System in plain English.
- Make the report personal by referencing score patterns and relevant answers.
- Keep one priority lever obvious.
- Keep all claims educational and non-diagnostic.
- Include evidence notes for the biggest educational claims.
- Never generate emoji or emoji-like fields.
- Never promise a cure, treatment, diagnosis, or guaranteed outcome.
- Never say food "will" fix a health issue.

### Visual Data Rules

- Every section must include a `visualToken`.
- Visual tokens must use brand accent names, not raw random colours.
- Foods must use `biotic`, `mechanism`, and `visualToken`, not `emoji`.
- Body sections must specify `bodyZone` where useful.
- Family sections must include `family-table` or `family-rhythm` visuals.
- Full, premium, and family reports must include the closing inside-out mission
  page.

### Safety Language Rules

Preferred wording:

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
- "Clinical research consistently shows..." without a specific evidence note.

## Visual Direction

The report should use EatoBiotics colour and body language throughout.

### Colours

Use the existing CSS tokens:

- `#A8E063` for Prebiotics and plant/fibre inputs.
- `#2DAA6E` for Probiotics and live-culture exposure.
- `#F5A623` for Postbiotics and output/recovery.
- `#4CB648` for primary brand actions and score confidence.
- `#F5C518` for energy, warmth, and supporting highlights.

### Typography

- Headings: Lora.
- Body: DM Sans.
- Numeric callouts: Lora or DM Sans Bold, depending on the prototype section.
- Avoid default Helvetica in live PDFs.

### Body Graphics

Use existing assets:

- `/images/twin-male.png`
- `/images/twin-female.png`
- `/images/couple-hero.png`
- `/images/assessment-hero.png`
- `/images/family-hero.png`
- `/images/hero-gut.png`
- `/images/mind-hero.png`
- `/images/3-biotics-infographic.png`

Use existing components:

- `DigitalTwinFigure`
- `LivingImage`
- `twinFigureSrc`

Create static PDF-compatible body panels:

- Whole system snapshot.
- Prebiotic feed pathway.
- Probiotic seed pathway.
- Postbiotic output pathway.
- Gut-brain signal map for Mind.
- Household rhythm map for Family.

### Icon Policy

- Use lucide icons for controls and functional labels.
- Use colour-coded pills, rings, pathway lines, and body overlays for report
  visuals.
- Do not use food emoji placeholders in reports, report CTAs, score cards,
  share cards, or assessment result pages.
- If real food visuals are needed, use photography or generated bitmap assets
  that match the brand. If not available, use abstract branded food-group
  tokens.

## Assessment Improvements

### You Assessment

Current strength:

- The 15-question 3-Biotics flow is clear and fast.

Improve:

- Add micro-learning moments after each pathway section:
  - "What your Prebiotic answers are telling us."
  - "What your Probiotic answers are telling us."
  - "What your Postbiotic answers are telling us."
- Add a confidence label: Snapshot, Pattern, or Tracked.
- Use the body visual earlier, not only after the score.
- Ask one optional "what do you most want to understand?" question before paid
  report generation, so Claude can orient the report.

### Family Assessment

Current strength:

- Native five-subscore Family architecture exists and derives 3-Biotics.

Improve:

- Present `FAMILY_CONTEXT_QUESTIONS`.
- Use context in scoring and reporting.
- Add family-specific education:
  - repeated exposure,
  - shared routines,
  - time and budget constraints,
  - picky eating,
  - age-aware food strategy,
  - school/work lunch reality.
- Replace the starter food emoji grid with a household system map.

### Mind Assessment

Current strength:

- Mind has a native five-subscore model and safer non-diagnostic direction.

Improve:

- Reframe gut-brain education carefully.
- Avoid deterministic serotonin, anxiety, depression, and sleep claims.
- Show a gut-brain body visual and label it as educational, not diagnostic.
- Keep the foundation requirement visible: Mind is a lens on the Food System,
  not a standalone diagnosis.

### Deep/Paid Assessment

Improve:

- Ask fewer generic symptoms and more interpretive context:
  - biggest daily constraint,
  - meal rhythm reality,
  - confidence with fermented foods,
  - family constraints where applicable,
  - current stage or goal,
  - what the customer wants to understand.
- For every generated question, Claude should know what report section it will
  improve. If a question does not improve a section, remove it.

## Implementation Roadmap

### Phase 1: Stop The Current Quality Leaks

Tasks:

1. Remove `emoji` from `lib/claude-report.ts`.
2. Remove `emoji` from `app/api/submit-deep-assessment/route.ts` prompt
   schemas.
3. Remove or replace `food.emoji` renders in:
   - `components/assessment/assessment-results.tsx`
   - `components/assessment/full-report-client.tsx`
   - `components/assessment/paid-report-client.tsx`
   - `components/family-assessment/family-assessment-results.tsx`
   - `components/mind-assessment/mind-assessment-results.tsx`
   - `lib/pdf/report-pdf.tsx`
4. Fix `/api/generate-report` score normalization or retire the endpoint.
5. Add a unit or snapshot test that fails if generated report prompts contain:
   - `undefined/100`
   - `emoji`
   - customer-facing emoji glyphs.
6. Wire `FAMILY_CONTEXT_QUESTIONS` into the Family assessment client.

### Phase 2: Build The Shared Educational Report Model

Tasks:

1. Add `lib/report/food-system-report-types.ts`.
2. Add `lib/report/report-theme.ts` with brand colours, typography labels, and
   visual token mapping.
3. Convert Claude output to the new shared report schema.
4. Update fallback paid reports to match the new schema.
5. Add Zod validation for Claude JSON before saving or rendering.

### Phase 3: Rebuild Web And PDF Report Presentation

Tasks:

1. Port the richer structure from `components/report/report-pdf.tsx` into the
   live paid renderer.
2. Remove prototype emoji before porting.
3. Use Lora and DM Sans in the live PDF.
4. Build reusable sections:
   - Cover snapshot.
   - Contents.
   - Food System map.
   - 3-Biotics engine.
   - Body signal map.
   - Priority lever.
   - Food tools.
   - 30-day loop.
   - Evidence notes.
   - Safety footer.
5. Make web and PDF render from the same report data.

### Phase 4: Visual System Upgrade

Tasks:

1. Reuse `DigitalTwinFigure` and `twinFigureSrc` in web reports.
2. Create static body-system panels for PDF.
3. Add prebiotic, probiotic, postbiotic pathway overlays.
4. Add family-specific household visuals.
5. Replace food emoji placeholders with:
   - lucide icons,
   - branded biotic capsules,
   - simple body-zone diagrams,
   - real or generated food photography if approved.

### Phase 5: Evidence And Safety Pass

Tasks:

1. Rewrite deterministic claims in static sample reports and generated prompts.
2. Add evidence notes to report templates.
3. Add a consistent non-medical safety footer.
4. Add claim review tests or lint fixtures for disallowed phrases.

## Acceptance Criteria

The work is done when:

1. No customer-facing assessment result or report surface displays food emoji.
2. Claude schemas do not ask for `emoji`.
3. Generated prompts never include `undefined/100`.
4. Family paid and free reports use household context.
5. Every report has a clear educational Food System map.
6. The body visual is present in the first report viewport or PDF cover.
7. Every major section teaches one idea before recommending an action.
8. Paid PDF uses EatoBiotics fonts, colours, and body visuals.
9. Report claims are educational, cited where meaningful, and non-medical.
10. Full, premium, and family reports end with the "Build the Food System
    inside you / around you" mission page.
11. The first next action is obvious and realistic.

Suggested verification commands:

```powershell
rg -n "food[.]emoji|identityLabel[.]emoji|emoji|\p{Extended_Pictographic}" components app lib
npm run build
```

The `rg` command should only return approved mock/demo exceptions, not live
customer report or assessment-result surfaces.

## Source Notes For Educational Claims

Use these as guardrails for report evidence notes and claim tone:

- NIH NCCIH, "Probiotics: What You Need To Know":
  https://www.nccih.nih.gov/health/probiotics-what-you-need-to-know
  - Useful for careful probiotic wording, strain specificity, variable effects,
    and safety caveats.
- WHO, "Healthy diet":
  https://www.who.int/news-room/fact-sheets/detail/healthy-diet
  - Useful for broad food-pattern guidance and general healthy diet framing.
- NIH NIEHS, "Microbiome":
  https://www.niehs.nih.gov/health/topics/science/microbiome
  - Useful for defining the microbiome and explaining it as a living community.
- Wastyk et al., "Gut-microbiota-targeted diets modulate human immune status",
  Cell, 2021:
  https://pubmed.ncbi.nlm.nih.gov/34256014/
  - Useful for cautious discussion of high-fibre and fermented-food diet
    studies. Do not overstate individual outcomes.
- Gibson et al., "Expert consensus document: The International Scientific
  Association for Probiotics and Prebiotics consensus statement on the
  definition and scope of prebiotics", Nature Reviews Gastroenterology and
  Hepatology, 2017:
  https://pubmed.ncbi.nlm.nih.gov/28611480/
  - Useful for prebiotic definitions and scope.

## Prompt To Give Claude

Use this as the starting implementation prompt:

```text
You are improving the EatoBiotics assessment and report experience.

Read these files first:
- docs/assessment-report-improvement-brief-for-claude.md
- docs/masterplan/MASTERPLAN.md
- docs/masterplan/PRODUCT_CONSTITUTION.md
- docs/assessment-refactor.md
- app/globals.css
- lib/assessment-report.ts
- lib/claude-report.ts
- app/api/generate-report/route.ts
- app/api/submit-deep-assessment/route.ts
- components/assessment/assessment-results.tsx
- components/assessment/full-report-client.tsx
- components/assessment/paid-report-client.tsx
- lib/pdf/report-pdf.tsx
- components/report/report-pdf.tsx
- lib/family-assessment-data.ts
- components/family-assessment/family-assessment-client.tsx
- lib/family-assessment-scoring.ts
- components/digital-twin/parts.tsx
- lib/account/twin-figure.ts

Goal:
Turn reports from food-list scorecards into premium educational Food System
reports. Customers should understand how the Food System inside them or their
family works, what their answers suggest, what pathway matters first, and how
specific food-first actions improve the system over time. The report must be
interesting and detailed enough that the customer can explain their current
Food System, why it is currently that way, and how it can improve.

Non-negotiables:
- Remove food emoji graphics from live report and assessment-result surfaces.
- Remove `emoji` from Claude report schemas.
- Use EatoBiotics brand colours from app/globals.css.
- Use body graphics and visual pathway explanations.
- Keep all health language educational and non-medical.
- Fix legacy score mismatch in /api/generate-report or retire the endpoint.
- Wire Family context questions into the Family assessment flow.
- Make web and PDF reports share one structured report model.
- Add a final report page with the headline:
  Build the Food System / inside you / - and help build the Food System /
  around you.

Implement in phases:
1. Stop quality leaks: remove emoji, fix score normalization, wire family context.
2. Add a shared educational report schema.
3. Update Claude prompts and fallback report data.
4. Rebuild live web and PDF reports using body visuals, brand colours, Lora,
   DM Sans, and educational chapters.
5. Add the final "Build the Food System inside you / around you" mission page.
6. Add safety/evidence notes and tests.

Run:
- npm run build
- rg -n "food[.]emoji|identityLabel[.]emoji|emoji|\p{Extended_Pictographic}" components app lib

Only approved mock/demo exceptions should remain. Do not make unrelated
homepage, pricing, membership, or navigation changes.
```
