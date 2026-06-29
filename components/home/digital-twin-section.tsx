/**
 * "Your Digital Twin" homepage section — a faithful port of the Claude Design
 * source (Food System Loop.dc.html): a two-column layout with an animated
 * digital-twin loop diagram (five green input nodes → the living twin → five
 * orange output nodes), a system-score card, a "next best action" card, and a
 * 4-up feature strip.
 *
 * Copy keeps the approved Digital Twin framing (eyebrow / headline / CTA); the
 * rest of the design's wording is retained verbatim. Centerpiece is the in-repo
 * couple figure (`/images/couple-hero.png`) with `mix-blend-mode: multiply`, so
 * its white background dissolves into the page. CSS animations live in
 * app/globals.css (`eb-*`), gated behind prefers-reduced-motion.
 *
 * Server component; brand palette only (green/lime/teal + yellow/orange).
 */

import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight, Lock, Utensils, HeartPulse, Moon, Footprints, BarChart3,
  Search, Lightbulb, TrendingUp, Infinity as InfinityIcon, Leaf, Shield, User, RefreshCw,
} from "lucide-react"

type NodeDef = { label: string; sub: string; Icon: typeof Utensils; tx: number }

const INPUTS: NodeDef[] = [
  { label: "MEALS", sub: "What you eat", Icon: Utensils, tx: 16 },
  { label: "SYMPTOMS", sub: "How you feel", Icon: HeartPulse, tx: 4 },
  { label: "SLEEP", sub: "How you rest", Icon: Moon, tx: 0 },
  { label: "ACTIVITY", sub: "How you move", Icon: Footprints, tx: 4 },
  { label: "PROGRESS", sub: "Your updates", Icon: BarChart3, tx: 16 },
]

const OUTPUTS: NodeDef[] = [
  { label: "ANALYSE", sub: "We find patterns", Icon: Search, tx: -16 },
  { label: "UNDERSTAND", sub: "We explain what it means", Icon: Lightbulb, tx: -4 },
  { label: "RECOMMEND", sub: "Your next best action", Icon: ArrowRight, tx: 0 },
  { label: "IMPROVE", sub: "You feel better", Icon: TrendingUp, tx: -4 },
  { label: "LEARN", sub: "The loop continues", Icon: InfinityIcon, tx: -16 },
]

const FEATURES = [
  { Icon: Shield, title: "Built on science.", sub: "Rooted in the three biotics.", tint: "rgba(76,182,72,0.12)", color: "#4CB648" },
  { Icon: User, title: "Personal to you.", sub: "Your data. Your system. Your journey.", tint: "rgba(76,182,72,0.12)", color: "#4CB648" },
  { Icon: Leaf, title: "Designed to improve.", sub: "Small steps. Big change. Every day.", tint: "rgba(245,197,24,0.16)", color: "#E0A800", iconColor: "#F5C518" },
  { Icon: RefreshCw, title: "Always learning.", sub: "Your Food System never stands still.", tint: "rgba(245,166,35,0.14)", color: "#F5A623" },
]

// Rising-particle definitions (left%, bottom%, size, color, glow, duration s, delay s)
const PARTICLES = [
  { l: "46%", b: "24%", s: 7, c: "#A8E063", g: "rgba(168,224,99,0.7)", d: 4.4, de: 0 },
  { l: "52%", b: "20%", s: 5, c: "#F5C518", g: "rgba(245,197,24,0.7)", d: 5.2, de: 0.6 },
  { l: "49%", b: "28%", s: 6, c: "#F5A623", g: "rgba(245,166,35,0.7)", d: 4.8, de: 1.1 },
  { l: "43%", b: "22%", s: 4, c: "#2DAA6E", g: "rgba(45,170,110,0.7)", d: 5.6, de: 0.3 },
  { l: "55%", b: "26%", s: 6, c: "#4CB648", g: "rgba(76,182,72,0.7)", d: 5.0, de: 1.7 },
  { l: "50%", b: "18%", s: 8, c: "#F5C518", g: "rgba(245,197,24,0.75)", d: 6.0, de: 2.3 },
  { l: "47%", b: "30%", s: 4, c: "#A8E063", g: "rgba(168,224,99,0.7)", d: 4.6, de: 2.0 },
  { l: "53%", b: "24%", s: 5, c: "#F5A623", g: "rgba(245,166,35,0.7)", d: 5.4, de: 3.0 },
  { l: "45%", b: "26%", s: 5, c: "#4CB648", g: "rgba(76,182,72,0.7)", d: 5.8, de: 3.6 },
  { l: "51%", b: "32%", s: 4, c: "#2DAA6E", g: "rgba(45,170,110,0.7)", d: 4.2, de: 4.0 },
]

