---
name: eatobiotics-design
description: Use this skill to generate well-branded interfaces and assets for EatoBiotics, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

EatoBiotics is "The Food System Inside You" — part of the broader EatoSystem. Key visual signals:
- 5-stop brand gradient: `#A8E063 → #4CB648 → #2DAA6E → #F5C518 → #F5A623` (Lime → Green → Teal → Yellow → Orange). Use on primary CTAs, score rings, section dividers, and a single clause in a headline.
- Type: Fraunces (serif display, 600–700) for headlines; Geist (sans) for body; Geist Mono for tokens.
- Dark-ground manifesto backgrounds use `#1A2E12` with light-on-dark gradient headlines.
- Rounded-24 cards, 6px top gradient bar, Lucide icons at 2px stroke.
- Pre/Pro/Post biotic semantics are carried by the three gradient anchor colors.

Key files:
- `colors_and_type.css` — the authoritative token + semantic CSS
- `assets/logos/` — logos, favicons, plate & book covers
- `assets/images/` — hero imagery (gut, family, mind)
- `ui_kits/web/` — marketing site components (Header, Hero, BioticTrio, Pathways, Manifesto, Tiers, Footer) + assessment flow
- `ui_kits/app/` — iOS app recreation (HomeScreen, LogMealScreen, ScoreScreen, TabBar)
- `preview/` — individual design-system specimen cards

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts *or* production code, depending on the need.
