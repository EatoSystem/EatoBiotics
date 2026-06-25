import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { ICON, ANIM } from "../lib/brand";

/**
 * Slow, elegant orbital energy rings around the figure — SVG ellipses with a
 * brand-gradient stroke that rotate gently at different speeds/tilts to enhance
 * the rings in the hero art. Calm, not spinning.
 */
export const SystemEnergyRings: React.FC<{
  startFrame?: number;
  /** Number of rings. */
  count?: number;
  /** Diameter of the largest ring as a fraction of canvas height. */
  sizePct?: number;
}> = ({ startFrame = 0, count = 3, sizePct = 1.0 }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const enter = spring({ frame: frame - startFrame, fps, config: ANIM.spring });
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  const base = height * sizePct;
  const cx = width / 2;
  const cy = height / 2;

  const rings = new Array(count).fill(0).map((_, i) => {
    const scale = 1 - i * 0.16;
    const rx = (base / 2) * scale;
    const ry = rx * (0.62 - i * 0.04); // flattened = perspective tilt
    const speed = (i % 2 === 0 ? 1 : -1) * (3 + i * 1.5); // deg/sec, alternating
    const tilt = -18 + i * 12;
    const rot = (frame / fps) * speed;
    return { rx, ry, tilt, rot, dash: i === count - 1 ? "2 14" : undefined, op: 0.5 - i * 0.1 };
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="eato-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ICON.lime} />
            <stop offset="40%" stopColor={ICON.green} />
            <stop offset="70%" stopColor={ICON.yellow} />
            <stop offset="100%" stopColor={ICON.orange} />
          </linearGradient>
        </defs>
        {rings.map((r, i) => (
          <g key={i} transform={`rotate(${r.tilt + r.rot} ${cx} ${cy})`}>
            <ellipse
              cx={cx}
              cy={cy}
              rx={r.rx}
              ry={r.ry}
              fill="none"
              stroke="url(#eato-ring-grad)"
              strokeWidth={2}
              strokeDasharray={r.dash}
              opacity={r.op}
            />
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
