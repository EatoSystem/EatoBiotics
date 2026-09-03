# Phase 3A Consultation Bank Summary

> **Status: NOT ACTIVE.** Nothing in this document is asked of a paying
> customer. `/assessment/deep` still runs the runtime-AI question path, and
> `lib/consultation/` is imported by no route, page or component — a test
> asserts that mechanically. This pack exists so the whole bank can be read,
> argued with and rejected *before* Phase 3B switches new paid sessions to it.
>
> **Nothing here has been reviewed by a qualified human for scientific
> accuracy.** No question carries `scienceReview: "reviewed"`, and a test
> enforces that. See "Requires Human Science Review" below for the list that
> needs sign-off before activation.

Bank version: `v1` · Source of truth: `lib/consultation/question-bank.ts` ·
Contract: `lib/consultation/types.ts`

This document is generated from the bank's own metadata. Every field below —
intent, why-needed, report targets, sensitivity, applicability, free-Assessment
overlap — is carried as data on the question itself, so the documentation
cannot drift away from the questions it describes.

---

## Product Principles

1. **Every question earns its place.** `reportTargets` is required and
   non-empty, and the bank validator rejects a question without it. A question
   the Report cannot use does not exist.
2. **Deeper, not longer.** The free Assessment already went wide across fifteen
   questions. Where this bank touches a construct q1–q15 already covers, it must
   declare that and say what NEW information it collects.
3. **Ask, don't diagnose.** Questions explore reported patterns and context.
   `tests/unit/consultation-language-safety.test.ts` bans diagnosis, treatment,
   measurement, microbiome-composition and postbiotic-level language from every
   customer-facing string in the bank.
4. **Nothing is irreversible.** Applicability is declared data and the resolver
   is pure, so Back, Edit and Review (Phase 3B/3C) can recompute what applies at
   any point rather than replaying a splice.
5. **Stable meaning before clever wording.** Question ids are semantic and
   versioned; answer meaning lives in a separate `answerField`. Copy is
   presentation and can be revised without renaming a persisted answer.
6. **Family is a household Food System.** Not this bank with plural pronouns.
7. **AI interprets.** It does not author the runtime core paid questions.

---

## Sections

Four customer-facing sections. Orientation and Answer Review are future UI
states, not sections. The entitled Lens appends its own existing deterministic
bank and is not a section here.

| Section | Customer title | Purpose |
|---|---|---|
| `signals` | Your Signals | What the customer notices day to day. Not symptoms, not diagnosis. |
| `rhythm` | Your Rhythm | How food fits the real day and week, including recent change as selected context. |
| `environment` | Your Food Environment | What they buy, prepare, can access, and need the Report to work around. |
| `intentions` | Your Intentions | What matters to them, and what has made change hard. |

There is deliberately **no** customer-facing "Gut History" or "Medical History"
section. The only history the bank asks for is
`core_rhythm_recent_change_v1`, inside Rhythm, and the one question that goes
further (antibiotics) is optional and only reachable from it.

---

## Question Count

| | Baseline | Adaptive (max) | Core total (max) | With Lens | Free text |
|---|---|---|---|---|---|
| You | 14 | 3 | 17 | 21 | 1 |
| Family | 13 | 2 | 15 | 19 | 1 |

Frozen target: baseline 12–16, normal range 14–20, with Lens 18–24, exceptional
ceiling 26. Both foundations sit inside every bound, and the bank validator
fails the build if they stop doing so.

**One deliberate deviation, flagged for review.** The spec's envelope for
runtime adaptive questions is 2–6. In practice a customer sees **0–3** adaptive
questions (You) or **0–2** (Family), because adaptive questions only fire when
their trigger fires. Every adaptive module that survived the §75 quality bar is
in the bank; I did not add filler to reach the lower bound, because §74 says a
shorter, better Consultation is preferred to a long impressive-looking one.
If the reviewer wants the count raised, that is a product decision about which
*additional* module earns its place, not a gap to be filled.

No duration estimate and no question-count promise appears anywhere in
customer-facing copy. The burden target above is internal product architecture.

---

## The Bank

### Your Signals — `signals`

> What you notice day to day. There is no wrong answer, and nothing here is a medical judgement.

#### `core_signals_post_meal_pattern_v1`

- **Answer field:** `signals.postMealPattern`
- **Type:** single
- **Foundations:** you
- **Required:** required (when applicable)
- **Sensitivity:** medium
- **Science review:** required
- **Question (You):** When you notice something after eating, what do you tend to notice first?
- **Question (Family):** — (You-only)
- **Support text:** This is about what you notice, not about anything being wrong.
- **Options:** `fullness` Fullness or heaviness that lasts a while<br>`bloating` Bloating or wind<br>`dip` Sleepiness or a dip in energy<br>`lift-then-dip` A lift, then a dip<br>`nothing` Nothing in particular<br>`prefer-not-to-say` Prefer not to say
- **Intent:** Names the one post-meal signal the Report should build its body-signal section around.
- **Why needed:** Heaviness, bloating and an energy dip each point at a different practical change; without knowing which one leads, the Report can only describe all three and commit to none.
- **Report targets:** `bodySignalMap`, `systemSnapshot`
- **Applicability:** Always asked (baseline)
- **Free Assessment overlap:** builds deeper on q13
- **What deeper information this adds:** q13 rates how someone feels after eating on a four-point scale from sluggish to energised. It cannot say WHICH signal they notice, so the report has a rating with no subject. This asks for the subject.

#### `core_signals_energy_shape_v1`

- **Answer field:** `signals.energyShape`
- **Type:** single
- **Foundations:** you
- **Required:** required (when applicable)
- **Sensitivity:** low
- **Science review:** required
- **Question (You):** Which of these best describes the shape of your energy on a typical day?
- **Question (Family):** — (You-only)
- **Support text:** none
- **Options:** `steady` Steady from morning to evening<br>`slow-start` Slow to start, then steady<br>`afternoon-dip` Fine until an afternoon dip<br>`variable` Up and down through the day<br>`unpredictable` Hard to predict
- **Intent:** Places the Report's first action at a time of day the reader will actually be there for.
- **Why needed:** An action with no hour attached is not something anyone can do. Knowing the shape of the day is what turns a suggestion into a specific one.
- **Report targets:** `priorityLever`, `thirtyDayLoop`, `bodySignalMap`
- **Applicability:** Always asked (baseline)
- **Free Assessment overlap:** builds deeper on q15
- **What deeper information this adds:** q15 scores how STABLE energy is. This asks WHEN it changes. A person scoring low on q15 because of a 3pm dip and a person scoring low because mornings are hard need actions at opposite ends of the day, and q15 cannot tell them apart.

