"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, RotateCcw, Send, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Types ───────────────────────────────────────────────────────────── */

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ConsultClientProps {
  memberName: string | null
  overallScore: number | null
  subScores: Record<string, number> | null
  pastConsultations: Array<{
    id: string
    turn_count: number
    created_at: string
    summary: string | null
  }>
  dailyCount: number
  monthlyCount: number
  apiEndpoint?: string
}

/* ── Pillar config ───────────────────────────────────────────────────── */

const PILLARS = [
  { key: "diversity",   label: "Diversity",   color: "var(--icon-lime)" },
  { key: "feeding",     label: "Feeding",     color: "var(--icon-green)" },
  { key: "adding",      label: "Adding",      color: "var(--icon-teal)" },
  { key: "consistency", label: "Consistency", color: "var(--icon-yellow)" },
  { key: "feeling",     label: "Feeling",     color: "var(--icon-orange)" },
]

/* ── Starter questions ───────────────────────────────────────────────── */

const STARTER_QUESTIONS = [
  "Why is my Adding score so low and what's the fastest way to improve it?",
  "What should I eat this week based on my current scores?",
  "I have IBS — how should I adapt the EatoBiotics framework for my situation?",
  "My energy is low in the afternoons. What does my gut health have to do with it?",
]

/* ── Score strip component ───────────────────────────────────────────── */

