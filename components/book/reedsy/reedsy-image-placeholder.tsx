interface ReedsyImagePlaceholderProps {
  type?: string
  idea: string
  caption?: string
  aspectRatio?: string
}

function summarise(idea: string, maxLen = 140): string {
  if (idea.length <= maxLen) return idea
  return idea.slice(0, maxLen).trimEnd() + "..."
}

export function ReedsyImagePlaceholder({ type, idea, caption }: ReedsyImagePlaceholderProps) {
  const typeLabel = type ? type.charAt(0).toUpperCase() + type.slice(1) : "Image"

  return (
    <figure className="my-6">
      <div className="rounded border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-center text-sm text-gray-400">
        [{typeLabel} placeholder]
      </div>
      <figcaption className="mt-2 text-center text-sm italic text-gray-500">
        Figure — {caption ?? summarise(idea)}
      </figcaption>
    </figure>
  )
}