const CTA_GRADIENT = "linear-gradient(135deg,#A8E063 0%,#4CB648 30%,#2DAA6E 55%,#F5C518 80%,#F5A623 100%)"

function CentreStage() {
  return (
    <div style={{ position: "absolute", left: "50%", top: "42%", transform: "translate(-50%,-50%)", width: 360, height: 360, pointerEvents: "none" }}>
      {/* pulsing aura */}
      <div className="eb-aura" style={{ position: "absolute", left: "50%", top: "50%", width: 340, height: 340, transform: "translate(-50%,-50%)", borderRadius: "50%", background: "radial-gradient(circle, rgba(168,224,99,0.55) 0%, rgba(245,197,24,0.42) 44%, rgba(245,166,35,0.20) 64%, rgba(255,255,255,0) 74%)" }} />
      {/* central energy beam */}
      <div className="eb-beam" style={{ position: "absolute", left: "50%", top: "50%", width: 40, height: 250, transform: "translate(-50%,-50%)", borderRadius: 9999, background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(245,197,24,0.55) 30%, rgba(255,255,255,0.9) 50%, rgba(168,224,99,0.55) 70%, rgba(255,255,255,0) 100%)", filter: "blur(7px)" }} />
      {/* the figure */}
      <Image src="/images/couple-hero.png" alt="Your Food System Digital Twin" width={240} height={300} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 240, height: "auto", mixBlendMode: "multiply" }} />
      {/* rising energy particles */}
      {PARTICLES.map((p, i) => (
        <span key={i} className="eb-rise" style={{ position: "absolute", left: p.l, bottom: p.b, width: p.s, height: p.s, borderRadius: "50%", background: p.c, boxShadow: `0 0 ${p.s + 3}px 2px ${p.g}`, animationDuration: `${p.d}s`, animationDelay: `${p.de}s` }} />
      ))}
    </div>
  )
}

function InputNode({ n }: { n: NodeDef }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 13, transform: `translateX(${n.tx}px)` }}>
      <span style={{ flex: "none", width: 56, height: 56, borderRadius: "50%", background: "#fff", boxShadow: "0 4px 14px rgba(26,46,18,0.10)", display: "flex", alignItems: "center", justifyContent: "center", color: "#4CB648" }}>
        <n.Icon size={24} strokeWidth={2} />
      </span>
      <span>
        <span style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", color: "#4CB648" }}>{n.label}</span>
        <span style={{ display: "block", fontSize: 14, color: "#5A6E50" }}>{n.sub}</span>
      </span>
    </div>
  )
}

function OutputNode({ n }: { n: NodeDef }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, flexDirection: "row-reverse", textAlign: "right", transform: `translateX(${n.tx}px)` }}>
      <span style={{ flex: "none", width: 56, height: 56, borderRadius: "50%", background: "#fff", boxShadow: "0 4px 14px rgba(26,46,18,0.10)", display: "flex", alignItems: "center", justifyContent: "center", color: "#F5A623" }}>
        <n.Icon size={24} strokeWidth={2} />
      </span>
      <span>
        <span style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", color: "#F5A623" }}>{n.label}</span>
        <span style={{ display: "block", fontSize: 14, color: "#5A6E50" }}>{n.sub}</span>
      </span>
    </div>
  )
}

