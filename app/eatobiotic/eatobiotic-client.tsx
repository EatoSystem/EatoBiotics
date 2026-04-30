"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight, ArrowUpRight,
  Mic, MicOff, CheckCircle,
  MessageSquare, Send,
  Leaf, Droplets, Zap, Dumbbell,
  Check,
} from "lucide-react"
import { useConversation } from "@11labs/react"
import { ScrollReveal } from "@/components/scroll-reveal"

type Status = "idle" | "connecting" | "active" | "ended"
type ActiveTab = "voice" | "text"

/* ── Data ─────────────────────────────────────────────────────────── */

const TOPICS = [
  {
    emoji: "🥗",
    title: "Your Plate",
    description: "Ask about the four EatoBiotics plates and which fits where you are right now.",
    accent: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  {
    emoji: "🦠",
    title: "Your Gut",
    description: "Explore your gut health, digestion patterns, and the microbiome foods that support you.",
    accent: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  },
  {
    emoji: "🌿",
    title: "The Three Biotics",
    description: "Understand Prebiotics, Probiotics, and Postbiotics — and how to build more of each into your week.",
    accent: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
  },
  {
    emoji: "📊",
    title: "Your Biotics Score",
    description: "Explore what your score means and what you can do this week to move it forward.",
    accent: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
  {
    emoji: "📅",
    title: "Weekly Food Planning",
    description: "Build a personalised weekly food plan that fits your plate, habits, and goals.",
    accent: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
  },
  {
    emoji: "🌍",
    title: "Food, Community & Environment",
    description: "Understand how your food choices connect to your community, culture, and the environment.",
    accent: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))",
  },
]

const PLATE_PARTS = [
  {
    Icon: Leaf,
    name: "Prebiotic Base",
    description: "Plants, fibres, grains, pulses, vegetables, herbs, and fruits that feed your gut ecosystem.",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    accent: "var(--icon-lime)",
  },
  {
    Icon: Droplets,
    name: "Probiotic Side",
    description: "Fermented foods and live cultures that support microbial diversity.",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
    accent: "var(--icon-teal)",
  },
  {
    Icon: Zap,
    name: "Postbiotic Builders",
    description: "Foods and habits that help your gut produce beneficial compounds.",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    accent: "var(--icon-yellow)",
  },
  {
    Icon: Dumbbell,
    name: "Protein Balance",
    description: "Quality protein to support strength, repair, metabolism, and satiety.",
    gradient: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
    accent: "var(--icon-orange)",
  },
]

const REPORTS = [
  {
    tag: "Essential",
    price: "€50",
    tagline: "A clear summary with practical next steps.",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    features: [
      "Conversation summary",
      "Key food and gut-health insights",
      "Your current EatoBiotics priorities",
      "3 recommended actions for the week",
      "Simple food suggestions",
    ],
    cta: "Generate Essential Report",
    href: "/report/essential",
    highlight: false,
  },
  {
    tag: "Advanced",
    price: "€75",
    tagline: "A deeper analysis of your plate, habits, and Biotics Score.",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    features: [
      "Everything in the Essential Report",
      "Personal EatoBiotics Plate analysis",
      "Prebiotic, Probiotic, Postbiotic & Protein Balance review",
      "Weekly improvement plan",
      "Shopping and meal suggestions",
      "Biotics Score improvement guidance",
    ],
    cta: "Generate Advanced Report",
    href: "/report/advanced",
    highlight: true,
  },
  {
    tag: "Complete",
    price: "€100",
    tagline: "The most detailed report and a full personal food system plan.",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    features: [
      "Everything in the Advanced Report",
      "Full Personal Food System Map",
      "Gut-health, plate, habits, kitchen, community & environment review",
      "7-day EatoBiotics food plan",
      "Seasonal food recommendations",
      "Sustainability and community impact suggestions",
      "Long-term EatoBiotics improvement roadmap",
    ],
    cta: "Generate Complete Report",
    href: "/report/complete",
    highlight: false,
  },
]

