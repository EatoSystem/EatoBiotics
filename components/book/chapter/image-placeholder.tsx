import { ImageIcon } from "lucide-react"

type ImageType = "diagram" | "photo" | "illustration" | "chart" | "infographic"

interface ImagePlaceholderProps {
  type?: ImageType
  idea: string
  caption?: string
  aspectRatio?: "wide" | "square" | "portrait"
}

const typeConfig: Record<ImageType, { label: string; color: string; bg: string; border: string }> = {
  diagram:     { label: "Diagram",     color: "#2DAA6E", bg: "#E2F5EF", border: "#9ED9C3" },
  photo:       { label: "Photo",       color: "#4CB648", bg: "#EBF7E1", border: "#C4E8A4" },
  illustration:{ label: "Illustration",color: "#A8E063", bg: "#F3FBE5", border: "#D4F0A4" },
  chart:       { label: "Chart",       color: "#F5C518", bg: "#FEF9E2", border: "#FAE68A" },
  infographic: { label: "Infographic", color: "#F5A623", bg: "#FEF3E2", border: "#FACB88" },
}

const aspectMap = {
  wide:    "aspect-video",
  square:  "aspect-square",
  portrait:"aspect-[3/4]",
}

export function ImagePlaceholder({
  type = "illustration",
  idea,
  caption,
  aspectRatio = "wide",
}: ImagePlaceholderProps) {
  const cfg = typeConfig[type]
  return (
    <figure className="my-10">
      <div
        className={`relative flex w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 text-center ${aspectMap[aspectRatio]}`}
        style={{ borderColor: cfg.border, backgroundColor: cfg.bg }}
      >
        {/* Tag */}
        <div
          className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: cfg.color + "22", color: cfg.color }}
        >
          <ImageIcon size={11} />
          {cfg.label}
        </div>

        {/* Icon */}
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: cfg.color + "22" }}
        >
          <ImageIcon size={28} style={{ color: cfg.color }} />
        </div>

        {/* Idea */}
        <p className="max-w-md text-sm font-medium leading-relaxed" style={{ color: cfg.color }}>
          {idea}
        </p>
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
