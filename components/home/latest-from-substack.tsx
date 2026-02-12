import { ScrollReveal } from "@/components/scroll-reveal"
import { SubstackCard } from "@/components/substack-card"
import { fetchSubstackPosts } from "@/lib/substack"
import { ArrowUpRight } from "lucide-react"

export async function LatestFromSubstack() {
  const posts = await fetchSubstackPosts(3)

  return (
    <section className="bg-orange-section px-6 py-32 md:py-40">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
                Latest Writing
              </p>
              <h2 className="mt-4 font-serif text-4xl font-800 text-foreground sm:text-5xl">
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

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <ScrollReveal key={post.link + index} delay={index * 100}>
              <SubstackCard
                title={post.title}
                description={post.description}
                date={post.pubDate}
                tag={post.tag}
                link={post.link}
              />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
