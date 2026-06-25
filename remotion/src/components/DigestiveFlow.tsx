import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ICON } from "../lib/brand";

/**
 * Streams of nutrient / energy light that flow down the digestive tract, so the
 * "food system is active" idea reads literally. Each dot travels the tract on a
 * repeating cycle; dots are phase-staggered for a continuous flow. The cycle
 * length should divide the loop length so the flow restarts seamlessly.
 *
 * Rendered with `screen` blending so the dots read as inner light over the figure.
 */
const PALETTE = [ICON.lime, ICON.green, ICON.yellow, ICON.orange];

export const DigestiveFlow: React.FC<{
  count?: number;
  /** Seconds for one dot to traverse the tract (use a divisor of the loop). */
  cycleSec?: number;
  /** Tract top/bottom as fractions of canvas height. */
  topPct?: number;
  bottomPct?: number;
  /** Horizontal centre as a fraction of canvas width. */
  centerXPct?: number;
}> = ({
  count = 9,
  cycleSec = 4,
  topPct = 0.4,
  bottomPct = 0.76,
  centerXPct = 0.5,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {new Array(count).fill(0).map((_, i) => {
        // Repeating progress 0→1 down the tract, phase-offset per dot.
        const p = ((t / cycleSec + i / count) % 1 + 1) % 1;

        // Serpentine path: gentle wiggle up top, tighter coil lower down.
        const y = topPct + (bottomPct - topPct) * p;
        const coil = p > 0.55 ? (p - 0.55) / 0.45 : 0;
        const wiggle =
          Math.sin(p * Math.PI * 3) * 0.018 + Math.sin(p * Math.PI * 7) * 0.02 * coil;
        const x = centerXPct + wiggle;

        // Emerge at the top, dissolve into the gut at the bottom.
        const fade =
          Math.min(1, p / 0.12) * Math.min(1, (1 - p) / 0.18);
        const size = 16 + 10 * Math.sin(p * Math.PI); // fattest mid-tract
        const color = PALETTE[i % PALETTE.length];

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x * width - size / 2,
              top: y * height - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              background: `radial-gradient(circle, #FFFFFF 0%, ${color} 40%, ${color}00 72%)`,
              opacity: 0.85 * fade,
              filter: "blur(2px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
