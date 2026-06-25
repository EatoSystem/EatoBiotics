import React from "react";
import {
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { ICON, ANIM } from "../lib/brand";

/**
 * The central hero artwork (the "food system inside you" figure). Fades in and
 * scales up gently from `startFrame`, with a soft brand-gradient glow behind it.
 *
 * Sizing is relative to the canvas (`useVideoConfig`) so the same component
 * recomposes for 16:9, 9:16 and 1:1 variants.
 */
export const HeroImageLayer: React.FC<{
  /** Public path of the hero image (in /remotion/public). */
  src?: string;
  startFrame?: number;
  /** Image height as a fraction of canvas height. */
  heightPct?: number;
  /** Extra vertical offset as a fraction of canvas height (negative = up). */
  offsetYPct?: number;
  /** Continuous scale multiplier applied on top of the entrance (for the finale). */
  scale?: number;
  /** Show the soft gradient glow behind the figure. */
  glow?: boolean;
}> = ({
  src = "assets/food-system-inside-you.png",
  startFrame = 0,
  heightPct = 0.92,
  offsetYPct = 0,
  scale = 1,
  glow = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();

  const enter = spring({
    frame: frame - startFrame,
    fps,
    config: ANIM.spring,
  });
  const enterScale = interpolate(enter, [0, 1], [0.96, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  // Very slow breathe so the static PNG feels alive.
  const breathe = 1 + 0.01 * Math.sin((frame / fps) * 1.1);

  const imgHeight = height * heightPct;
  const glowSize = imgHeight * 1.05;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        transform: `translateY(${offsetYPct * height}px) scale(${enterScale * scale * breathe})`,
      }}
    >
      {glow && (
        <div
          style={{
            position: "absolute",
            width: glowSize,
            height: glowSize,
            left: width / 2 - glowSize / 2,
            top: height / 2 - glowSize / 2 + offsetYPct * height,
            borderRadius: "50%",
            background: `radial-gradient(circle at 50% 45%, ${ICON.lime}33 0%, ${ICON.yellow}1f 38%, rgba(255,255,255,0) 66%)`,
            filter: "blur(40px)",
          }}
        />
      )}
      <Img
        src={staticFile(src)}
        style={{
          height: imgHeight,
          width: "auto",
          objectFit: "contain",
          filter: "drop-shadow(0 30px 60px rgba(26,46,18,0.10))",
        }}
      />
    </div>
  );
};
