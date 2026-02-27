import React from "react"

/* ══════════════════════════════════════════════════════════════════════════
   Reedsy-optimised variants of the Chapter 19 Index table components.
   Clean, book-safe HTML tables for Reedsy Studio import.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── ScoreLevel (reedsy) ──────────────────────────────────────────────── */

interface ScoreLevelProps { score: number; level: string; children: React.ReactNode }

export function ReedsyScoreLevel({ children }: ScoreLevelProps) {
  return <>{children}</>
}

/* ── DimensionScoreTable (reedsy) ─────────────────────────────────────── */

interface DimensionScoreTableProps {
  dimension: string
  icon?: string
  color?: string
  description?: string
  children: React.ReactNode
}

export function ReedsyDimensionScoreTable({
  dimension,
  description,
  children,
}: DimensionScoreTableProps) {
  const items: { score: number; level: string; content: React.ReactNode }[] = []
  React.Children.forEach(children, (child) => {
    if (React.isValidElement<ScoreLevelProps>(child) && child.props.score != null) {
      items.push({ score: child.props.score, level: child.props.level, content: child.props.children })
    }
  })

  return (
    <div className="my-6">
      <p className="font-bold text-gray-900">{dimension}</p>
      {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
      <table className="mt-2 w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-b border-gray-300 py-1 text-left font-semibold">Score</th>
            <th className="border-b border-gray-300 py-1 text-left font-semibold">Level</th>
            <th className="border-b border-gray-300 py-1 text-left font-semibold">Description</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.score}>
              <td className="border-b border-gray-200 py-1 font-bold">{item.score}</td>
              <td className="border-b border-gray-200 py-1">{item.level}</td>
              <td className="border-b border-gray-200 py-1 text-gray-600">{item.content}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── ScoreDimension (reedsy) ──────────────────────────────────────────── */

interface ScoreDimensionProps { dimension: string; score: number; children: React.ReactNode }

export function ReedsyScoreDimension({ children }: ScoreDimensionProps) {
  return <>{children}</>
}

/* ── FoodScoreCard (reedsy) ───────────────────────────────────────────── */

interface FoodScoreCardProps {
  name: string
  emoji?: string
  total: number
  rating: string
  summary?: string
  children: React.ReactNode
}

export function ReedsyFoodScoreCard({
  name,
  emoji,
  total,
  rating,
  summary,
  children,
}: FoodScoreCardProps) {
  const items: { dimension: string; score: number; rationale: React.ReactNode }[] = []
  React.Children.forEach(children, (child) => {
    if (React.isValidElement<ScoreDimensionProps>(child) && child.props.score != null) {
      items.push({ dimension: child.props.dimension, score: child.props.score, rationale: child.props.children })
    }
  })

  return (
    <div className="my-6">
      <p className="font-bold text-gray-900">
        {emoji && <>{emoji} </>}{name} — {total}/25 ({rating})
      </p>
      {summary && <p className="mt-1 text-sm italic text-gray-500">{summary}</p>}
      <table className="mt-2 w-full border-collapse text-sm">
        <tbody>
          {items.map((item) => (
            <tr key={item.dimension}>
              <td className="border-b border-gray-200 py-1 font-medium">{item.dimension}</td>
              <td className="border-b border-gray-200 py-1 font-bold">{item.score}</td>
              <td className="border-b border-gray-200 py-1 text-gray-600">{item.rationale}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── RankedFood (reedsy) ──────────────────────────────────────────────── */

interface RankedFoodProps { rank: number; name: string; score: number }

export function ReedsyRankedFood({ children }: { children?: React.ReactNode } & RankedFoodProps) {
  return <>{children}</>
}

/* ── FoodRankingTable (reedsy) ────────────────────────────────────────── */

interface FoodRankingTableProps { title?: string; children: React.ReactNode }

export function ReedsyFoodRankingTable({ title, children }: FoodRankingTableProps) {
  const items: RankedFoodProps[] = []
  React.Children.forEach(children, (child) => {
    if (React.isValidElement<RankedFoodProps>(child) && child.props.rank != null) {
      items.push({ rank: child.props.rank, name: child.props.name, score: child.props.score })
    }
  })

  return (
    <div className="my-6">
      <p className="font-bold text-gray-900">{title ?? "Top 20 EatoBiotics Index Foods"}</p>
      <ol className="mt-2 list-decimal space-y-1 pl-6 text-sm">
        {items.map((item) => (
          <li key={item.rank}>
            {item.name} — <strong>{item.score}/25</strong>
          </li>
        ))}
      </ol>
    </div>
  )
}

/* ── ScoreBand (reedsy) ───────────────────────────────────────────────── */

interface ScoreBandProps { range: string; rating: string; action: string; examples: string; color?: string }

export function ReedsyScoreBand({ children }: { children?: React.ReactNode } & ScoreBandProps) {
  return <>{children}</>
}

/* ── ScoreCheatSheet (reedsy) ─────────────────────────────────────────── */

interface ScoreCheatSheetProps { children: React.ReactNode }

export function ReedsyScoreCheatSheet({ children }: ScoreCheatSheetProps) {
  const items: ScoreBandProps[] = []
  React.Children.forEach(children, (child) => {
    if (React.isValidElement<ScoreBandProps>(child) && child.props.range != null) {
      items.push({
        range: child.props.range,
        rating: child.props.rating,
        action: child.props.action,
        examples: child.props.examples,
      })
    }
  })

  return (
    <div className="my-6">
      <p className="font-bold text-gray-900">EatoBiotics Index Cheat Sheet</p>
      <table className="mt-2 w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-b border-gray-300 py-1 text-left font-semibold">Score</th>
            <th className="border-b border-gray-300 py-1 text-left font-semibold">Rating</th>
            <th className="border-b border-gray-300 py-1 text-left font-semibold">Action</th>
            <th className="border-b border-gray-300 py-1 text-left font-semibold">Examples</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.range}>
              <td className="border-b border-gray-200 py-1 font-bold">{item.range}</td>
              <td className="border-b border-gray-200 py-1">{item.rating}</td>
              <td className="border-b border-gray-200 py-1">{item.action}</td>
              <td className="border-b border-gray-200 py-1 text-gray-600">{item.examples}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
