# The EatoBiotics Motion Constitution

> The body should always feel alive. Never gimmicky.

Motion is how EatoBiotics proves the Food System is living. It is a teaching
instrument, not decoration. (The implementation catalogue lives in
`docs/food-system-experience/MOTION_SYSTEM.md`; this document is the law above
it.)

---

## 1. Motion means something

- Every animation encodes a fact: a **ping** means a pathway was fed; a **dim**
  means strain; a **growing ring** means progress; a **burst** celebrates a
  member's action. If an animation encodes nothing, cut it.
- The same visual vocabulary teaches everywhere: the pathway colour a member
  sees in a marketing reaction card is the colour that lights up when they log
  the real meal.

## 2. Organic, breath-like, slow

- Ambient life moves on 4–8 second breath cycles — auras glow, particles rise
  and drift, rings turn over a minute. Nothing ticks, spins fast, or bounces.
- Easing is organic (ease-in-out, settle curves). Linear motion is for
  travelling light along a spine, nothing else.
- Low amplitude always: the body breathes; it does not dance.

## 3. Choreography

- **One moment animates at a time.** Sequenced reveals stagger from a single
  timeline so left and right land together; competing simultaneous animations
  are a bug.
- **Bursts are earned.** Explosive moments (meal received, milestone reached)
  are reserved for member actions — never autoplayed at page load.
- Scroll reveals are calm arrivals (rise + fade), used to pace a story, never
  to show off.

## 4. Meal and body animations

- Logging a meal is theatre with meaning: the stage receives it, pathways
  light in sync with the impact story, the aura re-tints, the score counts up.
  The member should *watch food become body*.
- Habit signals persist visually — tick "moved today" and the movement pathway
  stays softly lit. The body carries the day.
- Strain is shown gently: amber, dimmed, slower — informative, never punitive.

## 5. Technology strategy

- **CSS keyframes (the `eb-*` vocabulary) for ambient life** — SSR-safe,
  zero-bundle, reduced-motion-gated globally. This is the default.
- **Remotion for cinema** — narrative films (Inside You, hero compositions),
  lazily loaded, below the fold, never blocking first paint.
- **No spring-physics library until a real need earns it.** Framer Motion is a
  documented upgrade path, not a dependency.

## 6. Discipline

- Animate only `transform`, `opacity`, and `filter`. Keyframes that animate
  transform must end on `transform: none` (retained transforms break fixed
  descendants — a bug this codebase has already paid for once).
- **`prefers-reduced-motion` is honoured everywhere, automatically.** Loops
  stop, staggers become simple fades, the composition remains beautiful when
  perfectly still. A page that only works animated is broken.
- Motion must never gate function: every animated flow has a static, complete
  equivalent.

## 7. The test

Before shipping any animation, ask:

1. What does this teach?
2. Would the screen still be beautiful frozen?
3. Does it breathe or does it perform?

Two noes or a "performs" — remove it.
