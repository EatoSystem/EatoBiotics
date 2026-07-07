/**
 * HeroStage — a cinematic ambient wrapper for the /digital-twin hero figure/video.
 * Layers behind/around its children: a big radial brand glow, 2–3 slow orbital
 * rings, and large slow-drifting particles. CSS-only motion (eb-* classes,
 * reduced-motion gated). Server component. Brand palette only.
 */

const BIG_PARTICLES = [
  { l: "12%", t: "22%", s: 14, c: "#A8E063", g: "rgba(168,224,99,0.55)", d: 9, de: 0 },
  { l: "84%", t: "30%", s: 10, c: "#F5C518", g: "rgba(245,197,24,0.55)", d: 11, de: 1.4 },
  { l: "20%", t: "72%", s: 12, c: "#2DAA6E", g: "rgba(45,170,110,0.5)", d: 10, de: 0.8 },
  { l: "78%", t: "70%", s: 9, c: "#F5A623", g: "rgba(245,166,35,0.55)", d: 12, de: 2.2 },
  { l: "50%", t: "12%", s: 8, c: "#4CB648", g: "rgba(76,182,72,0.5)", d: 10.5, de: 1.0 },
  { l: "8%", t: "48%", s: 9, c: "#F5C518", g: "rgba(245,197,24,0.5)", d: 13, de: 2.8 },
  { l: "90%", t: "50%", s: 11, c: "#A8E063", g: "rgba(168,224,99,0.5)", d: 9.5, de: 0.4 },
  { l: "34%", t: "86%", s: 7, c: "#F5A623", g: "rgba(245,166,35,0.5)", d: 12.5, de: 3.4 },
  { l: "66%", t: "88%", s: 8, c: "#2DAA6E", g: "rgba(45,170,110,0.5)", d: 11.5, de: 1.8 },
  { l: "44%", t: "60%", s: 6, c: "#A8E063", g: "rgba(168,224,99,0.5)", d: 10, de: 2.4 },
]

export function HeroStage({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex aspect-square w-[min(640px,82vw)] items-center justify-center">
      {/* big soft radial glow */}
      <div
        aria-hidden
        className="eb-aura pointer-events-none absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: "118%",
          height: "118%",
          transform: "translate(-50%,-50%)",
          background:
            "radial-gradient(circle, rgba(168,224,99,0.40) 0%, rgba(245,197,24,0.26) 40%, rgba(245,166,35,0.12) 58%, rgba(255,255,255,0) 72%)",
        }}
      />

      {/* orbital rings */}
      <div aria-hidden className="eb-ring-spin pointer-events-none absolute inset-[4%] rounded-full"
        style={{ border: "1.5px dashed rgba(76,182,72,0.30)" }} />
      <div aria-hidden className="eb-ring-spin-rev pointer-events-none absolute inset-[13%] rounded-full"
        style={{ border: "1.5px dashed rgba(245,166,35,0.28)" }} />
      <div aria-hidden className="eb-ring-spin pointer-events-none absolute inset-[-4%] rounded-full"
        style={{ border: "1px solid rgba(45,170,110,0.18)" }} />

      {/* large drifting particles */}
      {BIG_PARTICLES.map((p, i) => (
        <span
          key={i}
          aria-hidden
          className="eb-float-big pointer-events-none absolute"
          style={{
            left: p.l,
            top: p.t,
            width: p.s,
            height: p.s,
            borderRadius: "50%",
            background: p.c,
            boxShadow: `0 0 ${p.s + 6}px 3px ${p.g}`,
            animationDuration: `${p.d}s`,
            animationDelay: `${p.de}s`,
          }}
        />
      ))}

      {/* the figure/video — no positive z-index, so mix-blend-mode: multiply blends
          against the page (white dissolves). DOM order keeps it above the layers above. */}
      <div className="relative w-[78%]">{children}</div>
    </div>
  )
}
