import React from "react"

/* ══════════════════════════════════════════════════════════════════════════
   Substack-optimised variants of the Chapter 19 Index table components.
   Minimal styling — designed for email / Substack paste compatibility.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── ScoreLevel (substack) ──────────────────────────────────────────────── */

interface ScoreLevelProps { score: number; level: string; children: React.ReactNode }

export function SubstackScoreLevel({ children }: ScoreLevelProps) {
  return <>{children}</>
}

/* ── DimensionScoreTable (substack) ─────────────────────────────────────── */

interface DimensionScoreTableProps {
  dimension: string
  icon?: string
  color?: string
  description?: string
  children: React.ReactNode
}

export function SubstackDimensionScoreTable({
  dimension,
  icon,
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
    <div className="my-4 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
      <p className="font-bold">
        {icon && <>{icon} </>}{dimension}
      </p>
      {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="py-1 text-left font-semibold">Score</th>
            <th className="py-1 text-left font-semibold">Level</th>
            <th className="py-1 text-left font-semibold">Description</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.score} className="border-b border-gray-200">
              <td className="py-1 font-bold">{item.score}</td>
              <td className="py-1">{item.level}</td>
              <td className="py-1 text-gray-600">{item.content}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── ScoreDimension (substack) ──────────────────────────────────────────── */

interface ScoreDimensionProps { dimension: string; score: number; children: React.ReactNode }

export function SubstackScoreDimension({ children }: ScoreDimensionProps) {
  return <>{children}</>
}

/* ── FoodScoreCard (substack) ───────────────────────────────────────────── */

interface FoodScoreCardProps {
  name: string
  emoji?: string
  total: number
  rating: string
  summary?: string
  children: React.ReactNode
}

export function SubstackFoodScoreCard({
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
    <div className="my-4 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
      <p className="font-bold">
        {emoji && <>{emoji} </>}{name} — {total}/25 ({rating})
      </p>
      {summary && <p className="mt-1 text-sm text-gray-500"><em>{summary}</em></p>}
      <table className="mt-3 w-full text-sm">
        <tbody>
          {items.map((item) => (
            <tr key={item.dimension} className="border-b border-gray-200">
              <td className="py-1 font-medium">{item.dimension}</td>
              <td className="py-1 font-bold">{item.score}</td>
              <td className="py-1 text-gray-600">{item.rationale}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── RankedFood (substack) ──────────────────────────────────────────────── */

interface RankedFoodProps { rank: number; name: string; score: number }

export function SubstackRankedFood({ children }: { children?: React.ReactNode } & RankedFoodProps) {
  return <>{children}</>
}

/* ── FoodRankingTable (substack) ────────────────────────────────────────── */

interface FoodRankingTableProps { title?: string; children: React.ReactNode }

export function SubstackFoodRankingTable({ title, children }: FoodRankingTableProps) {
  const items: RankedFoodProps[] = []
  React.Children.forEach(children, (child) => {
    if (React.isValidElement<RankedFoodProps>(child) && child.props.rank != null) {
      items.push({ rank: child.props.rank, name: child.props.name, score: child.props.score })
    }
  })

  return (
    <div className="my-4 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
      <p className="font-bold">{title ?? "Top 20 EatoBiotics Index Foods"}</p>
      <ol className="mt-2 space-y-1 text-sm">
        {items.map((item) => (
          <li key={item.rank}>
            <strong>{item.rank}.</strong> {item.name} — <strong>{item.score}/25</strong>
          </li>
        ))}
      </ol>
    </div>
  )
}

/* ── ScoreBand (substack) ───────────────────────────────────────────────── */

interface ScoreBandProps { range: string; rating: string; action: string; examples: string; color?: string }

export function SubstackScoreBand({ children }: { children?: React.ReactNode } & ScoreBandProps) {
  return <>{children}</>
}

/* ── ScoreCheatSheet (substack) ─────────────────────────────────────────── */

interface ScoreCheatSheetProps { children: React.ReactNode }

export function SubstackScoreCheatSheet({ children }: ScoreCheatSheetProps) {
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
    <div className="my-4 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
      <p className="font-bold">EatoBiotics Index Cheat Sheet</p>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="py-1 text-left font-semibold">Score</th>
            <th className="py-1 text-left font-semibold">Rating</th>
            <th className="py-1 text-left font-semibold">Action</th>
            <th className="py-1 text-left font-semibold">Examples</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.range} className="border-b border-gray-200">
              <td className="py-1 font-bold">{item.range}</td>
              <td className="py-1">{item.rating}</td>
              <td className="py-1">{item.action}</td>
              <td className="py-1 text-gray-600">{item.examples}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
