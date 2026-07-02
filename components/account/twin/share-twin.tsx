"use client"

/**
 * ShareTwin — "Share my Twin" button for the stage CTA row.
 *
 * Rasterises the member's twin to a 1080×1350 card (lib/account/share-card,
 * pure Canvas 2D) and hands it to the Web Share API when available, otherwise
 * downloads a PNG. No personal details beyond the numbers the member chooses
 * to share.
 */

import { useCallback, useState } from "react"
import { Share2 } from "lucide-react"
import { drawTwinCard, SHARE_CARD_W, SHARE_CARD_H } from "@/lib/account/share-card"
import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"
import type { TwinVisualState } from "@/lib/account/twin-visual"

export function ShareTwin({ twin, visual }: { twin: FoodSystemDigitalTwin; visual: TwinVisualState }) {
  const [busy, setBusy] = useState(false)

  const share = useCallback(async () => {
    setBusy(true)
    try {
      const canvas = document.createElement("canvas")
      canvas.width = SHARE_CARD_W
      canvas.height = SHARE_CARD_H
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      drawTwinCard(ctx, {
        score: visual.ringScore,
        delta: twin.progress.scoreDelta,
        momentumLabel: visual.momentumLabel,
        biotics: [
          { label: "Prebiotics", value: twin.biotics.prebiotics.score, color: "#A8E063" },
          { label: "Probiotics", value: twin.biotics.probiotics.score, color: "#2DAA6E" },
          { label: "Postbiotics", value: twin.biotics.postbiotics.score, color: "#F5C518" },
        ],
      })
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"))
      if (!blob) return
      const file = new File([blob], "my-digital-twin.png", { type: "image/png" })
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "My Digital Twin — EatoBiotics" }).catch(() => {})
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "my-digital-twin.png"
        a.click()
        URL.revokeObjectURL(url)
      }
    } finally {
      setBusy(false)
    }
  }, [twin, visual])

  return (
    <button
      type="button"
      onClick={() => void share()}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10 disabled:opacity-60"
      style={{ border: "1px solid rgba(253,251,247,0.3)", color: "rgba(253,251,247,0.85)" }}
    >
      <Share2 className="h-4 w-4" /> {busy ? "Preparing…" : "Share my Twin"}
    </button>
  )
}
