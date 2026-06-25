import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { BRAND_GRADIENT_STOPS, ICON } from "../lib/brand";

/** Deterministic pseudo-random in [0,1) from an integer seed. */
const rand = (seed: number) => {
  const x = Math.sin(seed * 91.7 + 47.3) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Microbiome dots orbiting the figure on slow elliptical paths — the "food
 * system particles" of the brand art. Deterministic, calm rotation. Place one
 * instance behind the figure and one in front for depth.
 */
export const OrbitingMicrobiomeLayer: React.FC<{
  startFrame?: number;
  count?: number;
  /** Orbit radii as fractions of canvas height (each dot is assigned one). */
  radiiPct?: number[];
  /** Vertical squash of the orbits (perspective). */
  flatten?: number;
  /** Degrees/sec base orbital speed. */
  speed?: number;
  /** Offsets the deterministic seed so two instances differ. */
  seed?: number;
  maxOpacity?: number;
}> = ({
  startFrame = 0,
  count = 8,
  radiiPct = [0.46, 0.52, 0.58],
  flatten = 0.66,
  speed = 6,
  seed = 0,
  maxOpacity = 0.9,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const cx = width / 2;
  const cy = height / 2;
  const layerOpacity = interpolate(frame, [startFrame, startFrame + 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const t = frame / fps;

  return (
    <AbsoluteFill style={{ opacity: layerOpacity, pointerEvents: "none" }}>
      {new Array(count).fill(0).map((_, i) => {
        const s = i + 1 + seed * 100;
        const radius = radiiPct[i % radiiPct.length] * height;
        const dir = rand(s) > 0.5 ? 1 : -1;
        const angle = rand(s + 3) * Math.PI * 2 + dir * (t * speed * (Math.PI / 180));
        const size = 14 + rand(s + 7) * 26;
        const color = BRAND_GRADIENT_STOPS[i % BRAND_GRADIENT_STOPS.length];

        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius * flatten;
        // Dots near the front (lower on the ellipse) appear slightly larger/brighter.
        const depth = (Math.sin(angle) + 1) / 2; // 0 (back) → 1 (front)
        const scale = 0.8 + depth * 0.4;
        const op = (0.45 + depth * 0.55) * maxOpacity;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              transform: `scale(${scale})`,
              opacity: op,
            }}
          >
            {/* bubble */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.55)",
                border: `1px solid ${color}55`,
                boxShadow: `0 0 10px ${ICON.green}33`,
              }}
            />
            {/* microbe core */}
            <div
              style={{
                position: "absolute",
                inset: "28%",
                borderRadius: "50%",
                background: color,
                boxShadow: `0 0 8px ${color}aa`,
              }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
