# EatoBiotics Design System

> **The Food System Inside You** — a design system for EatoBiotics, a practical guide and platform for understanding your microbiome and building a personal food system that improves digestion, immunity, energy, mood, and recovery.

This design system captures the brand's visual foundations, voice, and UI components so that any new artifact — marketing pages, app screens, slides, PDFs — stays true to the EatoBiotics identity.

---

## The Brand at a Glance

EatoBiotics is built around **one big idea** and **one framework**:

- **The idea** — *Build the food system inside you… and help build the food system around you.* Personal health and systemic change aren't separate goals; every plate you build feeds both.
- **The framework** — **The 3 Biotics**: **Prebiotics** (feed), **Probiotics** (add), **Postbiotics** (produce). Every piece of content, every color, and every feature maps back to these three.

EatoBiotics is part of a wider ecosystem called **EatoSystem** — a family of brands including EatoSports, EatoFund, EatoAI, etc. This design system covers **EatoBiotics specifically**, but the visual DNA (gradient palette, gentle organic feel) is shared across the family.

## Products & Surfaces

| Product | What it is | Source |
|---|---|---|
| **Marketing site** | `eatobiotics.com` — Next.js App Router site with hero, pathways (You / Family / Mind), 3-Biotics framework, the Plate, book showcase, podcast, membership teasers. | `EatoBiotics v1/app/`, `EatoBiotics v1/components/home/` |
| **The App / dashboard** | Logged-in product: Biotics Score, meal analysis, plate builder, journal, AI "EatoBiotic" consultation, weekly check-ins. Free → Grow (€9.99) → Restore (€49) → Transform (€99). | `EatoBiotics v1/app/account/`, `components/account/`, `components/app/` |
| **The Book** | 25-chapter practical guide, printable to 7×10" trim. | `EatoBiotics v1/content/book/`, `components/book/` |
| **The Assessment** | 15-question free assessment → Biotics Score across 5 pillars (Diversity, Feeding, Live Foods, Consistency, Feeling). Paid deep assessment → PDF report. | `app/assessment/`, `components/assessment/` |
| **Sub-pathways** | /you, /family, /mind, /gut-brain, /adhd, /anxiety, /bipolar, /depression — each themed around a facet of the core pathway. | `app/<path>/`, `components/<path>/` |

## Sources Consulted