#### `core_signals_context_v1`

- **Answer field:** `signals.context`
- **Type:** multi
- **Foundations:** you
- **Required:** required (when applicable)
- **Sensitivity:** medium
- **Science review:** required
- **Question (You):** On the days you notice it most, which of these are usually also true?
- **Question (Family):** — (You-only)
- **Support text:** none
- **Options:** `rushed` Meals were rushed or skipped<br>`large-late` Meals were unusually large or late<br>`stress-sleep` Stress was high or sleep was short<br>`away-from-home` I was eating out, travelling or away from home<br>`no-connection` No clear connection **[exclusive]**<br>`prefer-not-to-say` Prefer not to say **[exclusive]**
- **Intent:** Identifies what co-occurs with the signal, which is where a first change is most likely to land.
- **Why needed:** This is the single most useful thing the free Assessment never asks. Something that shows up on rushed days and something that shows up when away from home lead to completely different first steps.
- **Report targets:** `priorityLever`, `bodySignalMap`, `thirtyDayLoop`
- **Applicability:** Always asked (baseline)
- **Free Assessment overlap:** none
- **What deeper information this adds:** n/a — no overlap with the free Assessment

#### `core_signals_household_mealtime_v1`

- **Answer field:** `signals.householdMealtime`
- **Type:** single
- **Foundations:** family
- **Required:** required (when applicable)
- **Sensitivity:** low
- **Science review:** not-required
- **Question (You):** —
- **Question (Family):** How do shared meals usually go in your household?
- **Support text:** none
- **Options:** `relaxed` Mostly relaxed<br>`rushed` Often rushed<br>`staggered` Usually separate or staggered<br>`negotiated` Often a negotiation about what to eat<br>`varies` It varies a lot
- **Intent:** Establishes what mealtimes are actually like, which sets what a household plan can realistically ask for.
- **Why needed:** A plan that assumes a calm shared table is unusable in a household where meals are staggered. This is the household equivalent of a signal, and it is about the food system, not about anyone's health.
- **Report targets:** `familyContext`, `systemSnapshot`, `thirtyDayLoop`
- **Applicability:** Always asked (baseline)
- **Free Assessment overlap:** none
- **What deeper information this adds:** n/a — no overlap with the free Assessment

#### `core_signals_household_hardest_moment_v1`

- **Answer field:** `signals.householdHardestMoment`
- **Type:** single
- **Foundations:** family
- **Required:** required (when applicable)
- **Sensitivity:** low
- **Science review:** not-required
- **Question (You):** —
- **Question (Family):** Which part of the day is hardest to get food right in your household?
- **Support text:** none
- **Options:** `mornings` Mornings<br>`midday` Packed lunches or the middle of the day<br>`after-school-work` After school or after work<br>`evenings` Evenings<br>`weekends` Weekends<br>`none-stand-out` None of them stand out
- **Intent:** Points the household's first action at the moment that actually needs help.
- **Why needed:** Households do not need everything fixed; they need the one hard moment made easier. Without this the Report has to guess which one it is.
- **Report targets:** `priorityLever`, `familyContext`, `thirtyDayLoop`
- **Applicability:** Always asked (baseline)
- **Free Assessment overlap:** none
- **What deeper information this adds:** n/a — no overlap with the free Assessment

#### `core_signals_settled_days_v1`

- **Answer field:** `signals.settledDays`
- **Type:** single
- **Foundations:** you
- **Required:** required (when applicable)
- **Sensitivity:** low
- **Science review:** required
- **Question (You):** On the days things feel more settled, what is usually different?
- **Question (Family):** — (You-only)
- **Support text:** none
- **Options:** `regular-meals` Meals were more regular<br>`lighter-meals` Meals were lighter or simpler<br>`stress-sleep` Less stress, or better sleep<br>`movement` More movement<br>`cannot-tell` I can't tell a difference yet
- **Intent:** Lets the reader name their own lever, which the Report can then back rather than replace.
- **Why needed:** Someone who has already noticed that regular meals help does not need to be told to try regular meals — they need help protecting the thing they found. Asked only of people who reported noticing something, because it is meaningless otherwise.
- **Report targets:** `priorityLever`, `thirtyDayLoop`
- **Applicability:** Only when `core_signals_post_meal_pattern_v1` notEquals `nothing` / `prefer-not-to-say`
- **Free Assessment overlap:** none
- **What deeper information this adds:** n/a — no overlap with the free Assessment


### Your Rhythm — `rhythm`

> How food actually fits into your day and week, including anything that has recently changed.

#### `core_rhythm_first_meal_v1`

- **Answer field:** `rhythm.firstMeal`
- **Type:** single
- **Foundations:** you
- **Required:** required (when applicable)
- **Sensitivity:** low
- **Science review:** not-required
- **Question (You):** On a typical weekday, when do you have your first proper meal?
- **Question (Family):** — (You-only)
- **Support text:** none
- **Options:** `within-hour` Within an hour of waking<br>`one-to-three` One to three hours after waking<br>`over-three` More than three hours after waking<br>`varies` It varies a lot<br>`none` I don't usually have a first meal
- **Intent:** Anchors the day, so the 30-day loop can attach a change to a real, repeatable moment.
- **Why needed:** The first meal is the most repeatable one in most weeks, which makes it the cheapest place to put a change. The Report needs to know whether there is one.
- **Report targets:** `thirtyDayLoop`, `foodSystemMap`, `foodTools`
- **Applicability:** Always asked (baseline)
- **Free Assessment overlap:** none
- **What deeper information this adds:** n/a — no overlap with the free Assessment

#### `core_rhythm_longest_gap_v1`

