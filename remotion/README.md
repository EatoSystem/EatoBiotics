# EatoBiotics — Remotion video workspace

This folder is a **self-contained [Remotion](https://www.remotion.dev) project**
for producing branded EatoBiotics video content: adverts, assessment explainers,
hero animations, and social cuts.

> **Isolated from the main app.** This workspace has its **own** `package.json`,
> `node_modules`, `tsconfig.json` and ESLint config. It is **not** part of the
> Next.js website build — none of its dependencies are installed in the root app,
> and the root `tsc`/ESLint/`next build` explicitly exclude `/remotion`. You can
> develop, render, and delete video work here without touching the website.

## Prerequisites

- Node.js 18+
- From this folder, install once:

```bash
cd remotion
npm i
```

## Run Remotion Studio (live preview)

```bash
cd remotion
npm run dev
```

This opens **Remotion Studio** at <http://localhost:3000> — a live, scrubbable
preview of every composition. Edit a file in `src/` and the preview hot-reloads.

## Render a video

```bash
cd remotion
npx remotion render EatoBrandIntro out/intro.mp4
```

Render a single still frame (useful for thumbnails / quick checks):

```bash
npx remotion still EatoBrandIntro out/intro.png --frame=90
```

### Rendering in CI / headless / sandboxed environments

Remotion normally downloads its own Chrome Headless Shell on first render. If that
download is blocked (e.g. a restricted network), point Remotion at an existing
**headless-shell** Chromium binary instead:

```bash
npx remotion render EatoBrandIntro out/intro.mp4 \
  --browser-executable=/path/to/chrome-headless-shell
```

> Use the **headless-shell** build, not the full `chrome` binary — recent full
> Chrome removed the old headless mode Remotion relies on.

## Project structure

```
remotion/
├── src/
│   ├── index.ts                 # registerRoot entry
│   ├── Root.tsx                 # composition registry (add new <Composition> here)
│   ├── index.css                # Tailwind entry (Remotion Tailwind v4)
│   └── eatobiotics/
│       ├── brand.ts             # ← brand tokens: colours, gradient, fonts (single source of truth)
│       ├── BioticPill.tsx       # reusable animated "biotic pill" capsule
│       └── BrandIntro.tsx       # the EatoBrandIntro composition
├── remotion.config.ts
└── package.json
```

## Brand system

All brand values live in **`src/eatobiotics/brand.ts`** and mirror the website's
design tokens in `app/globals.css`. Reuse these in every new composition so
everything stays on-brand:

- **Background:** true white (`#FFFFFF`).
- **Text:** deep green (`#1A2E12`).
- **Brand gradient:** lime → green → teal → yellow → orange
  (`#A8E063 → #4CB648 → #2DAA6E → #F5C518 → #F5A623`).
- **Fonts:** DM Sans (sans) + Lora (serif).
- **Rule:** warm organic green/yellow/orange only — **no blue, no purple.**

### Fonts (follow-up)

`brand.ts` currently references the DM Sans / Lora **family names** with safe
system fallbacks, so renders work offline. For pixel-accurate brand type, load the
real fonts via [`@remotion/google-fonts`](https://www.remotion.dev/docs/fonts)
(`@remotion/google-fonts/DMSans`, `@remotion/google-fonts/Lora`) or drop local
`.woff2` files in `public/fonts` and `@font-face` them.

## Compositions

| ID               | Size        | Length | Description                                  |
| ---------------- | ----------- | ------ | -------------------------------------------- |
| `EatoBrandIntro` | 1920×1080   | 5s     | Brand-intro foundation — the base to evolve. |

### Roadmap

`EatoBrandIntro` is the foundation. Build on the same brand tokens + `BioticPill`
to create:

- **Adverts** — short product / waitlist promos.
- **Assessment explainers** — how the Food System score works.
- **Hero animations** — looping background / landing motion.
- **Social videos** — vertical (1080×1920) cuts for Reels / TikTok / Shorts.

Add each as a new file in `src/eatobiotics/` and register it in `src/Root.tsx`.