function ScoreStrip({
  overallScore,
  subScores,
  dailyCount,
  monthlyCount,
}: {
  overallScore: number | null
  subScores: Record<string, number> | null
  dailyCount: number
  monthlyCount: number
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-4 rounded-2xl p-4"
      style={{
        background: "color-mix(in srgb, var(--icon-lime) 6%, var(--card))",
        border: "1px solid color-mix(in srgb, var(--icon-lime) 18%, var(--border))",
      }}
    >
      {/* Overall score */}
      <div className="flex items-center gap-2">
        <span
          className="font-serif text-3xl font-bold tabular-nums leading-none"
          style={{ color: "var(--icon-green)" }}
        >
          {overallScore != null ? overallScore : "—"}
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Biotics Score</p>
          <p className="text-[10px] text-muted-foreground/60">/100</p>
        </div>
      </div>

      <div className="h-8 w-px bg-border" />

      {/* Pillar bars */}
      {subScores && (
        <div className="flex flex-wrap gap-4">
          {PILLARS.map((p) => {
            const val = subScores[p.key] ?? 0
            return (
              <div key={p.key} className="flex flex-col gap-1" style={{ minWidth: 56 }}>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-medium text-muted-foreground">{p.label}</span>
                  <span className="text-[10px] font-bold tabular-nums" style={{ color: p.color }}>
                    {Math.round(val)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${val}%`, background: p.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Usage counts */}
      <div className="ml-auto flex flex-col items-end gap-0.5">
        <p className="text-[10px] text-muted-foreground">
          Today: <span className={cn("font-bold", dailyCount >= 2 ? "text-amber-500" : "text-foreground")}>{dailyCount}/2</span>
        </p>
        <p className="text-[10px] text-muted-foreground">
          This month: <span className={cn("font-bold", monthlyCount >= 60 ? "text-amber-500" : "text-foreground")}>{monthlyCount}/60</span>
        </p>
      </div>
    </div>
  )
}

/* ── Message bubble ──────────────────────────────────────────────────── */

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  // Split last paragraph for "Your next step" action box on assistant messages
  const paragraphs = message.content.split(/\n\n+/)
  const lastPara = paragraphs[paragraphs.length - 1] ?? ""
  const bodyParas = paragraphs.slice(0, -1)
  const isLastParaAction = !isUser && paragraphs.length > 1 && lastPara.length > 10

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser ? "text-white" : "bg-card border text-foreground"
        )}
        style={isUser ? { background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" } : undefined}
      >
        {isUser ? (
          message.content
        ) : (
          <>
            {bodyParas.map((p, i) => (
              <p key={i} className={i < bodyParas.length - 1 ? "mb-3" : ""}>{p}</p>
            ))}
            {isLastParaAction && (
              <div
                className="mt-3 rounded-xl p-3 text-sm"
                style={{
                  border: "1.5px solid color-mix(in srgb, var(--icon-green) 40%, transparent)",
                  background: "color-mix(in srgb, var(--icon-green) 6%, transparent)",
                }}
              >
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
                  Your next step
                </p>
                <p className="text-foreground">{lastPara}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ── Main component ──────────────────────────────────────────────────── */

export function ConsultClient({
  memberName,
  overallScore,
  subScores,
  pastConsultations,
  dailyCount: initialDailyCount,
  monthlyCount: initialMonthlyCount,
  apiEndpoint = "/api/consult",
}: ConsultClientProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [turnCount, setTurnCount] = useState(0)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [sessionSummary, setSessionSummary] = useState<string | null>(null)
  const [limitError, setLimitError] = useState<string | null>(null)
  const [dailyCount, setDailyCount] = useState(initialDailyCount)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)
  const searchParams = useSearchParams()
  const autoSentRef  = useRef(false)

  // Compute weakest pillar label for first-time intro
  const weakestPillarLabel = (() => {
    if (!subScores) return null
    const labels: Record<string, string> = {
      diversity: "Plant Diversity", feeding: "Feeding", adding: "Live Foods",
      consistency: "Consistency", feeling: "Feeling",
    }
    let lowest = Infinity; let key = ""
    for (const [k, v] of Object.entries(subScores)) {
      if (labels[k] && v < lowest) { lowest = v; key = k }
    }
    return labels[key] ?? null
  })()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-send ?q= pre-filled question on mount
  useEffect(() => {
    const q = searchParams.get("q")
    if (q && !autoSentRef.current) {
      autoSentRef.current = true
      void sendMessage(decodeURIComponent(q))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const turnsRemaining = 20 - turnCount
  const nearLimit = turnsRemaining <= 2 && turnsRemaining > 0 && turnCount > 0

  async function sendMessage(text: string) {
    if (!text.trim() || streaming || sessionEnded) return

    const userMsg: Message = { role: "user", content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setStreaming(true)
    setLimitError(null)

    // Add empty assistant message to stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }])

    try {
      const res = await fetch(apiEndpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          messages: newMessages,
          sessionId: sessionId ?? undefined,
        }),
      })

      // Handle usage limit errors (429) and session limit (400)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Unknown error" })) as {
          error?: string
          message?: string
          summary?: string
        }

        if (res.status === 429) {
          setLimitError(errData.message ?? errData.error ?? "Limit reached")
          // Remove the empty assistant message
          setMessages((prev) => prev.slice(0, -1))
          return
        }

        if (errData.error === "session_limit_reached") {
          setSessionEnded(true)
          setSessionSummary(errData.summary ?? null)
          // Replace empty assistant placeholder with summary message
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: "assistant",
              content: "This session has reached its 20-turn limit. Here's a summary of what we covered:",
            }
            return updated
          })
          return
        }

        throw new Error(errData.error ?? "Request failed")
      }

      if (!res.body) throw new Error("No response body")

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value).split("\n")
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6).trim()
          if (data === "[DONE]") break
          try {
            const parsed = JSON.parse(data) as {
              text?: string
              sessionId?: string
              turnCount?: number
            }
            // First event carries session metadata
            if (parsed.sessionId && !sessionId) {
              setSessionId(parsed.sessionId)
            }
            if (parsed.turnCount != null) {
              setTurnCount(parsed.turnCount)
              setDailyCount((prev) => prev + (parsed.turnCount === 1 ? 1 : 0))
            }
            if (parsed.text) {
              accumulated += parsed.text
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: "assistant", content: accumulated }
                return updated
              })
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err) {
      console.error("[consult]", err)
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, I couldn't process that request. Please try again.",
        }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function startNew() {
    setMessages([])
    setInput("")
    setSessionId(null)
    setTurnCount(0)
    setSessionEnded(false)
    setSessionSummary(null)
    setLimitError(null)
    inputRef.current?.focus()
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      {/* Back link */}
      <div className="flex items-center gap-3">
        <Link
          href="/account"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={13} /> My Account
        </Link>
      </div>

      {/* Header */}
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xl leading-none">🤖</span>
          <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
            EatoBiotic
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {memberName ? `Hi ${memberName.split(" ")[0]} — ` : ""}Your personal EatoBiotics advisor, powered by Claude.
        </p>
      </div>

      {/* Score strip + usage counts */}
      <ScoreStrip
        overallScore={overallScore}
        subScores={subScores}
        dailyCount={dailyCount}
        monthlyCount={initialMonthlyCount}
      />

      {/* Limit error banner */}
      {limitError && (
        <div
          className="flex items-start gap-3 rounded-2xl p-4 text-sm"
          style={{
            background: "color-mix(in srgb, var(--icon-yellow) 10%, var(--card))",
            border: "1px solid color-mix(in srgb, var(--icon-yellow) 30%, transparent)",
          }}
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: "var(--icon-yellow)" }} />
          <p className="text-foreground">{limitError}</p>
        </div>
      )}

      {/* Session ended — summary */}
      {sessionEnded && sessionSummary && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: "color-mix(in srgb, var(--icon-green) 6%, var(--card))",
            border: "1px solid color-mix(in srgb, var(--icon-green) 25%, transparent)",
          }}
        >
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
            Session Summary
          </p>
          <p className="text-sm text-foreground leading-relaxed">{sessionSummary}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            This session has reached its 20-turn limit. Start a new consultation to continue.
          </p>
          <button
            onClick={startNew}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold transition-colors hover:opacity-80"
            style={{ color: "var(--icon-green)" }}
          >
            <RotateCcw size={12} /> New conversation
          </button>
        </div>
      )}

      {/* Chat area */}
      <div
        className="flex flex-col overflow-hidden rounded-3xl border bg-card"
        style={{ minHeight: 400 }}
      >
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {messages.length === 0 ? (
            <div className="space-y-4">
              {/* First-time intro card */}
              {pastConsultations.length === 0 && (
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: "color-mix(in srgb, var(--icon-orange) 8%, var(--card))",
                    border: "1px solid color-mix(in srgb, var(--icon-orange) 25%, var(--border))",
                  }}
                >
                  <p className="mb-2 text-sm font-semibold text-foreground">
                    Hi{memberName ? `, ${memberName.split(" ")[0]}` : ""} — I&apos;m EatoBiotic, your personal food system consultant.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    I&apos;ve reviewed your scores and I already know where to start.
                    {weakestPillarLabel
                      ? ` Your ${weakestPillarLabel} score is your biggest opportunity right now. Where would you like to begin?`
                      : " Where would you like to begin?"}
                  </p>
                </div>
              )}
              {pastConsultations.length > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Ask me anything about your gut health. Here are some ideas:
                </p>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {STARTER_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="rounded-2xl border bg-background px-4 py-3 text-left text-sm text-foreground transition-colors hover:border-[color-mix(in_srgb,var(--icon-green)_40%,var(--border))] hover:bg-muted"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              {streaming && messages[messages.length - 1]?.content === "" && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border bg-card px-4 py-3">
                    <span className="text-muted-foreground">●●●</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Turn warning */}
        {nearLimit && (
          <div className="border-t px-4 py-2 text-center">
            <p className="text-xs font-medium text-amber-500">
              <AlertTriangle size={11} className="inline mr-1" />
              {turnsRemaining} turn{turnsRemaining !== 1 ? "s" : ""} remaining in this session
            </p>
          </div>
        )}

        {/* Input */}
        <div
          className="flex items-end gap-3 border-t p-4 sm:p-5"
        >
          <div className="flex flex-1 flex-col gap-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={streaming || sessionEnded}
              placeholder={sessionEnded ? "Session ended — start a new consultation" : "Ask about your gut health…"}
              rows={2}
              className="w-full resize-none rounded-2xl border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-[color-mix(in_srgb,var(--icon-green)_50%,var(--border))] disabled:opacity-50"
              style={{ maxHeight: 120 }}
            />
            {turnCount > 0 && !sessionEnded && (
              <p className="pl-1 text-[10px] text-muted-foreground/60">
                Turn {turnCount}/20
              </p>
            )}
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming || sessionEnded}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
            aria-label="Send"
          >
            {streaming ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Send size={14} />
            )}
          </button>
        </div>
      </div>

      {/* Actions + history */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {messages.length > 0 && !sessionEnded && (
          <button
            onClick={startNew}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw size={12} /> Start new consultation
          </button>
        )}

        {pastConsultations.length > 0 && (
          <div className="text-right">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Past sessions
            </p>
            <ul className="space-y-1">
              {pastConsultations.slice(0, 5).map((c) => (
                <li key={c.id} className="text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString("en-IE", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                  {" · "}
                  {c.turn_count ?? 0} turn{(c.turn_count ?? 0) !== 1 ? "s" : ""}
                  {c.summary && (
                    <span className="ml-1 text-muted-foreground/60">
                      — {c.summary.slice(0, 60)}…
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
