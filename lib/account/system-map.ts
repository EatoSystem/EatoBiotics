/**
 * EatoBiotics — interactive System Map data.
 *
 * Defines the tappable hotspots on the Digital Twin figure (Mind, Defence,
 * Digestion, Energy) and `systemMapState(twin)` — a pure mapper that attaches the
 * member's live biotic level to each hotspot so the UI can show "what happens
 * here, which biotic feeds it, where you are today, and one food action".
 * All copy is educational and non-diagnostic ("supports", "associated with").
 */

import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"
import type { AuraTone } from "@/lib/account/twin-visual"

export type SystemHotspotKey = "mind" | "defence" | "digestion" | "energy"

export interface SystemHotspot {
  key: SystemHotspotKey
  label: string
  /** Position on the figure stage, in % of width/height. */
  x: number
  y: number
  /*
   * ══ 0R-5 · `biotic` IS GONE, AND `tone` IS WHAT REPLACED IT ════════════════
   *
   * Gate 3.6 kept `biotic: BioticKey` on this type as a DATA KEY — never
   * printed, present so the hotspot "knows which food action to offer". By
   * 0R-5 that justification had expired: `action` is a literal string on each
   * hotspot below, and the one remaining reader was `twin-stage.tsx` tinting
   * the stage with `auraGradientForBiotic(active.biotic, …)`.
   *
   * That tint was defensible — a static key, chosen by the member tapping a
   * hotspot, not a verdict about them. It is kept, and it now travels as a
   * PALETTE TONE instead, for one reason: while a `BioticKey` could reach a
   * colour function, `twin.biotics.weakest` could reach it too, and in the very
   * next branch it did. Removing the type from the path is what makes
   * `P0-SCIENCE-04` structurally unavailable rather than merely absent.
   *
   * The colours are unchanged, so nothing a member sees on tapping a hotspot
   * has moved.
   */
  tone: AuraTone
  /** What happens here — educational, non-medical. */
  what: string
  /** One concrete food-first action to support it. */
  action: string
}

export const SYSTEM_HOTSPOTS: SystemHotspot[] = [
  {
    key: "mind",
    label: "Mind",
    x: 50,
    y: 13,
    tone: "green",
    what: "Your gut and brain talk constantly. A diverse, well-fed microbiome is associated with steadier mood and clearer focus — food rhythm shapes the conversation.",
    action: "Add one fermented food today — kefir, live yoghurt, kimchi or sauerkraut.",
  },
  {
    key: "defence",
    label: "Defence",
    x: 41,
    y: 33,
    tone: "amber",
    what: "Much of your body's defence lives along the gut. Postbiotic compounds made by well-fed microbes are associated with a stronger gut barrier and everyday resilience.",
    // GATE 3.6: read "Feed the producers: … help your microbes make more." —
    // a microbial-production mechanism, asserted of this person, on /account.
    // Found by the behavioural guard, not by either audit or the source scan.
    // The foods are unchanged; what goes is the claim about what they cause.
    action: "Add resistant starch this week — cooked-and-cooled oats or potato, legumes, onions.",
  },
  {
    key: "digestion",
    label: "Digestion",
    x: 57,
    y: 50,
    tone: "lime",
    what: "This is home base — trillions of microbes digesting what you can't. Prebiotic fibre from a variety of plants is what keeps that inner ecosystem thriving.",
    action: "Add one new plant this week — leeks, asparagus or a handful of mixed seeds.",
  },
  {
    key: "energy",
    label: "Energy",
    x: 45,
    y: 67,
    tone: "lime",
    what: "Fibre-rich meals release their energy slowly, and your microbes turn the leftovers into fuel compounds — both are associated with steadier energy through the day.",
    action: "Build tomorrow's breakfast around oats or wholegrains instead of refined carbs.",
  },
]

/* ═══════════════════════════════════════════════════════════════════════════
   GATE 3.6 — the most serious live finding, and it was not in the audit.

   This state object used to carry three fields, and `TwinStage` rendered all
   three inside the hotspot panel on /account, which is V1_CORE:

     score   → "Building · 45"  and a bar at width: ${score}%
     level   → the band word, also on the hotspot's aria-label
     bioticLabel → "Fed by Postbiotics"

   `score` came straight from `twin.biotics[h.biotic].score`, so that chip and
   that bar were a PERSONAL BIOTIC NUMBER — the identical model Tranche 1
   removed from the reveal, 2A from /assessment/results and the share card, and
   2C from sequence-email.ts, reconstructed here out of a different component.
   "Fed by Postbiotics" is a feeding mechanism naming a Biotic, which
   POSTBIOTICS_INFERENCE_BOUNDARY refuses.

   ── THE FIELDS ARE REMOVED, NOT BLANKED ──────────────────────────

   `SystemHotspotState` is now `SystemHotspot` with nothing added. A renderer
   cannot show a personal Biotic state because it is no longer handed one — the
   same reason `BioticsProgressPanel` lost its prop in this gate and
   `ScoreRing` lost `percentile` before it. Leaving the fields and declining to
   render them would last exactly until the next person who wanted a chip.

   `biotic` survived this gate on `SystemHotspot` as a DATA KEY: never printed,
   present so the hotspot "knows which food action to offer". `levelLabel` went
   with the fields — it was an eleventh band ladder, and nothing may print it.

   ── SUPERSEDED AT 0R-5: `biotic` IS GONE TOO ─────────────────────────────

   This paragraph is kept because the reasoning still matters, but it no longer
   describes the type. By 0R-5 the data-key justification had expired — `action`
   is a literal on each hotspot, so nothing was looked up — and the single
   remaining reader was `twin-stage.tsx` passing `active.biotic` into a colour
   function. It now passes a static `tone` instead. See the field comment above.
   ═══════════════════════════════════════════════════════════════════════════ */

export type SystemHotspotState = SystemHotspot

/**
 * The hotspots, as the stage renders them.
 *
 * Takes the twin so the signature is stable for callers and so a future
 * genuinely-measured field has somewhere to arrive, but reads nothing
 * per-Biotic out of it — see the block above.
 */
export function systemMapState(_twin: FoodSystemDigitalTwin): SystemHotspotState[] {
  return SYSTEM_HOTSPOTS.map((h) => ({ ...h }))
}
