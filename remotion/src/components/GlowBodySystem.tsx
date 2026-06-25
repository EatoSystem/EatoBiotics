import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { ICON, ANIM } from "../lib/brand";

/**
 * An abstract, premium "food system inside you" form — translucent layered
 * blobs of brand-coloured light that breathe gently. Deliberately NOT clinical
 * or anatomical: soft glow, organic curves, overlapping radial gradients.
 *
 * Springs in from `startFrame`; pulses continuously thereafter.
 */
export const GlowBodySystem: React.FC<{
  startFrame?: number;
  /** Overall diameter in px. */
  size?: number;
}> = ({ startFrame = 0, size = 540 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - startFrame,
    fps,
    config: ANIM.spring,
  });
  const appear = interpolate(enter, [0, 1], [0.7, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  // Slow continuous breathe.
  const t = frame / fps;
  const pulse = 1 + 0.035 * Math.sin(t * 1.4);

  // Each translucent layer: [color, sizeFactor, dx, dy, blur, alpha, driftSpeed]
  const layers: Array<{
    color: string;
    sizeFactor: number;
    dx: number;
    dy: number;
    blur: number;
    alpha: number;
    speed: number;
    phase: number;
  }> = [
    { color: ICON.teal, sizeFactor: 1.0, dx: 0, dy: 0, blur: 40, alpha: 0.55, speed: 0.6, phase: 0 },
    { color: ICON.green, sizeFactor: 0.82, dx: -0.16, dy: -0.08, blur: 36, alpha: 0.5, speed: 0.8, phase: 1.5 },
    { color: ICON.lime, sizeFactor: 0.6, dx: 0.18, dy: -0.14, blur: 30, alpha: 0.5, speed: 1.0, phase: 3.0 },
    { color: ICON.yellow, sizeFactor: 0.5, dx: 0.1, dy: 0.2, blur: 28, alpha: 0.45, speed: 0.9, phase: 4.2 },
    { color: ICON.orange, sizeFactor: 0.42, dx: -0.2, dy: 0.16, blur: 26, alpha: 0.4, speed: 1.1, phase: 5.4 },
  ];

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        opacity,
        transform: `scale(${appear * pulse})`,
      }}
    >
      {/* Soft outer halo */}
      <div
        style={{
          position: "absolute",
          inset: -size * 0.25,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${ICON.green}22 0%, rgba(255,255,255,0) 68%)`,
        }}
      />
      {layers.map((l, i) => {
        const lt = t * l.speed + l.phase;
        const driftX = Math.sin(lt) * size * 0.03;
        const driftY = Math.cos(lt * 0.9) * size * 0.03;
        const d = size * l.sizeFactor;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: size / 2 - d / 2 + l.dx * size + driftX,
              top: size / 2 - d / 2 + l.dy * size + driftY,
              width: d,
              height: d * 0.92,
              borderRadius: "50%",
              background: `radial-gradient(circle at 40% 35%, ${l.color} 0%, ${l.color}00 70%)`,
              opacity: l.alpha,
              filter: `blur(${l.blur}px)`,
              mixBlendMode: "multiply",
            }}
          />
        );
      })}
      {/* Bright soft core */}
      <div
        style={{
          position: "absolute",
          left: size * 0.34,
          top: size * 0.34,
          width: size * 0.32,
          height: size * 0.32,
          borderRadius: "50%",
          background: `radial-gradient(circle, #FFFFFF 0%, ${ICON.lime}88 55%, rgba(255,255,255,0) 75%)`,
          filter: "blur(14px)",
        }}
      />
    </div>
  );
};