- **Answer field:** `rhythm.longestGap`
- **Type:** single
- **Foundations:** you
- **Required:** required (when applicable)
- **Sensitivity:** low
- **Science review:** not-required
- **Question (You):** What is the longest you usually go between eating during the day?
- **Question (Family):** — (You-only)
- **Support text:** Gaps are one of the easier things to adjust, so it helps to know the shape of your day.
- **Options:** `under-4` Under four hours<br>`4-to-6` Four to six hours<br>`6-to-8` Six to eight hours<br>`over-8` More than eight hours<br>`varies` It varies a lot
- **Intent:** Gives the Report the actual spacing of the day rather than a self-rating of it.
- **Why needed:** Spacing is the lever most often available when what someone eats is already reasonable, and it is the part of rhythm a reader can change without changing any food.
- **Report targets:** `thirtyDayLoop`, `priorityLever`
- **Applicability:** Always asked (baseline)
- **Free Assessment overlap:** builds deeper on q12
- **What deeper information this adds:** q12 asks how OFTEN meals get skipped, rushed or eaten late. This asks how long the gap actually is. 'A few times a week' covers both a five-hour gap and a twelve-hour one, and only the second changes what the Report should suggest.

#### `core_rhythm_household_shared_meals_v1`

- **Answer field:** `rhythm.householdSharedMeals`
- **Type:** single
- **Foundations:** family
- **Required:** required (when applicable)
- **Sensitivity:** low
- **Science review:** not-required
- **Question (You):** —
- **Question (Family):** How often does your household eat a main meal together?
- **Support text:** none
- **Options:** `most-days` Most days<br>`few-times-week` A few times a week<br>`weekends` Mainly at weekends<br>`rarely` Rarely<br>`never` Never — we eat separately
- **Intent:** Establishes whether the household has a shared meal to build on, or whether the plan has to work without one.
- **Why needed:** Every household food plan either builds on a shared meal or deliberately does not. Guessing wrong makes the whole plan unusable, and this is the household's central structural fact.
- **Report targets:** `familyContext`, `thirtyDayLoop`, `systemSnapshot`
- **Applicability:** Always asked (baseline)
- **Free Assessment overlap:** none
- **What deeper information this adds:** n/a — no overlap with the free Assessment

#### `core_rhythm_week_shape_v1`

- **Answer field:** `rhythm.weekShape`
- **Type:** single
- **Foundations:** you, family
- **Required:** required (when applicable)
- **Sensitivity:** low
- **Science review:** not-required
- **Question (You):** How different are your weekends from your weekdays?
- **Question (Family):** How different are your household's weekends from its weekdays?
- **Support text:** none
- **Options:** `same` Much the same<br>`looser` A little later or looser<br>`very-different` Very different<br>`weekdays-unpredictable` It's the weekdays that are unpredictable
- **Intent:** Tells the 30-day loop which days it has to survive.
- **Why needed:** A four-week plan that only works Monday to Friday fails on day six. The shape of the difference decides whether the plan needs a weekend version.
- **Report targets:** `thirtyDayLoop`, `systemSnapshot`
- **Applicability:** Always asked (baseline)
- **Free Assessment overlap:** builds deeper on q11
- **What deeper information this adds:** q11 scores how consistent the week is and mentions weekends inside its option text. This asks for the DIRECTION of the difference — including the case where weekdays are the unpredictable half, which q11's scale reads as simply inconsistent.

#### `core_rhythm_recent_change_v1`

- **Answer field:** `rhythm.recentChange`
- **Type:** multi
- **Foundations:** you, family
- **Required:** required (when applicable)
- **Sensitivity:** medium
- **Science review:** not-required
- **Question (You):** Has anything changed in the last few months that affected how you eat?
- **Question (Family):** Has anything changed in the last few months that affected how your household eats?
- **Support text:** none
- **Options:** `schedule` A new job, or a change of schedule<br>`move-travel` A house move, or a lot of travel<br>`caring` Caring responsibilities<br>`health-event` A health event, or a period of recovery<br>`cooking-change` More or less cooking at home<br>`none` Nothing much has changed **[exclusive]**<br>`prefer-not-to-say` Prefer not to say **[exclusive]**
- **Intent:** Gives the Report the context that explains a pattern, and the only route by which history is asked for at all.
- **Why needed:** A pattern that started three months ago after a schedule change is a different thing from a lifelong one, and the Report's opening line is wrong if it treats them the same. This is history as context inside Rhythm — there is no Medical History section, and no separate history intake.
- **Report targets:** `systemSnapshot`, `educationModules`, `priorityLever`
- **Applicability:** Always asked (baseline)
- **Free Assessment overlap:** none
- **What deeper information this adds:** n/a — no overlap with the free Assessment

#### `core_rhythm_household_separate_reason_v1`

- **Answer field:** `rhythm.householdSeparateReason`
- **Type:** single
- **Foundations:** family
- **Required:** required (when applicable)
- **Sensitivity:** low
- **Science review:** not-required
- **Question (You):** —
- **Question (Family):** What most often makes eating together difficult?
- **Support text:** none
- **Options:** `schedules` Different schedules<br>`tastes` Different tastes<br>`space` Space, or the way the kitchen works<br>`not-tried` We haven't really tried to change it<br>`works-better` It works better this way for us
- **Intent:** Decides whether the household plan should work towards a shared meal or work well without one.
- **Why needed:** Only asked of households that rarely eat together. 'It works better this way for us' is a real and complete answer — the Report should then stop trying to assemble everyone at a table and make the separate meals better instead.
- **Report targets:** `familyContext`, `thirtyDayLoop`
- **Applicability:** Only when `core_rhythm_household_shared_meals_v1` equals `rarely` / `never`
- **Free Assessment overlap:** none
- **What deeper information this adds:** n/a — no overlap with the free Assessment

#### `core_rhythm_antibiotics_v1`

- **Answer field:** `rhythm.antibiotics`
- **Type:** single
- **Foundations:** you
- **Required:** optional
- **Sensitivity:** high
- **Science review:** required
- **Question (You):** In the last two years, have you had a course of antibiotics?
- **Question (Family):** — (You-only)
- **Support text:** Optional. It is used only as background, and your Report draws no medical conclusion from it.
- **Options:** `recent` Yes, in the last six months<br>`older` Yes, longer ago than that<br>`no` No<br>`unsure` Not sure<br>`prefer-not-to-say` Prefer not to say
- **Intent:** Adds timing context to a health event the customer has already chosen to mention.
- **Why needed:** Kept deliberately narrow. It is OPTIONAL, high-sensitivity, and asked only of someone who already mentioned a health event — so nobody is asked about antibiotics as a matter of course, and nobody has to answer. Its wording carries no claim about what antibiotics do; that is exactly the wording that needs human science review before this bank is ever activated.
- **Report targets:** `educationModules`, `systemSnapshot`
- **Applicability:** Only when `core_rhythm_recent_change_v1` includes `health-event`
- **Free Assessment overlap:** none
- **What deeper information this adds:** n/a — no overlap with the free Assessment


