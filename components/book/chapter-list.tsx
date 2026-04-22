import { Lock } from "lucide-react"
import { chapters as defaultChapters, PART_COLORS } from "@/lib/chapters"
import type { Chapter } from "@/lib/chapters"

// Group an array of chapters into parts, preserving order
function groupByPart(chs: Chapter[]) {
  return Array.from(
    chs.reduce((map, ch) => {
      if (!map.has(ch.part)) {
        map.set(ch.part, { part: ch.part, title: ch.partTitle, chapters: [] as Chapter[] })
      }
      map.get(ch.part)!.chapters.push(ch)
      return map
    }, new Map<string, { part: string; title: string; chapters: Chapter[] }>()),
  ).map(([, v]) => v)
}

interface ChapterListProps {
  /** Pass a custom chapter array to render a different book's contents.
   *  Defaults to the original EatoBiotics book chapters. */
  chapters?: Chapter[]
}

export function ChapterList({ chapters = defaultChapters }: ChapterListProps) {
  const parts = groupByPart(chapters)

  return (
    <div className="mt-12 flex flex-col">
      {parts.map((part, partIdx) => {
        const color = PART_COLORS[partIdx % PART_COLORS.length]

        return (
          <div key={part.part}>
            {/* Part divider */}
            {partIdx > 0 && (
              <div
                className="my-10 h-0.5 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${color}, transparent)`,
                }}
              />
            )}

            <div className="flex items-center gap-3">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: color }}
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
                  className="rounded-xl border border-border px-5 py-4 opacity-70"
                >
                  <div className="flex items-baseline gap-4">
                    <span
                      className="w-8 flex-shrink-0 text-right font-serif text-sm font-semibold"
                      style={{ color }}
                    >
                      {chapter.number}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-medium text-foreground">
                          {chapter.title}
                        </span>
                        <Lock size={12} className="text-muted-foreground/40" />
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {chapter.description}
                      </p>
                      {chapter.status === "published" && chapter.readingTime && (
                        <p className="mt-1 text-xs text-muted-foreground/60">
                          {chapter.readingTime} min read
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