export function DigitalTwinSection() {
  return (
    <section id="digital-twin" style={{ background: "#FFFFFF", color: "#1A2E12", padding: "96px 24px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* top: two-column (stacks on mobile) */}
        <div className="dt-grid">
          {/* LEFT: copy */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "7px 16px", border: "1px solid #E5E5E5", borderRadius: 9999, background: "#fff" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4CB648" }} />
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#4CB648" }}>Your Digital Twin</span>
            </div>

            <h2 style={{ fontFamily: "var(--font-lora), Georgia, serif", fontWeight: 700, fontSize: "clamp(2.4rem,3.6vw,3.5rem)", lineHeight: 1.04, letterSpacing: "-0.02em", margin: "28px 0 0" }}>
              <span style={{ color: "#1A2E12" }}>Build your</span><br />
              <span style={{ color: "#4CB648" }}>Digital</span><br />
              <span style={{ color: "#F5A623" }}>Twin.</span>
            </h2>

            <div style={{ width: 64, height: 3, borderRadius: 9999, background: "#4CB648", margin: "28px 0" }} />

            <p style={{ fontSize: 18, lineHeight: 1.65, color: "#5A6E50", maxWidth: 380, margin: 0 }}>
              Every meal, symptom, habit and update feeds your Food System Digital Twin, which learns, adapts and guides you to feel your best.
            </p>

            <Link href="/assessment" style={{ display: "inline-flex", alignItems: "center", gap: 12, marginTop: 36, padding: "18px 30px", borderRadius: 9999, background: CTA_GRADIENT, color: "#fff", fontSize: 17, fontWeight: 600, textDecoration: "none", boxShadow: "0 10px 30px rgba(76,182,72,0.25)" }}>
              Build My Digital Twin
              <ArrowRight size={20} strokeWidth={2.2} />
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 20, color: "#5A6E50", fontSize: 15 }}>
              <Lock size={16} strokeWidth={2} color="#4CB648" />
              Takes 5 minutes. No account required.
            </div>
          </div>

          {/* RIGHT: loop diagram (desktop) */}
          <div className="dt-diagram" style={{ position: "relative", width: "100%", maxWidth: 840, height: 580, minWidth: 0, margin: "0 auto" }}>
            <svg viewBox="0 0 880 600" fill="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }} aria-hidden>
              <defs>
                <linearGradient id="ebGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#A8E063" /><stop offset="1" stopColor="#2DAA6E" /></linearGradient>
                <linearGradient id="ebOrange" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F5C518" /><stop offset="1" stopColor="#F5A623" /></linearGradient>
              </defs>
              <path className="eb-arc" d="M 440 24 A 388 276 0 0 0 440 576" stroke="url(#ebGreen)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 11" />
              <path className="eb-arc-rev" d="M 440 24 A 388 276 0 0 1 440 576" stroke="url(#ebOrange)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 11" />
              <circle cx="120" cy="120" r="4.5" fill="#4CB648" />
              <circle cx="62" cy="300" r="4.5" fill="#2DAA6E" />
              <circle cx="120" cy="480" r="4.5" fill="#2DAA6E" />
              <circle cx="760" cy="120" r="4.5" fill="#F5A623" />
              <circle cx="818" cy="300" r="4.5" fill="#F5A623" />
              <circle cx="760" cy="480" r="4.5" fill="#F5A623" />
              <path d="M 524 22 h 18" stroke="#4CB648" strokeWidth="2.5" strokeLinecap="round" />
              <path d="m 538 16 7 6 -7 6" stroke="#4CB648" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <CentreStage />

            {/* score card */}
            <div style={{ position: "absolute", left: "50%", top: "62%", transform: "translateX(-50%)", background: "#fff", border: "1px solid #EFEFEF", borderRadius: 16, boxShadow: "0 12px 32px rgba(26,46,18,0.12)", padding: "16px 26px", textAlign: "center", minWidth: 158 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#1A2E12", lineHeight: 1.3 }}>YOUR FOOD SYSTEM<br />DIGITAL TWIN</div>
              <div style={{ fontFamily: "var(--font-lora), Georgia, serif", fontWeight: 700, fontSize: 50, lineHeight: 1, color: "#4CB648", margin: "8px 0 4px" }}>74</div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#5A6E50" }}>SYSTEM SCORE</div>
            </div>

            {/* LEFT input nodes */}
            <div style={{ position: "absolute", left: 0, top: "6%", bottom: "6%", width: 200, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              {INPUTS.map((n) => <InputNode key={n.label} n={n} />)}
            </div>
            {/* RIGHT output nodes */}
            <div style={{ position: "absolute", right: 0, top: "6%", bottom: "6%", width: 200, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              {OUTPUTS.map((n) => <OutputNode key={n.label} n={n} />)}
            </div>
          </div>

          {/* RIGHT: diagram (mobile fallback) */}
          <div className="dt-diagram-mobile">
            <div style={{ position: "relative", width: "70%", maxWidth: 280, aspectRatio: "1", margin: "0 auto" }}>
              <Image src="/images/couple-hero.png" alt="Your Food System Digital Twin" width={280} height={350} style={{ width: "100%", height: "auto", mixBlendMode: "multiply" }} />
            </div>
            <div style={{ marginTop: 8, textAlign: "center", fontFamily: "var(--font-lora), Georgia, serif", fontWeight: 700, fontSize: 40, color: "#4CB648", lineHeight: 1 }}>74<span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#5A6E50" }}>SYSTEM SCORE</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{INPUTS.map((n) => <InputNode key={n.label} n={{ ...n, tx: 0 }} />)}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{OUTPUTS.map((n) => <OutputNode key={n.label} n={{ ...n, tx: 0 }} />)}</div>
            </div>
          </div>
        </div>

        {/* next best action */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: -8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, background: "#fff", border: "1px solid #EDEDED", borderRadius: 20, boxShadow: "0 14px 38px rgba(26,46,18,0.10)", padding: "18px 22px", maxWidth: 520, width: "100%" }}>
            <span style={{ flex: "none", width: 62, height: 62, borderRadius: "50%", background: "linear-gradient(135deg,#A8E063 0%,#4CB648 40%,#F5C518 75%,#F5A623 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <Leaf size={28} strokeWidth={2} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4CB648" }}>Your Next Best Action</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "#1A2E12", lineHeight: 1.3, marginTop: 4 }}>Add one fermented food to your next meal.</div>
            </div>
            <Link href="/assessment" aria-label="Start" style={{ flex: "none", width: 46, height: 46, borderRadius: "50%", border: "1.5px solid #F5A623", display: "flex", alignItems: "center", justifyContent: "center", color: "#F5A623", textDecoration: "none" }}>
              <ArrowRight size={22} strokeWidth={2.2} />
            </Link>
          </div>
        </div>

        {/* feature strip */}
        <div className="dt-features" style={{ gap: 24, marginTop: 48, padding: "30px 36px", border: "1px solid #EDEDED", borderRadius: 24, background: "#fff", boxShadow: "0 2px 8px rgba(26,46,18,0.04)" }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <span style={{ flex: "none", width: 48, height: 48, borderRadius: "50%", background: f.tint, display: "flex", alignItems: "center", justifyContent: "center", color: f.iconColor ?? f.color }}>
                <f.Icon size={22} strokeWidth={2} />
              </span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: f.color }}>{f.title}</div>
                <div style={{ fontSize: 14, color: "#5A6E50", lineHeight: 1.45, marginTop: 2 }}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
