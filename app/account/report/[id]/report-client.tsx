"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus,
  MessageSquare, Send, ChevronRight, Target, Activity,
} from "lucide-react"
import type { WeeklyReportJson } from "@/app/api/weekly-report/generate/route"

/* ── Types ───────────────────────────────────────────────────────────── */

interface Message { role: "user" | "assistant"; content: string }

interface Props {
  reportId:     string
  weekStarting: string
  content:      string
  reportJson:   WeeklyReportJson | null
  memberName:   string | null
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function barGradient(s: number) {
  if (s >= 60) return "linear-gradient(90deg, #A8E063, #4CB648)"
  if (s >= 30) return "linear-gradient(90deg, #F5C518, #F5A623)"
  return "linear-gradient(90deg, #F5A623, #E53E3E)"
}
function barColor(s: number) {
  if (s >= 60) return "#2d6b0e"; if (s >= 30) return "#a05a0a"; return "#b91c1c"
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-sm" style={{ color: "var(--muted-foreground)" }}>{label}</span>
      <div className="flex-1 overflow-hidden rounded-full" style={{ height: 7, background: "#ebebeb" }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: barGradient(score) }} />
      </div>
      <span className="w-7 text-right text-sm font-bold" style={{ color: barColor(score) }}>{score}</span>
    </div>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

/* ── Chat component ──────────────────────────────────────────────────── */

function ReportChat({ reportId }: { reportId: string }) {
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState("")
  const [streaming, setStreaming] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || streaming) return
    setInput(""); setError(null)
    const next: Message[] = [...messages, { role: "user", content: text }]
    setMessages(next)
    setStreaming(true)

