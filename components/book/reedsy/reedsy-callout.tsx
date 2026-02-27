import React from "react"

type CalloutType = "science" | "note" | "food" | "warning"

const CALLOUT_LABELS: Record<CalloutType, string> = {
  science: "The Science",
  note:    "Worth Knowing",
  food:    "On Your Plate",
  warning: "Watch Out",
}

interface ReedsyCalloutProps {
  type?: CalloutType
  label?: string
  children: React.ReactNode
}

export function ReedsyCallout({ type = "note", label, children }: ReedsyCalloutProps) {
  const displayLabel = label ?? CALLOUT_LABELS[type]

  return (
    <blockquote className="my-6 border-l-4 border-gray-300 pl-5">
      <p className="mb-2 font-bold text-gray-900">{displayLabel}</p>
      <div className="text-gray-700">{children}</div>
    </blockquote>
  )
}
