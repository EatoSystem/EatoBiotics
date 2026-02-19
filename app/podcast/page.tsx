import type { Metadata } from "next"
import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { Mic, Play, Users, Globe, Utensils, Heart, ArrowUpRight } from "lucide-react"

export const metadata: Metadata = {
  title: "The Podcast",
  description:
    "EatoBiotics: The Food System Inside You — a video series and podcast interviewing the world's greatest minds in business, sport, and entertainment about what they eat, how they live, and the food habits behind their success.",
  openGraph: {
    title: "The Podcast — EatoBiotics | The Food System Inside You",
    description:
      "World-class conversations about food, health, and performance. Jason Curry interviews leaders in business, sport, and entertainment about the food habits behind their success.",
  },
}

const themes = [
  {
    number: "01",
    icon: Utensils,
    title: "What They Eat",
    accent: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    description:
      "The daily plate. The weekly rhythms. The foods they swear by and the ones they've left behind. Real conversations about real eating habits from people at the top of their game.",
  },
  {
    number: "02",
    icon: Heart,
    title: "How They Feel",
    accent: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    description:
      "Energy, recovery, mental clarity, sleep. What does optimal feel like for a world-class athlete, a CEO, a musician? And what role does food play in getting there?",
  },
  {
    number: "03",
    icon: Users,
    title: "Where They Grew Up",
    accent: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    description:
      "Food is culture. Every guest brings a story — a family meal, a childhood kitchen, a country's food tradition. The origins of taste and the memory in every bite.",
  },
  {
    number: "04",
    icon: Globe,
    title: "What They've Learned",
    accent: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    description:
      "A lifetime of performance, travel, and curiosity about the body. What have the world's best learned about food that the rest of us should know?",
  },
]

const guestCategories = [
  { label: "Business Leaders", color: "var(--icon-lime)" },
  { label: "Elite Athletes", color: "var(--icon-green)" },
  { label: "Entertainment", color: "var(--icon-teal)" },
  { label: "Scientists", color: "var(--icon-yellow)" },
  { label: "Chefs", color: "var(--icon-orange)" },
  { label: "Entrepreneurs", color: "var(--icon-lime)" },
  { label: "Musicians", color: "var(--icon-green)" },
  { label: "Coaches", color: "var(--icon-teal)" },
  { label: "Doctors", color: "var(--icon-yellow)" },
  { label: "Authors", color: "var(--icon-orange)" },
  { label: "Activists", color: "var(--icon-lime)" },
  { label: "Innovators", color: "var(--icon-green)" },
]

const platforms = [
  { label: "YouTube", status: "Coming 2026" },
  { label: "Spotify", status: "Coming 2026" },
  { label: "Apple Podcasts", status: "Coming 2026" },
  { label: "Substack", status: "Coming 2026" },
]