### Your Food Environment — `environment`

> What you buy, cook and have access to — so your Report suggests things that fit your real life.

#### `core_environment_cooking_frequency_v1`

- **Answer field:** `environment.cookingFrequency`
- **Type:** single
- **Foundations:** you, family
- **Required:** required (when applicable)
- **Sensitivity:** low
- **Science review:** not-required
- **Question (You):** In a typical week, how many of your meals are cooked at home?
- **Question (Family):** In a typical week, how many of your household's meals are cooked at home?
- **Support text:** none
- **Options:** `almost-all` Almost all of them<br>`most` Most of them<br>`half` About half<br>`few` A few<br>`hardly-any` Hardly any
- **Intent:** Decides whether the Report's food suggestions should be recipes, assemblies or choices made elsewhere.
- **Why needed:** Recipe-shaped advice given to someone who cooks twice a week is advice they will not use. This is the single biggest determinant of whether the food section of the Report is usable at all.
- **Report targets:** `foodTools`, `thirtyDayLoop`
- **Applicability:** Always asked (baseline)
- **Free Assessment overlap:** none
- **What deeper information this adds:** n/a — no overlap with the free Assessment

#### `core_environment_who_prepares_v1`

- **Answer field:** `environment.whoPrepares`
- **Type:** single
- **Foundations:** you, family
- **Required:** required (when applicable)
- **Sensitivity:** low
- **Science review:** not-required
- **Question (You):** Who usually decides and prepares the food you eat?
- **Question (Family):** Who usually decides and prepares food in your household?
- **Support text:** none
- **Options:** `me` Mostly me<br>`shared` Shared with someone else (family: Shared between us)<br>`someone-else` Mostly someone else<br>`varies` It varies day to day
- **Intent:** Establishes how much of the Report the reader is actually in a position to act on alone.
- **Why needed:** Telling someone to change what is cooked, when they are not the person cooking, produces a Report about a life they do not have. It also changes what the Report should suggest: a conversation rather than a recipe.
- **Report targets:** `foodTools`, `familyContext`, `thirtyDayLoop`
- **Applicability:** Always asked (baseline)
- **Free Assessment overlap:** none
- **What deeper information this adds:** n/a — no overlap with the free Assessment

#### `core_environment_planning_v1`

- **Answer field:** `environment.planning`
- **Type:** single
- **Foundations:** you, family
- **Required:** required (when applicable)
- **Sensitivity:** low
- **Science review:** not-required
- **Question (You):** How does food usually get into the house?
- **Question (Family):** How does food usually get into your household?
- **Support text:** none
- **Options:** `planned` A planned shop, with a list<br>`regular` A regular shop, without much planning<br>`top-ups` Frequent top-up trips<br>`delivery` Mostly delivery or takeaway<br>`someone-else` Someone else handles it
- **Intent:** Finds the point upstream of the plate where a change is cheapest to make.
- **Why needed:** Most of what someone eats is decided in a shop, not at a meal. A Report that never mentions how food arrives is intervening at the last and hardest possible moment.
- **Report targets:** `foodTools`, `thirtyDayLoop`, `priorityLever`
- **Applicability:** Always asked (baseline)
- **Free Assessment overlap:** none
- **What deeper information this adds:** n/a — no overlap with the free Assessment

#### `core_environment_constraints_v1`

- **Answer field:** `environment.constraints`
- **Type:** multi
- **Foundations:** you, family
- **Required:** required (when applicable)
- **Sensitivity:** medium
- **Science review:** required
- **Question (You):** Is there anything your Report needs to work around?
- **Question (Family):** Is there anything your household's Report needs to work around?
- **Support text:** This is so your Report doesn't suggest something that doesn't suit you.
- **Options:** `allergy` A food allergy<br>`medical-avoid` Foods avoided for medical reasons<br>`vegetarian-vegan` Vegetarian or vegan<br>`religious-cultural` Religious or cultural requirements<br>`budget` A limited food budget<br>`time` Very little time to cook<br>`dislikes` Foods I simply don't like (family: Foods we simply don't like)<br>`none` Nothing in particular **[exclusive]**<br>`prefer-not-to-say` Prefer not to say **[exclusive]**
- **Intent:** The safety and usability boundary for every food the Report suggests.
- **Why needed:** This Report recommends foods, so it has to know what not to recommend. Deliberately framed as what to work AROUND rather than as a medical intake: it asks for no diagnosis, no medication and no detail about a condition — only the constraint itself.
- **Report targets:** `foodTools`, `thirtyDayLoop`, `familyContext`
- **Applicability:** Always asked (baseline)
- **Free Assessment overlap:** none
- **What deeper information this adds:** n/a — no overlap with the free Assessment

#### `core_environment_household_differing_needs_v1`

- **Answer field:** `environment.householdDifferingNeeds`
- **Type:** multi
- **Foundations:** family
- **Required:** required (when applicable)
- **Sensitivity:** medium
- **Science review:** not-required
- **Question (You):** —
- **Question (Family):** Do different people in your household need different things from food?
- **Support text:** none
- **Options:** `tastes` Yes — different tastes<br>`schedules` Yes — different schedules<br>`allergies` Yes — allergies or intolerances<br>`life-stage` Yes — different amounts, or different life stages<br>`same` No — largely the same **[exclusive]**<br>`prefer-not-to-say` Prefer not to say **[exclusive]**
- **Intent:** Captures the conflicting-needs problem that defines most household food systems.
- **Why needed:** Cooking for people who need different things is the hardest part of feeding a household, and a plan that ignores it is a plan for a household of identical people. Asks only THAT needs differ and in what broad way — never what anyone's condition is.
- **Report targets:** `familyContext`, `foodTools`, `thirtyDayLoop`
- **Applicability:** Always asked (baseline)
- **Free Assessment overlap:** none
- **What deeper information this adds:** n/a — no overlap with the free Assessment

