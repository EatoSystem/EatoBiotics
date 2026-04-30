import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"

export const metadata: Metadata = {
  title: "Weekly Recipes",
  description:
    "100 flexible protein recipe ideas across the four EatoBiotics plates — The Food System Bowl, The Immunity Mood & Energy Plate, The Living Plate, and The Rebuild Plate.",
  openGraph: {
    title: "Weekly Recipes — EatoBiotics",
    description: "Four plates. Four jobs. One complete weekly system. 100 flexible recipe ideas.",
  },
}

type Recipe = { id: number; name: string; description: string }

type Plate = {
  id: string
  category: string
  adjective: string
  plateName: string
  quote: string
  description: string
  tags: string[]
  emphasis: string
  plateLink: string
  image: string
  accent: string
  gradient: string
  recipes: Recipe[]
}

const PLATES: Plate[] = [
  {
    id: "foundation",
    category: "Foundation",
    adjective: "Balanced",
    plateName: "The Food System Bowl",
    quote: "This is how EatoBiotics begins.",
    description:
      "The entry point. The clearest, most balanced, most welcoming plate in the system. Built to introduce the central idea of EatoBiotics: not only feeding you, but feeding the ecosystem inside you.",
    tags: ["digestion", "energy", "resilience"],
    emphasis: "Balance",
    plateLink: "/food-system-bowl",
    image: "/plate-bowl.png",
    accent: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    recipes: [
      { id: 1,  name: "Protein Harvest Bowl",           description: "Protein with roasted seasonal vegetables, greens, grains, herbs, and dressing." },
      { id: 2,  name: "Protein Ancient Grain Plate",    description: "Protein with spelt, greens, seeds, lemon, and a fermented side." },
      { id: 3,  name: "Protein Garden Rice Bowl",       description: "Protein with brown rice, steamed greens, cucumber, herbs, and olive oil." },
      { id: 4,  name: "Protein Root & Seed Plate",      description: "Protein with roasted roots, leafy greens, seeds, and herbed dressing." },
      { id: 5,  name: "Protein Simple Supper Bowl",     description: "Protein with potatoes, greens, vegetables, and a cultured sauce." },
      { id: 6,  name: "Protein Farmer's Plate",         description: "Protein with seasonal vegetables, grains, beans, herbs, and greens." },
      { id: 7,  name: "Protein Green Foundation Bowl",  description: "Protein with broccoli, spinach, avocado, seeds, and lemon dressing." },
      { id: 8,  name: "Protein Earth Bowl",             description: "Protein with beetroot, carrots, grains, greens, and a sharp dressing." },
      { id: 9,  name: "Protein Everyday Bowl",          description: "Protein with rice, vegetables, greens, herbs, and a fermented garnish." },
      { id: 10, name: "Protein Orchard Plate",          description: "Protein with apple, greens, roots, toasted nuts, and mustard dressing." },
      { id: 11, name: "Protein Coastal Bowl",           description: "Protein with potatoes, sea greens, cucumber, herbs, and lemon oil." },
      { id: 12, name: "Protein Market Plate",           description: "Protein with whatever is fresh, colourful vegetables, grains, and dressing." },
      { id: 13, name: "Protein Seeded Greens Bowl",     description: "Protein with warm greens, toasted seeds, grains, and herb oil." },
      { id: 14, name: "Protein Country Bowl",           description: "Protein with cabbage, potatoes, carrots, herbs, and cultured dressing." },
      { id: 15, name: "Protein Sunrise Plate",          description: "Protein with eggs or grains, greens, avocado, seeds, and herbs." },
      { id: 16, name: "Protein Green Bean Bowl",        description: "Protein with green beans, rice, herbs, pickled vegetables, and olive oil." },
      { id: 17, name: "Protein Tomato Garden Plate",    description: "Protein with tomatoes, greens, beans, herbs, and sourdough crumbs." },
      { id: 18, name: "Protein Courgette & Herb Bowl",  description: "Protein with courgette, grains, herbs, seeds, and lemon." },
      { id: 19, name: "Protein Cucumber Crunch Plate",  description: "Protein with cucumber, radish, greens, grains, and tahini dressing." },
      { id: 20, name: "Protein Carrot & Coriander Bowl",description: "Protein with roasted carrots, rice, coriander, seeds, and greens." },
      { id: 21, name: "Protein Potato Herb Plate",      description: "Protein with warm potatoes, herbs, greens, olive oil, and pickles." },
      { id: 22, name: "Protein Bean & Greens Bowl",     description: "Protein with beans, leafy greens, herbs, garlic, and olive oil." },
      { id: 23, name: "Protein Savoury Oat Bowl",       description: "Protein with savoury oats, greens, seeds, herbs, and cultured topping." },
      { id: 24, name: "Protein Broccoli Bowl",          description: "Protein with broccoli, grains, herbs, seeds, and lemon-garlic dressing." },
      { id: 25, name: "Protein Foundation Plate",       description: "Protein with fibre, greens, healthy fats, herbs, and seasonal colour." },
    ],
  },
  {
    id: "function",
    category: "Function",
    adjective: "Functional",
    plateName: "The Immunity, Mood & Energy Plate",
    quote: "Support the system, and the system supports more of you.",
    description:
      "Shows that the microbiome affects far more than digestion. A vibrant plate designed to support immunity, steadier energy, emotional resilience, and recovery through the EatoBiotics framework.",
    tags: ["immunity", "mood", "energy", "recovery"],
    emphasis: "Function and support",
    plateLink: "/energy-plate",
    image: "/plate-immunity.png",
    accent: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    recipes: [
      { id: 26, name: "Protein Golden Energy Bowl",     description: "Protein with turmeric rice, greens, seeds, herbs, and bright dressing." },
      { id: 27, name: "Protein Ginger Glow Plate",      description: "Protein with ginger vegetables, greens, grains, and citrus dressing." },
      { id: 28, name: "Protein Brain Fuel Bowl",        description: "Protein with walnuts, greens, berries, grains, and cultured dressing." },
      { id: 29, name: "Protein Citrus Lift Plate",      description: "Protein with orange, fennel, greens, seeds, and a sharp vinaigrette." },
      { id: 30, name: "Protein Garlic Greens Bowl",     description: "Protein with garlic greens, rice, herbs, seeds, and olive oil." },
      { id: 31, name: "Protein Mineral Plate",          description: "Protein with beetroot, greens, seeds, herbs, and iron-rich vegetables." },
      { id: 32, name: "Protein Calm Bowl",              description: "Protein with rice, avocado, greens, cucumber, herbs, and sesame dressing." },
      { id: 33, name: "Protein Fire & Fibre Plate",     description: "Protein with chilli beans, greens, herbs, and cooling sauce." },
      { id: 34, name: "Protein Zest Bowl",              description: "Protein with lemony grains, greens, vegetables, herbs, and seeds." },
      { id: 35, name: "Protein Focus Plate",            description: "Protein with leafy greens, nuts, herbs, grains, and fermented vegetables." },
      { id: 36, name: "Protein Immune Garden Bowl",     description: "Protein with garlic, greens, mushrooms, herbs, and root vegetables." },
      { id: 37, name: "Protein Peppered Energy Plate",  description: "Protein with roasted peppers, greens, grains, seeds, and yogurt-style sauce." },
      { id: 38, name: "Protein Mood Bowl",              description: "Protein with sweet potato, greens, seeds, herbs, and creamy dressing." },
      { id: 39, name: "Protein Bright Beet Plate",      description: "Protein with beetroot, citrus, herbs, leaves, and toasted nuts." },
      { id: 40, name: "Protein Power Greens Bowl",      description: "Protein with kale, spinach, broccoli, seeds, and lemon oil." },
      { id: 41, name: "Protein Spiced Lentil Plate",    description: "Protein with spiced lentils, greens, herbs, and cooling dressing." },
      { id: 42, name: "Protein Sesame Energy Bowl",     description: "Protein with sesame vegetables, rice, greens, and ginger dressing." },
      { id: 43, name: "Protein Herb Vitality Plate",    description: "Protein with parsley, coriander, mint, grains, greens, and seeds." },
      { id: 44, name: "Protein Chilli Lime Bowl",       description: "Protein with lime rice, avocado, greens, herbs, and chilli oil." },
      { id: 45, name: "Protein Root Energy Plate",      description: "Protein with sweet roots, greens, seeds, herbs, and spiced dressing." },
      { id: 46, name: "Protein Sea Mineral Bowl",       description: "Protein with seaweed, cucumber, rice, herbs, and sesame." },
      { id: 47, name: "Protein Sunshine Plate",         description: "Protein with carrots, citrus, greens, grains, seeds, and herbs." },
      { id: 48, name: "Protein Steady Energy Bowl",     description: "Protein with beans, grains, greens, olive oil, and fresh herbs." },
      { id: 49, name: "Protein Immune Broth Bowl",      description: "Protein with broth, vegetables, herbs, greens, and noodles or grains." },
      { id: 50, name: "Protein Function Plate",         description: "Protein with energising herbs, fibre, minerals, colour, and healthy fats." },
    ],
  },
  {
    id: "richness",
    category: "Richness",
    adjective: "Abundant",
    plateName: "The Living Plate",
    quote: "The system thrives when it is fed with richness and variety.",
    description:
      "A fibre-rich, plant-diverse plate built to express the full range of what a thriving microbiome needs — colour, abundance, variety, and nourishment. Diversity is the goal.",
    tags: ["richness", "diversity", "nourishment", "consistency"],
    emphasis: "Diversity and abundance",
    plateLink: "/living-plate",
    image: "/plate-living.png",
    accent: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    recipes: [
      { id: 51, name: "Protein Rainbow Abundance Bowl",     description: "Protein with seven colourful vegetables, grains, herbs, and dressing." },
      { id: 52, name: "Protein Mezze Plate",                description: "Protein with hummus, pickles, herbs, greens, vegetables, and flatbread." },
      { id: 53, name: "Protein Living Garden Bowl",         description: "Protein with raw and cooked vegetables, herbs, seeds, and fermented garnish." },
      { id: 54, name: "Protein Mediterranean Plate",        description: "Protein with tomatoes, olives, greens, beans, herbs, and olive oil." },
      { id: 55, name: "Protein Thai Herb Bowl",             description: "Protein with rice, herbs, lime, cucumber, vegetables, and chilli dressing." },
      { id: 56, name: "Protein Nordic Plate",               description: "Protein with rye, cucumber, dill, roots, greens, and cultured sauce." },
      { id: 57, name: "Protein Moroccan Bowl",              description: "Protein with spiced vegetables, grains, herbs, nuts, and preserved lemon." },
      { id: 58, name: "Protein Japanese Garden Bowl",       description: "Protein with rice, seaweed, cucumber, greens, sesame, and miso dressing." },
      { id: 59, name: "Protein Irish Farm Plate",           description: "Protein with potatoes, greens, roots, herbs, and cultured butter-style sauce." },
      { id: 60, name: "Protein Mexican Fibre Bowl",         description: "Protein with beans, corn, avocado, herbs, salsa, and greens." },
      { id: 61, name: "Protein Indian Spice Plate",         description: "Protein with dhal, greens, rice, herbs, pickles, and cooling sauce." },
      { id: 62, name: "Protein Korean Crunch Bowl",         description: "Protein with rice, crunchy vegetables, sesame, greens, and spicy dressing." },
      { id: 63, name: "Protein Greek Island Plate",         description: "Protein with cucumber, tomato, herbs, olives, grains, and tangy dressing." },
      { id: 64, name: "Protein Persian Herb Bowl",          description: "Protein with herbs, rice, greens, nuts, dried fruit, and yogurt-style sauce." },
      { id: 65, name: "Protein Lebanese Greens Plate",      description: "Protein with tabbouleh-style herbs, grains, vegetables, and tahini." },
      { id: 66, name: "Protein Italian Bean Bowl",          description: "Protein with white beans, tomatoes, greens, herbs, and olive oil." },
      { id: 67, name: "Protein Spanish Market Plate",       description: "Protein with peppers, potatoes, greens, herbs, and smoky dressing." },
      { id: 68, name: "Protein Vietnamese Fresh Bowl",      description: "Protein with noodles, herbs, cucumber, pickles, and lime dressing." },
      { id: 69, name: "Protein Caribbean Colour Plate",     description: "Protein with rice, beans, mango, greens, herbs, and spice." },
      { id: 70, name: "Protein Middle Eastern Harvest Bowl",description: "Protein with roasted vegetables, grains, herbs, tahini, and pickles." },
      { id: 71, name: "Protein Green Goddess Plate",        description: "Protein with green herbs, avocado, leaves, seeds, and lemon dressing." },
      { id: 72, name: "Protein Ferment & Fresh Bowl",       description: "Protein with fresh vegetables, cooked grains, pickles, herbs, and seeds." },
      { id: 73, name: "Protein Abundance Salad Plate",      description: "Protein with leaves, grains, roasted vegetables, nuts, and bright dressing." },
      { id: 74, name: "Protein Global Market Bowl",         description: "Protein with mixed vegetables, grains, herbs, spices, and cultured garnish." },
      { id: 75, name: "Protein Richness Plate",             description: "Protein with maximum colour, texture, herbs, fibre, and living foods." },
    ],
  },
  {
    id: "rebuild",
    category: "Restoration",
    adjective: "Restorative",
    plateName: "The Rebuild Plate",
    quote: "Not perfection. Rebuilding.",
    description:
      "Closes the weekly sequence with resilience, recovery, and restoration. Designed to support rebuilding through better daily inputs and weekly consistency — calm, purposeful, and hopeful.",
    tags: ["rebuilding", "steadiness", "recovery"],
    emphasis: "Restoration and resilience",
    plateLink: "/build-plate",
    image: "/plate-rebuild.png",
    accent: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
    recipes: [
      { id: 76, name: "Protein Restore Bowl",              description: "Protein with soft grains, greens, vegetables, herbs, and nourishing broth." },
      { id: 77, name: "Protein Sweet Potato Recovery Plate",description: "Protein with sweet potato, greens, seeds, herbs, and creamy dressing." },
      { id: 78, name: "Protein Gentle Rice Bowl",          description: "Protein with rice, steamed vegetables, herbs, greens, and light sauce." },
      { id: 79, name: "Protein Broth & Greens Bowl",       description: "Protein with broth, greens, roots, herbs, and grains." },
      { id: 80, name: "Protein Slow-Cooked Rebuild Plate", description: "Protein with slow vegetables, beans, greens, and rich cooking juices." },
      { id: 81, name: "Protein Soft Lentil Bowl",          description: "Protein with soft lentils, greens, herbs, olive oil, and roots." },
      { id: 82, name: "Protein Golden Rebuild Plate",      description: "Protein with turmeric vegetables, grains, greens, and calming herbs." },
      { id: 83, name: "Protein Potato Recovery Bowl",      description: "Protein with potatoes, greens, herbs, cultured dressing, and seeds." },
      { id: 84, name: "Protein Mushroom Restore Plate",    description: "Protein with mushrooms, rice, greens, herbs, and savoury sauce." },
      { id: 85, name: "Protein Rebuild Noodle Bowl",       description: "Protein with noodles, greens, vegetables, herbs, and broth." },
      { id: 86, name: "Protein Sleepy Supper Plate",       description: "Protein with sweet roots, greens, herbs, seeds, and gentle dressing." },
      { id: 87, name: "Protein Bone Broth-Style Bowl",     description: "Protein with broth, vegetables, greens, herbs, and soft grains." },
      { id: 88, name: "Protein Repair Plate",              description: "Protein with beans, roots, greens, herbs, and olive oil." },
      { id: 89, name: "Protein Warm Cabbage Bowl",         description: "Protein with braised cabbage, potatoes, herbs, and mustard dressing." },
      { id: 90, name: "Protein Calm Curry Bowl",           description: "Protein with mild curry vegetables, rice, greens, and herbs." },
      { id: 91, name: "Protein Strength Bowl",             description: "Protein with grains, beans, greens, seeds, and rich dressing." },
      { id: 92, name: "Protein Rebuild Mash Plate",        description: "Protein with root mash, greens, herbs, and fermented vegetables." },
      { id: 93, name: "Protein Soft Herb Plate",           description: "Protein with soft vegetables, herbs, rice, greens, and olive oil." },
      { id: 94, name: "Protein Recovery Stew Bowl",        description: "Protein with vegetables, beans, greens, herbs, and thick broth." },
      { id: 95, name: "Protein Gentle Greens Plate",       description: "Protein with steamed greens, rice, seeds, herbs, and lemon oil." },
      { id: 96, name: "Protein Reset Bowl",                description: "Protein with simple grains, greens, vegetables, herbs, and cultured topping." },
      { id: 97, name: "Protein Winter Rebuild Plate",      description: "Protein with roots, greens, grains, herbs, and warming spices." },
      { id: 98, name: "Protein Spring Restore Bowl",       description: "Protein with asparagus, peas, greens, herbs, and light grains." },
      { id: 99, name: "Protein Deep Nourish Plate",        description: "Protein with roots, greens, beans, seeds, herbs, and slow sauce." },
      { id: 100, name: "Protein Rebuild Plate",            description: "Protein with recovery-focused fibre, minerals, healthy fats, and warm vegetables." },
    ],
  },
]

