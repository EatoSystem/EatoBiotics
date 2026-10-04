# EatoBiotics Experience Audit v1 — the synthesis

**Experience 0, step 8. The audit is frozen here.**

Seven steps of evidence: five per-surface audits, a **24-entry** debt register,
and a 234-row capture manifest across four surfaces. This document inspects
nothing new. Its job is to turn that evidence into one product architecture, one
remediation sequence and one roadmap.

| | |
|---|---|
| branch | `claude/eatobiotics-experience-audit`, from the frozen Gate 6.1 head `71aa9fd` |
| steps | `496fa76` · `12b0ed8` · `81bf323` · `38ab8af` · `cd4722c` · `c995bca` · `ce828ca` · `e7f9600` |
| **tested audit head** | **`5274e03`** — the full gate is recorded in [`AUDIT_BASELINE.md` §10](./AUDIT_BASELINE.md) |
| evidence | 234 manifest rows · 101 committed citations · 133 archive-only |
| findings | **16 P0 · 3 P1 · 2 P2 · 3 notes = 24**, plus `RESP-ACCOUNT-01` (named inside `NOTE-CAPTURE-01`, deliberately not entered separately) |

The audit's own standard, which decided several conclusions against my first
reading of them:

> **Source inspection establishes possibility. Rendered evidence establishes
> reachability.**

---

## 1 · The four generations, resolved

The baseline anticipated three and found four. Seven steps later the count holds
and the ranking does not reduce to *old bad, new good* — the evidence refuses
that reading in both directions.

### Generation 1 — Account / legacy dashboard

| | |
|---|---|
| product model | **show everything we know.** One 2,609-line component, five tabs, every fact the system holds rendered at once |
| useful capabilities | meal history, reports list, consultations, subscription management, referral — all genuinely needed |
| visual value | **high.** The score cockpit, the card and gradient system and the overall ambition of the surface. The single most ambitious piece on `/account` — the Twin stage and figure — is **Generation 3's**, rendered above it; see `P0-ARCH-01` |
| claims debt | **six of the sixteen P0s** — `P0-TRUST-01` fabricated meals · `P0-TRUST-02` fabricated attributed quotation · `P0-TRUST-03` fabricated personal conclusion · `P0-SCIENCE-01/02/03` personal Biotic scoring in language, in rings and in prose with a mechanism |
| destination | **Account keeps infrastructure. Everything else moves or retires.** |

### Generation 2 — Assessment / Results

| | |
|---|---|
| product model | **measure, then explain at length.** 16 scored questions, one per screen, then a 13-block 6,313px result |
| useful capabilities | the question flow itself: native radio semantics, explicit Continue, `localStorage` resume, a working age gate, explicit health-data consent |
| visual value | calm and correct; *"would not look out of place inside Generation 4"* |
| claims debt | one P0 (`P0-TRUST-04`) and one P1 (`P1-FUNNEL-01`), plus the corpus gap |
| destination | **the questions survive almost intact. Results does not.** |

**The split inside this generation is the finding.** The instrument already
speaks Generation 4's language; only the result falls back toward Generation 1.

### Generation 3 — Digital Twin / Living Body

| | |
|---|---|
| product model | **a living thing that knows you.** First-person voice, an evolution ladder, an anatomical figure that responds |
| useful capabilities | the daily ritual and 7-day rhythm bar · the evolution ladder (derived, honest) · the learning feed · the after-meal education (hedged, accurate) · the hotspot education (structurally carries no personal state) |
| visual value | high, and genuinely cinematic |
| claims debt | three P0s, two of them forms no earlier repair anticipated — a **colour** encoding a Biotic verdict, and an **anatomical light** asserting a bodily reaction to a checkbox |
| destination | **retired as an architecture; four capabilities move into Generation 4** |

It is **not** abandoned experimentation. It is live, coherent and carefully
built, and it is still retired — because every job it does, Generation 4 does
more honestly, except one, and that one does not need a Digital Twin.

### Generation 4 — My Food System

