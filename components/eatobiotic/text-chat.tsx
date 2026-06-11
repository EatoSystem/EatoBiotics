"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, RotateCcw } from "lucide-react"

type ChatMessage = { role: "user" | "assistant"; content: string }

const STARTERS = [
  "What should I eat this week?",
  "How do I improve my Biotics Score?",
  "What are the best foods for digestion?",
]

/**
 * Self-contained streaming text chat with the EatoBiotics Food System Expert.
 * Talks to /api/eatobiotic (SSE). Free + public; personalises automatically
 * when the visitor is signed in. `seed` lets the parent prefill the input from
 * a prompt chip elsewhere on the page.
 */
export function TextChat({ seed }: { seed?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Prefill from an external chip click.
  useEffect(() => {
    if (seed) setInput(seed)
  }, [seed])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, streaming])

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || streaming) return

    const next = [...messages, { role: "user" as const, content: trimmed }]
    setMessages(next)
    setInput("")
    setError(null)
    setStreaming(true)

    try {
      const res = await fetch("/api/eatobiotic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      })

      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? "The expert is unavailable right now. Please try again shortly.")
      }

      // Add an empty assistant message we stream into.
      setMessages((m) => [...m, { role: "assistant", content: "" }])

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() ?? ""
        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine.startsWith("data:")) continue
          const payload = trimmedLine.slice(5).trim()
          if (payload === "[DONE]") continue
          try {
            const { text: delta } = JSON.parse(payload) as { text?: string }
            if (delta) {
              setMessages((m) => {
                const copy = [...m]
                copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + delta }
                return copy
              })
            }
          } catch { /* ignore malformed chunk */ }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
      // Drop a trailing empty assistant bubble if the stream never started.
      setMessages((m) => (m.length && m[m.length - 1].role === "assistant" && !m[m.length - 1].content ? m.slice(0, -1) : m))
    } finally {
      setStreaming(false)
    }
  }, [messages, streaming])

  const empty = messages.length === 0

  return (
    <div className="flex flex-col gap-4">
      {/* Conversation */}
      {!empty && (
        <div
          ref={scrollRef}
          className="flex max-h-[360px] flex-col gap-3 overflow-y-auto rounded-xl border border-border bg-secondary/20 p-4"
        >
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "self-end max-w-[85%]" : "self-start max-w-[90%]"}>
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-icon-green text-white"
                    : "border border-border bg-background text-foreground"
                }`}
              >
                {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm" style={{ color: "var(--icon-orange)" }}>{error}</p>}

      {/* Input */}
      <div className="relative">
        <textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          placeholder="Ask about your plate, gut health, Biotics Score, or weekly food plan…"
          className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:border-icon-green focus:outline-none focus:ring-1 focus:ring-icon-green/30"
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || streaming}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-lg text-white transition-all disabled:opacity-30"
          style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </div>

      {/* Starter chips (only before the first message) */}
      {empty && (
        <div className="flex flex-wrap gap-2">
          {STARTERS.map((chip) => (
            <button
              key={chip}
              onClick={() => send(chip)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-icon-green hover:text-foreground"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {!empty && (
        <button
          onClick={() => { setMessages([]); setError(null); setInput("") }}
          className="inline-flex items-center gap-1.5 self-start text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          <RotateCcw size={12} /> New conversation
        </button>
      )}

      <p className="text-center text-[11px] text-muted-foreground/70">
        Educational guidance, not medical advice. For diagnosis or treatment, see a healthcare professional.
      </p>
    </div>
  )
}
