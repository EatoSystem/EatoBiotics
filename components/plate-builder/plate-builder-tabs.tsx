"use client"

/**
 * Unified /plate-builder experience.
 *
 * Four tabs in a single URL with deep-linkable `?tab=` state:
 *   - build     → existing one-recipe generator (PlateBuilderClient)
 *   - weekly    → meal-plan generator (formerly /create-my-plate)
 *   - my-plate  → quadrant builder + plants + journal (formerly /myplate)
 *   - cookbook  → user's saved recipes (new)
 *
 * Each tab is a previously-standalone client component, plugged in here
 * unchanged. The tab strip + URL handling lives in this file so the
 * inner components stay portable and Codex-friendly.
 */
import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sparkles, Calendar, Layout, BookHeart } from "lucide-react"
import { PlateBuilderClient } from "@/components/plate-builder/plate-builder-client"
import PlateCreatorClient from "@/components/plate-builder/weekly-plan-client"
import { MyPlateClient } from "@/components/plate-builder/my-plate-client"
import { MyRecipesPanel } from "@/components/plate-builder/my-recipes-panel"

type TabId = "build" | "weekly" | "my-plate" | "cookbook"

const TABS: { id: TabId; label: string; icon: React.ReactNode; description: string }[] = [
  { id: "build",    label: "Build",        icon: <Sparkles size={14} />,  description: "Generate a single recipe with an image" },
  { id: "weekly",   label: "Weekly Plan",  icon: <Calendar size={14} />,  description: "AI-planned meals for a single day or a full week" },
  { id: "my-plate", label: "My Plate",     icon: <Layout size={14} />,    description: "Build a quadrant plate, track plants, journal" },
  { id: "cookbook", label: "My Recipes",   icon: <BookHeart size={14} />, description: "Your saved recipes" },
]

const VALID_TAB_IDS = new Set<TabId>(TABS.map((t) => t.id))

function isTabId(value: string | null): value is TabId {
  return value !== null && VALID_TAB_IDS.has(value as TabId)
}

export function PlateBuilderTabs() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const tabParam     = searchParams.get("tab")
  const initialTab   = isTabId(tabParam) ? tabParam : "build"
  const [tab, setTab] = useState<TabId>(initialTab)

  // Sync tab → URL whenever it changes, without scrolling to top.
  useEffect(() => {
    const current = searchParams.get("tab")
    if (current === tab) return
    const next = new URLSearchParams(searchParams.toString())
    if (tab === "build") next.delete("tab")
    else next.set("tab", tab)
    router.replace(`/plate-builder${next.toString() ? `?${next}` : ""}`, { scroll: false })
  }, [tab, router, searchParams])

  const onSelectTab = useCallback((id: TabId) => () => setTab(id), [])

  return (
    <div className="min-h-screen bg-background">
      {/* ── Tab strip ── */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <nav
          aria-label="Plate builder sections"
          className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-2.5 md:px-8"
        >
          {TABS.map(({ id, label, icon }) => {
            const active = tab === id
            return (
              <button
                key={id}
                type="button"
                onClick={onSelectTab(id)}
                aria-current={active ? "page" : undefined}
                className={
                  "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors " +
                  (active
                    ? "bg-icon-green text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                <span aria-hidden="true">{icon}</span>
                <span>{label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* ── Tab content ── */}
      <div className="pt-2">
        {tab === "build"    && <PlateBuilderClient />}
        {tab === "weekly"   && <PlateCreatorClient />}
        {tab === "my-plate" && <MyPlateClient />}
        {tab === "cookbook" && (
          <div className="px-4 py-8 md:px-8 md:py-10">
            <header className="mx-auto mb-6 max-w-4xl">
              <h1 className="font-serif text-3xl font-semibold">Your cookbook</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Every recipe you&apos;ve saved from the Build tab. Tap the heart to favourite, the trash to remove.
              </p>
            </header>
            <MyRecipesPanel />
          </div>
        )}
      </div>
    </div>
  )
}
