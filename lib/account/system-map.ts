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
import type { BioticKey } from "@/lib/agent-loop/types"

export type SystemHotspotKey = "mind" | "defence" | "digestion" | "energy"

export interface SystemHotspot {
  key: SystemHotspotKey
  label: string
  /** Position on the figure stage, in % of width/height. */
  x: number
  y: number
  /** The biotic this system leans on most. */
  biotic: BioticKey
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
    biotic: "probiotics",
    what: "Your gut and brain talk constantly. A diverse, well-fed microbiome is associated with steadier mood and clearer focus — food rhythm shapes the conversation.",
    action: "Add one fermented food today — kefir, live yoghurt, kimchi or sauerkraut.",
  },
  {
    key: "defence",
    label: "Defence",
    x: 41,
    y: 33,
    biotic: "postbiotics",
    what: "Much of your body's defence lives along the gut. Postbiotic compounds made by well-fed microbes are associated with a stronger gut barrier and everyday resilience.",
    action: "Feed the producers: cooked-and-cooled oats, legumes and onions help your microbes make more.",
  },
  {
    key: "digestion",
    label: "Digestion",
    x: 57,
    y: 50,
    biotic: "prebiotics",
    what: "This is home base — trillions of microbes digesting what you can't. Prebiotic fibre from a variety of plants is what keeps that inner garden thriving.",
    action: "Add one new plant this week — leeks, asparagus or a handful of mixed seeds.",
  },
  {
    key: "energy",
    label: "Energy",
    x: 45,
    y: 67,
    biotic: "prebiotics",
    what: "Fibre-rich meals release their energy slowly, and your microbes turn the leftovers into fuel compounds — both are associated with steadier energy through the day.",
    action: "Build tomorrow's breakfast around oats or wholegrains instead of refined carbs.",
  },
]

export interface SystemHotspotState extends SystemHotspot {
  /** The member's live level for this system's biotic (0–100). */
  score: number
  /** Band label for the score, e.g. "Strong", "Building". */
  level: string
  /** Name of the feeding biotic, capitalised for display ("Prebiotics"). */
  bioticLabel: string
}

function levelLabel(score: number): string {
  if (score >= 70) return "Strong"
  if (score >= 45) return "Building"
  return "Needs feeding"
}

export function systemMapState(twin: FoodSystemDigitalTwin): SystemHotspotState[] {
  return SYSTEM_HOTSPOTS.map((h) => {
    const band = twin.biotics[h.biotic]
    return {
      ...h,
      score: band.score,
      level: band.label || levelLabel(band.score),
      bioticLabel: h.biotic.charAt(0).toUpperCase() + h.biotic.slice(1),
    }
  })
}