#### `core_environment_allergen_detail_v1`

- **Answer field:** `environment.allergenDetail`
- **Type:** multi
- **Foundations:** you, family
- **Required:** optional
- **Sensitivity:** high
- **Science review:** required
- **Question (You):** So your Report doesn't suggest something unsuitable, which of these should it avoid?
- **Question (Family):** So your household's Report doesn't suggest something unsuitable, which of these should it avoid?
- **Support text:** Optional. Whatever you choose, always check labels yourself as well.
- **Options:** `dairy` Milk or dairy<br>`eggs` Eggs<br>`fish-shellfish` Fish or shellfish<br>`nuts` Nuts or peanuts<br>`wheat-gluten` Wheat or gluten<br>`soya` Soya<br>`sesame` Sesame<br>`other` Something not listed here
- **Intent:** Turns a declared constraint into something the food section can mechanically avoid.
- **Why needed:** Only asked of someone who has already said there is an allergy or a medical avoidance, and optional even then. Broad categories rather than free text, because a Report generator cannot reliably parse a sentence, and a mis-parsed allergy is the worst failure this product could have.
- **Report targets:** `foodTools`, `thirtyDayLoop`
- **Applicability:** Only when `core_environment_constraints_v1` includes `allergy` / `medical-avoid`
- **Free Assessment overlap:** none
- **What deeper information this adds:** n/a — no overlap with the free Assessment


### Your Intentions — `intentions`

> What you want from this, and what has made change hard before.

#### `core_intentions_primary_focus_v1`

- **Answer field:** `intentions.primaryFocus`
- **Type:** single
- **Foundations:** you, family
- **Required:** required (when applicable)
- **Sensitivity:** low
- **Science review:** not-required
- **Question (You):** If your Report could help with one thing first, what would it be?
- **Question (Family):** If your household's Report could help with one thing first, what would it be?
- **Support text:** none
- **Options:** `energy` Steadier energy<br>`digestion` More comfortable digestion<br>`focus` Clearer focus<br>`recovery` Better sleep and recovery<br>`consistency` Eating more consistently<br>`variety` More variety in what I eat (family: More variety in what we eat)
- **Intent:** Chooses which of several defensible priorities the Report actually leads with.
- **Why needed:** The assessment can identify several things worth working on. Only the reader can say which one they will actually care about in four weeks, and a Report that leads with the wrong one is read once and closed.
- **Report targets:** `priorityLever`, `systemSnapshot`, `thirtyDayLoop`
- **Applicability:** Always asked (baseline)
- **Free Assessment overlap:** none
- **What deeper information this adds:** n/a — no overlap with the free Assessment

#### `core_intentions_barrier_v1`

- **Answer field:** `intentions.barrier`
- **Type:** single
- **Foundations:** you, family
- **Required:** required (when applicable)
- **Sensitivity:** low
- **Science review:** not-required
- **Question (You):** What has usually made change hard to keep going?
- **Question (Family):** What has usually made change hard for your household to keep going?
- **Support text:** none
- **Options:** `time` Time<br>`cost` Cost<br>`different-needs` Cooking for people with different needs<br>`unclear` Not knowing what to do<br>`fades` It tends to fade after a week or two<br>`none` Nothing in particular has got in the way
- **Intent:** Shapes the 30-day loop around the thing that has actually stopped this person before.
- **Why needed:** Every plan meets the same barrier the last one did. A plan built for someone short of time and a plan built for someone who runs out of momentum look different, and the free Assessment never asks.
- **Report targets:** `thirtyDayLoop`, `priorityLever`, `educationModules`
- **Applicability:** Always asked (baseline)
- **Free Assessment overlap:** none
- **What deeper information this adds:** n/a — no overlap with the free Assessment

#### `core_intentions_success_v1`

- **Answer field:** `intentions.success`
- **Type:** textarea
- **Foundations:** you, family
- **Required:** optional
- **Sensitivity:** medium
- **Science review:** not-required
- **Question (You):** In your own words, what would feel different if this worked?
- **Question (Family):** In your own words, what would feel different for your household if this worked?
- **Support text:** none
- **Options:** free text, max 600 characters
- **Intent:** The one place the customer speaks in their own voice, for the Report's opening and closing.
- **Why needed:** A Report that can quote back what someone actually said is a different object from one assembled entirely from multiple choice. Optional, and the only free-text question in the bank — long-form typing is not the personalisation mechanism.
- **Report targets:** `closingMissionPage`, `systemSnapshot`
- **Applicability:** Always asked (baseline)
- **Free Assessment overlap:** none
- **What deeper information this adds:** n/a — no overlap with the free Assessment

---

## Family-Only / Family-Different Questions

**Family-only (15 questions in the Family bank; these are the ones You never sees):**

- `core_signals_household_mealtime_v1` — how shared meals actually go
- `core_signals_household_hardest_moment_v1` — which part of the day is hardest
- `core_rhythm_household_shared_meals_v1` — how often the household eats together
- `core_rhythm_household_separate_reason_v1` — *(adaptive)* what makes eating together hard
- `core_environment_household_differing_needs_v1` — conflicting needs

**You-only (never asked of a household):**

- `core_signals_post_meal_pattern_v1`
- `core_signals_energy_shape_v1`
- `core_signals_context_v1`
- `core_signals_settled_days_v1`
- `core_rhythm_first_meal_v1`
- `core_rhythm_longest_gap_v1`
- `core_rhythm_antibiotics_v1`

The rule applied: **individual health signals and individual history are never
asked as a household aggregate.** An average of five people's post-meal
comfort describes nobody. Family instead gets household-level questions about
the food system itself — shared meals, mealtime reality, the hardest moment,
shopping, cooking, access, differing needs — which is what a household report
can actually act on.

**Shared with alternate wording:** every question asked of both foundations
carries a `familyText`, and the bank validator fails if one does not. The
Family wording is a genuine household rewrite, not a pluralisation: the tests
assert it differs from the You wording and reads as a household.

---

## Adaptive Modules

Four declared modules, all depth 1 (a branch off a branch is rejected by the
validator). Operators are `equals`, `notEquals` and `includes`, each taking a
value list — there is no AND, no nesting and no expression language.

