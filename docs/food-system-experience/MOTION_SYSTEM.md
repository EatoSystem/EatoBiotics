# Motion System — how the Food System moves

Motion is the product's biology made visible. Rules first, catalogue second.

## Rules

1. **Organic, never mechanical.** Ease curves are breath-like (`ease-in-out`, long periods);
   nothing snaps, nothing bounces for its own sake.
2. **Motion means something.** Every animation encodes a fact: a ping = a pathway fed; a dim =
   strain; a ring = growth. If it doesn't teach or reflect state, cut it.
3. **Choreography over chaos.** Sequenced moments (arrival, reveal) use staggered delays from
   one timeline so left/right elements land together. One moment animates at a time.
4. **Calm by default.** Ambient loops are slow (4–8s) and low-amplitude. Bursts are reserved
   for member actions (meal logged, milestone).
5. **Respect `prefers-reduced-motion`.** Loops stop, staggers collapse to fade-ins, Remotion
   players still render but nothing auto-loops aggressively.
6. **Transforms end clean.** Keyframes that animate `transform` must end on `transform: none`
   — retained transforms break `position: fixed` descendants (learned the hard way with
   `page-enter`). Overlays portal to `document.body`.

## Technology split

| Layer | Tool | Why |
|---|---|---|
| Ambient loops, staggers, reveals | CSS keyframes (`app/globals.css`, `eb-*`) | zero-cost, SSR-safe, proven |
| Cinematic films (Inside You, hero/close videos, inside-out story) | Remotion + `@remotion/player` (lazy, `ssr:false`) | frame-accurate storytelling |
| Count-ups | `use-count-up.ts` hook | number choreography synced to reveals |

**Framer Motion is deliberately not a dependency yet.** The current reveal choreography needs
timeline stagger + loops, which CSS does reliably. If we later need spring physics, drag, or
shared-layout transitions, `motion/react` is the upgrade path — noted here so the decision is
explicit, not forgotten.

## Catalogue — existing keyframes (globals.css)

| Keyframe | Motion | Used for |
|---|---|---|
| `ebRevealUp` | rise + fade in | staggered row/card arrivals (stage cockpit, impact rows) |
| `ebDrawRing` | stroke draw | score ring arrival |
| `ebShimmer` | light sweep | "learning" state on the figure |
| `ebOrbBloom` | slow scale/opacity | the body breathing (ambient) |
| `eb-ping` | expanding halo | hotspot pulses, pathway node ignition |
| `eb-burst` | radial particles | `MealReactionBurst` — meal received, milestone |
| `eb-pop-in` | scale-settle | chips, badges |
| `pulse-ring` | soft ring pulse | "today" markers |
| `spine-flow` | travelling glow | energy flowing along pathways (public page) |

## Catalogue — Remotion compositions (`components/twin-motion/`)

| Composition | Story |
|---|---|
| Inside You chapters | dark cinema: gut world, microbes, compounds |
| `InsideOutEatoSystemAnimation` | You → Family → Community → County → Country → The Food System |
| Hero / close films | landing and closing loops (pre-rendered where shipped as video) |

## The Meal Reveal choreography (new — `meal-reveal.tsx`)

One timeline, CSS `animation-delay`, both sides driven by the same `mealImpact()` rows:

```
t=0        stage enters reveal: hotspots fade out (200ms), aura begins re-tint (1.5s)
t=0.2s     "MEAL RECEIVED" eyebrow + meal name rise in (ebRevealUp)
t=0.4s     score starts counting (useCountUp, ~1s)
t=0.9s+    impact row i appears at 0.9 + i·0.45s (ebRevealUp)
           …and its pathway node ignites on the figure at the SAME delay (eb-ping + halo)
t=0.9s     particle drift inward begins (burst language, reversed)
after rows nutrition strip + insight fade in (ebRevealUp)
then       after-meal journey steps stagger in (0.15s apart)
end state  ambient: lit nodes keep a slow 5s pulse; aura holds the top impact tint
exit       "Done" → reveal fades (300ms), cockpit + hotspots return (ebRevealUp)
```

Strain rows use the amber palette and a slower (2.4s) pulse — visibly different physiology,
never a red alarm.

## Micro-interactions

| Trigger | Motion |
|---|---|
| Hotspot hover/touch | halo ping + tooltip pop-in |
| Next Best Action complete | check icon pop + card settle |
| Milestone unseen | stage burst + celebration card `ebRevealUp` |
| Streak day filled | flame chip pop-in |
| Tab change | content fade-slide (existing) |
| Log button | lift on hover (`-translate-y-0.5`) |

## Performance

- Animate only `transform`, `opacity`, `filter` — never layout properties.
- Remotion players stay lazy (`dynamic`, `ssr:false`) and below the fold where possible.
- Ambient loops pause when the tab is hidden (browser default for CSS animations is fine;
  no rAF loops).