- **Codebase (attached, read-only):** `EatoBiotics v1/` — Next.js 16 App Router + Tailwind v4 + Supabase. Treated as the **canonical source of truth** for tokens, components, copy voice.
- **GitHub:** [`EatoSystem/EatoBiotics`](https://github.com/EatoSystem/EatoBiotics) — public repo, same codebase.
- **Related (not consulted in depth):** `EatoSystem/EatoSystems`, `EatoSystem/EatoSports`, `EatoSystem/EatoAgent` — referenced as sibling products.

---

## CONTENT FUNDAMENTALS — How EatoBiotics writes

**Voice in one line:** *A practical, optimistic, second-person guide — speaks like a thoughtful coach, not a doctor, not a marketer.*

### Tone
- **Warm & optimistic, never preachy.** The brand is aspirational but grounded. It invites, it doesn't lecture.
- **Practical over academic.** Science is earned ("100 trillion microbes", "70% of your immune system lives in your gut") but never dumped — always tied to a next step.
- **Calm authority.** Short, declarative sentences. No hype, no exclamation marks, no "AMAZING BREAKTHROUGH."
- **Systems-minded.** Reaches for the word *system* constantly — "food system," "build a system," "one plate, five days." The ideology is: small inputs, consistent, compounding.

### Pronouns & POV
- **"You" is the default subject.** The user is the protagonist: *your gut, your plate, your food system.*
- **"We" appears rarely** — only in Jason's voice on /about or the manifesto, and for company-level statements ("what we're building").
- **"I" almost never** — this isn't a personal blog.

### Casing
- **Sentence case for almost everything.** UI buttons, most headings, body copy: *"Start free assessment"*, *"Your biotics score."*
- **Title Case on big section titles & page titles** that carry brand weight: *"The Food System Inside You"*, *"Three Types of Biotics. One Food System."*
- **UPPERCASE + wide letter-spacing for eyebrows and tiny labels** — e.g. `CORE`, `THE ECOSYSTEM`, `THE MISSION`, `PREBIOTIC`. Always short. Always `text-xs font-semibold uppercase tracking-widest`.

### Punctuation & style
- **Em-dashes, often.** "...digestion, immunity, energy, mood, and recovery — the fuel your microbiome runs on."
- **Oxford comma.** Consistently used.
- **Curly quotes** in body copy, straight quotes in code/mono.
- **No exclamation marks** in marketing copy. Ever.
- **Numerals over spelling-out** for pillars and tiers: *"5 pillars," "3 biotics," "4 quadrants."*

### Signature copy patterns
- **"The [thing] inside [possessive]"** — the hero construction. *The Food System Inside You / Your Family / Your Mind.*
- **Triads.** Most hero statements come in threes: *"Feed. Add. Produce."* / *"Assess. Score. Log. Improve."* / *"One plate. Five days. One decision."*
- **"Start with yourself. Extend to your family. Support your mind."** — the ecosystem frame.
- **Numbered steps (01, 02, 03, 04)** — always zero-padded, always in the brand's uppercase eyebrow style.
- **Science-backed single-line claims** set in `--icon-green` or `--icon-orange`: *"70% of your immune system lives in your gut."*

### Emoji
- **Yes, but sparingly and only inside the app.** Food emojis (🫐 🥣 🥛 🧄 🐟 🥑) are used in the iPhone mock screens (`iphone-screen-plate.tsx`, `iphone-screen-food-log.tsx`) as tiny content tokens inside meal cards — they stand in for real food photography that hasn't been shot yet.
- **Never on the marketing site** — no emoji on /, /you, /family, /mind, /biotics, /about.
- **Never in headings.**

### Examples to copy from
> "An advanced system to understand your Food System and microbiome that improves how you feel every day — digestion, immunity, energy, mood, and recovery."
> *(Hero subcopy — one sentence, five nouns, em-dash reveal.)*

> "Build this plate once. Eat it five days. Change it next week."
> *(The Plate caption — triad, imperative, all lowercase sentence case.)*

> "Free to start. No card needed. Takes about 3 minutes."
> *(CTA microcopy — removes friction, three short sentences, declarative.)*

> "Build the food system inside you… and help build the food system around you."
> *(The Manifesto — ellipsis pause, mirrored clauses, the mission statement.)*

---

## VISUAL FOUNDATIONS

### Colors
Two systems sit on top of each other:

**1. Neutral/UI palette** — a warm near-white background (`#FFFFFF`) with a deep organic green-black foreground (`#1A2E12`) and a muted olive for secondary text (`#5A6E50`). Borders are a soft `#E5E5E5`. This keeps content legible and calm.

**2. Brand / icon palette** — a 5-stop gradient extracted from the EatoBiotics icon capsules:

| Token | Hex | Role |
|---|---|---|
| `--icon-lime` | `#A8E063` | **Prebiotic** — feed, fiber, plants |
| `--icon-green` | `#4CB648` | Primary CTA, core brand |
| `--icon-teal` | `#2DAA6E` | **Probiotic** — live cultures, fermented |
| `--icon-yellow` | `#F5C518` | Protein, warmth, energy |
| `--icon-orange` | `#F5A623` | **Postbiotic** — produce, output, accent |

These five colors are almost always deployed as a **135° gradient** — the signature `brand-gradient`. Solid brand color is the exception, gradient is the rule.

### Typography
- **Display / headings — Lora** (500–700). Warm editorial serif; used for every `<h1>`/`<h2>`/`<h3>` and any big numeric callout ("01", "02", "78"). Authoritative — confirmed in the Claude Code brand guidelines.
- **Body — DM Sans** (400–700). Humanist sans, highly legible at small sizes.
- **Mono — Geist Mono**. Used rarely — only in developer-facing surfaces (admin, dashboards, tokens).

Type is set with **clamp-based responsive sizing** (`clamp(2.5rem, 5vw, 4rem)` for hero). Letter-spacing is tightened slightly on headings (`-0.02em`) and dramatically widened on eyebrows (`0.15em`).

### Spacing & Layout
- **Max content width: 1200px.** Every major section wraps in `max-w-[1200px]`.
- **Horizontal padding: 24px** (`px-6`) on mobile, expands with breakpoint.
- **Section rhythm: 96–128px vertical** (`py-24 md:py-32`) between major sections.
- **Grid: mostly 2-col or 3-col** on desktop, stacking to 1-col on mobile. 4-col for "Assess / Score / Log / Improve."
- **4px spacing base** (Tailwind's default).

### Backgrounds
- **Predominantly white.** The app and marketing site are a crisp, high-contrast white canvas.
- **Dark sections are reserved for the manifesto** (`bg-foreground` — the deep green-black) where the brand gradient text appears over a dark field.
- **Soft secondary panels** (`bg-secondary/40` = `#F7F7F7` at 40%) frame specific modules like "The Plate" section.
- **One hero background pattern** exists (`public/background-graphic.webp`) — soft organic shapes; used sparingly.
- **No illustrations, no textures, no grain.** Illustration is carried by the 3 real PNG hero images (hero-gut, family-hero, mind-hero) — soft, photographic, warm-toned.
- **Gradients over photos, not under.** Photos sit in their own containers; gradients are always vector.

### The Section Divider
A signature 4px full-width gradient bar (`.eb-section-divider`) between major page sections. It carries the brand in the spaces between content — used ~6× per homepage.

### Animation
- **Gentle fade + rise on scroll** (via `<ScrollReveal>`). 20–30px translateY, 300–500ms ease-out, staggered by 60–160ms across siblings.
- **No bounces, no spring physics, no confetti.** The brand is calm.
- **Transitions are 200–300ms** for hover, 500–1000ms for score/number counters.
- **Number counters animate up** (0 → 78 over 1s) on score components — a subtle reward.
- **No parallax, no sticky scrollytelling.**

### Hover States
- **Cards:** `-translate-y-1.5` lift + `shadow-2xl` (increased shadow).
- **Primary buttons (gradient):** `opacity-90` + slightly larger colored shadow.
- **Outline buttons:** swap to filled `bg-icon-green text-white`.
- **Text links:** color shift from `text-muted-foreground` → `text-foreground` (or → `text-icon-green` for branded links).
- **Icons inside groups:** fade in from `opacity-0` on hover.

### Press / Active States
- Inherits hover state; no explicit `:active` scale-down. The product doesn't "bounce."

### Borders & Radii
- **Default radius: 12px** (`--radius`). Cards: `rounded-2xl` or `rounded-3xl` (16–28px).
- **Pills: `rounded-full`** — buttons, tags, the biotic pills in the footer.
- **Border color: `--border` (#E5E5E5)** by default. On highlighted cards, the border softens to a color-mixed tint of the card's accent (e.g. `color-mix(in srgb, var(--icon-yellow) 20%, transparent)`).
- **Border width: 1px default**, 2px only on emphasized states (outline buttons, highlighted tier card).

### Shadows
A soft, green-black tinted shadow system (NOT pure black — the shadow inherits a hint of `#1A2E12`):
- `shadow-sm` — 1px for inputs
- `shadow` / `shadow-md` — 2–6px for cards at rest
- `shadow-lg` — 12px for raised cards
- `shadow-xl` — 20px for hover / modal elevation
- `shadow-green-glow` — colored glow on CTAs: `0 10px 30px rgba(76, 182, 72, 0.20)`

No inner shadows. No multi-layer paper stacks. Shadows are a single soft drop.

### Gradient Uses (signature brand moves)
1. **`brand-gradient` 135°** — CTAs, top accent bars on cards, decorative `h-1` / `h-1.5` strips.
2. **`brand-gradient-text`** — phrases like *"One food system."* or *"Built once a week."* set inside a larger foreground-colored headline.
3. **Pair gradients** — each biotic card uses a 2-stop slice of the full gradient (lime→green for Prebiotic, green→teal for Probiotic, yellow→orange for Postbiotic).
4. **Section divider** — 90° version of the full gradient, 4px tall.

### Transparency & Blur
- **Nav uses `bg-background/95 backdrop-blur-sm`** when sticky — the only place blur is used.
- **`color-mix(in srgb, <color> 10–30%, transparent)`** is used liberally to tint backgrounds and borders with the biotic colors at low opacity — especially on how-it-works cards and membership tiers.
- **Image containers use `bg-secondary/20`** — a barely-there warm off-white.

### Imagery Vibe
- **Warm, soft, slightly painterly** — the hero PNGs (hero-gut, family-hero, mind-hero) feel illustrated-but-realistic. Earth tones, soft highlights, no hard outlines.
- **No black & white, no heavy grain, no duotone.**
- **Food emoji stand-ins** are used *only* inside the iPhone mock screens in the app showcase — as placeholders for future food photography.

### Layout Rules
- **Sticky nav** (fixed top, 60px tall, blur background).
- **No sticky footers, no sticky CTAs** on desktop; mobile sub-pathway pages (start, start-family) use a single sticky-CTA bar.
- **Hero is always 2-column** on desktop (text left, image right), always stacks on mobile.
- **Cards are always full-height within their grid row** (`h-full`) so the grid stays rectangular.

---

## ICONOGRAPHY

### Icon System
**Lucide React** is the single source for all line icons (~100 used across the app). It ships with the Next.js app via `lucide-react`. Characteristics:
- **Stroke-based, 2px stroke, rounded caps and joins.**
- Default size: **14–20px inline, 24–26px for featured icons.**
- Default color: inherits from text (`currentColor`), so icon color follows text color naturally.

Examples used in the app: `ArrowRight`, `ArrowUpRight`, `ClipboardList`, `BarChart2`, `Utensils`, `TrendingUp`, `Leaf`, `Brain`, `BookOpen`, `Smartphone`, `Apple`, `Activity`, `Users`, `ChevronDown`, `Check`, `Menu`, `X`, `Mic`, `Calendar`, `Globe`, `Map`, `Info`.

> **In this design system** Lucide is loaded from CDN (`https://unpkg.com/lucide-static@latest/` for SVGs, or `https://unpkg.com/lucide@latest` for the JS API) when used in prototypes. In production code, use the `lucide-react` npm package.

### Social Icons
Custom inline SVGs for **LinkedIn, X, Instagram, TikTok** — all filled with the `#social-gradient` (a 5-stop gradient matching the brand). See `components/footer.tsx` for source.

### Brand Marks & Logos
- **`eatobiotics-icon.webp` / `.png`** — the circular biotic-capsule mark, ~36×36 at default display.
- **`icon.svg`** — vector version of the mark.
- **`eatobiotics-plate.png`** — the 4-quadrant plate illustration (Prebiotic / Probiotic / Protein / Postbiotic).
- **`book-cover.png`** — the book cover asset.
- **`eatosports-plate.png`, `eatosystem-icon.jpg`** — sibling-brand marks, available if designing ecosystem content.

### Photography / Illustrations
- `hero-gut.png` — microbiome illustration (/you, /).
- `family-hero.png` — shared food culture illustration (/family).
- `mind-hero.png` — gut-brain connection (/mind).
- `3-biotics-infographic.png` — the 3-biotics framework visual.
- `background-graphic.webp` — soft organic shapes background.

### Emoji
See CONTENT FUNDAMENTALS — used *only* inside in-app meal cards as food stand-ins. Never on marketing or in headings.

### Unicode
Not used as UI elements.

---

## Folder Index

```
colors_and_type.css     — CSS tokens: colors, fonts, spacing, radii, shadows, gradients
README.md               — this file
SKILL.md                — cross-compatible skill manifest for Claude Code

assets/
  logos/                — brand marks (eatobiotics icon/plate, eatosports, eatosystem, book cover)
  images/               — hero PNGs, backgrounds, infographics
  (icons from CDN — lucide-static)

preview/                — Design System tab cards (colors, type, components, tokens)

ui_kits/
  web/                  — Header, Hero, BioticTrio, Pathways, Manifesto, Tiers, Footer + Assessment flow
  app/                  — iPhone frame, HomeScreen, LogMealScreen, ScoreScreen, TabBar
```

## Quick file index

- `README.md` — this file (brand, content, visual, iconography)
- `SKILL.md` — Agent Skills manifest (cross-compatible with Claude Code)
- `colors_and_type.css` — **the authoritative CSS token file**
- `assets/logos/` — eatobiotics-icon, plate, book cover, sibling marks
- `assets/images/` — hero-gut, family-hero, mind-hero, background-graphic
- `preview/*.html` — Design System tab cards (21 cards: colors, type, spacing, components, brand)
- `ui_kits/web/index.html` — marketing site recreation (home → assessment → result)
- `ui_kits/app/index.html` — mobile app recreation (home → log → score)
- `ui_kits/start/index.html` — high-conversion landing pattern with 3 themed routes (/start, /start-family, /start-mind)

---

## Known Substitutions / Caveats

- **Fonts:** Lora (headings) + DM Sans (body) + Geist Mono, all Google Fonts. This design system does the same — no substitution needed.
- **Lucide icons** are loaded from CDN in prototypes; in production the `lucide-react` npm package is used.
- **No Figma file was provided** — visual decisions are all rooted in the codebase + real assets copied from `public/`.

---

## How to use this system

- **Building marketing/brand artifacts?** Start from `ui_kits/marketing-site/index.html`. Copy the hero pattern, the brand gradient, the section divider.
- **Building product/app artifacts?** Start from `ui_kits/app/index.html`. Pull the iPhone frame, score ring, and tier cards.
- **Building slides or PDFs?** Use `colors_and_type.css` + the assets in `assets/` + the `--brand-gradient` for accent. Keep the white canvas, the green-black text, and lots of breathing room.
- **Writing copy?** Re-read *CONTENT FUNDAMENTALS*. The voice is more distinctive than the visuals — get it right.