| | |
|---|---|
| product model | **seven persistent areas, and refuse what cannot be proved.** 2,256 lines across 13 files; Today is 164 |
| useful capabilities | the seven areas, versioned provenance, `canCompare` as the single comparison authority, refusal as a first-class state |
| visual value | **competent, and not finished.** Step 4 awarded it the product-architecture north star and explicitly declined the visual one |
| claims debt | **none at P0.** One P2 (`P2-FSS-ARCH-01`), recorded as forward-looking architectural risk and proved clean by import closure |
| destination | **the product** |

> Generation 4 earns the product-architecture north star **because of
> truthfulness and deterministic behaviour, not because its present visual
> design is finished.**

### The finding that explains why `/account` feels accumulated

`P0-ARCH-01`: Generations 1 and 3 are not neighbours. They are **stacked** —
the Twin gate above, the legacy dashboard beneath, in one destination. And the
gate is satisfied by *having completed the free assessment*, so this is what
essentially every member sees.

```
/account  ─┬─ Generation 3   TodayStrip · TwinStage · DailyRitual · learning feed
           │                 InsideYouTeaser · AskTwin · SystemsExplorer
           └─ Generation 1   score cards · Biotics profile · meals · weekly report
                             monthly focus · analysis · reports · consultations
```

**Two product concepts, one scroll, no boundary.** That is the architectural
diagnosis the step-2 corpus could not see, because every fixture state before
step 6 passed `twin: null`.

### Where the sixteen P0s actually sit

Counted once each, so no finding is attributed to two generations. The stacking
above is exactly why that was easy to get wrong, and why this table exists.

| | P0s | |
|---|---|---|
| **Gen 1 — Account** | **6** | `TRUST-01` · `TRUST-02` · `TRUST-03` · `SCIENCE-01` · `SCIENCE-02` · `SCIENCE-03` |
| **Gen 2 — Results** | **1** | `TRUST-04` |
| **Gen 3 — Twin** | **3** | `SCIENCE-04` · `SCIENCE-05` · `TRUST-05` |
| **Reports** | **3** | `SCIENCE-06` · `SCIENCE-07` · `SCIENCE-08` |
| **Test corpus** | **2** | `GUARD-01` · `GUARD-02` |
| **Architecture / coverage** | **1** | `ARCH-01` — about the **stacking itself**, belonging to neither generation alone |
| | **16** | |

**Generation 4 carries none.**

---

## 2 · The future product architecture

The emerging model is **confirmed**, with one amendment and one addition.

```
DISCOVER      Assessment          the instrument. Asks, scores, hands off.
                   │
                   ▼
PERSIST       My Food System      the product. One system, seven areas.
              ├── Today           acts            — what matters today, and one action
              ├── Score           measures        — the Biotics Score™ and its provenance
              ├── My Food         describes       — what the answers described
              ├── Biotics         explains        — the science, never personalised
              ├── My Plan         directs         — the persisted plan
              ├── Progress        learns          — change over time, under canCompare
              └── Learn           teaches         — reviewed education
                   │
                   ▼
REFLECT       Report              a versioned editorial snapshot, periodically
                   │
RUN           Account             infrastructure: identity, billing, data, export
```

**Amendment: Today, Progress and Learn are areas of My Food System, not peers of
it.** The brief's list reads as seven top-level things; the product already has
them as seven areas inside one system (`SECTION_ORDER`), and that nesting is what
makes "one system, many views" true rather than aspirational.

**Addition: each area is defined by what it refuses**, not only by what it owns.
That is the property that distinguishes this architecture from Generation 1's,
and the table above states it in the second column.

### The Digital Twin has no unique job

Tested, as instructed, against the model:

| Twin capability | already owned by |
|---|---|
| daily check-in and streak | `today` |
| score, momentum, sparkline | `score` |
| three Biotic bars | `biotics` — which refuses to personalise |
| next best action | `my-plan` |
| evolution ladder, learning feed | `progress` |
| after-meal education, hotspots | `learn` |
| the body figure as personal state | **nothing — and nothing should** |

**One job was unique: the daily habit loop.** It is real, it is valuable, and it
is roughly 190 lines of `daily-ritual.tsx` plus an evolution ladder. It does not
require a Digital Twin, and it moves.

