import React from "react"

interface ReedsyPullQuoteProps {
  children: React.ReactNode
  attribution?: string
}

export function ReedsyPullQuote({ children, attribution }: ReedsyPullQuoteProps) {
  return (
    <blockquote className="my-8 border-l-4 border-gray-400 pl-5">
      <p className="text-lg italic leading-relaxed text-gray-800">{children}</p>
      {attribution && (
        <p className="mt-2 text-sm text-gray-500">— {attribution}</p>
      )}
    </blockquote>
  )
}
