"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, BookOpen, RefreshCw, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Types ───────────────────────────────────────────────────────────── */

interface Chapter {
  month: string
  summary: string
  scoreStart: number | null
  scoreEnd: number | null
}

interface Story {
  narrative: string
  lastUpdated: string
  chapters: Chapter[]
}

interface StoryClientProps {
  story: Story | null
  currentScore: number | null
  memberName: string | null
  memberSince: string | null
}

interface UpdateResponse {
  narrative: string
  lastUpdated: string
}

/* ── Score pill ──────────────────────────────────────────────────────── */

function ScorePill({ score, label }: { score: number | null; label: string }) {
  if (score == null) return null
  const color =
    score >= 70 ? "var(--icon-green)" : score >= 50 ? "var(--icon-yellow)" : "var(--icon-orange)"
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="font-serif text-2xl font-bold tabular-nums"
        style={{ color }}
      >
        {score}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

/* ── Chapter timeline ────────────────────────────────────────────────── */

function ChapterDot({
  chapter,
  isLast,
}: {
  chapter: Chapter
  isLast: boolean
}) {
  const monthLabel = new Date(chapter.month + "-01").toLocaleDateString("en-IE", {
    month: "short",
    year: "2-digit",
  })
  const scoreChange =
    chapter.scoreStart != null && chapter.scoreEnd != null
      ? chapter.scoreEnd - chapter.scoreStart
      : null

  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div
          className="h-3 w-3 rounded-full border-2"
          style={{
            borderColor: "var(--icon-lime)",
            background: "var(--background)",
          }}
        />
        {!isLast && (
          <div className="mt-1 h-8 w-px" style={{ background: "var(--border)" }} />
        )}
      </div>
      <div className="pb-4 min-w-0">
        <p className="text-xs font-bold text-foreground">{monthLabel}</p>
        {scoreChange != null && (
          <p
            className="text-[10px] font-semibold"
            style={{ color: scoreChange >= 0 ? "var(--icon-green)" : "var(--icon-orange)" }}
          >
            {scoreChange >= 0 ? "+" : ""}
            {scoreChange} pts
          </p>
        )}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-0.5">
          {chapter.summary.slice(0, 100)}
        </p>
      </div>
    </div>
  )
}

/* ── Main component ──────────────────────────────────────────────────── */

export function StoryClient({ story, currentScore, memberName, memberSince }: StoryClientProps) {
  const [currentStory, setCurrentStory] = useState<Story | null>(story)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const firstScore =
    currentStory?.chapters && currentStory.chapters.length > 0
      ? currentStory.chapters[0]?.scoreStart ?? null
      : null

  const memberSinceLabel = memberSince
    ? new Date(memberSince).toLocaleDateString("en-IE", { month: "long", year: "numeric" })
    : null

  const lastUpdated = currentStory?.lastUpdated
    ? new Date(currentStory.lastUpdated).toLocaleDateString("en-IE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  async function updateStory() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/food-system-story/update", { method: "POST" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Request failed" })) as { error?: string }
        throw new Error(data.error ?? "Failed to generate story")
      }
      const data = await res.json() as UpdateResponse
      setCurrentStory((prev) => ({
        narrative: data.narrative,
        lastUpdated: data.lastUpdated,
        chapters: prev?.chapters ?? [],
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Back */}
      <Link
        href="/account"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft size={14} /> My Account
      </Link>

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--icon-orange)" }}>
          Transform Feature
        </p>
        <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">
          Your Food System
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your progress, patterns, and improvements — where you started, what changed, where you&apos;re going.
        </p>
      </div>

      {/* Score journey */}
      {(firstScore != null || currentScore != null) && (
        <div
          className="flex items-center gap-6 rounded-2xl p-4 mb-6"
          style={{
            background: "color-mix(in srgb, var(--icon-green) 6%, var(--card))",
            border: "1px solid color-mix(in srgb, var(--icon-green) 18%, var(--border))",
          }}
        >
          <ScorePill score={firstScore} label="Started" />
          {firstScore != null && currentScore != null && (
            <>
              <div className="flex-1 flex items-center gap-1">
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                <TrendingUp
                  size={14}
                  style={{
                    color: currentScore >= firstScore ? "var(--icon-green)" : "var(--icon-orange)",
                  }}
                />
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              </div>
              <ScorePill score={currentScore} label="Now" />
            </>
          )}
          {firstScore == null && currentScore != null && (
            <ScorePill score={currentScore} label="Current" />
          )}
          {memberSinceLabel && (
            <div className="ml-auto text-right">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Member since
              </p>
              <p className="text-xs font-medium text-foreground">{memberSinceLabel}</p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="mb-4 rounded-2xl p-4 text-sm"
          style={{
            background: "color-mix(in srgb, var(--icon-orange) 10%, var(--card))",
            border: "1px solid color-mix(in srgb, var(--icon-orange) 30%, transparent)",
            color: "var(--icon-orange)",
          }}
        >
          {error}
        </div>
      )}

      {/* No story yet */}
      {!currentStory && !loading && (
        <div className="rounded-2xl border bg-card p-8 text-center mb-4">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "color-mix(in srgb, var(--icon-orange) 12%, transparent)" }}
          >
            <BookOpen size={24} style={{ color: "var(--icon-orange)" }} />
          </div>
          <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
            Your story hasn&apos;t been written yet
          </h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {memberName ? `${memberName.split(" ")[0]}'s` : "Your"} food system journey is ready to be told. Generate your first chapter.
          </p>
          <button
            onClick={updateStory}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--icon-orange), var(--icon-teal))" }}
          >
            <BookOpen size={14} /> Generate Your Story
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <div
            className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-transparent"
            style={{ borderTopColor: "var(--icon-orange)" }}
          />
          <p className="text-sm text-muted-foreground">Writing your story…</p>
          <p className="text-xs text-muted-foreground/60 mt-1">This takes about 10 seconds</p>
        </div>
      )}

      {/* Story exists */}
      {currentStory && !loading && (
        <div className="space-y-4">
          {/* Narrative */}
          <div
            className="rounded-2xl border bg-card p-6"
            style={{
              borderTopWidth: "3px",
              borderTopColor: "var(--icon-orange)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen size={15} style={{ color: "var(--icon-orange)" }} />
                <p className="text-sm font-semibold text-foreground">
                  {memberName ? `${memberName.split(" ")[0]}'s Story` : "Your Story"}
                </p>
              </div>
              <button
                onClick={updateStory}
                disabled={loading}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted/30",
                  loading && "opacity-50 cursor-not-allowed"
                )}
                style={{ color: "var(--icon-orange)" }}
              >
                <RefreshCw size={11} /> Update
              </button>
            </div>

            {/* Narrative paragraphs in serif */}
            <div className="space-y-4">
              {currentStory.narrative.split("\n\n").map((para, i) => (
                <p
                  key={i}
                  className="font-serif text-base leading-relaxed text-foreground"
                  style={{ lineHeight: "1.75" }}
                >
                  {para}
                </p>
              ))}
            </div>

            {lastUpdated && (
              <p className="mt-6 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Last updated {lastUpdated}
              </p>
            )}
          </div>

          {/* Chapter timeline */}
          {currentStory.chapters && currentStory.chapters.length > 1 && (
            <div className="rounded-2xl border bg-card p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Chapter Timeline
              </p>
              <div>
                {currentStory.chapters.map((chapter, i) => (
                  <ChapterDot
                    key={chapter.month}
                    chapter={chapter}
                    isLast={i === currentStory.chapters.length - 1}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
