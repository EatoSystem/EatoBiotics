import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ICON } from "../lib/brand";

/**
 * A slow "heartbeat" aura behind the figure: a soft radial glow that pulses on a
 * double-thump rhythm and crossfades green ↔ warm gold. Periods are chosen to
 * divide the loop length so it restarts seamlessly.
 */
export const AuraGlow: React.FC<{
  /** Diameter as a fraction of the smaller canvas axis. */
  sizePct?: number;
  /** Pulse period in seconds (use a divisor of the loop length). */
  beatSec?: number;
  /** Colour-shift period in seconds (use a divisor of the loop length). */
  hueSec?: number;
}> = ({ sizePct = 0.95, beatSec = 4, hueSec = 8 }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  // Double-thump heartbeat: a sharp beat + a softer echo.
  const phase = (t % beatSec) / beatSec;
  const thump =
    Math.exp(-Math.pow((phase - 0.0) * 6, 2)) +
    0.5 * Math.exp(-Math.pow((phase - 0.18) * 7, 2));
  const pulse = 0.82 + 0.26 * thump;

  // Smooth green↔gold crossfade.
  const mix = 0.5 + 0.5 * Math.sin((t / hueSec) * Math.PI * 2);

  const base = Math.min(width, height) * sizePct * pulse;
  const cx = width / 2;
  const cy = height / 2;

  const layer = (color: string, opacity: number) => (
    <div
      style={{
        position: "absolute",
        width: base,
        height: base,
        left: cx - base / 2,
        top: cy - base / 2,
        borderRadius: "50%",
        background: `radial-gradient(circle at 50% 46%, ${color}3a 0%, ${color}1c 34%, rgba(255,255,255,0) 68%)`,
        filter: "blur(30px)",
        opacity,
      }}
    />
  );

  return (
    <AbsoluteFill>
      {layer(ICON.green, 1 - mix)}
      {layer(ICON.yellow, mix)}
    </AbsoluteFill>
  );
};