> **Generation 3 does not survive as a parallel persistent product.** Preserve
> the value; do not preserve the architecture that happened to contain it.

---

## 3 · The Assessment handoff

> **The handoff is an instrument change before it is an interface change.**

### What the free instrument collects

`lib/assessment-data.ts` is **16 scored questions and nothing else.**

### What establishing a Food System requires

| input class | where it exists | in the free assessment? |
|---|---|---|
| scored domain answers | `lib/assessment-data.ts` | **yes** |
| **What You Notice** | paid deep assessment · FSS-v1 | **no** |
| **Food Context** (`ReportedContext.limiting`) | paid deep assessment · FSS-v1 | **no** |

Named from the code, **not inferred**. Generation 4's plan is
constraint-filtered by `ReportedContext.limiting` — with no context there is
nothing to filter against, and the product would be **inventing** a plan rather
than deriving one. That is precisely what Generation 1 was found doing.

### The future journey, as hypothesis

```
Assessment → concise reveal → complete establishment inputs
           → establish My Food System → Today
```

Three of thirteen Results blocks belong in the reveal: **the score, one line of
meaning, one action.** The other ten have homes among the seven areas or in a
Report.

> **Do not manufacture What You Notice or Food Context, and do not infer them
> from scored answers.** Either the free instrument gains the observation and
> context models, or what it establishes is a score and not a Food System.

---

## 4 · The future Report job

> **The Report is a versioned, keepable editorial snapshot of the person's
> observable Food System at a meaningful point in time, grounded in
> deterministic product truth.**

Confirmed. Not a dashboard, not an action centre, not a second copy of the seven
areas.

### What it answers

Six questions, all of which reward deliberate reading and none of which a live
surface should answer between updates:

1. Where was my observable food system at this assessment?
2. What changed since the previous **comparable** assessment?
3. Which patterns matter enough to understand?
4. What did I actually do?
5. What might I consider next?
6. What science explains this — **within reviewed claim boundaries**?

### The test that keeps it from becoming a second My Food System

> **Anything a person needs *between* Reports belongs in the seven areas, not in
> the document.** A Report that answers "what should I do today" has stopped
> being a Report.

### Two architectural hypotheses, recorded and not built

**Binding.** A historical Report should bind to explicit `systemId` /
`assessmentId` / methodology provenance / `CONTENT_PACK_VERSION` / report
version, rather than silently rendering whatever is current when someone reopens
it. The machinery exists — `consultation_reports` already stores canonical bytes
with a SHA-256 and is write-once — and this hypothesis says the *reader* must
follow the same discipline as the writer.

**Release shape.** Future Report content ships as **reviewed capabilities, one
gate at a time**, not as one rewritten document.
`lib/report/deterministic/capabilities.ts` already models exactly this:
`specificFoods` waits on a dietitian and an EU allergen taxonomy,
`bioticsLanguage` on Irish/EU health-claims law, `safetyNetting` on GP/dietetic
sign-off. `reportCapabilityEnabled` takes no parameters *"by construction"*.

### Why this is tractable

The canonical renderer **already looks like a publication** — dark serif cover
band, one idea per block, no charts, no rings, no score. EatoBiotics does not
need a third Report UI architecture. It needs content that has earned the right
to exist, and three professional reviews.

> **The legacy Report is useful and cannot prove what it says. The canonical
> Report can prove everything it says and is not yet useful.**

---

## 5 · The master disposition map

Consolidated from the five per-step maps. Every row has **exactly one**
destination, or it is a RETIRE.

### Generation 1 — Account

