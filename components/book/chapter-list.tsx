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
    title: "Foundations",
    chapters: [
      { number: 1, title: "You Are an Ecosystem" },
      { number: 2, title: "The Microbiome: Your Inner Rainforest" },
      { number: 3, title: "Why Food Is the First Medicine" },
    ],
  },
  {
    part: "II",
    title: "The Three Biotics",
    chapters: [
      { number: 4, title: "Prebiotics: Feeding the Colony" },
      { number: 5, title: "Probiotics: Introducing New Residents" },
      { number: 6, title: "Postbiotics: The Output That Heals" },
    ],
  },
  {
    part: "III",
    title: "Food Profiles",
    chapters: [
      { number: 7, title: "Garlic: The Prebiotic Powerhouse" },
      { number: 8, title: "Yogurt: Living Culture" },
      { number: 9, title: "The Fermentation Kitchen" },
      { number: 10, title: "Whole Grains and the Fiber Spectrum" },
    ],
  },
  {
    part: "IV",
    title: "Systems Thinking",
    chapters: [
      { number: 11, title: "The Gut-Brain Axis" },
      { number: 12, title: "Immunity Starts in Your Gut" },
      { number: 13, title: "Inflammation and the Modern Diet" },
    ],
  },
  {
    part: "V",
    title: "Building Your System",
    chapters: [
      { number: 14, title: "The 7-Day Biotics Reset" },
      { number: 15, title: "Scoring Your Microbiome" },
      { number: 16, title: "From Individual to County: The EatoSystem" },
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
              className="my-8 h-0.5 rounded-full opacity-40"
              style={{ backgroundColor: iconColors[partIdx % iconColors.length] }}
            />
          )}

          <div className="flex items-center gap-3">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-background"
              style={{ backgroundColor: iconColors[partIdx % iconColors.length] }}
            >
              {part.part}
            </span>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Part {part.part}
            </p>
          </div>
          <h3 className="mt-2 font-serif text-2xl font-bold text-foreground">
            {part.title}
          </h3>

          <div className="mt-6 flex flex-col gap-4">
            {part.chapters.map((chapter) => (
              <div
                key={chapter.number}
                className="flex items-baseline gap-4 rounded-lg px-3 py-2 transition-colors hover:bg-secondary"
              >
                <span
                  className="w-8 flex-shrink-0 text-right font-serif text-sm font-normal"
                  style={{ color: iconColors[partIdx % iconColors.length] }}
                >
                  {chapter.number}
                </span>
                <span className="text-base text-foreground">
                  {chapter.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
