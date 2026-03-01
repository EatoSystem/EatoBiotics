"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { foods, type Food, type BioticType } from "@/lib/foods"
import { Search, X } from "lucide-react"

interface FoodSearchProps {
  onSelect: (food: Food) => void
  /** Hide foods already selected */
  excludeSlugs?: string[]
  /** Only show foods of these biotic types */
  filterBiotics?: BioticType[]
  /** Only show plant-based foods */
  plantsOnly?: boolean
  /** Placeholder text */
  placeholder?: string
}

const PLANT_CATEGORIES = new Set([
  "Vegetables",
  "Fruit",
  "Grains & Legumes",
  "Nuts & Seeds",
  "Herbs & Spices",
  "Sea Vegetables",
])

export function FoodSearch({
  onSelect,
  excludeSlugs = [],
  filterBiotics,
  plantsOnly = false,
  placeholder = "Search foods…",
}: FoodSearchProps) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const excludeSet = new Set(excludeSlugs)

  const filtered = foods.filter((f) => {
    if (excludeSet.has(f.slug)) return false
    if (filterBiotics && !filterBiotics.includes(f.biotic)) return false
    if (plantsOnly && !PLANT_CATEGORIES.has(f.category)) return false
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      f.name.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q) ||
      f.biotic.toLowerCase().includes(q) ||
      f.emoji.includes(q)
    )
  })

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return
    const item = listRef.current.children[highlightIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: "nearest" })
  }, [highlightIndex])

  const selectFood = useCallback(
    (food: Food) => {
      onSelect(food)
      setQuery("")
      setIsOpen(false)
      setHighlightIndex(0)
      inputRef.current?.blur()
    },
    [onSelect]
  )

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1))
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightIndex((i) => Math.max(i - 1, 0))
        break
      case "Enter":
        e.preventDefault()
        if (filtered[highlightIndex]) selectFood(filtered[highlightIndex])
        break
      case "Escape":
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  const bioticColor: Record<string, string> = {
    prebiotic: "text-icon-lime",
    probiotic: "text-icon-teal",
    postbiotic: "text-icon-orange",
    protein: "text-icon-yellow",
    all: "text-muted-foreground",
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search
          size={16}
          className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setHighlightIndex(0)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-background py-2.5 pr-9 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-icon-green focus:outline-none focus:ring-1 focus:ring-icon-green/30"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("")
              inputRef.current?.focus()
            }}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1.5 max-h-56 w-full overflow-auto rounded-xl border border-border bg-background shadow-lg"
        >
          {filtered.slice(0, 20).map((food, i) => (
            <li key={food.slug}>
              <button
                type="button"
                onClick={() => selectFood(food)}
                onMouseEnter={() => setHighlightIndex(i)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                  i === highlightIndex ? "bg-muted" : "hover:bg-muted/50"
                }`}
              >
                <span className="text-base">{food.emoji}</span>
                <span className="flex-1 font-medium text-foreground">{food.name}</span>
                <span className={`text-xs capitalize ${bioticColor[food.biotic]}`}>
                  {food.biotic}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && query && filtered.length === 0 && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-background p-4 text-center text-sm text-muted-foreground shadow-lg">
          No foods found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  )
}
