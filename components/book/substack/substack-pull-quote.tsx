import React from "react"

interface SubstackPullQuoteProps {
  children: React.ReactNode
  attribution?: string
}

export function SubstackPullQuote({ children, attribution }: SubstackPullQuoteProps) {
  return (
    <div className="my-8 border-l-4 border-gray-400 pl-5">
      {/* blockquote survives Substack paste */}
      <blockquote>
        <p className="text-lg font-semibold italic leading-relaxed text-gray-800">{children}</p>
        {attribution && (
          <p className="mt-2 text-sm text-gray-500">
            <em>— {attribution}</em>
          </p>
        )}
      </blockquote>
    </div>
  )
}
