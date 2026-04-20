"use client"

import { useEffect, useRef, useState } from "react"

/* ── ThinkingStream ─────────────────────────────────────────────────────
   Live display of Claude's extended-thinking reasoning as it streams in.

   Props:
     thinking    — accumulated reasoning text (grows with each SSE event)
     isComplete  — true once Claude has finished thinking (text phase started)
────────────────────────────────────────────────────────────────────────── */

interface ThinkingStreamProps {
  thinking: string
  isComplete: boolean
}

export function ThinkingStream({ thinking, isComplete }: ThinkingStreamProps) {
  const [expanded, setExpanded] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  /* Auto-scroll to bottom as new thinking text arrives */
  useEffect(() => {
    if (!expanded || !scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [thinking, expanded])

  if (!thinking) return null

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: "1px solid var(--border)",
        borderLeft: "3px solid transparent",
        backgroundImage: `
          linear-gradient(var(--card), var(--card)),
          linear-gradient(180deg, var(--icon-lime), var(--icon-teal))
        `,
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
      }}
    >
      {/* Header row — toggle + status label */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-secondary/40"
      >
        <div className="flex items-center gap-2.5">
          {/* Status dot — blinks while thinking, solid once done */}
          {isComplete ? (
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ background: "var(--icon-teal)" }}
            />
          ) : (
            <span
              className="h-2 w-2 rounded-full shrink-0 animate-pulse"
              style={{ background: "var(--icon-lime)" }}
            />
          )}
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {isComplete ? "Claude's reasoning" : "Claude is thinking…"}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground/60 select-none">
          {expanded ? "▲ hide" : "▼ show"}
        </span>
      </button>

      {/* Scrollable thinking text */}
      {expanded && (
        <div
          ref={scrollRef}
          className="px-4 pb-4 overflow-y-auto"
          style={{ maxHeight: "14rem" /* 224px ≈ max-h-56 */ }}
        >
          <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap font-mono">
            {thinking}
            {/* Blinking cursor while streaming */}
            {!isComplete && (
              <span
                className="inline-block animate-pulse ml-0.5 align-middle"
                style={{
                  width: "0.375rem",
                  height: "0.875rem",
                  background: "var(--muted-foreground)",
                  opacity: 0.5,
                }}
              />
            )}
          </p>
        </div>
      )}
    </div>
  )
}

export default ThinkingStream
