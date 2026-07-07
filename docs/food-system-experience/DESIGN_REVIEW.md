# Design Review — the four uploaded concepts

A working review of the supplied mockups. They are **inspiration, not spec**: this document
extracts what to keep, what to cut, and where we can go further than the mockups do.

The four boards reviewed:

1. **Account page — 3 variations** (light sidebar app · dark hero app · full-bleed cinematic hero)
2. **Your Food System — split landing** (dark hero left, "Right Now" + "Last Meal Impact" rails)
3. **Your Food System + Today split** (light hero, "How it works" cycle, "See it in action" strip,
   mobile-ish Today column with Meal impact panel)
4. **Your Food System — full landing** (dark hero with orbit labels, What is / How it works /
   See it in action / From the inside out / vision bar)

---

## 1 · What works (adopt)

**The body is the interface.** Every board leads with the glowing figure, not a chart. The
digestive tract is the brightest element, energy pathways radiate outward, and the whole figure
reads as *alive*. This is exactly our product thesis and our existing `TwinStage` already renders
this language (dark stage, orb figure, aura, constellation). → Keep the stage as the account's
first screen; make it the venue for every meal moment.

**Status chips orbiting the figure** (Mind Clear · Energy Good · Gut Balanced · Immunity Strong ·
Sleep Restorative · Inflammation Low). They translate sub-scores into *states in plain words*
anchored to body regions — data becomes anatomy. We already have `SYSTEM_HOTSPOTS`
(`lib/account/system-map.ts`) doing the anchoring; the chips give us the wording model.

**"Last Meal Impact" response bars** (board 2, right rail): per-dimension bars — Prebiotics
"Great boost", Probiotics "Good boost", Inflammation "Low impact". This is the single best
educational device in the set: *the meal graded along the body's own dimensions*. Our
`mealImpact()` engine (`lib/account/meal-impact.ts`) already computes exactly these rows. → This
becomes the right-hand side of the on-stage Meal Reveal.

**"See your Food System respond" journey strip** (You ate Kefir → It enters → Microbes feed →
Postbiotics made → Body benefits). A five-beat biology lesson with zero reading burden. We have
`AFTER_MEAL_STEPS` (`lib/account/evolution.ts`) — same idea, keep the compact horizontal form.

**"See it in action" reaction cards** (Kefir / Beans / Berries / Poor sleep / Ultra-processed /
Consistent meals, each with a body silhouette whose pathway glows or dims). The teach-by-contrast
device — including the *negative* cases — is what makes the biology stick. Notably it teaches the
same colour language the member later sees on their own reveal.

**Greeting + one-line system status** ("Good afternoon, Sarah — Your Food System is learning,
adapting and getting stronger · last updated 10 min ago"). The system speaks about itself in one
sentence before any number appears. Cheap to build, huge for the "living organism" feeling.

**"What changed today" as sentences with arrows** (Fibre diversity *Improved* ↑, Energy rhythm
*Slight dip* ↓). Changes, not levels — the daily return loop in one row.

**Journey rail with milestones** (Day 46 · Baseline → First meal → Fibre habit → Score improving).
Progress as a story with named beats, not a line chart. Our `lib/account/milestones.ts` +
`Journey` component already model this.

**The inside-out closer** (You → Family → Community → County → Country → The Food System). The
brand's biggest idea, and we already have it animated (`InsideOutEmbed`). Every board ends on it —
so should our pages.

**Dark hero, light body.** Boards use immersive dark *sections* (the biology) over a white/cream
page (the actions). Matches our existing rule; keep it. Variation 3's full-dark app frame is the
one to avoid — Jason's direction says "never become an all-dark interface".

---

## 2 · What doesn't work (cut or fix)

**Score-number overload.** Board 1's dark variation shows *eight* numbers above the fold
(62/100, +4, then 71·58·40·68·28·62 chips), then repeats "This week's score 64" further down —
three scoring systems per screen. Numbers without sentences are exactly what the brief bans
("Never just 72, 74, 61 — explain WHY"). → One hero score with delta + trend; every other number
must arrive *inside a sentence* or on demand.

**Dashboard-y stat tiles.** The 6-tile biotics strip (board 1) is MyFitnessPal thinking — a row
of gauges. The same data lands better as the orbit chips (words anchored to the body) or the
response bars (graded, explained). → No bare gauge rows on the redesigned Overview.

**Repetition across modules.** The sub-score list appears three times on board 2 (hero panel,
"Right Now" chips, bottom ring panel). Each screen should say a thing once, in its best form.

**The sidebar app-shell** (board 1, variation 1). It reframes the product as *software with
navigation* rather than *a living system you enter*, and it duplicates our existing header +
dashboard tabs. → Keep our current top-nav + in-page chapters; no sidebar.

**Stock-photo food imagery inside action cards** (berry bowls). Pretty, but it pulls toward
recipe-app aesthetics and is a content-ops burden. Our illustrated/iconographic language plus the
figure's own glow states carries more meaning per pixel. → Use imagery sparingly; prefer the
body reacting.

**"Powered by your Food System Digital Twin" card** (board 4). Correct instinct (trust), wrong
prominence — the technology should disappear into the background. We already have `/method` for
the how-it-works trust story; a single quiet link suffices.

**Fake precision.** "Next update in 2h 15m", "Learning in real time" badges — promises the
backend doesn't make. Keep honesty: "last updated Xh ago" from real data only.

---

## 3 · Strongest ideas (ranked)

1. **Meal → visible body response** (impact bars + lit pathways). The core loop; builds Phase 1.
2. **Status chips around the figure** — sub-scores as anatomy in plain words.
3. **See-it-in-action contrast cards** — teach the colour language before members live it.
4. **Greeting + system self-status line** — the organism speaks first.
5. **"What changed today" sentence chips** — the daily curiosity loop.
6. **Journey rail with named milestones** — progress as narrative.

## 4 · Weakest ideas

1. Six-gauge biotic tile rows (data overload, no teaching).
2. Sidebar app shell (software, not organism).
3. Triple-repeated score modules per screen.
4. All-dark app frame (variation 2/3 of board 1).
5. Countdown/real-time badges the system can't honour.

## 5 · Opportunities beyond the mockups

- **The reveal is a moment, not a panel.** The mockups show meal impact as a *static card*; we
  can play it as a choreographed sequence ON the stage — nodes lighting on the figure in sync
  with rows appearing on the right. No mockup does this; it's our biggest differentiator.
- **The figure remembers.** Aura tint, evolution rings and mood already respond to streaks and
  score (`lib/account/stage-mood.ts`, `evolution.ts`) — the mockups' figure is static art.
- **One canvas, chaptered.** The mockups still stack cards; we can make the Overview read as one
  continuous surface (dark stage → gradient bridge → cream canvas → chapters) so it stops feeling
  like "a few pages stuck together".
- **Everything already has a data source.** Every adopted device maps to an existing lib —
  `mealImpact`, `SYSTEM_HOTSPOTS`, `AFTER_MEAL_STEPS`, `milestones`, `patterns`, the twin feed —
  so the redesign is presentation-only, exactly as the technical direction requires.
