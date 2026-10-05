"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, RotateCcw, Send, AlertTriangle, ChevronDown } from "lucide-react"
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
    messages: Array<{role: string; content: string; turn: number}> | null
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

/*
 * ══ 0R-3 · P0-TRUST-05 — A SUGGESTION MAY NOT ASSERT SOMETHING FOR THE MEMBER
 *
 * Three of the four questions here asserted a personal premise on the member's
 * behalf, and were removed rather than reworded:
 *
 *   "Why is my Adding score so low and what's the fastest way to improve it?"
 *       — asserts a low score AND names an internal dimension, which this
 *         route's own system prompt already forbids the model from quoting;
 *   "I have IBS — how should I adapt the EatoBiotics framework for my situation?"
 *       — the product proposing that the member assert a condition;
 *   "My energy is low in the afternoons. What does my food system health have
 *    to do with it?"
 *       — asserts a symptom the product never observed.
 *
 * Making these prefill rather than auto-send (see the mount effect) materially
 * reduces the defect: the member reads and edits a draft instead of silently
 * sending it. It does NOT cure an asserting suggestion, because the product is
 * still the author of the assertion it is proposing the member make. The
 * permanent rule has no prefill exemption:
 *
 *     The product must never place a product-authored personal conclusion into
 *     the member's mouth.
 *
 * So one question survives — the one that asks rather than concludes. One chip
 * is a thin set, and that is recorded as an editorial gap for the Experience
 * work rather than closed here with new copy: 0R does not redesign.
 */
const STARTER_QUESTIONS = [
  "What should I eat this week based on my current scores?",
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
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  /*
   * ══ 0R-3 · P0-TRUST-05 — `?q=` PREFILLS THE DRAFT. IT DOES NOT SEND. ══════
   *
   * This effect used to call `sendMessage(decodeURIComponent(q))` on mount,
   * behind an `autoSentRef` latch. One tap on a product-authored suggestion
   * elsewhere in the product therefore became the member's own first message to
   * a model — they never saw the sentence in an input box and never got to edit
   * it. The model then answered ON that premise, and its prose inherited the
   * apparent legitimacy of something the member had supposedly asked.
   *
   * The permanent rule this now follows:
   *
   *     Authorship is created by the member's explicit submit action, not
   *     inherited from the source of the text in the input box.
   *
   * So a `q` value may at most initialise the draft. It must not invoke
   * `sendMessage`, construct a user message, persist anything, trigger
   * summarisation, or call the model. The member sees it, can edit it, and
   * sends it — or does not.
   *
   * `setInput` is deliberately the ONLY thing reachable from a search param.
   * See `tests/unit/ai-authorship.test.ts`.
   */
  useEffect(() => {
    const q = searchParams.get("q")
    if (q) setInput(decodeURIComponent(q))
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/eatobiotics-icon.webp" alt="" className="h-7 w-7" />
          <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
            EatoBiotic
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {memberName ? `Hi ${memberName.split(" ")[0]} — ` : ""}I&apos;m your personal food system consultant.
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
                  {/*
                    * 0R-3. This read `Your ${weakestPillarLabel} score is your
                    * biggest opportunity right now` — a personal weakest-score
                    * verdict, rendered in the CONSULTANT'S voice before the
                    * model had said anything, and labelling the `adding`
                    * dimension "Live Foods", vocabulary retired in Tranche 2B.
                    * It also contradicted this route's own system prompt, which
                    * already tells the model never to quote an internal
                    * dimension name back to a member.
                    *
                    * Removed, not reworded. No replacement copy is written in a
                    * remediation pass.
                    */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Where would you like to begin?
                  </p>
                </div>
              )}
              {pastConsultations.length > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Ask me anything about your food system health. Here are some ideas:
                </p>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {STARTER_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    // 0R-3: drafts the suggestion for the member to read, edit
                    // and send. It must never call `sendMessage` — that is what
                    // made a product-authored sentence into member speech.
                    onClick={() => { setInput(q); inputRef.current?.focus() }}
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
              placeholder={sessionEnded ? "Session ended — start a new consultation" : "Ask about the Food System Inside You…"}
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
          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Past sessions</p>
            {pastConsultations.slice(0, 10).map((c) => (
              <div key={c.id} className="rounded-2xl border bg-card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedSession(expandedSession === c.id ? null : c.id)}
                >
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {new Date(c.created_at).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}{c.turn_count ?? 0} turn{c.turn_count !== 1 ? "s" : ""}
                    </p>
                    {c.summary && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{c.summary}</p>}
                  </div>
                  <ChevronDown size={14} className={cn("shrink-0 text-muted-foreground transition-transform", expandedSession === c.id && "rotate-180")} />
                </button>
                {expandedSession === c.id && c.messages && c.messages.length > 0 && (
                  <div className="border-t px-4 py-3 space-y-3 max-h-80 overflow-y-auto">
                    {c.messages.map((msg, i) => (
                      <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                          msg.role === "user" ? "text-white" : "bg-muted/50 border text-foreground"
                        )} style={msg.role === "user" ? { background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" } : undefined}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {expandedSession === c.id && (!c.messages || c.messages.length === 0) && (
                  <div className="border-t px-4 py-3">
                    <p className="text-xs text-muted-foreground">No message history saved for this session.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
