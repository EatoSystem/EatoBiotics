import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Help & Getting Started — EatoBiotics",
  description:
    "How EatoBiotics works, answers to common questions, and how to get in touch. Start with your free Food System assessment.",
}

const CONTACT_EMAIL = "hello@eatobiotics.com"

/* ── Getting-started steps (the core loop, made explicit for new members) ── */
const STEPS: { n: string; title: string; body: string; href?: string; cta?: string }[] = [
  {
    n: "1",
    title: "Take your free assessment",
    body: "A few questions about how you eat gives you a Food System (Biotics) Score out of 100 and your profile type — no payment, no app needed.",
    href: "/assessment",
    cta: "Start the assessment",
  },
  {
    n: "2",
    title: "Get your score and report",
    body: "See your score, your three biotics (prebiotics, probiotics, postbiotics), and a personalised report emailed to you. Save your results to an account with a one-tap sign-in link.",
  },
  {
    n: "3",
    title: "Log meals, one at a time",
    body: "Describe or photograph a meal and get its Biotics Score instantly — with a plain-English insight on what it does for your gut and one swap to make it better.",
    href: "/analyse",
    cta: "Score a meal",
  },
  {
    n: "4",
    title: "Watch your Food System grow",
    body: "Your living Food System responds to what you feed it. Keep a daily rhythm, build a streak, and retest after 75 days to see how far you've come.",
  },
]

/* ── FAQ (the Support surface) ── */
const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "What is EatoBiotics?",
    a: "EatoBiotics is a food-system platform built on the 3 Biotics Framework — prebiotics (the fibre-rich plants that feed your gut bacteria), probiotics (live fermented foods), and postbiotics (the beneficial compounds your gut bacteria produce). It helps you understand and improve how your everyday food supports your gut, through education, scoring, and daily habits.",
  },
  {
    q: "What is the Biotics Score?",
    a: "A 0–100 score that reflects how well your food choices support your microbiome across the three biotics. Higher means more variety of gut-supporting foods. It's a guide to build better habits over time — not a medical measurement.",
  },
  {
    q: "Is EatoBiotics medical advice?",
    a: (
      <>
        No. EatoBiotics is educational and for general wellbeing. It does not diagnose, treat, cure,
        or prevent any medical condition, and it is not a substitute for professional care. Always
        speak with a qualified healthcare professional about medical concerns. See our{" "}
        <Link href="/terms" className="underline hover:opacity-80">Terms</Link> for more.
      </>
    ),
  },
  {
    q: "How do I log a meal?",
    a: (
      <>
        On the <Link href="/analyse" className="underline hover:opacity-80">Score My Meal</Link> page
        (or inside your account), describe your meal in a sentence or snap a photo. You'll get an
        instant Biotics Score, the three biotics broken down, and a short insight. You don't need to
        log every meal — even a few a week builds a useful picture.
      </>
    ),
  },
  {
    q: "What's the difference between prebiotics, probiotics, and postbiotics?",
    a: "Prebiotics are fibre-rich plant foods that feed your gut bacteria (vegetables, wholegrains, legumes, seeds). Probiotics are live cultures from fermented foods (yogurt, kefir, kimchi, sauerkraut, miso). Postbiotics are the beneficial compounds your bacteria produce when they're well fed (found in aged cheese, sourdough, extra-virgin olive oil, and made inside you). A strong food system includes all three.",
  },
  {
    q: "What do the memberships include?",
    a: (
      <>
        Free tools include the assessment and meal scoring. Paid tiers add deeper features —
        personalised plans, an AI food-system consultant, and more, depending on the tier. See{" "}
        <Link href="/pricing" className="underline hover:opacity-80">Pricing</Link> for the current
        details.
      </>
    ),
  },
  {
    q: "How do I manage or cancel my membership?",
    a: (
      <>
        From your <Link href="/account" className="underline hover:opacity-80">account</Link>, open
        the membership section to manage your plan through our secure payment portal. You can update
        or cancel at any time.
      </>
    ),
  },
  {
    q: "I didn't get my results email",
    a: (
      <>
        Check your spam or promotions folder first. You can resend the link from your results page,
        and it can take a few minutes to arrive. If it still doesn't show up, email us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:opacity-80">{CONTACT_EMAIL}</a>{" "}
        and we'll sort it.
      </>
    ),
  },
  {
    q: "How is my data used?",
    a: (
      <>
        Your data is used to give you your results and personalise your experience — never sold. See
        our <Link href="/privacy" className="underline hover:opacity-80">Privacy Policy</Link> for
        the full detail on what we collect and how it's protected.
      </>
    ),
  },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background pt-[57px]">
      <div className="mx-auto max-w-3xl px-6 pb-24 pt-12">
        {/* Header */}
        <div className="mb-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
            Help
          </p>
          <h1 className="font-serif text-4xl font-bold" style={{ color: "var(--foreground)" }}>
            Getting started &amp; help
          </h1>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            New here, or stuck on something? Here&apos;s how EatoBiotics works and answers to the
            questions we hear most.
          </p>
          <div className="mt-4 h-1 w-16 rounded-full" style={{ background: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))" }} />
        </div>

        {/* Getting started */}
        <section className="mb-14">
          <h2 className="mb-5 font-serif text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            How it works
          </h2>
          <div className="space-y-4">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-4 rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
                >
                  {s.n}
                </span>
                <div>
                  <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{s.body}</p>
                  {s.href && s.cta && (
                    <Link href={s.href} className="mt-2 inline-block text-sm font-semibold underline hover:opacity-80" style={{ color: "var(--icon-green)" }}>
                      {s.cta} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-14">
          <h2 className="mb-5 font-serif text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Frequently asked questions
          </h2>
          <div className="space-y-2">
            {FAQS.map((f, i) => (
              <details key={i} className="group rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold" style={{ color: "var(--foreground)" }}>
                  {f.q}
                  <span className="ml-4 shrink-0 text-lg transition-transform group-open:rotate-45" style={{ color: "var(--icon-green)" }}>+</span>
                </summary>
                <div className="mt-3 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{f.a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-2xl border p-6 text-center" style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--icon-green) 5%, var(--card))" }}>
          <h2 className="font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>Still need a hand?</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Email us and a real person will get back to you.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-4 inline-block rounded-full px-6 py-3 text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
          >
            {CONTACT_EMAIL}
          </a>
        </section>
      </div>
    </div>
  )
}
