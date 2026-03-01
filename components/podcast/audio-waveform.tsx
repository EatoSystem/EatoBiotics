"use client"

/**
 * Animated decorative waveform — purely visual, signals "podcast" instantly.
 * Uses deterministic sine-wave heights + CSS animation for a living pulse.
 */
export function AudioWaveform() {
  const bars = Array.from({ length: 48 }, (_, i) => {
    const t = i / 48
    const h =
      0.3 +
      0.25 * Math.sin(t * Math.PI * 2) +
      0.15 * Math.sin(t * Math.PI * 4 + 0.5) +
      0.1 * Math.sin(t * Math.PI * 6 + 1) +
      0.08 * Math.cos(t * Math.PI * 3)
    return Math.max(0.15, Math.min(0.95, h))
  })

  return (
    <div className="relative mx-auto max-w-[500px] py-2">
      <div className="flex h-14 items-center justify-center gap-[2px] sm:h-16">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-full"
            style={{
              height: `${h * 100}%`,
              background:
                "linear-gradient(to top, var(--icon-lime), var(--icon-green), var(--icon-teal))",
              animation: `waveform-pulse 2.5s ease-in-out ${i * 0.05}s infinite alternate`,
              opacity: 0.65,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes waveform-pulse {
          0%   { transform: scaleY(0.5);  opacity: 0.35; }
          50%  { transform: scaleY(1);    opacity: 0.75; }
          100% { transform: scaleY(0.55); opacity: 0.4;  }
        }
      `}</style>
    </div>
  )
}
