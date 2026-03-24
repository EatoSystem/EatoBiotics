"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, RotateCcw, Send } from "lucide-react"
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
  pastConsultations: Array<{ id: string; message_count: number; created_at: string }>
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
}: {
  overallScore: number | null
  subScores: Record<string, number> | null
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-4 rounded-2xl p-4"
      style={{ background: "color-mix(in srgb, var(--icon-lime) 6%, var(--card))", border: "1px solid color-mix(in srgb, var(--icon-lime) 18%, var(--border))" }}
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
    </div>
  )
}

/* ── Message bubble ──────────────────────────────────────────────────── */

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  // Split last paragraph for "action box" on assistant messages
  const paragraphs = message.content.split(/\n\n+/)
  const lastPara = paragraphs[paragraphs.length - 1] ?? ""
  const bodyParas = paragraphs.slice(0, -1)
  const isLastParaAction = !isUser && paragraphs.length > 1 && lastPara.length > 10

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "text-white"
            : "bg-card border text-foreground"
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
            {/* Actionable step box */}
            {isLastParaAction && (
              <div
                className="mt-3 rounded-xl p-3 text-sm"
                style={{ border: "1.5px solid color-mix(in srgb, var(--icon-green) 40%, transparent)", background: "color-mix(in srgb, var(--icon-green) 6%, transparent)" }}
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
}: ConsultClientProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return

    const userMsg: Message = { role: "user", content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setStreaming(true)

    // Add empty assistant message to stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }])

    try {
      const res = await fetch("/api/consult", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: newMessages }),
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Unknown error" })) as { error?: string }
        throw new Error(err.error ?? "Request failed")
      }

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
            const parsed = JSON.parse(data) as { text?: string }
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
            Gut Health Advisor
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {memberName ? `Hi ${memberName.split(" ")[0]} — ` : ""}Your personal EatoBiotics advisor, powered by Claude.
        </p>
      </div>

      {/* Score strip */}
      <ScoreStrip overallScore={overallScore} subScores={subScores} />

      {/* Chat area */}
      <div
        className="flex min-h-[400px] flex-col overflow-hidden rounded-3xl border bg-card"
        style={{ minHeight: 400 }}
      >
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {messages.length === 0 ? (
            /* Starter questions */
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Ask me anything about your gut health. Here are some ideas:
              </p>
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

        {/* Input */}
        <div
          className="flex items-end gap-3 border-t p-4 sm:p-5"
          style={{ background: "var(--muted/50)" }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={streaming}
            placeholder="Ask about your gut health…"
            rows={2}
            className="flex-1 resize-none rounded-2xl border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-[color-mix(in_srgb,var(--icon-green)_50%,var(--border))] disabled:opacity-50"
            style={{ maxHeight: 120 }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
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
        {messages.length > 0 && (
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
                  {c.message_count} message{c.message_count !== 1 ? "s" : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
