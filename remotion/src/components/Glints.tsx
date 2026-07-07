import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ICON } from "../lib/brand";

/** Deterministic pseudo-random in [0,1) from an integer seed. */
const rand = (seed: number) => {
  const x = Math.sin(seed * 73.13 + 19.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Tiny twinkling light points scattered across the figure — adds sparkle/life.
 * Each glint twinkles at an integer number of cycles over the loop length, so the
 * field restarts seamlessly. Positions are deterministic within a body-shaped box.
 */
export const Glints: React.FC<{
  count?: number;
  /** Loop length in seconds (twinkle frequencies are integers over this). */
  loopSec?: number;
  /** Bounding box (fractions of canvas) the glints live within. */
  box?: { x0: number; x1: number; y0: number; y1: number };
}> = ({
  count = 14,
  loopSec = 8,
  box = { x0: 0.36, x1: 0.64, y0: 0.28, y1: 0.78 },
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const colors = [ICON.lime, ICON.yellow, "#FFFFFF"];

  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {new Array(count).fill(0).map((_, i) => {
        const x = box.x0 + rand(i + 1) * (box.x1 - box.x0);
        const y = box.y0 + rand(i + 5) * (box.y1 - box.y0);
        const size = 3 + rand(i + 9) * 6;
        // Integer cycles over the loop → seamless.
        const cycles = 2 + Math.floor(rand(i + 13) * 4); // 2..5
        const phase = rand(i + 17) * Math.PI * 2;
        const tw = Math.max(0, Math.sin((t / loopSec) * cycles * Math.PI * 2 + phase));
        const opacity = 0.15 + 0.75 * tw * tw;
        const color = colors[i % colors.length];
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
              background: color,
              boxShadow: `0 0 ${size * 2}px ${color}`,
              opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
