import Image from "next/image"
import { LayoutTemplate, BarChart3, Camera, Sparkles, ImageIcon } from "lucide-react"

type ImageType = "diagram" | "photo" | "illustration" | "chart" | "infographic"

interface ImagePlaceholderProps {
  type?: ImageType
  idea: string
  caption?: string
  aspectRatio?: "wide" | "square" | "portrait"
  /** When provided, renders a real image instead of the placeholder UI */
  src?: string
  /** Alt text for real images — falls back to `idea` if not provided */
  alt?: string
}

const typeConfig: Record<ImageType, {
  label: string
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  color: string
}> = {
  diagram:     { label: "Diagram",      Icon: LayoutTemplate, color: "var(--icon-teal)" },
  photo:       { label: "Photo",        Icon: Camera,         color: "var(--icon-green)" },
  illustration:{ label: "Illustration", Icon: Sparkles,       color: "var(--icon-lime)" },
  chart:       { label: "Chart",        Icon: BarChart3,      color: "var(--icon-yellow)" },
  infographic: { label: "Infographic",  Icon: ImageIcon,      color: "var(--icon-orange)" },
}

const aspectMap: Record<string, string> = {
  wide:    "aspect-video",
  square:  "aspect-square",
  portrait:"aspect-[3/4]",
}

export function ImagePlaceholder({
  type = "illustration",
  idea,
  caption,
  aspectRatio = "wide",
  src,
  alt,
}: ImagePlaceholderProps) {
  const { label, Icon, color } = typeConfig[type]

  /* ── Real image mode — when `src` is provided ──────────────────────── */
  if (src) {
    return (
      <figure className="my-10">
        <div className="overflow-hidden rounded-2xl">
          <Image
            src={src}
            alt={alt ?? idea}
            width={1280}
            height={720}
            className="h-auto w-full"
          />
        </div>
        {caption && (
          <figcaption className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
            {caption}
          </figcaption>
        )}
      </figure>
    )
  }

  /* ── Placeholder mode — default ────────────────────────────────────── */
  return (
    <figure className="my-10">
      <div
        className={`relative flex w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border-2 border-dashed border-border bg-secondary/30 p-8 text-center ${aspectMap[aspectRatio]}`}
      >
        {/* Type label — top left */}
        <div className="absolute left-4 top-4 flex items-center gap-1.5">
          <Icon size={11} style={{ color }} />
          <span
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color }}
          >
            {label}
          </span>
        </div>

        {/* Icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-background border border-border">
          <Icon size={24} style={{ color }} />
        </div>

        {/* Idea description */}
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{idea}</p>
      </div>

      {caption && (
        <figcaption className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
