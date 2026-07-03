"use client"

/**
 * Inside-out EatoSystem player — the InsideOutEatoSystemAnimation composition
 * (You → Family → Community → County → Country → The Food System) played live
 * via @remotion/player. Loaded only through InsideOutEmbed (dynamic, ssr:false).
 */

import { Player } from "@remotion/player"
import { InsideOutEatoSystemAnimation } from "./food-system-animations"

export default function InsideOutPlayer() {
  return (
    <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(253,251,247,0.14)", boxShadow: "0 18px 60px rgba(0,0,0,0.35)" }}>
      <Player
        component={InsideOutEatoSystemAnimation}
        durationInFrames={220}
        fps={30}
        compositionWidth={1280}
        compositionHeight={720}
        style={{ width: "100%" }}
        autoPlay
        loop
        initiallyMuted
        clickToPlay={false}
        controls={false}
        acknowledgeRemotionLicense
      />
    </div>
  )
}
