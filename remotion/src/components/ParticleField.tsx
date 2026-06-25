import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { BRAND_GRADIENT_STOPS } from "../lib/brand";

/**
 * A living "internal ecosystem" of soft brand-coloured particles drifting gently
 * across the frame — microbiome / food-intelligence aesthetic, not chaotic.
 *
 * Fully deterministic: every particle's properties are derived from its index via
 * a tiny seeded PRNG, so renders are stable frame-to-frame (no Math.random).
 * Movement is sin/cos on `useCurrentFrame`, so particles loop calmly.
 */

/** Deterministic pseudo-random in [0,1) from an integer seed. */
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const ParticleField: React.FC<{
  count?: number;
  palette?: readonly string[];
  /** Frame at which particles finish fading in. */
  fadeInBy?: number;
  /** Max particle opacity. */
  maxOpacity?: number;
}> = ({
  count = 42,
  palette = BRAND_GRADIENT_STOPS,
  fadeInBy = 40,
  maxOpacity = 0.55,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const particles = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      const baseX = rand(i + 1) * width;
      const baseY = rand(i + 7) * height;
      const size = 6 + rand(i + 13) * 30;
      const driftX = 30 + rand(i + 19) * 120;
      const driftY = 24 + rand(i + 23) * 90;
      const speed = 0.4 + rand(i + 29) * 0.9;
      const phase = rand(i + 31) * Math.PI * 2;
      const color = palette[i % palette.length];
      const opacityFactor = 0.35 + rand(i + 37) * 0.65;
      return { baseX, baseY, size, driftX, driftY, speed, phase, color, opacityFactor };
    });
  }, [count, width, height, palette]);

  const fieldOpacity = interpolate(frame, [0, fadeInBy], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: fieldOpacity }}>
      {particles.map((p, i) => {
        const t = (frame / 30) * p.speed + p.phase;
        const x = p.baseX + Math.sin(t) * p.driftX;
        const y = p.baseY + Math.cos(t * 0.8) * p.driftY;
        // Each particle breathes opacity slightly so the field feels alive.
        const pulse = 0.7 + 0.3 * Math.sin(t * 1.6);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: p.size,
              height: p.size,
              borderRadius: 999,
              background: p.color,
              opacity: maxOpacity * p.opacityFactor * pulse,
              filter: `blur(${Math.max(1, p.size * 0.12)}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
