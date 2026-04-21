"use client"

import { useState, useCallback } from "react"
import {
  BookOpen, RefreshCw, AlertCircle, Printer, Loader2, Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThinkingStream } from "@/components/analyse/thinking-stream"

/* ── Types ──────────────────────────────────────────────────────────── */

export interface GutHealthStory {
  title: string
  subtitle: string
  sections: Array<{
    heading: string
    content: string   // paragraphs separated by \n\n
  }>
  closingThought: string
  generatedAt: string
  mealCount: number
}

type State =
  | { kind: "idle";      existingStory: GutHealthStory | null }
  | { kind: "streaming"; thinking: string; thinkingDone: boolean }
  | { kind: "result";    story: GutHealthStory }
  | { kind: "error";     message: string }

/* ── Story article ──────────────────────────────────────────────────── */

function StoryArticle({ story }: { story: GutHealthStory }) {
  return (
    <article className="chapter-prose">
      {/* Title */}
      <h1 className="font-serif text-3xl font-bold text-foreground leading-tight">
        {story.title}
      </h1>
      <p className="text-sm text-muted-foreground mt-2 mb-10">{story.subtitle}</p>

      {/* Sections */}
      {story.sections.map((section) => (
        <div key={section.heading}>
          <h2>{section.heading}</h2>
          {section.content.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      ))}

      {/* Closing */}
      <hr />
      <p><em>{story.closingThought}</em></p>
    </article>
  )
}

/* ── Idle — no story yet ────────────────────────────────────────────── */

function IdleViewEmpty({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="space-y-6">
      {/* Feature card */}
      <div className="rounded-2xl border border-border bg-secondary/30 p-6">
        <div className="flex items-start gap-4 mb-5">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-md"
            style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
          >
            <BookOpen size={22} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-foreground">What your story covers</p>
            <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">
              Claude reads your full history and writes a personal narrative — not a report, but a story.
            </p>
          </div>
        </div>

        <ul className="space-y-2.5">
          {[
            "Where you started — your assessment score and what it revealed",
            "How you've been eating — your real food patterns over 90 days",
            "Your biotic profile — what's strong and what needs attention",
            "The patterns we found — specific insights from your meal data",
            "Your next chapter — where your gut health journey goes from here",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
              <div
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: "var(--icon-teal)" }}
              />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Biotic pill decorations */}
      <div className="flex items-center justify-center gap-2 opacity-30">
        <div className="biotic-pill" style={{ background: "var(--icon-lime)" }} />
        <div className="biotic-pill" style={{ background: "var(--icon-green)" }} />
        <div className="biotic-pill" style={{ background: "var(--icon-teal)" }} />
      </div>

      {/* CTA */}
      <button
        onClick={onGenerate}
        className="brand-gradient w-full flex items-center justify-center gap-2 rounded-full px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
      >
        <Sparkles size={16} /> Write my gut health story
      </button>
      <p className="text-center text-xs text-muted-foreground">
        Takes 30–60 seconds · Requires 3+ meal analyses
      </p>
    </div>
  )
}

/* ── Idle — story exists ────────────────────────────────────────────── */

