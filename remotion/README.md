# EatoBiotics — Remotion video engine

A **self-contained [Remotion](https://www.remotion.dev) workspace** that is the
foundation of the EatoBiotics **video engine** — branded video content built from
shared brand tokens and reusable components.

Product strategy this engine supports: **Brand → Assessment → Meal → Score →
Share → Membership.**

> **Isolated from the main app.** This workspace has its **own** `package.json`,
> `node_modules`, `tsconfig.json` and ESLint config. It is **not** part of the
> Next.js website build — none of its dependencies are installed in the root app,
> and the root `tsc`/ESLint/`next build` explicitly exclude `/remotion`. You can
> develop, render, and delete video work here without touching the website.

## Prerequisites

- Node.js 18+
- Install once:

```bash
cd remotion
npm i
```

## Run Remotion Studio (live preview)

```bash
cd remotion
npm run dev
```

Opens **Remotion Studio** at <http://localhost:3000> — a live, scrubbable preview
of every composition. Edit a file in `src/` and the preview hot-reloads. Use the
right-hand props panel to change a composition's data live (score, copy, labels…).

## Compositions

| ID                       | Size        | Length | Purpose                                                        |
| ------------------------ | ----------- | ------ | ------------------------------------------------------------- |
| `EatoBioticsBrandIntro`  | 1920×1080   | 8s     | **Master brand asset** — particles → glowing food-system → score ring → lockup. The polished intro for all videos. |
| `AssessmentResultVideo`  | 1920×1080   | 13s    | Post-assessment result. Data-driven (score / name / summary / pillars). |
| `MealScoreSocialVideo`   | 1080×1920   | 11s    | Vertical (9:16) social meal-score for sharing. Data-driven (score / labels / meal image). |

### Data-driven props

`AssessmentResultVideo` and `MealScoreSocialVideo` take props so they can later
generate personalised videos (edit live in Studio, or pass `--props`):

```bash
# Personalised assessment result
npx remotion render AssessmentResultVideo out/result.mp4 \
  --props='{"name":"Jason","score":84,"pillars":["Stability","Diversity","Rhythm","Energy"]}'

# Meal score with a real meal photo (drop the file in remotion/public first)
npx remotion render MealScoreSocialVideo out/meal.mp4 \
  --props='{"score":91,"mealImage":"meals/my-lunch.jpg"}'
```

When `mealImage` is omitted, an abstract brand "plate" is used — no asset needed.

## Render / export a video

```bash
cd remotion
npx remotion render EatoBioticsBrandIntro out/brand-intro.mp4
# stills (thumbnails / brand assets):
npx remotion still EatoBioticsBrandIntro out/brand.png --frame=230
```

### Rendering in CI / headless / sandboxed environments

Remotion normally downloads its own Chrome Headless Shell on first render. If that
download is blocked (restricted network), point Remotion at an existing
**headless-shell** Chromium binary:

```bash
npx remotion render EatoBioticsBrandIntro out/brand-intro.mp4 \
  --browser-executable=/path/to/chrome-headless-shell
```

> Use the **headless-shell** build, not the full `chrome` binary — recent full
> Chrome removed the old headless mode Remotion relies on.

## Project structure

```
remotion/
├── src/
│   ├── index.ts                       # registerRoot entry
│   ├── Root.tsx                       # composition registry (add new <Composition> here)
│   ├── index.css                      # imports fonts.css + Tailwind
│   ├── fonts.css                      # self-hosted @font-face (DM Sans + Lora)
│   ├── fonts/                         # woff2 files (latin)
│   ├── lib/
│   │   ├── brand.ts                   # ← brand tokens: colours, gradients, fonts, anim, text, glow
│   │   └── fonts.ts                   # font-family stacks
│   ├── components/                    # reusable building blocks
│   │   ├── ParticleField.tsx          # living brand-particle ecosystem
│   │   ├── GlowBodySystem.tsx         # abstract glowing "food system inside you"
│   │   ├── ScoreRing.tsx              # animated gradient score ring + count-up
│   │   ├── BrandLockup.tsx            # logo + wordmark + tagline lockup
│   │   ├── GradientText.tsx           # brand-gradient clipped text
│   │   ├── MetricPill.tsx             # pillar / label chip
│   │   └── BioticPill.tsx             # rounded capsule motif
│   └── compositions/
│       ├── EatoBioticsBrandIntro.tsx
│       ├── AssessmentResultVideo.tsx
│       └── MealScoreSocialVideo.tsx
├── public/                            # static assets (logo, meal images)
├── remotion.config.ts
└── package.json
```

## Brand system

All brand values live in **`src/lib/brand.ts`** and mirror the website's design
tokens in `app/globals.css`. Reuse these in every new composition so everything
stays on-brand:

- **Background:** true white (`#FFFFFF`).
- **Text:** deep green (`#1A2E12`).
- **Brand gradient:** lime → green → teal → yellow → orange
  (`#A8E063 → #4CB648 → #2DAA6E → #F5C518 → #F5A623`).
- **Fonts:** DM Sans (sans) + Lora (serif) — self-hosted in `src/fonts/`.
- **Rule:** warm organic green/yellow/orange only — **no blue, no purple.**

Fonts are **self-hosted** (`src/fonts.css`), so the real brand type renders in both
Studio and headless renders with no runtime network fetch.

## Adding a new video

1. Build it from `src/lib/brand.ts` tokens + the components in `src/components/`.
2. Add the file under `src/compositions/`.
3. Register a `<Composition>` in `src/Root.tsx`.

### Roadmap

`EatoBioticsBrandIntro` is the master asset. Next from the same components:

- **Adverts** — short product / waitlist promos.
- **Hero animations** — looping landing-page background motion.
- **More social cuts** — vertical share videos for the score/meal mechanics.
- **Membership / share** stages of the Brand → … → Membership funnel.
