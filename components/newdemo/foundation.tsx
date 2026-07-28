import Image from "next/image"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { display, text } from "./tokens"

/**
 * Section 5 — Feed. Seed. Regenerate., and the plate that demonstrates it.
 *
 * Merges two production sections: the three biotic cards and the plate diagram,
 * both currently in components/home/the-framework.tsx as separate lessons. The
 * plate is now the practical expression of the framework rather than a second
 * explanation of it.
 *
 * Vocabulary is kept disjoint from section 2 on purpose: the four steps are
 * what EatoBiotics does, these three are what the user does, and no word
 * appears in both. "Regenerate" exists only in this section.
 *
 * ══ POSTBIOTICS WORDING RULE — the highest-priority item in the brief ═══════
 * No copy in this file states or implies that a food IS a postbiotic. Under the
 * 2021 ISAPP consensus, postbiotics are preparations of inanimate
 * microorganisms and/or their components; purified microbial metabolites such
 * as short-chain fatty acids are explicitly excluded. Consumer usage is looser;
 * we do not follow it.
 *
 * The word appears once here, in the sub below ("informed by the science of…"),
 * linked to /method. The Regenerate card describes supporting microbial
 * activity and its products without naming them postbiotics.
 *
 * Note what production says today and what was NOT carried over: the-framework
 * describes postbiotics as "short-chain fatty acids, vitamins, and
 * neurotransmitters" — naming SCFAs as postbiotics, exactly what ISAPP
 * excludes. That framing is deliberately dropped.
 *
 * Known deviation, flagged in the PR: the word also appears in section 3 as a
 * Biotics Score pillar label ("Postbiotics — Consistency & rhythm"). That is a
 * score-dimension name in a product interface, not a claim about a food, so it
 * honours the binding rule. Relabelling it to "Regenerate" would have broken
 * the separate rule that Regenerate appears only in this section.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const ACTIONS = [
  {
    number: "01",
    word: "Feed",
    title: "Nourish your body",
    body: "Diverse, fibre-rich whole foods that feed the bacteria already living in you.",
    color: display.lime,
    gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))",
    image: "/prebiotics-1.png",
  },
  {
    number: "02",
    word: "Seed",
    title: "Introduce beneficial microbes",
    body: "Fermented foods and dietary patterns that add live cultures.",
    color: display.teal,
    gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))",
    image: "/probiotics-1.png",
  },
  {
    number: "03",
    word: "Regenerate",
    title: "Support what your microbes produce",
    body: "The beneficial compounds produced by microbial activity, and the conditions that help your system recover.",
    color: display.orange,
    gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))",
    image: "/postbiotics-1.png",
  },
]

const PLATE_PARTS = [
  {
    label: "Prebiotic Base",
    name: "Fibre Foundation",
    color: text.green,
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    examples: ["Leafy greens", "Broccoli", "Legumes", "Whole grains"],
  },
  {
    label: "Probiotic Side",
    name: "Fermented Foods",
    color: text.teal,
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    examples: ["Yogurt", "Kimchi", "Sauerkraut", "Kefir"],
  },
  {
    label: "Protein Balance",
    name: "Quality Protein",
    color: text.orange,
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    examples: ["Eggs", "Salmon", "Beans", "Tempeh"],
  },
  {
    label: "Healthy Fats",
    name: "Daily Support",
    color: text.yellow,
    gradient: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
    examples: ["Avocado", "Olive oil", "Nuts", "Seeds"],
  },
]

export function Foundation() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: text.green }}>
              The Foundation of EatoBiotics
            </p>
            <h2 className="mt-4 font-serif text-4xl font-bold text-foreground sm:text-5xl text-balance">
              Feed. Seed. <span className="brand-gradient-text">Regenerate.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Three simple actions informed by the science of prebiotics, probiotics and
              postbiotics.{" "}
              <Link
                href="/method"
                className="font-semibold underline underline-offset-4 hover:opacity-80"
                style={{ color: text.green }}
              >
                How the science works
              </Link>
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {ACTIONS.map((a, i) => (
            <ScrollReveal key={a.word} delay={i * 130}>
              <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-shadow hover:shadow-lg">
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 z-10 h-1.5"
                  style={{ background: a.gradient }}
                />
                <div className="w-full overflow-hidden">
                  <Image
                    src={a.image}
                    alt=""
                    width={600}
                    height={360}
                    sizes="(max-width: 768px) 90vw, 380px"
                    className="h-auto w-full"
                  />
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <span
                    className="font-serif text-5xl font-semibold leading-none"
                    style={{ color: a.color }}
                  >
                    {a.number}
                  </span>
                  <h3
                    className="mt-5 font-serif text-2xl font-bold"
                    style={{ color: a.color }}
                  >
                    {a.word}
                  </h3>
                  <p className="mt-1.5 text-base font-semibold text-foreground">{a.title}</p>
                  <p className="mt-3 flex-1 text-base leading-relaxed text-muted-foreground">
                    {a.body}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* ── The plate: the practical demonstration ──
            Asymmetric split rather than another centred-heading-plus-grid, to
            break the page's repeated section formula. */}
        <div className="mt-24 flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
          <div className="lg:w-[45%] lg:shrink-0">
            <ScrollReveal>
              <h3 className="font-serif text-3xl font-bold text-foreground sm:text-4xl text-balance">
                What does that look like on a{" "}
                <span className="brand-gradient-text">real plate?</span>
              </h3>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                EatoBiotics doesn&apos;t label a meal good or bad. It shows how different parts
                of the meal support different parts of your Food System.
              </p>
              <div className="mt-8 flex justify-center lg:justify-start">
                <Image
                  src="/images/eatobiotics/eatobiotics-plate.png"
                  alt="The EatoBiotics plate, divided into a prebiotic base, a probiotic side, protein balance and healthy fats"
                  width={1000}
                  height={1000}
                  sizes="(max-width: 1024px) 85vw, 480px"
                  className="h-auto w-full max-w-[480px] object-contain"
                />
              </div>
            </ScrollReveal>
          </div>

          {/* Single column at 375px so the example chips never wrap to one word
              per line; two columns from sm upward. */}
          <div className="flex-1">
            <ScrollReveal delay={140}>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {PLATE_PARTS.map((q) => (
                  <li
                    key={q.label}
                    className="relative overflow-hidden rounded-2xl border border-border bg-background p-5"
                  >
                    <div
                      aria-hidden
                      className="absolute inset-x-0 top-0 h-1"
                      style={{ background: q.gradient }}
                    />
                    <p
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: q.color }}
                    >
                      {q.label}
                    </p>
                    <h4 className="mt-1.5 font-serif text-lg font-semibold text-foreground">
                      {q.name}
                    </h4>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {q.examples.map((ex) => (
                        <span
                          key={ex}
                          className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
                          style={{ background: q.gradient }}
                        >
                          {ex}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  )
}
