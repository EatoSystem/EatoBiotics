const iconColors = [
  "var(--icon-lime)",
  "var(--icon-green)",
  "var(--icon-teal)",
  "var(--icon-yellow)",
  "var(--icon-orange)",
]

const parts = [
  {
    part: "I",
    title: "The Food System Inside You",
    chapters: [
      { number: 1, title: "The Food System Inside You", desc: "What the microbiome is, what it controls, and why your gut is the foundation of health." },
      { number: 2, title: "Modern Diets Broke the System", desc: "How ultra-processed food, low fiber, stress, poor sleep, alcohol, and antibiotics disrupt your internal ecosystem." },
      { number: 3, title: "The 3 Biotics Framework", desc: "Prebiotics, probiotics, postbiotics -- your core model, simple and scalable." },
      { number: 4, title: "The EatoBiotics Method", desc: "Your daily and weekly rules for rebuilding the system with consistency, not perfection." },
    ],
  },
  {
    part: "II",
    title: "The EatoBiotics Foods",
    chapters: [
      { number: 5, title: "Prebiotic Foods", desc: "Fiber, resistant starch, legumes, whole grains, vegetables, seeds -- the soil your microbiome grows in." },
      { number: 6, title: "Probiotic Foods", desc: "Fermented foods, live cultures, what to buy, what matters on labels, how to use them every day." },
      { number: 7, title: "Postbiotic Results", desc: "Short-chain fatty acids, gut lining support, inflammation balance -- what your microbiome creates when you feed it well." },
      { number: 8, title: "The Polyphenol Advantage", desc: "Berries, herbs, spices, cocoa, olive oil, coffee, tea -- the upgrade layer that boosts gut performance." },
      { number: 9, title: "Protein & Fat (The EatoBiotics Way)", desc: "How to include protein and fats without extremes -- supporting digestion, blood sugar, and long-term balance." },
    ],
  },
  {
    part: "III",
    title: "The 5 Outcomes",
    chapters: [
      { number: 10, title: "Digestion", desc: "Bloating, regularity, tolerance, meal timing, chewing, and fast wins." },
      { number: 11, title: "Immunity", desc: "The gut-immune connection and how to build resilience through food and daily habits." },
      { number: 12, title: "Energy & Metabolism", desc: "Blood sugar stability, fiber + protein strategy, and the end of crash eating." },
      { number: 13, title: "Mood & Mind", desc: "The gut-brain system: emotional steadiness, clarity, and stress resilience." },
      { number: 14, title: "Recovery", desc: "Inflammation, sleep, repair, training support, and building a calmer nervous system through nutrition." },
    ],
  },
  {
    part: "IV",
    title: "The Practical System",
    chapters: [
      { number: 15, title: "The EatoBiotics Kitchen", desc: "Your setup, pantry staples, shopping rhythm, and chef shortcuts that make consistency easy." },
      { number: 16, title: "The EatoBiotics Plate", desc: "The signature meal formula: 2 plants + protein + fat + ferment + booster." },
      { number: 17, title: "The 7-Day Reset", desc: "A realistic reset you can repeat anytime you drift off track." },
      { number: 18, title: "The 21-Day Build", desc: "A deeper system to lock in routine and feel a noticeable change." },
      { number: 19, title: "The EatoBiotics Index", desc: "Your scoring system for food quality: microbiome support, nutrients, ease, taste, access." },
    ],
  },
  {
    part: "V",
    title: "Real Life + Long-Term Health",
    chapters: [
      { number: 20, title: "The Travel & Busy Life Protocol", desc: "Airport, hotel, and workday rules to stay consistent anywhere." },
      { number: 21, title: "Antibiotics: Protect, Support, Rebuild", desc: "What happens to the microbiome and how to recover food-first." },
      { number: 22, title: "The EatoBiotics Lifestyle", desc: "How to live this long-term -- without obsession, tracking fatigue, or perfection pressure." },
      { number: 23, title: "EatoSystem", desc: "The Food System." },
    ],
  },
]

export function ChapterList() {
  return (
    <div className="mt-12 flex flex-col">
      {parts.map((part, partIdx) => (
        <div key={part.part}>
          {/* Part divider with icon colour */}
          {partIdx > 0 && (
            <div
              className="my-10 h-0.5 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${iconColors[partIdx % iconColors.length]}, transparent)`,
              }}
            />
          )}

          <div className="flex items-center gap-3">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: iconColors[partIdx % iconColors.length] }}
            >
              {part.part}
            </span>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Part {part.part}
            </p>
          </div>
          <h3 className="mt-2 font-serif text-2xl font-semibold text-foreground">
            {part.title}
          </h3>

          <div className="mt-6 flex flex-col gap-3">
            {part.chapters.map((chapter) => (
              <div
                key={chapter.number}
                className="rounded-xl border border-border px-5 py-4 transition-colors hover:bg-secondary"
              >
                <div className="flex items-baseline gap-4">
                  <span
                    className="w-8 flex-shrink-0 text-right font-serif text-sm font-semibold"
                    style={{ color: iconColors[partIdx % iconColors.length] }}
                  >
                    {chapter.number}
                  </span>
                  <div>
                    <span className="text-base font-medium text-foreground">
                      {chapter.title}
                    </span>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {chapter.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
