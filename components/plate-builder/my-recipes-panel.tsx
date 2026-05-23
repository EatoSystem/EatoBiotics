"use client"

/**
 * My Recipes — the user's personal cookbook view inside /plate-builder.
 *
 * Lists everything they've saved via the "Save plate" button on the Build tab.
 * Lazy: fetches once on mount; refetches on the same mount only when a save
 * just happened (caller can trigger via the `refreshKey` prop).
 */
import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart, Trash2, UtensilsCrossed, ArrowRight } from "lucide-react"

interface SavedRecipe {
  id:           string
  slug:         string
  plate_id:     "foundation" | "function" | "diversity" | "restoration"
  name:         string
  description:  string | null
  image_url:    string | null
  is_favorite:  boolean
  created_at:   string
  recipe_json:  Record<string, unknown>
}

const PLATE_LABEL: Record<SavedRecipe["plate_id"], string> = {
  foundation:  "Foundation",
  function:    "Function",
  diversity:   "Diversity",
  restoration: "Restoration",
}

export function MyRecipesPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error" | "auth">("loading")
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])

  useEffect(() => {
    let cancelled = false
    setState("loading")
    fetch("/api/plate-builder/recipes")
      .then(async (res) => {
        if (cancelled) return
        if (res.status === 401 || res.status === 403) { setState("auth"); return }
        if (!res.ok) { setState("error"); return }
        const data = (await res.json()) as { recipes?: SavedRecipe[] }
        if (cancelled) return
        const list = data.recipes ?? []
        setRecipes(list)
        setState(list.length === 0 ? "empty" : "ready")
      })
      .catch(() => { if (!cancelled) setState("error") })
    return () => { cancelled = true }
  }, [refreshKey])

  async function toggleFavorite(recipe: SavedRecipe) {
    const next = !recipe.is_favorite
    // Optimistic UI: flip immediately, roll back on failure.
    setRecipes((cur) => cur.map((r) => r.id === recipe.id ? { ...r, is_favorite: next } : r))
    const res = await fetch(`/api/plate-builder/recipes/${recipe.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ is_favorite: next }),
    })
    if (!res.ok) {
      setRecipes((cur) => cur.map((r) => r.id === recipe.id ? { ...r, is_favorite: !next } : r))
    }
  }

  async function deleteRecipe(recipe: SavedRecipe) {
    if (!window.confirm(`Remove "${recipe.name}" from your cookbook?`)) return
    const prev = recipes
    setRecipes((cur) => cur.filter((r) => r.id !== recipe.id))
    const res = await fetch(`/api/plate-builder/recipes/${recipe.id}`, { method: "DELETE" })
    if (!res.ok) {
      setRecipes(prev) // roll back
    } else if (recipes.length === 1) {
      setState("empty")
    }
  }

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-icon-green border-t-transparent" />
      </div>
    )
  }

  if (state === "auth") {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
        <UtensilsCrossed className="mx-auto mb-3 text-icon-green" size={28} aria-hidden="true" />
        <h2 className="font-serif text-xl font-semibold">Sign in to see your cookbook</h2>
        <p className="mt-2 text-sm text-muted-foreground">Saving recipes requires an EatoBiotics account on a paid plan.</p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/account/signin" className="rounded-full bg-icon-green px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">Sign in</Link>
          <Link href="/pricing" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:border-icon-green hover:text-icon-green">See plans</Link>
        </div>
      </div>
    )
  }

  if (state === "error") {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center text-sm text-amber-800">
        We couldn&apos;t load your recipes right now. Refresh to try again.
      </div>
    )
  }

  if (state === "empty") {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
        <UtensilsCrossed className="mx-auto mb-3 text-icon-green" size={28} aria-hidden="true" />
        <h2 className="font-serif text-xl font-semibold">Your cookbook is empty</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Generate a recipe on the <strong>Build</strong> tab and tap <strong>Save plate</strong> to add it here.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="grid gap-4 sm:grid-cols-2">
        {recipes.map((recipe) => (
          <article
            key={recipe.id}
            className="overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
              {recipe.image_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={recipe.image_url} alt={recipe.name} className="h-full w-full object-cover" />
                : <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
              }
            </div>
            <div className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-icon-green">
                {PLATE_LABEL[recipe.plate_id]} · {new Date(recipe.created_at).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}
              </p>
              <h3 className="mt-1 font-serif text-lg font-semibold leading-snug">{recipe.name}</h3>
              {recipe.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{recipe.description}</p>
              )}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(recipe)}
                    aria-label={recipe.is_favorite ? "Remove from favourites" : "Add to favourites"}
                    className="rounded-full border border-border p-1.5 transition-colors hover:border-icon-green"
                  >
                    <Heart size={14} fill={recipe.is_favorite ? "currentColor" : "none"} className={recipe.is_favorite ? "text-rose-500" : "text-muted-foreground"} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRecipe(recipe)}
                    aria-label="Delete recipe"
                    className="rounded-full border border-border p-1.5 transition-colors hover:border-red-500 hover:text-red-500 text-muted-foreground"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <Link
                  href={`/recipe/${recipe.slug}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-icon-green hover:underline"
                >
                  Open <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
