"use client"

import { useState } from "react"
import { Utensils, Heart, Users, Globe, MessageCircle } from "lucide-react"

/* ── Theme data with sample questions ────────────────────────────────── */

const themes = [
  {
    id: "eat",
    number: "01",
    icon: Utensils,
    title: "What They Eat",
    accent: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    questions: [
      "Walk me through your breakfast this morning.",
      "What\u2019s the one food you never skip?",
      "Has your diet changed as you\u2019ve gotten older?",
      "What would surprise people about what you eat?",
    ],
  },
  {
    id: "feel",
    number: "02",
    icon: Heart,
    title: "How They Feel",
    accent: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    questions: [
      "When did you first notice food affecting your performance?",
      "What does your body tell you when you eat well?",
      "How do you fuel for your biggest days?",
      "What happens to your energy when your diet slips?",
    ],
  },
  {
    id: "grew",
    number: "03",
    icon: Users,
    title: "Where They Grew Up",
    accent: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    questions: [
      "What was the first meal you learned to cook?",
      "Which childhood food still feels like home?",
      "How has your culture shaped what you eat?",
      "What would your family table look like today?",
    ],
  },
  {
    id: "learned",
    number: "04",
    icon: Globe,
    title: "What They\u2019ve Learned",
    accent: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    questions: [
      "What do you know about food now that you wish you knew at 20?",
      "What\u2019s the biggest food myth you\u2019ve had to unlearn?",
      "If you could teach one food habit to everyone, what would it be?",
      "What\u2019s the simplest change that made the biggest difference?",
    ],
  },
]

/* ── Component ───────────────────────────────────────────────────────── */

export function QuestionExplorer() {
  const [active, setActive] = useState(0)
  const theme = themes[active]

  return (
    <div>
      {/* Theme tabs */}
      <div className="flex flex-wrap gap-2">
        {themes.map((t, i) => {
          const isActive = i === active
          return (
            <button
              key={t.id}
              onClick={() => setActive(i)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? "text-white shadow-md"
                  : "border border-border hover:border-current/20"
              }`}
              style={{
                background: isActive ? t.gradient : undefined,
                color: isActive ? "white" : t.accent,
              }}
            >
              <t.icon size={15} />
              {t.title}
            </button>
          )
        })}
      </div>

      {/* Active theme content */}
      <div className="mt-8" key={theme.id}>
        {/* Theme header */}
        <div className="mb-6 flex items-center gap-4">
          <span
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
            style={{ background: theme.gradient }}
          >
            {theme.number}
          </span>
          <div>
            <h3 className="font-serif text-xl font-semibold text-foreground sm:text-2xl">
              {theme.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              Sample questions from every episode
            </p>
          </div>
        </div>

        {/* Questions grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          {theme.questions.map((q, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-xl border border-border bg-background p-5 transition-all hover:shadow-md"
            >
              <div
                className="absolute bottom-0 left-0 top-0 w-1"
                style={{ background: theme.gradient }}
              />
              <div className="flex items-start gap-3 pl-2">
                <MessageCircle
                  size={16}
                  className="mt-0.5 flex-shrink-0"
                  style={{ color: theme.accent }}
                />
                <p className="text-sm font-medium leading-relaxed text-foreground italic">
                  &ldquo;{q}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
