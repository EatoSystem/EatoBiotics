import { ScrollReveal } from "@/components/scroll-reveal"
import { fetchSubstackPosts } from "@/lib/substack"
import { ArrowUpRight } from "lucide-react"

const tagColors: Record<string, string> = {
  CHAPTER: "var(--icon-lime)",
  "FOOD PROFILE": "var(--icon-teal)",
  Science: "var(--icon-green)",
  Lifestyle: "var(--icon-yellow)",
}

export async function LatestFromSubstack() {
  const posts = await fetchSubstackPosts(1)
  const post = posts[0]

  if (!post) return null

  const tagColor = post.tag ? tagColors[post.tag] || "var(--icon-green)" : "var(--icon-orange)"

  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
                Latest Writing
              </p>
              <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl">
                From the Substack
              </h2>
            </div>
            <a
              href="https://eatobiotics.substack.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm font-medium text-icon-green transition-colors hover:text-icon-orange"
            >
              View all posts
              <ArrowUpRight size={14} />
            </a>
          </div>
        </ScrollReveal>

        {/* Featured post card */}
        <ScrollReveal delay={100}>
          <a
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative mt-12 flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all hover:shadow-xl lg:flex-row"
          >
            {/* Gradient top bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ background: `linear-gradient(90deg, ${tagColor}, var(--icon-orange))` }}
            />

            {/* Left: content */}
            <div className="flex flex-1 flex-col p-8 sm:p-12">
              <div className="flex items-center gap-3">
                {post.tag && (
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: tagColor }}
                  >
                    {post.tag}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{post.pubDate}</span>
              </div>

              <h3 className="mt-6 font-serif text-3xl font-semibold leading-snug text-foreground sm:text-4xl text-pretty">
                {post.title}
              </h3>

              <p className="mt-5 flex-1 text-base leading-relaxed text-muted-foreground">
                {post.description}
              </p>

              <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-icon-green transition-colors group-hover:text-icon-orange">
                Read on Substack
                <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>

            {/* Right: decorative accent */}
            <div
              className="hidden lg:flex lg:w-72 lg:shrink-0 lg:flex-col lg:items-center lg:justify-center lg:p-12"
              style={{ background: `linear-gradient(135deg, var(--icon-lime)15, var(--icon-orange)10)` }}
            >
              <p
                className="font-serif text-[8rem] font-bold leading-none select-none"
                style={{ color: tagColor, opacity: 0.15 }}
              >
                &ldquo;
              </p>
              <p className="mt-2 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Latest Post
              </p>
            </div>
          </a>
        </ScrollReveal>
      </div>
    </section>
  )
}
