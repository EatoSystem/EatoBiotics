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

function isGeneratedRecipeImage(imageUrl?: string | null): boolean {
  if (!imageUrl) return false
  return !imageUrl.startsWith("/plate-builder/") && !imageUrl.startsWith("/food-")
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
    imageGenerated: Boolean(row.image_generated) || isGeneratedRecipeImage(row.image_url),
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

function FoodSystemSection({ recipe }: { recipe: PlateRecipe }) {
  const plantItems = recipe.shoppingSections
    .filter((section) => !/protein/i.test(section.title))
    .flatMap((section) => section.items)
  const proteinItems = recipe.shoppingSections
    .find((section) => /protein/i.test(section.title))
    ?.items ?? []
  const fermentedItems = plantItems.filter((item) =>
    /kimchi|kefir|yogurt|miso|pickle|pickled|fermented|sauerkraut/i.test(item)
  )

  const cards = [
    {
      title: "Feeds your inner food system",
      text: `${plantItems.slice(0, 5).join(", ") || "The plant ingredients"} bring fibre, colour, and variety that help make the plate feel more complete and microbiome-aware.`,
      color: "text-icon-green",
      border: "border-icon-green/30",
    },
    {
      title: "Adds steady nourishment",
      text: `${proteinItems[0] || "The protein"} plus healthy fats and plants gives the bowl structure, helping it work as a proper meal rather than a snack.`,
      color: "text-icon-teal",
      border: "border-icon-teal/30",
    },
    {
      title: "Includes biotic contrast",
      text: fermentedItems.length > 0
        ? `${fermentedItems[0]} adds a fermented note alongside prebiotic plants and supportive fats.`
        : "Fermented, fibre-rich, colourful, and lightly dressed elements work together inside the EatoBiotics framework.",
      color: "text-icon-orange",
      border: "border-icon-orange/30",
    },
  ]

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-[1180px] rounded-3xl border border-icon-green/30 bg-white p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-green">The Food System Inside You</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold leading-tight text-foreground">
              What this recipe is designed to do.
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              This recipe is built as food education: a practical plate that combines plants, protein, fermented elements, healthy fats, herbs, and texture so your meal supports the internal food system you are feeding every day.
            </p>
          </div>
          <div className="grid gap-3">
            {cards.map((card) => (
              <div key={card.title} className={`rounded-2xl border ${card.border} bg-white p-5`}>
                <p className={`text-xs font-bold uppercase tracking-widest ${card.color}`}>{card.title}</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-icon-green/20 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Prebiotic</p>
            <p className="mt-2 font-serif text-2xl font-semibold text-foreground">{recipe.score.prebiotic}</p>
          </div>
          <div className="rounded-2xl border border-icon-teal/20 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Probiotic</p>
            <p className="mt-2 font-serif text-2xl font-semibold text-foreground">{recipe.score.probiotic}</p>
          </div>
          <div className="rounded-2xl border border-icon-orange/20 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Postbiotic</p>
            <p className="mt-2 font-serif text-2xl font-semibold text-foreground">{recipe.score.postbiotic}</p>
          </div>
          <div className="rounded-2xl border border-icon-yellow/30 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Balance</p>
            <p className="mt-2 font-serif text-2xl font-semibold text-foreground">{recipe.score.balance}</p>
          </div>
        </div>
      </div>
    </section>
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
            </div>
          </div>
        </div>
      </section>

      <FoodSystemSection recipe={recipe} />

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