| Module | Foundation | Trigger | Required? | Sensitivity |
|---|---|---|---|---|
| `core_signals_settled_days_v1` | you | post-meal pattern is anything other than "nothing" / "prefer not to say" | required when applicable | low |
| `core_rhythm_antibiotics_v1` | you | recent change includes "a health event, or a period of recovery" | **optional** | high |
| `core_environment_allergen_detail_v1` | you + family | constraints include an allergy or a medical avoidance | **optional** | high |
| `core_rhythm_household_separate_reason_v1` | family | household eats together "rarely" or "never" | required when applicable | low |

Every trigger is a baseline question, appears earlier in the bank, and lists
only values that trigger question actually offers — all three enforced by
`validateConsultationBank`, so a branch that can never fire (and therefore
looks present in review while being dead) is a build failure.

**Adaptation is bounded.** The resolver may select a module, reveal a declared
branch, omit an irrelevant module, use Family-specific selection and wording,
and append the entitled Lens. It may not adapt safety wording, science claims,
answer schemas, option values, consent, or non-diagnostic framing. There is no
runtime AI adaptation of any kind.

**What it adapts on:** foundation, answers already given inside the
Consultation, and the selected Lens. The context type also carries the Three
Biotics pattern, but **v1 does not adapt on it** — it is there so Phase 3B can
without a contract change. Individual free-Assessment answers are deliberately
NOT an input: the duplication problem they would solve is solved by design (see
below), and carrying fifteen raw health answers through checkout to solve it
would expand sensitive-data transport for no benefit this pack does not
already deliver.

---

## Lens Compatibility

The four deterministic Lens banks (`lib/assessment/addon-questions.ts`) are
**untouched** by Phase 3A. No id renamed, no answer value renamed, no wording
changed, no shared type extracted — a broad refactor across a live paid path is
exactly the risk this phase is supposed to avoid.

Compatibility is established by construction rather than by coupling:

- **Namespaces cannot collide.** A core id must match
  `core_<section>_<concept>_v<n>`; a lens id matches `<addon>_lens<n>`; the
  legacy core ids match `dq<n>`. The bank validator rejects any core id shaped
  like the other two, and a test cross-checks the real lens ids and the real
  legacy ids for disjointness.
- **Entitlement isolation is preserved.** Lens answers are still sanitised by
  `sanitizeLensAnswers` against the entitled add-on. Nothing in this contract
  reads or writes lens answers.
- **The resolver knows about the Lens without owning it.** `ConsultationContext`
  carries `lens`, so a future runtime can append `addonQuestionsFor(lens,
  foundation)` after the core bank. Phase 3A does not do the appending.

Counting the Lens: You reaches at most 21 questions and Family at most
19, both inside the exceptional ceiling of 26.

---

## Question-to-Report Traceability Matrix

Every answer has a declared destination in the frozen report model
(`lib/report/food-system-report-types.ts`). The report-target union is asserted
at compile time to be a subset of `keyof FoodSystemReport`, so this matrix
cannot name a deliverable that does not exist.

| Question | Answer field | Report targets | Required | Sensitivity | Free overlap | Foundations |
|---|---|---|---|---|---|---|
| `core_signals_post_meal_pattern_v1` | `signals.postMealPattern` | bodySignalMap, systemSnapshot | yes | medium | q13 | you |
| `core_signals_energy_shape_v1` | `signals.energyShape` | priorityLever, thirtyDayLoop, bodySignalMap | yes | low | q15 | you |
| `core_signals_context_v1` | `signals.context` | priorityLever, bodySignalMap, thirtyDayLoop | yes | medium | none | you |
| `core_signals_household_mealtime_v1` | `signals.householdMealtime` | familyContext, systemSnapshot, thirtyDayLoop | yes | low | none | family |
| `core_signals_household_hardest_moment_v1` | `signals.householdHardestMoment` | priorityLever, familyContext, thirtyDayLoop | yes | low | none | family |
| `core_signals_settled_days_v1` | `signals.settledDays` | priorityLever, thirtyDayLoop | yes | low | none | you |
| `core_rhythm_first_meal_v1` | `rhythm.firstMeal` | thirtyDayLoop, foodSystemMap, foodTools | yes | low | none | you |
| `core_rhythm_longest_gap_v1` | `rhythm.longestGap` | thirtyDayLoop, priorityLever | yes | low | q12 | you |
| `core_rhythm_household_shared_meals_v1` | `rhythm.householdSharedMeals` | familyContext, thirtyDayLoop, systemSnapshot | yes | low | none | family |
| `core_rhythm_week_shape_v1` | `rhythm.weekShape` | thirtyDayLoop, systemSnapshot | yes | low | q11 | you, family |
| `core_rhythm_recent_change_v1` | `rhythm.recentChange` | systemSnapshot, educationModules, priorityLever | yes | medium | none | you, family |
| `core_rhythm_household_separate_reason_v1` | `rhythm.householdSeparateReason` | familyContext, thirtyDayLoop | yes | low | none | family |
| `core_rhythm_antibiotics_v1` | `rhythm.antibiotics` | educationModules, systemSnapshot | no | high | none | you |
| `core_environment_cooking_frequency_v1` | `environment.cookingFrequency` | foodTools, thirtyDayLoop | yes | low | none | you, family |
| `core_environment_who_prepares_v1` | `environment.whoPrepares` | foodTools, familyContext, thirtyDayLoop | yes | low | none | you, family |
| `core_environment_planning_v1` | `environment.planning` | foodTools, thirtyDayLoop, priorityLever | yes | low | none | you, family |
| `core_environment_constraints_v1` | `environment.constraints` | foodTools, thirtyDayLoop, familyContext | yes | medium | none | you, family |
| `core_environment_household_differing_needs_v1` | `environment.householdDifferingNeeds` | familyContext, foodTools, thirtyDayLoop | yes | medium | none | family |
| `core_environment_allergen_detail_v1` | `environment.allergenDetail` | foodTools, thirtyDayLoop | no | high | none | you, family |
| `core_intentions_primary_focus_v1` | `intentions.primaryFocus` | priorityLever, systemSnapshot, thirtyDayLoop | yes | low | none | you, family |
| `core_intentions_barrier_v1` | `intentions.barrier` | thirtyDayLoop, priorityLever, educationModules | yes | low | none | you, family |
| `core_intentions_success_v1` | `intentions.success` | closingMissionPage, systemSnapshot | no | medium | none | you, family |

