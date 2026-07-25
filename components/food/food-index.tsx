"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, X } from "lucide-react"
import { FoodImage } from "@/components/food/food-image"
import { BIOTIC_META, BIOTIC_ORDER, bioticMeta } from "@/lib/biotic-meta"
import type { FoodCardData } from "@/components/food/food-card"

type Filter = "all" | (typeof BIOTIC_ORDER)[number]
type Sort = "az" | "biotic" | "category"

interface FoodIndexProps {
  /** Slim projection from the server page — never the full Food objects. */
  foods: FoodCardData[]
}

/**
 * The complete library as a dense, scannable index.
 *
 * Replaces the six stacked card grids the page used to be. Search, filter and sort
 * are the fast path for anyone who already knows what they're looking for.
 *
 * Matching mirrors `components/app/food-search.tsx` (name / category / biotic), which
 * is intentionally left untouched — it is a typeahead consumed by the plate builder,
 * score calculator and plant tracker, and serves a different job.
 */
export function FoodIndex({ foods }: FoodIndexProps) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [sort, setSort] = useState<Sort>("az")

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: foods.length }
    for (const biotic of BIOTIC_ORDER) {
      base[biotic] = foods.filter((f) => f.biotic === biotic).length
    }
    return base
  }, [foods])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = foods.filter((food) => {
      if (filter !== "all" && food.biotic !== filter) return false
      if (!q) return true
      return (
        food.name.toLowerCase().includes(q) ||
        food.category.toLowerCase().includes(q) ||
        food.biotic.toLowerCase().includes(q) ||
        food.tagline.toLowerCase().includes(q)
      )
    })

    const byName = (a: FoodCardData, b: FoodCardData) => a.name.localeCompare(b.name)
    if (sort === "category") {
      return [...list].sort((a, b) => a.category.localeCompare(b.category) || byName(a, b))
    }
    if (sort === "biotic") {
      return [...list].sort(
        (a, b) =>
          BIOTIC_ORDER.indexOf(a.biotic as (typeof BIOTIC_ORDER)[number]) -
            BIOTIC_ORDER.indexOf(b.biotic as (typeof BIOTIC_ORDER)[number]) || byName(a, b)
      )
    }
    return [...list].sort(byName)
  }, [foods, query, filter, sort])

  const chips: { key: Filter; label: string }[] = [
    { key: "all", label: "All foods" },
    ...BIOTIC_ORDER.map((b) => ({ key: b as Filter, label: BIOTIC_META[b].label })),
  ]

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the library"
            aria-label="Search the food library"
            className="w-full border-0 bg-transparent py-2 pr-7 pl-6 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-0 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="food-sort" className="sr-only">
            Sort the food library
          </label>
          <select
            id="food-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            className="cursor-pointer border-0 bg-transparent py-2 text-sm font-medium text-muted-foreground focus:outline-none"
          >
            <option value="az">A–Z</option>
            <option value="biotic">By biotic</option>
            <option value="category">By category</option>
          </select>
        </div>
      </div>

      {/* Filter chips */}
      <div className="mt-5 flex flex-wrap gap-2">
        {chips.map((chip) => {
          const active = filter === chip.key
          const color =
            chip.key === "all" ? "var(--icon-green)" : BIOTIC_META[chip.key].color
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => setFilter(chip.key)}
              aria-pressed={active}
              className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: active ? "currentColor" : color }}
              />
              {chip.label}
              <span className="tabular-nums opacity-60">{counts[chip.key]}</span>
            </button>
          )
        })}
      </div>

      {/* Rows */}
      {visible.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-serif text-xl text-foreground">
            Nothing matches “{query}”.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a food name, or a category like “fermented”.
          </p>
        </div>
      ) : (
        <ul className="mt-2">
          {visible.map((food) => {
            const meta = bioticMeta(food.biotic)
            return (
              <li key={food.slug}>
                <Link
                  href={`/food/${food.slug}`}
                  className="group flex items-center gap-4 border-b border-border py-3 transition-colors hover:bg-secondary/50"
                >
                  <FoodImage
                    food={food}
                    sizes="56px"
                    emojiClassName="text-2xl"
                    className="h-14 w-14 shrink-0 rounded-xl"
                  />

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-serif text-lg font-semibold text-foreground">
                      {food.name}
                    </h3>
                    <p className="truncate text-sm text-muted-foreground">{food.tagline}</p>
                  </div>

                  <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="w-20 text-xs font-medium text-muted-foreground">
                      {meta.label}
                    </span>
                  </div>

                  <span className="hidden w-40 shrink-0 truncate text-xs text-muted-foreground md:block">
                    {food.category}
                  </span>

                  {food.county && (
                    <span className="hidden w-24 shrink-0 truncate text-xs text-muted-foreground lg:block">
                      Co. {food.county}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-5 text-xs text-muted-foreground tabular-nums">
        Showing {visible.length} of {foods.length} foods
      </p>
    </div>
  )
}