    try {
      const res = await fetch("/api/report-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, reportId }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? "Something went wrong")
        setStreaming(false)
        return
      }
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let assistantText = ""
      setMessages((prev) => [...prev, { role: "assistant", content: "" }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split("\n").filter((l) => l.startsWith("data: "))
        for (const line of lines) {
          const payload = line.slice(6)
          if (payload === "[DONE]") break
          try {
            const parsed = JSON.parse(payload) as { text?: string }
            if (parsed.text) {
              assistantText += parsed.text
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: "assistant", content: assistantText }
                return updated
              })
            }
          } catch { /* skip malformed chunk */ }
        }
      }
    } catch (err) {
      setError("Connection error — please try again")
      console.error("[report-chat]", err)
    } finally {
      setStreaming(false)
    }
  }

  const starters = [
    "Why is my probiotic score the weakest?",
    "What should I eat this week to improve?",
    "Explain the patterns you detected",
    "Give me a high-scoring meal idea",
  ]

  return (
    <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid #ebebeb", boxShadow: "0 2px 16px rgba(26,46,18,0.07)" }}>
      {/* Header */}
      <div className="px-5 py-4" style={{ background: "linear-gradient(135deg, #6aab28 0%, #2e8c2a 40%, #c49610 75%, #c47010 100%)" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.18)" }}>
            <MessageSquare size={16} color="white" />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.55)" }}>
              Ask EatoBiotic
            </p>
            <p className="font-serif text-base font-bold text-white">Chat about this report</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="min-h-[240px] space-y-4 px-5 py-4" style={{ background: "white" }}>
        {messages.length === 0 && (
          <div>
            <p className="mb-3 text-sm" style={{ color: "var(--muted-foreground)" }}>
              Ask anything about your week — EatoBiotic has full context of every meal you logged.
            </p>
            <div className="flex flex-wrap gap-2">
              {starters.map((q) => (
                <button key={q} onClick={() => { setInput(q) }}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-75"
                  style={{ borderColor: "var(--icon-green)", color: "var(--icon-green)", background: "white" }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "text-white" : ""}`}
              style={m.role === "user"
                ? { background: "linear-gradient(135deg, #4CB648, #2DAA6E)", color: "white" }
                : { background: "#f7f7f7", color: "var(--foreground)" }}>
              {m.content || (streaming && i === messages.length - 1 ? <span className="animate-pulse">●</span> : "")}
            </div>
          </div>
        ))}

        {error && <p className="text-center text-xs text-red-500">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3" style={{ borderColor: "#ebebeb", background: "white" }}>
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send() } }}
            placeholder="Ask about your food system this week…"
            className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-2"
            style={{ borderColor: "#e0e0e0", background: "white", color: "var(--foreground)" }}
          />
          <button onClick={() => void send()} disabled={!input.trim() || streaming}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #4CB648, #2DAA6E)" }}>
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main report page ─────────────────────────────────────────────────── */

export function ReportClient({ reportId, weekStarting, reportJson, memberName }: Props) {
  const rj = reportJson

  const trendIcon = rj?.previousWeekAverage != null
    ? (rj.averageScore - rj.previousWeekAverage > 2 ? <TrendingUp size={14} />
       : rj.averageScore - rj.previousWeekAverage < -2 ? <TrendingDown size={14} />
       : <Minus size={14} />)
    : null

  const trendColor = rj?.previousWeekAverage != null
    ? (rj.averageScore - rj.previousWeekAverage > 2 ? "var(--icon-green)"
       : rj.averageScore - rj.previousWeekAverage < -2 ? "#e53e3e"
       : "var(--muted-foreground)")
    : "var(--muted-foreground)"

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-8 md:px-8">

      {/* Back link */}
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70 mb-6"
        style={{ color: "var(--muted-foreground)" }}>
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="mb-8 overflow-hidden rounded-2xl" style={{
        background: "linear-gradient(135deg, #6aab28 0%, #2e8c2a 40%, #c49610 75%, #c47010 100%)",
        boxShadow: "0 8px 32px rgba(26,46,18,0.22)",
      }}>
        <div className="p-6 md:p-8">
          <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.55)" }}>
            The Food System Inside You
          </p>
          <h1 className="mt-2 font-serif text-2xl font-bold text-white md:text-3xl">
            {rj?.weekSummaryTitle ?? "Your Weekly Report"}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
            {formatDate(weekStarting)}{rj?.weekNumber ? ` · Week ${rj.weekNumber}` : ""}
            {memberName ? ` · ${memberName}` : ""}
          </p>

          {/* Score row */}
          {rj && (
            <div className="mt-5 flex flex-wrap gap-3">
              <div className="rounded-xl px-4 py-3 text-center" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.20)", minWidth: 90 }}>
                <p className="font-mono text-3xl font-bold text-white">{rj.averageScore}</p>
                <p className="mt-0.5 text-[10px]" style={{ color: "rgba(255,255,255,0.60)" }}>avg score</p>
              </div>
              {rj.previousWeekAverage != null && (
                <div className="flex items-center gap-1.5 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}>
                  <span style={{ color: trendColor }}>{trendIcon}</span>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {rj.averageScore - rj.previousWeekAverage > 0 ? "+" : ""}{rj.averageScore - rj.previousWeekAverage} pts
                    </p>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>vs last week ({rj.previousWeekAverage})</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}>
                <p className="text-sm font-bold text-white">{rj.mealCount} {rj.mealCount === 1 ? "meal" : "meals"}</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>logged</p>
              </div>
            </div>
          )}

          {/* Pull quote */}
          {rj?.pullQuote && (
            <div className="mt-5 rounded-xl p-4" style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <p className="text-sm italic leading-relaxed text-white">&ldquo;{rj.pullQuote}&rdquo;</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Narrative ────────────────────────────────────────────────── */}
      {rj?.narrative && (
        <div className="mb-6 overflow-hidden rounded-2xl" style={{ background: "white", border: "1px solid #ebebeb", boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
          <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #A8E063, #4CB648, #2DAA6E, #F5C518, #F5A623)" }} />
          <div className="p-5">
            <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
              Your food system this week
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{rj.narrative}</p>
          </div>
        </div>
      )}

      {/* ── Three Pillars ─────────────────────────────────────────────── */}
      {rj && (
        <div className="mb-6 overflow-hidden rounded-2xl" style={{ background: "white", border: "1px solid #ebebeb", boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
          <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #A8E063, #4CB648, #2DAA6E)" }} />
          <div className="p-5">
            <p className="mb-4 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>
              Your three pillars
            </p>
            <div className="space-y-3">
              <ScoreBar label="Prebiotic"  score={rj.pillars.prebiotic} />
              <ScoreBar label="Probiotic"  score={rj.pillars.probiotic} />
              <ScoreBar label="Postbiotic" score={rj.pillars.postbiotic} />
            </div>
            {rj.pillarInsights && (
              <div className="mt-4 space-y-2 border-t pt-4" style={{ borderColor: "#f0f0f0" }}>
                {[
                  { label: "Prebiotic", text: rj.pillarInsights.prebiotic,  color: "var(--icon-green)" },
                  { label: "Probiotic", text: rj.pillarInsights.probiotic,  color: "var(--icon-orange)" },
                  { label: "Postbiotic", text: rj.pillarInsights.postbiotic, color: "var(--icon-teal)" },
                ].map(({ label, text, color }) => (
                  <div key={label} className="flex gap-2">
                    <span className="mt-0.5 shrink-0 text-[10px] font-bold uppercase tracking-wider w-20" style={{ color }}>{label}</span>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Meals this week ──────────────────────────────────────────── */}
      {rj && rj.mealsThisWeek.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl" style={{ background: "white", border: "1px solid #ebebeb", boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
          <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #A8E063, #F5A623)" }} />
          <div className="p-5">
            <p className="mb-4 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
              Meals logged this week
            </p>
            <div className="space-y-2">
              {rj.mealsThisWeek.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "#f9f9f9", border: "1px solid #f0f0f0" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{m.name}</p>
                    <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{new Date(m.date).toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" })} · {m.type}</p>
                  </div>
                  <span className="shrink-0 rounded-full px-2.5 py-0.5 text-sm font-bold text-white"
                    style={{ background: barGradient(m.score) }}>
                    {m.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Patterns ─────────────────────────────────────────────────── */}
      {rj?.patterns && rj.patterns.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl" style={{ background: "white", border: "1px solid #ebebeb", boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
          <div className="p-5">
            <p className="mb-3 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
              Patterns detected
            </p>
            <div className="space-y-2">
              {rj.patterns.map((p, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: i === 0 ? "var(--icon-green)" : "var(--icon-orange)" }} />
                  <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{p}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Focus next week ──────────────────────────────────────────── */}
      {rj && (
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          {/* Primary focus */}
          <div className="overflow-hidden rounded-2xl" style={{
            background: "white", border: "1px solid #ebebeb",
            borderLeft: "4px solid #4CB648",
            boxShadow: "0 2px 12px rgba(26,46,18,0.05)",
          }}>
            <div className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <Target size={13} color="var(--icon-green)" />
                <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Your focus next week</p>
              </div>
              <p className="text-sm leading-relaxed font-medium" style={{ color: "var(--foreground)" }}>{rj.focusAction}</p>
            </div>
          </div>
          {/* Stretch goal */}
          {rj.stretchGoal && (
            <div className="overflow-hidden rounded-2xl" style={{
              background: "white", border: "1px solid #ebebeb",
              borderLeft: "4px solid #F5A623",
              boxShadow: "0 2px 12px rgba(26,46,18,0.05)",
            }}>
              <div className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Activity size={13} color="var(--icon-orange)" />
                  <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>Stretch goal</p>
                </div>
                <p className="text-sm leading-relaxed font-medium" style={{ color: "var(--foreground)" }}>{rj.stretchGoal}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Chat ─────────────────────────────────────────────────────── */}
      <ReportChat reportId={reportId} />

      {/* ── Back to dashboard ─────────────────────────────────────────── */}
      <div className="mt-8 text-center">
        <Link href="/account" className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #4CB648, #2DAA6E)", boxShadow: "0 4px 14px rgba(76,182,72,0.30)" }}>
          Back to dashboard <ChevronRight size={14} />
        </Link>
      </div>

    </div>
  )
}
