/**
 * PhoneFrame — a CSS device frame wrapping a mocked app screen.
 * `platform="ios"` renders a Dynamic-Island-style pill; `"android"` a
 * hole-punch camera and slightly tighter radii. Screens are authored at a
 * 390×844 logical viewport and scaled to fit via the `scale` prop.
 * Concept-only.
 */

import type { ReactNode } from "react"
import { APP } from "./theme"

export function PhoneFrame({
  children,
  platform = "ios",
  scale = 1,
  label,
}: {
  children: ReactNode
  platform?: "ios" | "android"
  scale?: number
  label?: string
}) {
  const W = 390
  const H = 844
  const radius = platform === "ios" ? 56 : 44

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        style={{
          width: W * scale,
          height: H * scale,
          padding: 12 * scale,
          borderRadius: radius * scale,
          background: "linear-gradient(150deg, #2a2a2e, #0c0c0e)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.45), inset 0 0 0 1.5px rgba(255,255,255,0.08)",
        }}
      >
        <div
          className="relative overflow-hidden"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: (radius - 12) * scale,
            background: APP.bg,
          }}
        >
          {/* Status bar */}
          <div
            className="absolute inset-x-0 top-0 z-20 flex items-center justify-between"
            style={{ height: 44 * scale, paddingInline: 24 * scale, color: APP.ink }}
          >
            <span style={{ fontSize: 13 * scale, fontWeight: 600 }}>9:41</span>
            <span style={{ fontSize: 11 * scale, letterSpacing: 1, opacity: 0.85 }}>
              {platform === "ios" ? "􀙇 􀉪 􀛨" : "▲ ▮ ▂▄▆"}
            </span>
          </div>

          {/* Notch / island / hole-punch */}
          {platform === "ios" ? (
            <div
              className="absolute left-1/2 z-30 -translate-x-1/2 rounded-full"
              style={{ top: 11 * scale, width: 108 * scale, height: 30 * scale, background: "#050505" }}
            />
          ) : (
            <div
              className="absolute left-1/2 z-30 -translate-x-1/2 rounded-full"
              style={{ top: 12 * scale, width: 12 * scale, height: 12 * scale, background: "#050505", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.12)" }}
            />
          )}

          {/* Screen content, offset below the status bar */}
          <div className="absolute inset-0 z-10" style={{ paddingTop: 44 * scale }}>
            {children}
          </div>

          {/* Home indicator */}
          <div
            className="absolute left-1/2 z-20 -translate-x-1/2 rounded-full"
            style={{
              bottom: 8 * scale,
              width: (platform === "ios" ? 128 : 96) * scale,
              height: 5 * scale,
              background: "rgba(27,42,32,0.35)",
            }}
          />
        </div>
      </div>
      {label && (
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
          {label}
        </span>
      )}
    </div>
  )
}