| capability | disposition | destination |
|---|---|---|
| Identity, login, email | **KEEP** | Account |
| Subscription + Stripe portal | **KEEP** | Account |
| Data export, deletion | **KEEP** | Account |
| Referral system | **KEEP** | Account |
| Meal history | **MOVE** | My Food |
| Meal analysis entry | **MOVE** | Today |
| Reports list | **MOVE** | Report index |
| Consultations list | **MOVE** | Account |
| Score cards (×3 renderings) | **MERGE** → one | Score |
| "Your Biotics Profile" rings | **RETIRE** — `P0-SCIENCE-02` | — |
| Per-Biotic meal bars | **RETIRE** — `P0-SCIENCE-01` | — |
| "Your Focus Today" | **RETIRE** — `P0-TRUST-03` | — |
| "This month's focus" | **RETIRE** — `P0-SCIENCE-03` | — |
| Weekly report pull-quote | **RETIRE** — `P0-TRUST-02` | — |
| `MOCK_MEALS` fallback | **RETIRE** — `P0-TRUST-01` | — |
| Gut trend / plants-this-week | **EVOLVE** | Progress |
| Retest countdown | **MOVE** | Progress |
| Systems explorer grid | **EVOLVE** — "Coming soon", no dead links | Learn |

### Generation 2 — Assessment and Results

| capability | disposition | destination |
|---|---|---|
| The 16-question flow | **KEEP** | Assessment |
| Lead form + consent + age gate | **EVOLVE** — later in the flow | Assessment |
| Score reveal | **KEEP** | immediate reveal |
| Profile narrative | **EVOLVE** — one line | Score |
| Three Biotics cards | **MOVE** | Biotics |
| Strongest / exploring ranking | **RETIRE** — `P0-TRUST-04`, D1 | — |
| One free action | **KEEP** | immediate reveal |
| Share card | **MOVE** | a later moment |
| Second score card | **MERGE** into the reveal | — |
| Research opt-in | **MOVE** | Account |
| €49 CTA | **MOVE** | a considered offer surface |
| "A few more ideas" | **MOVE** | My Plan |
| Save results / sign-in error | **EVOLVE** — not inside the reveal | Account |
| Four add-on CTAs | **RETIRE** until the routes exist — `P1-FUNNEL-01` | — |
| Retake | **MOVE** | Today |

### Generation 3 — Digital Twin

| capability | disposition | destination |
|---|---|---|
| Daily ritual + rhythm bar | **MOVE**, minus asserted effects and body coordinates | Today |
| Greeting · streak · add meal | **MERGE** | Today |
| Evolution ladder | **MOVE** | Progress |
| Learning feed | **EVOLVE** — must route through `canCompare` | Progress |
| After-meal journey | **MOVE** | Learn |
| Hotspot education | **MOVE** — already clean | Learn |
| 14-day sparkline | **MERGE** | Score |
| Next best action + "I did this" | **MERGE** | My Plan |
| First-meal checklist | **EVOLVE** — wrong voice | Today, first run |
| Ask-Twin action/meal prompts | **KEEP** | My Plan |
| Ask-Twin Biotic prompt | **RETIRE** — `P0-TRUST-05` | — |
| Body figure as personal state | **RETIRE** — `P0-SCIENCE-04/05` | — |
| Body figure as illustration | **EVOLVE** — carrying no member data | Learn |
| Three Biotic bars | **RETIRE** | — |
| Inside You teaser → `/account/twin` | **RETIRE the link** — `P1-FUNNEL-02` | — |
| Meal reveal · impact · reaction · week story · share | **HOLD** — reachable, unrendered; audit before any port | — |
| The refused eight | **RETIRE** | — |

### Reports