export default function WeeklyRecipesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-28 pb-16 md:pt-36 md:pb-20">
        <div className="mx-auto flex max-w-[1200px] flex-col-reverse items-center gap-10 md:flex-row md:gap-14 lg:gap-20">

          {/* Left: food image — natural, no decorative treatment */}
          <ScrollReveal className="w-full md:flex-1 md:max-w-[500px]">
            <Image
              src="/eatobiotics-plate.png"
              alt="EatoBiotics plate"
              width={560}
              height={560}
              className="w-full object-contain"
              priority
            />
          </ScrollReveal>

          {/* Right: text */}
          <div className="flex-1">
            <ScrollReveal>
              <Image
                src="/eatobiotics-icon.webp"
                alt="EatoBiotics"
                width={48}
                height={48}
                className="mb-5 h-11 w-11"
              />
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
                Weekly Recipes
              </p>
              <h1 className="mt-3 font-serif text-4xl font-semibold text-foreground sm:text-5xl lg:text-6xl text-balance">
                100 recipes for your{" "}
                <GradientText>Food System</GradientText>
              </h1>
              <p className="mt-4 font-serif text-lg font-semibold text-foreground sm:text-xl">
                Four plates. Four jobs. One complete weekly system.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Every recipe uses{" "}
                <span className="font-semibold text-foreground">your protein of choice</span> — fish,
                chicken, eggs, tofu, legumes, or whatever works for you. The rest is built around
                whole grains, seasonal vegetables, leafy greens, and gut-nourishing ingredients,
                organised across the four EatoBiotics plates.
              </p>
              <div className="mt-6 flex items-center gap-1.5">
                <span className="biotic-pill bg-icon-lime" />
                <span className="biotic-pill bg-icon-green" />
                <span className="biotic-pill bg-icon-teal" />
                <span className="biotic-pill bg-icon-yellow" />
                <span className="biotic-pill bg-icon-orange" />
              </div>
            </ScrollReveal>
          </div>

        </div>
      </section>

      <div className="section-divider" />

      {/* Jump-to nav */}
      <section className="sticky top-[64px] z-30 border-b border-border bg-background/95 backdrop-blur-sm px-6 py-3">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            <span className="shrink-0 text-xs font-semibold uppercase tracking-widest text-muted-foreground mr-2">
              Jump to:
            </span>
            {PLATES.map((plate) => (
              <a
                key={plate.id}
                href={`#${plate.id}`}
                className="shrink-0 rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary hover:border-secondary"
              >
                {plate.category}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Stats strip */}
      <section className="bg-secondary/40 px-6 py-10 md:py-12">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <div className="grid gap-6 sm:grid-cols-4 text-center">
              {[
                { value: "100", label: "Recipe ideas",      color: "var(--icon-lime)" },
                { value: "4",   label: "Plate categories",  color: "var(--icon-teal)" },
                { value: "25",  label: "Recipes per plate", color: "var(--icon-yellow)" },
                { value: "∞",   label: "Protein options",   color: "var(--icon-orange)" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-serif text-4xl font-semibold" style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* Plate sections — all white, image alternates left/right */}
      {PLATES.map((plate, plateIndex) => {
        const reversed = plateIndex % 2 === 1
        return (
          <div key={plate.id}>
            <section
              id={plate.id}
              className="px-6 py-16 md:py-24 scroll-mt-28"
            >
              <div className="mx-auto max-w-[1200px]">
                {/* Section header — alternating image side */}
                <ScrollReveal>
                  <div className={`flex flex-col gap-10 md:items-center md:gap-14 lg:gap-20 ${reversed ? "md:flex-row-reverse" : "md:flex-row"}`}>

                    {/* Image — natural, no box styling */}
                    <div className="w-full md:flex-1 md:max-w-[440px]">
                      <Image
                        src={plate.image}
                        alt={plate.plateName}
                        width={480}
                        height={480}
                        className="w-full object-contain"
                      />
                    </div>

                    {/* Text column */}
                    <div className="flex-1">
                      {/* Eyebrow */}
                      <div className="flex items-center gap-3">
                        <div
                          className="h-1 w-12 rounded-full"
                          style={{ background: plate.gradient }}
                        />
                        <p
                          className="text-xs font-semibold uppercase tracking-widest"
                          style={{ color: plate.accent }}
                        >
                          {plate.category} · {plate.adjective}
                        </p>
                      </div>

                      {/* Plate name */}
                      <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
                        {plate.plateName}
                      </h2>

                      {/* Quote */}
                      <p
                        className="mt-4 font-serif text-base italic leading-relaxed"
                        style={{ color: plate.accent }}
                      >
                        &ldquo;{plate.quote}&rdquo;
                      </p>

                      {/* Description */}
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-xl">
                        {plate.description}
                      </p>

                      {/* Tags + emphasis */}
                      <div className="mt-5 flex flex-wrap items-center gap-2">
                        {plate.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full px-3 py-1 text-xs font-semibold"
                            style={{
                              background: `color-mix(in srgb, ${plate.accent} 12%, var(--background))`,
                              color: plate.accent,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                        <span className="ml-1 text-xs text-muted-foreground">
                          Emphasis: <span className="font-semibold text-foreground">{plate.emphasis}</span>
                        </span>
                      </div>

                      {/* Explore link */}
                      <div className="mt-5">
                        <Link
                          href={plate.plateLink}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
                          style={{ color: plate.accent }}
                        >
                          Explore this plate
                          <ArrowUpRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Recipe grid */}
                <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {plate.recipes.map((recipe, index) => (
                    <ScrollReveal key={recipe.id} delay={index * 40}>
                      <div className="relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background p-5 transition-all hover:shadow-md">
                        {/* Accent bar */}
                        <div
                          className="absolute top-0 left-0 right-0 h-1"
                          style={{ background: plate.gradient }}
                        />

                        {/* Category label only — no numbers */}
                        <p
                          className="mt-1 text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: plate.accent }}
                        >
                          {plate.category}
                        </p>

                        {/* Name */}
                        <h3 className="mt-1.5 font-serif text-base font-semibold text-foreground leading-snug">
                          {recipe.name}
                        </h3>

                        {/* Description */}
                        <p className="mt-1.5 flex-1 text-xs italic leading-relaxed text-muted-foreground">
                          {recipe.description}
                        </p>

                        {/* Bottom accent line */}
                        <div
                          className="mt-4 h-0.5 w-8 rounded-full"
                          style={{ background: plate.gradient }}
                        />
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </section>

            {plateIndex < PLATES.length - 1 && <div className="section-divider" />}
          </div>
        )
      })}

      <div className="section-divider" />

      {/* CTA */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              Ready to <GradientText>analyse your plate?</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              Pick a recipe, build your plate, then use the EatoBiotics meal analyser to score it
              for microbiome diversity, fibre, and gut-health impact.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/analyse"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
              >
                Analyse a meal
                <ArrowUpRight size={16} />
              </Link>
              <Link
                href="/assessment"
                className="inline-flex items-center gap-2 rounded-full border-2 border-icon-green px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white"
              >
                Take the assessment
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