export default function PodcastPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 pb-20">
        {/* Floating background pills */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-2 left-[5%] h-5 w-44 rotate-[-35deg] rounded-full opacity-20"
            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
          />
          <div
            className="absolute top-[8%] right-[6%] h-5 w-36 rotate-[25deg] rounded-full opacity-15"
            style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
          />
          <div
            className="absolute top-[25%] left-[10%] h-6 w-28 rotate-[55deg] rounded-full opacity-15"
            style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
          />
          <div
            className="absolute bottom-[20%] left-[2%] h-5 w-32 rotate-[40deg] rounded-full opacity-15"
            style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}
          />
          <div
            className="absolute bottom-[8%] right-[4%] h-5 w-48 rotate-[-20deg] rounded-full opacity-20"
            style={{ background: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))" }}
          />
          <div
            className="absolute top-[55%] right-[15%] h-6 w-24 rotate-[60deg] rounded-full opacity-15"
            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))" }}
          />
          <div className="absolute top-[18%] left-[16%] h-8 w-8 rounded-full bg-icon-lime opacity-15" />
          <div className="absolute top-[40%] right-[10%] h-6 w-6 rounded-full bg-icon-orange opacity-15" />
          <div className="absolute bottom-[30%] right-[20%] h-9 w-9 rounded-full bg-icon-yellow opacity-10" />
          <div className="absolute bottom-[22%] left-[18%] h-5 w-5 rounded-full bg-icon-teal opacity-15" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-[760px] flex-col items-center text-center">
          <ScrollReveal>
            <Image
              src="/eatobiotics-icon.webp"
              alt="EatoBiotics"
              width={200}
              height={200}
              priority
              className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32"
            />
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-icon-orange" />
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
                The Podcast — Coming 2026
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <h1 className="mt-6 font-serif text-5xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl text-balance">
              The food system{" "}
              <GradientText>inside you.</GradientText>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <p className="mt-6 font-serif text-xl font-medium text-foreground sm:text-2xl">
              Hosted by Jason Curry.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              The world&apos;s greatest minds in business, sport, and entertainment — sitting down
              to talk about what they eat, how they live, and the food habits behind their
              extraordinary lives. One conversation. One plate. One story at a time.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={500}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <a
                href="https://eatobiotics.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
              >
                Get notified at launch
                <ArrowUpRight size={16} />
              </a>
              <a
                href="/about"
                className="inline-flex items-center gap-2 rounded-full border-2 border-icon-green px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white"
              >
                Meet Jason
              </a>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={600}>
            <div className="mt-10 flex items-center justify-center gap-1.5">
              <span className="biotic-pill bg-icon-lime" />
              <span className="biotic-pill bg-icon-green" />
              <span className="biotic-pill bg-icon-teal" />
              <span className="biotic-pill bg-icon-yellow" />
              <span className="biotic-pill bg-icon-orange" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* The Concept */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[680px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
              The Concept
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Everyone eats.{" "}
              <GradientText>Not everyone thinks about it.</GradientText>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="mt-8 text-base leading-relaxed text-foreground md:text-lg">
              The most successful people in the world have one thing in common — they perform
              at an extraordinary level, consistently, over time. Behind that performance is
              a body that functions well. And behind that body is food.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="mt-6 text-base leading-relaxed text-foreground md:text-lg">
              EatoBiotics: The Food System Inside You brings together world-class guests — CEOs,
              Olympic athletes, musicians, scientists, chefs, entertainers — to explore one
              of the most personal and universal questions there is: what do you eat, and why?
            </p>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <p className="mt-6 text-base leading-relaxed text-foreground md:text-lg">
              Not a nutrition show. Not a diet debate. A human conversation about the food
              that shaped them, sustains them, and connects them to the world around them.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={400}>
            <blockquote className="mt-10 border-l-4 border-icon-green pl-6">
              <p className="font-serif text-xl font-medium italic text-icon-green md:text-2xl">
                &ldquo;Tell me what you eat, and I&apos;ll tell you who you are.&rdquo;
              </p>
              <p className="mt-2 text-sm text-muted-foreground">— Jean Anthelme Brillat-Savarin, 1825</p>
            </blockquote>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* The Themes */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">
              The Conversations
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Four themes.{" "}
              <GradientText>Every episode.</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
              Every guest, every story, every episode is anchored in the same four territories —
              the conversations that reveal the food system inside each person.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {themes.map((theme, index) => (
              <ScrollReveal key={theme.number} delay={index * 100}>
                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-lg">
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: theme.gradient }}
                  />
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ background: theme.gradient }}
                  >
                    <theme.icon size={22} className="text-white" />
                  </div>
                  <p
                    className="font-serif text-5xl font-bold"
                    style={{ color: theme.accent }}
                  >
                    {theme.number}
                  </p>
                  <h3 className="mt-3 font-serif text-lg font-semibold text-foreground">
                    {theme.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {theme.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Guest Categories */}
      <section className="bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-20">
            <div className="lg:w-[420px] lg:shrink-0">
              <ScrollReveal>
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
                  The Guests
                </p>
                <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                  The world&apos;s greatest{" "}
                  <GradientText>minds and plates.</GradientText>
                </h2>
                <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                  No single field, no single background. The guest list spans every domain
                  of human excellence — united only by the fact that they&apos;ve reached the
                  top of their world, and they eat to get there.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={150}>
                <div className="mt-8 flex items-center gap-3">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-orange))" }}
                  >
                    <Mic size={26} className="text-white" />
                  </div>
                  <div>
                    <p className="font-serif text-lg font-semibold text-foreground">Hosted by Jason Curry</p>
                    <p className="text-sm text-muted-foreground">Founder, EatoBiotics &amp; EatoSystem</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            <div className="flex-1">
              <ScrollReveal delay={100}>
                <div className="flex flex-wrap gap-3">
                  {guestCategories.map((cat) => (
                    <span
                      key={cat.label}
                      className="rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
                      style={{
                        borderColor: cat.color,
                        color: cat.color,
                      }}
                    >
                      {cat.label}
                    </span>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Format */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-yellow">
              The Format
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Video. Audio.{" "}
              <GradientText>Everywhere.</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
              Filmed as a long-form video conversation and released across every major audio
              and video platform. Watch it, listen to it, share it.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {platforms.map((platform, index) => (
              <ScrollReveal key={platform.label} delay={index * 100}>
                <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-6 text-center transition-shadow hover:shadow-lg">
                  <div className="absolute top-0 left-0 right-0 h-1 brand-gradient" />
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                    <Play size={20} className="text-muted-foreground" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-foreground">{platform.label}</h3>
                  <p className="mt-1 text-xs font-medium text-icon-orange">{platform.status}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* CTA */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl text-balance">
              Be first to hear{" "}
              <GradientText>every conversation.</GradientText>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
              The podcast launches in 2026. Subscribe to the EatoBiotics Substack to be
              notified the moment the first episode drops — and to follow the journey as it&apos;s built.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="mt-10 flex flex-col items-center gap-4">
              <a
                href="https://eatobiotics.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
              >
                Subscribe on Substack
                <ArrowUpRight size={16} />
              </a>
              <a
                href="/roadmap"
                className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-semibold text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                See the full roadmap
                <ArrowUpRight size={16} />
              </a>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <div className="mt-12 flex items-center justify-center gap-1.5">
              <span className="biotic-pill bg-icon-lime" />
              <span className="biotic-pill bg-icon-green" />
              <span className="biotic-pill bg-icon-teal" />
              <span className="biotic-pill bg-icon-yellow" />
              <span className="biotic-pill bg-icon-orange" />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
