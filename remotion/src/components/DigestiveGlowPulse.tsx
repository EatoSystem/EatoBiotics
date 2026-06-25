import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { ICON } from "../lib/brand";

/**
 * Fakes "the digestive system activating" over the flat hero PNG: a travelling
 * sequence of soft radial-gradient light blobs that ignite from the upper tract
 * down toward the stomach and gut, then settle into a continuous breathe.
 *
 * Positions are props (fractions of canvas) so this can be re-tuned per hero
 * asset / aspect ratio. Rendered with `screen` blending so it reads as inner light.
 */
export type GutPoint = { xPct: number; yPct: number; size: number; color: string };

const DEFAULT_POINTS: GutPoint[] = [
  // upper tract (throat / oesophagus)
  { xPct: 0.5, yPct: 0.46, size: 150, color: ICON.lime },
  // stomach
  { xPct: 0.505, yPct: 0.585, size: 240, color: ICON.yellow },
  // small intestine / gut core
  { xPct: 0.5, yPct: 0.68, size: 300, color: ICON.yellow },
  // lower gut
  { xPct: 0.5, yPct: 0.74, size: 230, color: ICON.orange },
];

export const DigestiveGlowPulse: React.FC<{
  startFrame?: number;
  /** Frames between each point igniting. */
  stagger?: number;
  points?: GutPoint[];
}> = ({ startFrame = 0, stagger = 14, points = DEFAULT_POINTS }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {points.map((p, i) => {
        const local = frame - startFrame - i * stagger;
        // Ignite (0→1) then ease to a sustained level.
        const ignite = interpolate(local, [0, 18], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        // Continuous breathe once lit.
        const breathe = 0.78 + 0.22 * Math.sin(t * 1.6 + i);
        const intensity = ignite * breathe;

        const d = p.size;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.xPct * width - d / 2,
              top: p.yPct * height - d / 2,
              width: d,
              height: d,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${p.color} 0%, ${p.color}00 65%)`,
              opacity: 0.55 * intensity,
              filter: `blur(${d * 0.12}px)`,
              transform: `scale(${0.85 + 0.15 * ignite})`,
            }}
          />
        );
      })}

      {/* A faint travelling spark that runs upper→gut as the system "fires". */}
      {(() => {
        const travel = interpolate(
          frame,
          [startFrame, startFrame + stagger * points.length + 20],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) },
        );
        const first = points[0];
        const last = points[points.length - 1];
        const x = interpolate(travel, [0, 1], [first.xPct, last.xPct]) * width;
        const y = interpolate(travel, [0, 1], [first.yPct, last.yPct]) * height;
        const sparkOpacity = interpolate(travel, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
        const s = 70;
        return (
          <div
            style={{
              position: "absolute",
              left: x - s / 2,
              top: y - s / 2,
              width: s,
              height: s,
              borderRadius: "50%",
              background: `radial-gradient(circle, #FFFFFF 0%, ${ICON.lime}aa 45%, rgba(255,255,255,0) 70%)`,
              opacity: 0.7 * sparkOpacity,
              filter: "blur(6px)",
            }}
          />
        );
      })()}
    </AbsoluteFill>
  );
};
