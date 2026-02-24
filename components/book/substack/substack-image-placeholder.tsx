interface SubstackImagePlaceholderProps {
  type?: string
  idea: string
  caption?: string
  aspectRatio?: string
}

// Truncate the idea string to a short summary so the pasted note is readable
function summarise(idea: string, maxLen = 120): string {
  if (idea.length <= maxLen) return idea
  return idea.slice(0, maxLen).trimEnd() + "…"
}

export function SubstackImagePlaceholder({ type, idea, caption }: SubstackImagePlaceholderProps) {
  const typeLabel = type ? type.charAt(0).toUpperCase() + type.slice(1) : "Image"

  return (
    <div className="my-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-5 py-4 text-center">
      <p className="text-2xl">📸</p>
      {/* em paragraph survives Substack paste as italic text */}
      <p className="mt-1 text-sm text-gray-500">
        <em>
          [{typeLabel}: {summarise(idea)}]
        </em>
      </p>
      {caption && (
        <p className="mt-1 text-xs text-gray-400">
          <em>{caption}</em>
        </p>
      )}
    </div>
  )
}
