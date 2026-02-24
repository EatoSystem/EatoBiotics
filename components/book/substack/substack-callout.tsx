import React from "react"

type CalloutType = "science" | "note" | "food" | "warning"

const CALLOUT_CONFIG: Record<CalloutType, { emoji: string; label: string; bg: string; border: string }> = {
  science: { emoji: "🔬", label: "Science",  bg: "bg-blue-50",   border: "border-blue-200" },
  note:    { emoji: "💡", label: "Note",     bg: "bg-amber-50",  border: "border-amber-200" },
  food:    { emoji: "🥗", label: "Food",     bg: "bg-green-50",  border: "border-green-200" },
  warning: { emoji: "⚠️", label: "Warning",  bg: "bg-red-50",    border: "border-red-200" },
}

interface SubstackCalloutProps {
  type?: CalloutType
  label?: string
  children: React.ReactNode
}

export function SubstackCallout({ type = "note", label, children }: SubstackCalloutProps) {
  const config = CALLOUT_CONFIG[type]
  const displayLabel = label ?? config.label

  return (
    <div className={`my-8 rounded-xl border ${config.border} ${config.bg} px-5 py-4`}>
      {/* blockquote survives Substack paste — carries the type prefix as bold text */}
      <blockquote className="not-italic">
        <p>
          <strong>
            {config.emoji} {displayLabel}:
          </strong>{" "}
          {children}
        </p>
      </blockquote>
    </div>
  )
}