---

## Free Assessment Duplication Check

The free Food System Assessment asks q1–q15: plant variety (q1–q3), fibre and
whole foods (q4–q6), fermented foods (q7–q9), overall approach and rhythm
consistency (q10–q12), post-meal feeling, digestive-discomfort frequency and
energy stability (q13–q15).

**Constructs the free Assessment owns outright, and which this bank therefore
does not ask about at all:** plant variety, plant-category spread, intentional
rotation, fibre-rich whole foods, ultra-processed share, prebiotic-rich foods,
fermented-food frequency, fermented variety, fermented intentionality. A test
greps the bank for each of these and fails if one reappears.

**Questions that build deeper on a free construct.** Four, each reviewed
individually. The recurring pattern is that the free Assessment measures HOW
MUCH or HOW OFTEN, and the Consultation needs WHEN, WITH WHAT, or WHAT AROUND
IT — because that is what an action in the Report attaches to.

| New question | Free q | What is genuinely new |
|---|---|---|
| `core_signals_post_meal_pattern_v1` | q13 | q13 rates how someone feels after eating (sluggish→energised). It never says WHICH signal. The Report gets a rating with no subject; this supplies the subject. |
| `core_signals_energy_shape_v1` | q15 | q15 scores how STABLE energy is. This asks WHEN it changes. Two people with the same q15 score — one with a 3pm dip, one with hard mornings — need actions at opposite ends of the day. |
| `core_rhythm_longest_gap_v1` | q12 | q12 asks how OFTEN meals are skipped, rushed or late. This asks how long the gap actually is. "A few times a week" covers both a five-hour gap and a twelve-hour one. |
| `core_rhythm_week_shape_v1` | q11 | q11 scores consistency and mentions weekends inside option text. This asks for the DIRECTION of the difference — including "the weekdays are the unpredictable ones", which q11's scale reads as simply inconsistent. |

**How this is kept honest.** `tests/unit/consultation-question-bank.test.ts`
holds the four ids above in a curated manifest and asserts the bank's declared
overlaps equal it exactly. Adding another question that touches a free construct
requires editing that manifest — which means someone had to think about it. A
text-similarity heuristic was considered and rejected: it would have caught none
of these four and would have flagged several innocent questions.

---

## Sensitive Data Review

Classification is review architecture, not runtime behaviour — nothing branches
on it. Its job is to make a collection decision visible and arguable.

| Question | Sensitivity | Required | Asked of everyone? | Decline path |
|---|---|---|---|---|
| `core_signals_post_meal_pattern_v1` | medium | yes | yes | `nothing`, `prefer-not-to-say` |
| `core_signals_context_v1` | medium | yes | yes | `prefer-not-to-say` |
| `core_rhythm_recent_change_v1` | medium | yes | yes | `none`, `prefer-not-to-say` |
| `core_rhythm_antibiotics_v1` | high | no | no — adaptive | `unsure`, `prefer-not-to-say` |
| `core_environment_constraints_v1` | medium | yes | yes | `none`, `prefer-not-to-say` |
| `core_environment_household_differing_needs_v1` | medium | yes | yes | `same`, `prefer-not-to-say` |
| `core_environment_allergen_detail_v1` | high | no | no — adaptive | skip (optional) |
| `core_intentions_success_v1` | medium | no | yes | skip (optional) |

Rules the bank holds to, each asserted by a test:

- **Every `high`-sensitivity question is optional.** No exceptions.
- **Every `high`-sensitivity question is adaptive** — nobody is asked about
  antibiotics or allergens as a matter of course.
- **Every sensitive question offers a way to decline.** A question someone
  cannot decline is a judgement of its own. On `multi` questions the decline
  option is flagged `exclusive`, so "prefer not to say" cannot be recorded
  alongside three disclosures.

**Two `medium`/required judgements worth challenging.**
`core_rhythm_recent_change_v1` and `core_environment_constraints_v1` are
required. The position taken is that "required" costs one tap rather than a
disclosure, because both offer `none` and `prefer-not-to-say` as exclusive
options — and constraints in particular is the safety boundary for a Report
that recommends food. If the reviewer disagrees, making either optional is a
one-line change with no structural consequence.

**Deliberately not collected:** medication names, diagnoses, conditions, family
medical history, lab values, blood glucose, HbA1c, blood pressure, weight or
weight targets, stool detail, clinical mental-health screening, eating-disorder
screening. A test greps the whole bank for each.

---

## Postbiotics Boundary Review

EatoBiotics does not measure postbiotic preparations, metabolites, microbial
products, postbiotic production, or clinical adequacy. Self-reported rhythm,
digestive comfort, energy, recovery and food reactions are **reported patterns
and context only**. They do not quantify Postbiotics.

The bank holds this boundary in the strongest available way: **no
customer-facing string in the new bank contains the words *prebiotics*,
*probiotics*, *postbiotics*, *microbiome*, *microbial*, *microbes*, *gut
bacteria*, *metabolite*, *diversity* or *measure* at all.** Not in a claim, not
in a disclaimer, not in an option label. `tests/unit/consultation-language-safety.test.ts`
enforces it, and the same test proves each matcher fires on real violating
sentences.

That absoluteness is a design choice worth stating: it means the bank cannot
carry even a *negative* clinical disclaimer ("this is not a diagnosis"). Such
disclaimers belong in the Phase 3B UI chrome, where the Stability module
already puts them (`components/stability/MedicalDisclaimer.tsx`), and in the
report's fixed `SAFETY_FOOTER`. Keeping clinical vocabulary out of the question
data entirely is what lets the guard be exception-free — and an exception-free
guard is one nobody can quietly widen later.

### Legacy fallback bank — science-risk inventory

`FALLBACK_DEEP_QUESTIONS` (`lib/deep-assessment.ts`) is **unchanged by Phase
3A** and is still live. It is inventoried here because the new bank had to be
checked against it, and because whoever activates Phase 3B will need this list.
Every line below is current customer-facing `eduContext` in that file:

