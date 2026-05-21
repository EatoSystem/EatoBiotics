import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getSupabase } from "@/lib/supabase"
import type { PlateId, PlateRecipe } from "@/lib/plate-builder-recipe"

type PageProps = {
  params: Promise<{ slug: string }>
}

type RecipeRow = {
  slug: string
  plate_type: PlateId
  plate_name: string
  name: string
  description: string
  image_url: string
  goal: string | null
  flavour: string | null
  dietary_style: string | null
  time: PlateRecipe["time"]
  score: PlateRecipe["score"]
  nutrition: PlateRecipe["nutrition"]
  ingredients: string[]
  method: string[]
  shopping_sections: PlateRecipe["shoppingSections"]
  weekly_role: string | null
  disclaimer: string | null
  image_generated?: boolean | null
  image_options?: string[] | null
  image_model?: string | null
  image_prompt?: string | null
  reference_style_used?: boolean | null
  created_at: string
}

async function getRecipe(slug: string): Promise<PlateRecipe | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("plate_recipes")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (error || !data) return null

  const row = data as RecipeRow
  return {
    slug: row.slug,
    plateId: row.plate_type,
    plateName: row.plate_name,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    goal: row.goal ?? "balance",
    flavour: row.flavour ?? "Bright and zesty",
    dietaryStyle: row.dietary_style ?? "Flexible",
    time: row.time,
    score: row.score,
    nutrition: row.nutrition,
    ingredients: row.ingredients,
    method: row.method,
    shoppingSections: row.shopping_sections,
    weeklyRole: row.weekly_role ?? "",
    disclaimer: row.disclaimer ?? "EatoBiotics recipes and scores are educational and not medical advice.",
    createdAt: row.created_at,
    imageGenerated: row.image_generated ?? false,
    imageOptions: row.image_options ?? [],
    imageModel: row.image_model ?? undefined,
    imagePrompt: row.image_prompt ?? undefined,
    referenceStyleUsed: row.reference_style_used ?? false,
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const recipe = await getRecipe(slug)
  if (!recipe) return { title: "Recipe | EatoBiotics" }

  return {
    title: `${recipe.name} | EatoBiotics`,
    description: recipe.description,
    openGraph: {
      title: recipe.name,
      description: recipe.description,
      images: recipe.imageUrl ? [{ url: recipe.imageUrl }] : undefined,
    },
  }
}

function ScoreCircle({ value }: { value: number }) {
  return (
    <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full border-4 border-icon-green bg-white text-center">
      <span className="font-serif text-4xl font-semibold leading-none text-foreground">{value}</span>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">/100</span>
    </div>
  )
}

export default async function RecipePage({ params }: PageProps) {
  const { slug } = await params
  const recipe = await getRecipe(slug)
  if (!recipe) notFound()

  return (
    <main className="bg-white">
      <section className="px-6 pt-24 pb-10 md:pt-32">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-green">{recipe.plateName}</p>
            <h1 className="mt-4 font-serif text-5xl font-semibold leading-tight text-foreground md:text-6xl">
              {recipe.name}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{recipe.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full border border-icon-green/30 px-4 py-2 text-sm font-semibold text-foreground">{recipe.time.total}</span>
              <span className="rounded-full border border-icon-orange/30 px-4 py-2 text-sm font-semibold text-foreground">{recipe.nutrition.calories} kcal</span>
              <span className="rounded-full border border-icon-teal/30 px-4 py-2 text-sm font-semibold text-foreground">{recipe.nutrition.protein}g protein</span>
            </div>
          </div>
          <div className="overflow-hidden rounded-[2rem] border border-icon-green/25 bg-white">
            <div className="relative">
              <img src={recipe.imageUrl} alt={recipe.name} className="aspect-square h-full w-full object-cover" />
              <div className="absolute left-4 top-4 rounded-full border border-white/80 bg-white px-3 py-1.5 text-xs font-bold text-foreground shadow-sm">
                {recipe.imageGenerated ? "AI-generated image" : "Fallback reference image"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto grid max-w-[1180px] gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-icon-green/30 bg-white p-6">
              <div className="flex gap-5">
                <ScoreCircle value={recipe.score.overall} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-icon-green">Biotic breakdown</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <p>Prebiotic: <strong>{recipe.score.prebiotic}</strong></p>
                    <p>Probiotic: <strong>{recipe.score.probiotic}</strong></p>
                    <p>Postbiotic: <strong>{recipe.score.postbiotic}</strong></p>
                    <p>Balance: <strong>{recipe.score.balance}</strong></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-icon-teal/30 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-icon-teal">Nutrition</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                <p><strong>{recipe.nutrition.calories}</strong><br />kcal</p>
                <p><strong>{recipe.nutrition.protein}g</strong><br />protein</p>
                <p><strong>{recipe.nutrition.carbs}g</strong><br />carbs</p>
                <p><strong>{recipe.nutrition.fat}g</strong><br />fat</p>
                <p><strong>{recipe.nutrition.fibre}g</strong><br />fibre</p>
              </div>
            </div>

            <div className="rounded-3xl border border-icon-orange/30 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">Shopping list</p>
              <div className="mt-4 grid gap-3">
                {recipe.shoppingSections.map((section) => (
                  <div key={section.title} className="rounded-2xl border border-border p-4">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: section.color }}>{section.title}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {section.items.map((item) => (
                        <span key={`${section.title}-${item}`} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold">{item}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-icon-green/30 bg-white p-6">
              <h2 className="font-serif text-3xl font-semibold text-foreground">Ingredients</h2>
              <ul className="mt-4 grid gap-3">
                {recipe.ingredients.map((ingredient) => (
                  <li key={ingredient} className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">{ingredient}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-icon-orange/30 bg-white p-6">
              <h2 className="font-serif text-3xl font-semibold text-foreground">Method</h2>
              <div className="mt-4 grid gap-3">
                {recipe.method.map((step, index) => (
                  <div key={step} className="flex gap-4 rounded-2xl border border-border p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-icon-green text-sm font-bold text-white">{index + 1}</span>
                    <p className="pt-1 text-sm leading-relaxed text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
              {recipe.weeklyRole && <p className="mt-5 rounded-2xl border border-icon-green/20 p-4 text-sm leading-relaxed text-foreground">{recipe.weeklyRole}</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-[900px] rounded-2xl border border-border bg-white p-6 text-sm leading-relaxed text-muted-foreground">
          {recipe.disclaimer}
        </div>
      </section>
    </main>
  )
}