function IdleViewWithStory({
  story,
  onRegenerate,
}: {
  story: GutHealthStory
  onRegenerate: () => void
}) {
  const generatedDate = new Date(story.generatedAt)
  const daysAgo       = Math.floor((Date.now() - generatedDate.getTime()) / 86_400_000)
  const dateLabel     =
    daysAgo === 0 ? "today" : daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`

  return (
    <div className="space-y-8">
      <StoryArticle story={story} />

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-secondary/30 px-5 py-3 print-hide">
        <p className="text-xs text-muted-foreground">
          Written {dateLabel} · Based on {story.mealCount} meals
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <Printer size={13} /> Print
          </button>
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ color: "var(--icon-teal)" }}
          >
            <RefreshCw size={13} /> Rewrite story
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Streaming view ─────────────────────────────────────────────────── */

function StreamingView({
  thinking,
  thinkingDone,
}: {
  thinking: string
  thinkingDone: boolean
}) {
  return (
    <div className="space-y-4">
      {/* Status pill */}
      <div className="flex items-center justify-center gap-2">
        {thinkingDone ? (
          <>
            <Loader2 size={14} className="animate-spin" style={{ color: "var(--icon-teal)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--icon-teal)" }}>
              Writing your story…
            </span>
          </>
        ) : (
          <>
            <Loader2 size={14} className="animate-spin" style={{ color: "var(--icon-green)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--icon-green)" }}>
              Claude is reading your history…
            </span>
          </>
        )}
      </div>

      {/* Progress hints */}
      <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-2">
        {[
          { label: "Reading your gut assessment",       color: "var(--icon-lime)",   done: true },
          { label: "Scanning 90 days of meal data",     color: "var(--icon-green)",  done: true },
          { label: "Identifying your patterns",         color: "var(--icon-teal)",   done: thinkingDone },
          { label: "Writing your personal story",       color: "var(--icon-yellow)", done: thinkingDone },
        ].map(({ label, color, done }) => (
          <div key={label} className="flex items-center gap-2.5">
            <div
              className={cn("h-1.5 w-1.5 rounded-full transition-opacity", done ? "opacity-100" : "opacity-25")}
              style={{ background: color }}
            />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <ThinkingStream thinking={thinking} isComplete={thinkingDone} />
    </div>
  )
}

/* ── Result view ────────────────────────────────────────────────────── */

function ResultView({
  story,
  onRewrite,
}: {
  story: GutHealthStory
  onRewrite: () => void
}) {
  return (
    <div className="space-y-8">
      <StoryArticle story={story} />

      {/* Actions */}
      <div className="flex flex-col gap-3 print-hide">
        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 rounded-full border border-border px-7 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60"
        >
          <Printer size={15} /> Print your story
        </button>
        <button
          onClick={onRewrite}
          className="flex items-center justify-center gap-2 rounded-full border border-border px-7 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/40"
        >
          <RefreshCw size={14} /> Rewrite story
        </button>
      </div>
    </div>
  )
}

/* ── Error view ─────────────────────────────────────────────────────── */

function ErrorView({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
        <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
        <p className="text-sm text-red-700">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm font-medium transition-colors hover:bg-secondary/40"
      >
        <RefreshCw size={14} /> Try again
      </button>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────── */

export function StoryClient({
  tier,
  existingStory,
}: {
  tier: "restore" | "transform"
  existingStory: GutHealthStory | null
}) {
  void tier
  const [state, setState] = useState<State>({ kind: "idle", existingStory })

  const generate = useCallback(async () => {
    setState({ kind: "streaming", thinking: "", thinkingDone: false })

    try {
      const res = await fetch("/api/gut-health-story", { method: "POST" })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        setState({ kind: "error", message: err.error ?? "Story generation failed. Please try again." })
        return
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer    = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const payload = line.slice(6).trim()
          if (payload === "[DONE]") break

          let event: Record<string, unknown>
          try { event = JSON.parse(payload) as Record<string, unknown> } catch { continue }

          if (event.type === "thinking") {
            setState((s) =>
              s.kind === "streaming"
                ? { ...s, thinking: s.thinking + (event.text as string) }
                : s
            )
          } else if (event.type === "thinking_complete") {
            setState((s) => s.kind === "streaming" ? { ...s, thinkingDone: true } : s)
          } else if (event.type === "complete") {
            setState({ kind: "result", story: event.result as unknown as GutHealthStory })
          } else if (event.type === "error") {
            setState({ kind: "error", message: event.message as string })
          }
        }
      }

      // If stream closed without a result
      setState((s) => {
        if (s.kind === "streaming") {
          return { kind: "error", message: "Story generation did not complete. Please try again." }
        }
        return s
      })
    } catch {
      setState({ kind: "error", message: "Something went wrong. Please check your connection and try again." })
    }
  }, [])

  function reset() {
    const storyToKeep = state.kind === "result" ? state.story : existingStory
    setState({ kind: "idle", existingStory: storyToKeep })
  }

  return (
    <div>
      {state.kind === "idle" && !state.existingStory && (
        <IdleViewEmpty onGenerate={generate} />
      )}
      {state.kind === "idle" && state.existingStory && (
        <IdleViewWithStory story={state.existingStory} onRegenerate={generate} />
      )}
      {state.kind === "streaming" && (
        <StreamingView thinking={state.thinking} thinkingDone={state.thinkingDone} />
      )}
      {state.kind === "result" && (
        <ResultView story={state.story} onRewrite={reset} />
      )}
      {state.kind === "error" && (
        <ErrorView message={state.message} onRetry={generate} />
      )}
    </div>
  )
}
