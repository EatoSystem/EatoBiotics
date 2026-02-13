import type { Metadata } from "next"
import Image from "next/image"
import { Database, MessageSquare, Brain, Globe, BarChart3, Cpu, Leaf } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export const metadata: Metadata = {
  title: "Vercel AI Accelerator | EatoSystem",
  description:
    "EatoSystem — 32 county-specific AI agents coordinating Ireland's regenerative food transformation. Built for the Vercel AI Accelerator, Cohort 3.",
  robots: { index: false, follow: false },
}

/* ─── Reusable section label ─── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
      {children}
    </p>
  )
}

/* ─── Numbered card used across several sections ─── */
function NumberedCard({
  num,
  title,
  children,
  accent = "var(--icon-green)",
}: {
  num: string
  title: string
  children: React.ReactNode
  accent?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-lg">
      <div style={{ backgroundColor: accent }} className="mb-4 h-1 w-10 rounded-full" />
      <p className="text-xs font-semibold text-muted-foreground">{num}</p>
      <h3 className="mt-1 font-serif text-lg font-semibold text-foreground">{title}</h3>
      <div className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  )
}

export default function VercelPage() {
  return (
    <div>
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20">
        {/* Floating decorative pills */}
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
        </div>

        <div className="relative z-10 mx-auto flex max-w-[720px] flex-col items-center text-center">
          <ScrollReveal>
            <Image
              src="/eatobiotics-icon.webp"
              alt="EatoSystem icon"
              width={200}
              height={200}
              priority
              className="h-32 w-32 sm:h-40 sm:w-40 md:h-48 md:w-48"
            />
          </ScrollReveal>

          {/* Badge */}
          <ScrollReveal delay={100} className="w-full text-center">
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-icon-green opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-icon-green" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                Vercel AI Accelerator &middot; Cohort 3 &middot; March&ndash;April 2026
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200} className="w-full text-center">
            <h1 className="mt-6 font-serif text-5xl font-semibold tracking-tight sm:text-7xl md:text-8xl lg:text-9xl">
              <span className="brand-gradient-text">EatoSystem</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={300} className="w-full text-center">
            <p className="mt-3 font-serif text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">
              The AI Coordination Layer
            </p>
          </ScrollReveal>

          <ScrollReveal delay={400} className="w-full text-center">
            <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
              32 county-specific AI agents coordinating Ireland{"'"}s regenerative food
              transformation — collecting intelligence, guiding communities, and training a
              national learning system. Designed for global licensing.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={500}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <a
                href="#platform"
                className="brand-gradient rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
              >
                Explore the Platform
              </a>
              <a
                href="https://vercel.com/ai-accelerator"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border-2 border-icon-green px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white"
              >
                {"Vercel Accelerator \u2197"}
              </a>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={600}>
            <p className="mt-10 max-w-md text-sm font-medium italic text-icon-orange sm:text-base">
              {"\"Build the food system inside you\u2026 and help build the food system around you.\""}
            </p>
          </ScrollReveal>


        </div>
      </section>

      {/* ═══════════════ SECTION 1: WHAT WE'RE BUILDING ═══════════════ */}
      <div className="section-divider" />
      <section id="platform" className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <SectionLabel>The Platform</SectionLabel>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl text-balance">
              What we{"'"}re building
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            <ScrollReveal delay={100}>
              <NumberedCard num="01" title="County-specific intelligence" accent="var(--icon-lime)">
                Each EatoAgent understands local soil profiles, dominant farm types, signature
                crops, processing infrastructure, and community dynamics. Not a generic chatbot
                — a knowledgeable local guide.
              </NumberedCard>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <NumberedCard num="02" title="Nine stakeholder pathways" accent="var(--icon-green)">
                Farmers, investors, community supporters, consumers, educators, policymakers,
                processors, media, and explorers — each routed through structured conversations
                tailored to their context.
              </NumberedCard>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <NumberedCard num="03" title="Agents that listen" accent="var(--icon-teal)">
                Every conversation feeds a national intelligence layer that learns which
                transition pathways succeed, which approaches work in different communities,
                and which products command premiums.
              </NumberedCard>
            </ScrollReveal>
            <ScrollReveal delay={400}>
              <NumberedCard num="04" title="Compounding intelligence" accent="var(--icon-yellow)">
                By Year 3, a single conversation benefits from insights derived from 50,000+
                prior conversations across Ireland. The system gets smarter with every
                interaction.
              </NumberedCard>
            </ScrollReveal>
          </div>

          {/* Accent callout card */}
          <ScrollReveal delay={500}>
            <div className="mt-10 rounded-2xl border-2 border-icon-green/30 p-8" style={{ backgroundColor: "rgba(76, 182, 72, 0.04)" }}>
              <p className="font-serif text-base font-semibold text-foreground sm:text-lg">
                {"→ Counties and regional development bodies license the platform as their coordination layer."}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                This is not a chatbot. It is a multi-tenant AI coordination platform for
                national-scale transformation.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════ SECTION 2: THREE CORE LAYERS ═══════════════ */}
      <div className="section-divider" />
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <SectionLabel>Architecture</SectionLabel>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl text-balance">
              Three core layers
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <ScrollReveal delay={100}>
              <div className="rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-lg">
                <div className="mb-4 h-1.5 w-full rounded-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" }} />
                <p className="text-xs font-semibold text-muted-foreground">01 &middot; Agent</p>
                <h3 className="mt-1 font-serif text-lg font-semibold text-foreground">County Agent Layer</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Each agent routes nine stakeholder types through structured conversations.
                  A beef farmer receives transition economics. An investor receives modeled
                  returns. A citizen receives participation options.
                </p>
                <p className="mt-4 rounded-lg border border-border px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                  32 agents deployed across Ireland, each with county-specific knowledge and
                  conversation architectures.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className="rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-lg">
                <div className="mb-4 h-1.5 w-full rounded-full" style={{ background: "linear-gradient(90deg, var(--icon-teal), var(--icon-yellow))" }} />
                <p className="text-xs font-semibold text-muted-foreground">02 &middot; Intelligence</p>
                <h3 className="mt-1 font-serif text-lg font-semibold text-foreground">National Intelligence — EatoAI</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Every conversation generates structured data across 10 layers: metadata,
                  intent, sentiment, geography, production type, economics, barriers,
                  opportunities, and outcomes.
                </p>
                <p className="mt-4 rounded-lg border border-border px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                  Cross-county pattern recognition continuously improves every agent using
                  shared intelligence.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <div className="rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-lg">
                <div className="mb-4 h-1.5 w-full rounded-full" style={{ background: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))" }} />
                <p className="text-xs font-semibold text-muted-foreground">03 &middot; Community</p>
                <h3 className="mt-1 font-serif text-lg font-semibold text-foreground">Co-Creation Engine</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Agents actively solicit local knowledge, ideas, resources, and project
                  proposals. The system is discovered through conversation with people who
                  know the land.
                </p>
                <p className="mt-4 rounded-lg border border-border px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                  The best food systems are built by the people who understand the land,
                  seasons, and community.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION 3: THE NUMBERS ═══════════════ */}
      <div className="section-divider" />
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <SectionLabel>Key Metrics</SectionLabel>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl text-balance">
              The numbers
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { value: "32", label: "County AI Agents", desc: "One per Irish county with unique knowledge and conversations", accent: "var(--icon-lime)" },
              { value: "<\u20AC25K", label: "Annual Software Cost", desc: "All 32 agents vs \u20AC75\u2013120K traditional outreach", accent: "var(--icon-green)" },
              { value: "\u20AC38M", label: "County Investment Model", desc: "380\u2013520 farms, 720\u20131,050 jobs per county", accent: "var(--icon-teal)" },
              { value: "10", label: "Data Layers", desc: "Metadata, intent, sentiment, geography, economics, barriers, opportunities", accent: "var(--icon-teal)" },
              { value: "\u20AC30B+", label: "Market Size", desc: "Global regenerative agriculture, 15\u201320% CAGR", accent: "var(--icon-yellow)" },
              { value: "32 \u2192 32", label: "Scale Path", desc: "Irish counties \u2192 countries via global licensing", accent: "var(--icon-orange)" },
            ].map((metric, index) => (
              <ScrollReveal key={metric.label} delay={index * 100}>
                <div className="rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-lg">
                  <div className="mb-4 h-1 w-10 rounded-full" style={{ backgroundColor: metric.accent }} />
                  <p className="font-serif text-3xl font-semibold sm:text-4xl">
                    <span className="brand-gradient-text">{metric.value}</span>
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{metric.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{metric.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION 4: BUILT FOR VERCEL ═══════════════ */}
      <div className="section-divider" />
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <SectionLabel>Tech Stack</SectionLabel>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl text-balance">
              Built for Vercel
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "\u25B2", title: "Next.js on Vercel", desc: "Multi-tenant frontend, edge-deployed" },
              { icon: "AI", title: "Vercel AI SDK", desc: "Streaming conversations, structured outputs" },
              { icon: "C", title: "Anthropic Claude", desc: "Agent reasoning for community conversations" },
              { icon: "S", title: "Supabase", desc: "Real-time 10-layer data architecture" },
              { icon: "A", title: "Auth0 / WorkOS", desc: "Multi-county authentication" },
              { icon: "E", title: "Edge Network", desc: "Global access for 70M+ Irish diaspora" },
            ].map((item) => (
              <ScrollReveal key={item.title}>
                <div className="flex items-start gap-4 rounded-2xl border border-border bg-background p-5 transition-shadow hover:shadow-lg">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground font-serif text-sm font-semibold text-white">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-serif text-sm font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION 5: ACCELERATOR PLAN ═══════════════ */}
      <div className="section-divider" />
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <SectionLabel>Accelerator Plan</SectionLabel>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl text-balance">
              Six weeks. Four agents. Real data.
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <ScrollReveal delay={100}>
              <NumberedCard num="Week 1-2" title="National Agent" accent="var(--icon-lime)">
                Deploy Ireland EatoAgent as homepage entry point using Next.js + Vercel AI SDK.
              </NumberedCard>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <NumberedCard num="Week 3-4" title="County Launch" accent="var(--icon-green)">
                First 3 county agents with stakeholder routing, conversations, and data collection.
              </NumberedCard>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <NumberedCard num="Week 5-6" title="Validation" accent="var(--icon-teal)">
                50&ndash;100 real users. EatoAI aggregation. Cross-county analytics dashboard.
              </NumberedCard>
            </ScrollReveal>
            <ScrollReveal delay={400}>
              <div className="rounded-2xl border-2 border-icon-green/30 p-6" style={{ backgroundColor: "rgba(76, 182, 72, 0.04)" }}>
                <div style={{ backgroundColor: "var(--icon-orange)" }} className="mb-4 h-1 w-10 rounded-full" />
                <p className="text-xs font-semibold text-icon-orange">Demo Day</p>
                <h3 className="mt-1 font-serif text-lg font-semibold text-foreground">April 16, San Francisco</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  4 live agents, real community data, validated path to 32 counties.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION 6: WHY EATOSYSTEM ═══════════════ */}
      <div className="section-divider" />
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <SectionLabel>The Case</SectionLabel>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl text-balance">
              Why EatoSystem
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <ScrollReveal delay={100}>
              <NumberedCard num="01" title="Novel AI category" accent="var(--icon-lime)">
                Most applicants build copilots or productivity tools. EatoSystem uses AI agents
                as the core coordination layer for real-world national transformation.
              </NumberedCard>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <NumberedCard num="02" title="AI enables the impossible" accent="var(--icon-teal)">
                Coordinating 32 county transitions would require hundreds of staff. The agent
                architecture delivers consistent facilitation, 24/7 availability, and
                cross-county learning at a fraction of the cost.
              </NumberedCard>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <NumberedCard num="03" title="Perfect Vercel fit" accent="var(--icon-orange)">
                Multi-tenant Next.js platform, heavy use of Vercel AI SDK, edge deployment,
                real-time data. 32 counties as a compelling demo of AI at scale on Vercel
                infrastructure.
              </NumberedCard>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION 7: AI AGENT NETWORK ═══════════════ */}
      <div className="section-divider" />
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <SectionLabel>Intelligence Layer</SectionLabel>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl text-balance">
              32 County <span className="brand-gradient-text">AI Agents</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Each county has its own dedicated AI agent -- collecting local food intelligence,
              guiding communities through regenerative food practices, and feeding data into
              a national learning system that gets smarter with every interaction.
            </p>
          </ScrollReveal>

          {/* Network visualisation video */}
          <ScrollReveal delay={100}>
            <div
              className="mx-auto mt-12 max-w-[900px]"
              style={{
                maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
                WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
              }}
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                className="h-auto w-full"
              >
                <source src="/videos/ireland-network.mp4" type="video/mp4" />
              </video>
            </div>
          </ScrollReveal>

          <div className="mt-16 grid gap-8 md:grid-cols-3 md:gap-10">
            {[
              {
                icon: Database,
                title: "Collect Intelligence",
                color: "var(--icon-lime)",
                gradientTo: "var(--icon-green)",
                description:
                  "Each agent gathers hyper-local data -- seasonal availability, soil conditions, producer output, community demand, participation levels, and local investment -- building a living map of the county\u2019s food landscape.",
              },
              {
                icon: MessageSquare,
                title: "Guide Communities",
                color: "var(--icon-teal)",
                gradientTo: "var(--icon-green)",
                description:
                  "Agents serve as always-on advisors for local food hubs, growers, and families -- answering questions, suggesting seasonal recipes, and connecting people to nearby producers.",
              },
              {
                icon: Brain,
                title: "Train the Network",
                color: "var(--icon-orange)",
                gradientTo: "var(--icon-yellow)",
                description:
                  "Every county agent feeds insights into a shared national learning system. Local knowledge compounds into collective intelligence -- patterns that no single county could see alone.",
              },
            ].map((capability, index) => (
              <ScrollReveal key={capability.title} delay={index * 150}>
                <div className="relative flex flex-col items-start overflow-hidden rounded-2xl border border-border bg-background p-8 transition-shadow hover:shadow-lg">
                  <div
                    className="absolute top-0 right-0 left-0 h-1.5"
                    style={{ background: `linear-gradient(90deg, ${capability.color}, ${capability.gradientTo})` }}
                  />
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: capability.color }}
                  >
                    <capability.icon size={24} className="text-white" />
                  </div>
                  <h3 className="mt-6 font-serif text-lg font-semibold text-foreground">
                    {capability.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {capability.description}
                  </p>
                  <div
                    className="mt-6 h-2 w-16 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${capability.color}, ${capability.gradientTo})` }}
                  />
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* How it works flow */}
          <ScrollReveal delay={200}>
            <div className="mx-auto mt-20 max-w-[800px]">
              <h3 className="text-center font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                How the Agent Network Works
              </h3>
              <div className="mt-12 flex flex-col gap-0">
                {[
                  {
                    step: "01",
                    label: "Local Input",
                    color: "#A8E063",
                    detail: "Growers, markets, and community members interact with their county agent -- reporting harvests, logging participation, tracking local investment, and sharing availability.",
                  },
                  {
                    step: "02",
                    label: "County Processing",
                    color: "#2DAA6E",
                    detail: "Each agent processes local data, identifies patterns, and generates tailored guidance for its county\u2019s unique food ecosystem.",
                  },
                  {
                    step: "03",
                    label: "National Learning",
                    color: "#F5C518",
                    detail: "Insights from all 32 agents flow into a shared intelligence layer -- cross-referencing seasonal trends, supply gaps, and best practices across Ireland.",
                  },
                  {
                    step: "04",
                    label: "Feedback Loop",
                    color: "#F5A623",
                    detail: "National-level patterns feed back into each county agent, making local recommendations sharper and more informed with every cycle.",
                  },
                ].map((item, index) => (
                  <div key={item.step} className="flex gap-6">
                    <div className="flex flex-col items-center">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.step}
                      </div>
                      {index < 3 && (
                        <div className="w-0.5 flex-1 bg-border" />
                      )}
                    </div>
                    <div className={index < 3 ? "pb-10" : ""}>
                      <p className="font-serif text-lg font-semibold text-foreground">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════ SECTION 8: GLOBAL LICENSING ═══════════════ */}
      <div className="section-divider" />
      <section className="relative overflow-hidden px-6 py-24 md:py-32">
        {/* Background globe video with feathered edges */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="h-full w-full max-w-[1400px] opacity-15"
            style={{
              maskImage: "radial-gradient(ellipse at center, black 20%, transparent 65%)",
              WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 65%)",
            }}
          >
            <video
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            >
              <source src="/videos/global-licensing.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
              Beyond Ireland
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl text-balance">
              Designed for <span className="brand-gradient-text">Global Licensing</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Each Irish county licenses its AI agent model to regions worldwide --
              creating collaborative partnerships that generate revenue flowing directly
              back into local food system development. The same architecture that maps
              Ireland{"'"}s 32 counties adapts to any region, language, or food culture.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 md:gap-10">
            {[
              {
                icon: Globe,
                title: "County-Led Licensing",
                color: "var(--icon-lime)",
                gradientTo: "var(--icon-teal)",
                description:
                  "Each Irish county licenses its proven agent model to equivalent regions globally -- a Kerry agent partners with a Tuscany province, a Galway agent with a Basque comarca. Peer-to-peer, county-to-county.",
              },
              {
                icon: BarChart3,
                title: "Revenue Back to Local",
                color: "var(--icon-teal)",
                gradientTo: "var(--icon-green)",
                description:
                  "Licensing revenue flows directly back to the originating county and is reinvested into local food system development -- funding growers, infrastructure, community programmes, and agent improvements.",
              },
              {
                icon: Cpu,
                title: "Collaborative Partnerships",
                color: "var(--icon-yellow)",
                gradientTo: "var(--icon-orange)",
                description:
                  "Licensing isn\u2019t one-way. Partner regions share their own local intelligence back, creating a two-way exchange that strengthens both food systems and builds a global regenerative knowledge network.",
              },
              {
                icon: Leaf,
                title: "Scalable by Design",
                color: "var(--icon-orange)",
                gradientTo: "var(--icon-yellow)",
                description:
                  "Swap 32 Irish counties for 50 US states, 16 German Bundesl\u00E4nder, or 47 Japanese prefectures. Every licensed instance inherits biotic-aware food categorisation, community empowerment, and measurable outcomes.",
              },
            ].map((item, index) => (
              <ScrollReveal key={item.title} delay={index * 150}>
                <div className="relative flex flex-col items-start overflow-hidden rounded-2xl border border-border bg-background p-8 transition-shadow hover:shadow-lg">
                  <div
                    className="absolute top-0 right-0 left-0 h-1.5"
                    style={{ background: `linear-gradient(90deg, ${item.color}, ${item.gradientTo})` }}
                  />
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: item.color }}
                  >
                    <item.icon size={24} className="text-white" />
                  </div>
                  <h3 className="mt-6 font-serif text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                  <div
                    className="mt-6 h-2 w-16 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${item.color}, ${item.gradientTo})` }}
                  />
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Closing statement */}
          <ScrollReveal delay={200}>
            <div className="mx-auto mt-16 max-w-[600px] text-center">
              <p className="font-serif text-xl font-medium leading-relaxed text-foreground sm:text-2xl text-pretty">
                Ireland builds the proof. Each county owns its model. The world becomes the partner.
              </p>
              <div className="mt-8 flex items-center justify-center gap-1.5">
                <span className="biotic-pill bg-icon-lime" />
                <span className="biotic-pill bg-icon-green" />
                <span className="biotic-pill bg-icon-teal" />
                <span className="biotic-pill bg-icon-yellow" />
                <span className="biotic-pill bg-icon-orange" />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════ SECTION 9: TIMELINE ═══════════════ */}
      <div className="section-divider" />
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <SectionLabel>Timeline</SectionLabel>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl text-balance">
              Seed. Grow. Harvest.
            </h2>
          </ScrollReveal>

          <div className="mt-16 flex flex-col items-center gap-6 md:flex-row md:gap-0">
            {/* 2026 */}
            <ScrollReveal delay={100} className="flex-1">
              <div className="rounded-2xl border border-border bg-background p-6 text-center transition-shadow hover:shadow-lg">
                <p className="font-serif text-4xl font-semibold">
                  <span className="brand-gradient-text">2026</span>
                </p>
                <h3 className="mt-2 font-serif text-lg font-semibold text-foreground">Seed</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Prototype national agent + first county deployments
                </p>
              </div>
            </ScrollReveal>

            {/* Arrow */}
            <div className="hidden text-2xl text-muted-foreground md:block md:px-4">{"\u2192"}</div>
            <div className="text-2xl text-muted-foreground md:hidden">{"\u2193"}</div>

            {/* 2027 */}
            <ScrollReveal delay={200} className="flex-1">
              <div className="rounded-2xl border border-border bg-background p-6 text-center transition-shadow hover:shadow-lg">
                <p className="font-serif text-4xl font-semibold">
                  <span className="brand-gradient-text">2027</span>
                </p>
                <h3 className="mt-2 font-serif text-lg font-semibold text-foreground">Grow</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  All 32 counties live. Cross-county learning active
                </p>
              </div>
            </ScrollReveal>

            {/* Arrow */}
            <div className="hidden text-2xl text-muted-foreground md:block md:px-4">{"\u2192"}</div>
            <div className="text-2xl text-muted-foreground md:hidden">{"\u2193"}</div>

            {/* 2028 */}
            <ScrollReveal delay={300} className="flex-1">
              <div className="rounded-2xl border border-border bg-background p-6 text-center transition-shadow hover:shadow-lg">
                <p className="font-serif text-4xl font-semibold">
                  <span className="brand-gradient-text">2028</span>
                </p>
                <h3 className="mt-2 font-serif text-lg font-semibold text-foreground">Harvest</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Model proven. Global licensing begins
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA SECTION ═══════════════ */}
      <div className="section-divider" />
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl text-balance">
              6 weeks to 4 live agents, real data, and national-scale proof.
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Regenerative agriculture is a {"\u20AC"}30B+ market growing 15&ndash;20% annually.
              EatoSystem is building the coordination infrastructure layer.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="mt-10">
              <a
                href="https://vercel.com/ai-accelerator"
                target="_blank"
                rel="noopener noreferrer"
                className="brand-gradient inline-block rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
              >
                {"Vercel AI Accelerator \u2197"}
              </a>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <p className="mt-8 text-sm font-medium italic text-icon-orange sm:text-base">
              Seeded in Ireland. Harvested Globally.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={400}>
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
    </div>
  )
}