const PROMPT_CHIPS = [
  "How can I improve my breakfast?",
  "What foods support my gut this week?",
  "How can I improve my Biotics Score?",
  "What are the best prebiotic foods for me?",
  "How do I build a better weekly food plan?",
  "How can I eat better for my health, community, and environment?",
]

const JOURNEY_STEPS = [
  { num: 1, label: "Get your Biotics Score", word: "Assess" },
  { num: 2, label: "Speak or text with your Food System Expert", word: "Ask" },
  { num: 3, label: "Generate your personalised EatoBiotics Report", word: "Understand" },
  { num: 4, label: "Build your weekly food system plan", word: "Improve" },
]

/* ── Waveform ─────────────────────────────────────────────────────── */
function Waveform() {
  return (
    <div className="flex items-center justify-center gap-1.5 h-full" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-1.5 rounded-full"
          style={{
            height: "100%",
            background:
              "linear-gradient(180deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
            animation: `wave 1.2s ease-in-out infinite`,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          0%, 100% { height: 8px;  opacity: 0.5; }
          50%       { height: 40px; opacity: 1;   }
        }
      `}</style>
    </div>
  )
}

/* ── Orb ──────────────────────────────────────────────────────────── */
function Orb({ fast = false }: { fast?: boolean }) {
  return (
    <div
      className="flex h-28 w-28 items-center justify-center rounded-full"
      style={{
        background:
          "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
        animation: `orbPulse ${fast ? "0.8s" : "2s"} ease-in-out infinite`,
        boxShadow: "0 0 40px 10px color-mix(in srgb, var(--icon-green) 30%, transparent)",
      }}
    >
      <Mic size={36} className="text-white" />
      <style>{`
        @keyframes orbPulse {
          0%, 100% { transform: scale(1);    opacity: 0.9; }
          50%       { transform: scale(1.08); opacity: 1;   }
        }
      `}</style>
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────────── */
export function EatobioticClient() {
  const [status, setStatus] = useState<Status>("idle")
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>("voice")
  const [textInput, setTextInput] = useState("")
  const [textSent, setTextSent] = useState(false)

  const sessionRef = useRef<HTMLDivElement>(null)

  const conversation = useConversation({
    onConnect:    () => setStatus("active"),
    onDisconnect: () => setStatus((s) => s === "active" ? "ended" : s),
    onError:      (err: unknown) => {
      setError(err instanceof Error ? err.message : String(err))
      setStatus("idle")
    },
  })

  const startSession = useCallback(async () => {
    setError(null)
    setStatus("connecting")
    try {
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? "demo",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect. Please try again.")
      setStatus("idle")
    }
  }, [conversation])

  const endSession = useCallback(async () => {
    await conversation.endSession()
    setStatus("ended")
  }, [conversation])

  const toggleMute = useCallback(async () => {
    await conversation.setVolume({ volume: muted ? 1 : 0 })
    setMuted((m) => !m)
  }, [conversation, muted])

  const scrollToSession = () =>
    sessionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })

  const reset = () => { setStatus("idle"); setError(null); setMuted(false) }

  const handleChipClick = (chip: string) => {
    setTextInput(chip)
    setActiveTab("text")
    setTextSent(false)
    scrollToSession()
  }

  const handleTextSend = () => {
    if (!textInput.trim()) return
    setTextSent(true)
  }

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <>
      {/* ── A. Hero ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen overflow-hidden px-6 pt-20">
        <div className="relative z-10 mx-auto flex max-w-[1200px] min-h-[calc(100vh-80px)] flex-col items-center justify-center gap-12 md:flex-row md:gap-16 lg:gap-20">

          {/* Image */}
          <ScrollReveal delay={60} className="flex-1 flex items-center justify-center w-full max-w-[540px]">
            <div className="relative w-full">
              <Image
                src="/eatobiotic-hero.png"
                alt="EatoBiotics — your food system"
                width={900}
                height={900}
                priority
                className="w-full h-auto max-h-[70vw] object-contain md:max-h-none"
              />
            </div>
          </ScrollReveal>

          {/* Text */}
          <div className="flex-1 text-left max-w-[560px]">
            <ScrollReveal>
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-green mb-3">
                Your Food System Expert
              </p>
              <h1
                className="font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl text-balance"
                style={{
                  background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Understand the food system inside you.
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                Speak or text with your EatoBiotics Food System Expert to explore your plate, gut health, Biotics Score, and the foods that help you thrive.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={scrollToSession}
                  className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
                >
                  Start your free session <ArrowRight size={16} />
                </button>
                <Link
                  href="/assessment"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-icon-green px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white"
                >
                  Get your Biotics Score
                </Link>
              </div>
              <div className="flex items-center gap-1.5 mt-4">
                <span className="biotic-pill bg-icon-lime" />
                <span className="biotic-pill bg-icon-green" />
                <span className="biotic-pill bg-icon-teal" />
                <span className="biotic-pill bg-icon-yellow" />
                <span className="biotic-pill bg-icon-orange" />
              </div>
            </ScrollReveal>
          </div>

        </div>
      </section>

      <div className="section-divider" />

      {/* ── B. Journey strip ─────────────────────────────────────── */}
      <section className="px-6 py-12 md:py-16">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-icon-green mb-8">
              Assess · Ask · Understand · Improve
            </p>
          </ScrollReveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEY_STEPS.map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 60}>
                <div className="relative flex flex-col items-center text-center gap-3 rounded-2xl border border-border bg-background p-6">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }}
                  >
                    {step.num}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
                    {step.word}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── C. Session section ───────────────────────────────────── */}
      <section ref={sessionRef} className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green mb-2">
              Your Session
            </p>
            <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              Choose how you want to begin
            </h2>
            <p className="mt-3 text-base text-muted-foreground max-w-lg">
              Voice feels personal and natural. Text is simple, private, and flexible. Both connect you to the same Food System Expert.
            </p>
          </ScrollReveal>

          {/* Mobile tab toggle */}
          <ScrollReveal delay={60}>
            <div className="mt-8 flex rounded-xl border border-border bg-secondary/40 p-1 md:hidden">
              {(["voice", "text"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                    activeTab === tab
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "voice" ? <Mic size={14} /> : <MessageSquare size={14} />}
                  {tab === "voice" ? "Voice" : "Text"}
                </button>
              ))}
            </div>
          </ScrollReveal>

          {/* Cards */}
          <div className="mt-6 grid gap-6 md:grid-cols-2">

            {/* Voice card */}
            <ScrollReveal delay={80}>
              <div className={`rounded-2xl border bg-background p-6 md:p-8 transition-all ${activeTab === "text" ? "hidden md:block" : ""} border-border`}>
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }}
                  >
                    <Mic size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-lg">Voice Session</p>
                    <p className="text-sm text-muted-foreground">Talk naturally with your Food System Expert.</p>
                  </div>
                </div>

                {/* State machine */}
                <div className="flex flex-col items-center gap-5 py-4">

                  {status === "idle" && (
                    <>
                      <Orb />
                      <p className="font-serif text-lg font-semibold text-foreground">Your Expert is ready.</p>
                      <p className="text-sm text-muted-foreground">Tap to begin your conversation.</p>
                      {error && <p className="text-sm text-destructive">{error}</p>}
                      <button
                        onClick={startSession}
                        className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 hover:opacity-90 transition-all"
                      >
                        Start speaking <ArrowRight size={16} />
                      </button>
                    </>
                  )}

                  {status === "connecting" && (
                    <>
                      <Orb fast />
                      <p className="font-serif text-lg font-semibold text-foreground">Connecting…</p>
                      <p className="text-sm text-muted-foreground">Your Expert will be with you in a moment.</p>
                    </>
                  )}

                  {status === "active" && (
                    <>
                      <div className="flex h-28 w-28 items-center justify-center">
                        <Waveform />
                      </div>
                      <span
                        className="rounded-full px-4 py-1.5 text-sm font-semibold"
                        style={{
                          background: conversation.isSpeaking
                            ? "color-mix(in srgb, var(--icon-teal) 12%, var(--background))"
                            : "color-mix(in srgb, var(--icon-lime) 12%, var(--background))",
                          color: conversation.isSpeaking ? "var(--icon-teal)" : "var(--icon-green)",
                        }}
                      >
                        {conversation.isSpeaking ? "Your Expert is speaking…" : "Listening…"}
                      </span>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={toggleMute}
                          className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-secondary"
                          aria-label={muted ? "Unmute" : "Mute"}
                        >
                          {muted
                            ? <MicOff size={20} className="text-muted-foreground" />
                            : <Mic size={20} className="text-foreground" />
                          }
                        </button>
                      </div>
                      <button
                        onClick={endSession}
                        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                      >
                        End session
                      </button>
                    </>
                  )}

                  {status === "ended" && (
                    <>
                      <div
                        className="flex h-20 w-20 items-center justify-center rounded-full"
                        style={{ background: "color-mix(in srgb, var(--icon-green) 12%, var(--background))" }}
                      >
                        <CheckCircle size={40} style={{ color: "var(--icon-green)" }} />
                      </div>
                      <p className="font-serif text-xl font-semibold text-foreground">Session complete.</p>
                      <p className="text-sm text-muted-foreground max-w-xs text-center">
                        Great conversation. Come back any time your food system needs a guide.
                      </p>
                      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        <button
                          onClick={reset}
                          className="brand-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-md shadow-icon-green/20 hover:opacity-90 transition-all"
                        >
                          Start a new session
                        </button>
                        <Link
                          href="/assessment"
                          className="inline-flex items-center gap-1.5 rounded-full border-2 border-icon-green px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white"
                        >
                          Take the assessment <ArrowUpRight size={14} />
                        </Link>
                      </div>
                    </>
                  )}

                </div>
              </div>
            </ScrollReveal>

            {/* Text card */}
            <ScrollReveal delay={120}>
              <div className={`rounded-2xl border bg-background p-6 md:p-8 transition-all ${activeTab === "voice" ? "hidden md:block" : ""} border-border`}>
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))" }}
                  >
                    <MessageSquare size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-lg">Text Session</p>
                    <p className="text-sm text-muted-foreground">Prefer to write? Ask your Expert anything by text.</p>
                  </div>
                </div>

                {/* Input area */}
                <div className="flex flex-col gap-4">
                  {textSent ? (
                    <div
                      className="rounded-xl p-5 text-sm leading-relaxed"
                      style={{ background: "color-mix(in srgb, var(--icon-green) 8%, var(--background))" }}
                    >
                      <p className="font-semibold text-foreground mb-1">Thanks for your question.</p>
                      <p className="text-muted-foreground">
                        Text conversations are coming soon. In the meantime, start a voice session or get your Biotics Score to prepare.
                      </p>
                      <button
                        onClick={() => { setTextSent(false); setTextInput("") }}
                        className="mt-3 text-xs text-icon-green underline underline-offset-2 hover:opacity-80 transition-opacity"
                      >
                        Ask another question
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <textarea
                        rows={4}
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleTextSend()
                          }
                        }}
                        placeholder="Ask about your plate, gut health, Biotics Score, or weekly food plan…"
                        className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:border-icon-green focus:outline-none focus:ring-1 focus:ring-icon-green/30"
                      />
                      <button
                        onClick={handleTextSend}
                        disabled={!textInput.trim()}
                        className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-lg text-white transition-all disabled:opacity-30"
                        style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
                        aria-label="Send"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  )}

                  {/* Quick-fill chips */}
                  {!textSent && (
                    <div className="flex flex-wrap gap-2">
                      {["What should I eat this week?", "How do I improve my Biotics Score?", "What is my Prebiotic Base?"].map((chip) => (
                        <button
                          key={chip}
                          onClick={() => { setTextInput(chip); setTextSent(false) }}
                          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-icon-green hover:text-foreground"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    Text conversations are coming soon. Voice is available now.
                  </p>
                </div>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── D. What your Expert can help with ───────────────────── */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green mb-2">
              What your Expert covers
            </p>
            <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              Ask about anything in your food system.
            </h2>
          </ScrollReveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map((t, i) => (
              <ScrollReveal key={t.title} delay={i * 60}>
                <div className="relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background p-6 h-full">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: t.gradient }} />
                  <span className="text-4xl">{t.emoji}</span>
                  <p className="mt-4 text-xs font-bold uppercase tracking-widest" style={{ color: t.accent }}>
                    {t.title}
                  </p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{t.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── E. The EatoBiotics Plate ─────────────────────────────── */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green mb-2">
              The Framework
            </p>
            <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              The EatoBiotics Plate
            </h2>
            <p className="mt-3 text-base text-muted-foreground max-w-md">
              Four parts. Four jobs. One complete food system.
            </p>
          </ScrollReveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {PLATE_PARTS.map((part, i) => (
              <ScrollReveal key={part.name} delay={i * 60}>
                <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-background p-6">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: part.gradient }} />
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: part.gradient }}
                  >
                    <part.Icon size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{part.name}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{part.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── F. Example questions ─────────────────────────────────── */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green mb-2">
              Start the conversation
            </p>
            <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              Not sure where to start?
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Try one of these with your Expert.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="mt-8 flex flex-wrap gap-3">
              {PROMPT_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleChipClick(chip)}
                  className="rounded-full border border-border bg-background px-5 py-2.5 text-sm text-foreground transition-colors hover:border-icon-green hover:bg-secondary"
                >
                  {chip}
                </button>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── G. Report section ────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green mb-2">
              Personalised Reports
            </p>
            <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              Generate your personalised EatoBiotics Report
            </h2>
            <p className="mt-3 text-base text-muted-foreground max-w-lg">
              After your conversation, turn your insights into a detailed personal food system plan.
            </p>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {REPORTS.map((report, i) => (
              <ScrollReveal key={report.tag} delay={i * 80}>
                <div
                  className={`relative flex flex-col overflow-hidden rounded-2xl bg-background p-6 h-full ${
                    report.highlight
                      ? "border-2 border-icon-green shadow-xl shadow-icon-green/10"
                      : "border border-border"
                  }`}
                >
                  {/* Most Popular badge */}
                  {report.highlight && (
                    <div
                      className="absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
                    >
                      Most Popular
                    </div>
                  )}

                  {/* Gradient bar */}
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: report.gradient }} />

                  {/* Tag */}
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--icon-green)" }}>
                    {report.tag}
                  </p>

                  {/* Price */}
                  <p className="font-serif text-4xl font-bold text-foreground">{report.price}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{report.tagline}</p>

                  {/* Features */}
                  <ul className="mt-6 flex flex-col gap-2.5 flex-1">
                    {report.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                        <Check size={14} className="shrink-0 mt-0.5" style={{ color: "var(--icon-green)" }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={report.href}
                    className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all ${
                      report.highlight
                        ? "brand-gradient text-white shadow-lg shadow-icon-green/20 hover:opacity-90"
                        : "border-2 border-icon-green text-foreground hover:bg-icon-green hover:text-white"
                    }`}
                  >
                    {report.cta} <ArrowRight size={14} />
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── H. Trust section ─────────────────────────────────────── */}
      <section className="px-6 py-12 md:py-16">
        <div className="mx-auto max-w-[600px] text-center">
          <ScrollReveal>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your Food System Expert is designed for education and personal food-system guidance. It does not replace medical advice, diagnosis, or treatment. For medical concerns, please speak with a qualified health professional.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── I. Final CTA ─────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              Ready to understand your food system?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              EatoBiotics helps you understand and improve the food system inside you — so you can eat better for your health, your community, and the environment.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={scrollToSession}
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 hover:opacity-90 transition-all"
              >
                Start your free session <ArrowRight size={16} />
              </button>
              <Link
                href="/assessment"
                className="inline-flex items-center gap-2 rounded-full border-2 border-icon-green px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white"
              >
                Get your Biotics Score
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