| capability | disposition | destination |
|---|---|---|
| "What you told us" | **KEEP** — the most honest block in either document | Report |
| The person's own words, quoted | **KEEP** | Report |
| PDF delivery | **KEEP** | Report |
| Membership CTA | **KEEP** | Report close |
| 12 foods | **EVOLVE** — drop "ranked for your profile" | Report |
| Mechanistic food claims | **EVOLVE** — pending review, `P0-SCIENCE-08` | Report / Learn |
| 5 swaps | **MOVE** | My Plan |
| 30-day plan | **MOVE** | My Plan |
| Retest date | **MOVE** | Progress |
| Pathway ranking | **RETIRE** — `P0-SCIENCE-06`, D1 | — |
| Per-Biotic /100 scores | **RETIRE** — `P0-SCIENCE-07` | — |
| Feed/Seed/**Heal** tags | **REMEDIATE** — `P1-VOCAB-01` | — |
| Premium add-on CTAs | **RETIRE** — they sell retired tiers | — |
| Add-on lens chapters | **HOLD** — products not currently sold | — |
| `demo-report.tsx` + four refused pages | **RETIRE** | — |

### Generation 4 — My Food System

Every area **KEEPS**. The seven are the destination column above.

---

## 6 · Experience 0R

Specified in full in
[`EXPERIENCE_0R_REMEDIATION_SPEC.md`](./EXPERIENCE_0R_REMEDIATION_SPEC.md) —
16 P0s and 3 P1s, each with reachability, the governing rule, the proposed
behaviour, the guard that should initially turn red, and a close criterion.

**It is mandatory before any visual redesign**, and it is specified, not begun.

---

## 7 · Experience 1–5, re-sequenced

Recorded in [`AUDIT_BASELINE.md`](./AUDIT_BASELINE.md). The sequence is
**re-derived from the audit**, not preserved because it was written first.

---

## 8 · Design-system synthesis

Delivered as [`DOCUMENTATION_MAP.md`](./DOCUMENTATION_MAP.md).

**One open question is carried forward rather than answered.** The measured
**66 CSS custom properties · 616 hardcoded hex values · 2,472 inline styles**
has been held since the baseline and is **not diagnosed here.** The four-way
question it poses — intentional one-off visual work · a duplicated design
decision · legacy styling · genuine token-system failure — is redesign input, and
0R precedes redesign. It is assigned to **Experience 5**.

**No `UI_PATTERN_INVENTORY` and no `VISUAL_TOKENS_AUDIT` were produced.** Both
were named at Experience 0 kickoff and are deliberately not built: the audit
found that the decisive problems are claims and product architecture, and a
variant census would have been the kind of work that looks thorough and changes
nothing. Said here rather than left looking forgotten.

---

## 9 · The artifact close

Delivered as [`audit/ARCHIVE.md`](./audit/ARCHIVE.md).

---

## 10 · The final verdict — what should EatoBiotics become?

**A food-system instrument with a persistent product around it, and an editorial
publication beside it — where every sentence on every surface can be traced to
something the product actually observed.**

| | |
|---|---|
| **Product model** | One Food System per person, established by an instrument, persisted with versioned provenance, acted on daily, compared only when comparison is permitted, and explained by reviewed education |
| **Information architecture** | Seven areas inside one system — `today · score · my-food · biotics · my-plan · progress · learn` — each defined by what it refuses as much as what it owns |
| **Assessment** | **Discovers.** The instrument. It must gain What You Notice and Food Context, or it establishes a score rather than a Food System |
| **My Food System** | **The product.** Everything a person returns to |
| **Report** | **Reflects.** A versioned, keepable editorial snapshot, bound to the system and provenance it describes, released as reviewed capabilities |
| **Account** | **Infrastructure.** Identity, billing, data, export — and nothing that claims anything about the person |
| **Digital Twin** | **Retired as an architecture.** Four capabilities move; the body survives as illustration carrying no member data |
| **Visual ambition** | **Scientific clarity with editorial beauty** |

### The two sentences that carry the programme

> **Bring Generation 1's visual ambition to Generation 4's truthfulness — not
> Generation 1's product model.**

> **The strongest parts of EatoBiotics are emerging where the software says less
> but can prove everything it says. The goal is not sparseness — it is richness
> without speculation.**

### What the audit actually discovered

Not that the interface needs restyling.

> **EatoBiotics already contains most of the ingredients of the future product.
> They are spread across four generations of thinking, and the work is not to
> redesign them independently but to assemble the best of them into one.**

The visual ambition exists — in Generation 1. The habit loop exists — in
Generation 3. The honest instrument exists — in Generation 2's questions. The
architecture that can hold all of it exists — in Generation 4. And the editorial
Report that can prove what it says exists — in the canonical renderer, waiting on
content and three professional reviews.

What is missing is not invention. It is **assembly, and the integrity work that
has to come first.**

---

**Experience 0 is frozen here. Experience 0R is specified and not begun.**