| Legacy question | Wording | Risk |
|---|---|---|
| `dq1` | "These symptoms are your gut's way of communicating — each one points to a specific imbalance." | Claims a symptom identifies a specific imbalance. Also frames the list as symptoms. |
| `dq3` | "Food sensitivity patterns are a key indicator of microbiome composition." | Claims self-reported reactions indicate microbiome composition. |
| `dq4` | "Antibiotics can reduce microbial diversity significantly — rebuilding after a course is one of the highest-impact gut interventions." | Unqualified magnitude claim plus "interventions". |
| `dq7` | "Chronic stress directly suppresses digestive enzyme output and gut motility." | Direct-mechanism claim. |
| `dq8` | "Sleep is when your gut repairs its lining and your microbiome resets its rhythm." | Direct-mechanism claim. |
| `dq9` | "Regular movement directly increases microbiome diversity by promoting gut motility." | Direct-mechanism claim. |
| `dq11` | "Your goal shapes the entire protocol we build for you." | "Protocol" in a clinical sense. |

**None of this language appears in the new bank**, and the language-safety test
uses several of these exact sentences as its non-vacuity fixtures — so the guard
is demonstrably capable of catching them if they were ever copied across.
Cleaning up or retiring the legacy bank is deliberate later work, not Phase 3A.

---

## Requires Human Science Review

Nothing in this bank has been reviewed by a qualified human. No question is
marked `reviewed`, and a test fails if one ever is without a human actually
having done it.

**REQUIRES SCIENCE REVIEW** — wording that touches health-adjacent territory and
needs external sign-off before Phase 3B activation:

- `core_signals_post_meal_pattern_v1` — When you notice something after eating, what do you tend to notice first?
- `core_signals_energy_shape_v1` — Which of these best describes the shape of your energy on a typical day?
- `core_signals_context_v1` — On the days you notice it most, which of these are usually also true?
- `core_signals_settled_days_v1` — On the days things feel more settled, what is usually different?
- `core_rhythm_antibiotics_v1` — In the last two years, have you had a course of antibiotics?
- `core_environment_constraints_v1` — Is there anything your Report needs to work around?
- `core_environment_allergen_detail_v1` — So your Report doesn't suggest something unsuitable, which of these should it avoid?

**REQUIRES PRODUCT DECISION** — open questions for the reviewer, not for a
scientist:

- `core_environment_allergen_detail_v1` offers "Something not listed here" with
  no follow-up text field, so the Report does not learn what that something is.
  The alternative (free text) cannot be reliably parsed by a report generator,
  and a mis-parsed allergy is the worst failure this product could have. The
  current position is: broad categories only, plus "always check labels
  yourself" in the support line. Phase 4A should decide whether the Report also
  needs a standing "check anything new against your own known allergies" line.
- Whether `core_rhythm_recent_change_v1` and `core_environment_constraints_v1`
  should be optional rather than required (see Sensitive Data Review).
- Whether the adaptive count should be raised above 0–3 (see Question Count).

**LOW-RISK PRODUCT WORDING** — everything else. Cooking frequency, shopping,
who prepares food, meal timing, weekend shape, intentions and barriers make no
scientific claim of any kind.

---

## Questions Considered But Rejected

Recording what we chose *not* to collect is as much a part of the design as
what is here. These are genuine decisions taken while building the bank, not a
list assembled to populate a section.

| Considered | Decision | Reason |
|---|---|---|
| Medication names | **Rejected** | The Report cannot act on them, and collecting drug names turns a food questionnaire into a medical intake. |
| Diagnosis / condition collection | **Rejected** | Non-diagnostic by construction. `core_environment_constraints_v1` asks what to work *around* — which is what the Report actually needs — without asking what anyone has. |
| Detailed family medical history | **Rejected** | No Report target. Nothing in the product could use it. |
| Stool detail / Bristol-type screening | **Rejected** | Reads as clinical screening, and the Report makes no claim it could support. |
| Detailed antibiotic course history (how many, which, how long) | **Rejected** | The retained question asks only "recent / longer ago / no", optional, behind a trigger. Course detail adds sensitivity without adding a Report action. |
| HbA1c, blood glucose, blood pressure, cholesterol | **Rejected** | The product measures nothing clinical and must not ask as though it interprets a lab value. |
| Weight, goal weight, BMI | **Rejected** | No Report target, and a well-known harm surface. |
| Eating-disorder screening | **Rejected** | Genuinely important and genuinely outside what an educational food product may do. Belongs with a qualified professional. |
| Clinical mental-health screening (anxiety, depression) | **Rejected** | Same. The Mind Lens deliberately asks about routine and what someone notices, never about diagnosis. |
| Frequency of digestive discomfort | **Rejected** | The free Assessment already asks it (q14). Asking again is not depth. |
| A second plant-variety / fermented-foods question | **Rejected** | q1–q9's entire job. |
| "What kind of first step tends to work for you?" | **Deferred** | A good question that lost to `core_intentions_barrier_v1`, which reaches the same 30-day-loop decision while also collecting what has actually stopped this person. Keeping both would have pushed Intentions past its 2–3 target for no new Report action. |
| "How often do you eat away from home?" | **Deferred** | Substantially covered by `core_environment_cooking_frequency_v1`. Worth revisiting if the Report's food section proves it needs it separately. |
| A slider question | **Rejected for v1** | Nothing in v1 is genuinely a magnitude, and adding one to exercise the type would inflate the bank. The contract and validator support sliders (including "no implicit default") for future banks. |
| A `yesno` question type | **Rejected** | The legacy schema has it, but a two-option `single` carries the same information with one fewer branch in every validator, renderer and report reader. Legacy yes/no questions exist only to hang a `followUp` off, which declared applicability replaces. |
| Household versions of individual health signals | **Rejected** | Pluralising "how do you feel after eating" into a household aggregate produces a number describing nobody. See Family-Only above. |

---

## What Phase 3A Deliberately Does Not Do

- Does not change `/assessment/deep`, its client, its question component, the
  generation route, the save route or the submission route.
- Does not activate the bank for any session, new or existing.
- Does not migrate, regenerate or touch legacy `dq*` sessions.
- Does not add a migration, a column, or any schema change.
- Does not redesign the Report generator or Phase 4A architecture.
- Does not delete the legacy AI generation path or the fallback bank.
- Does not add Orientation, Back, Review, progress, save feedback, icons or any
  other UI — those are Phase 3B/3C, and they will consume this contract.
