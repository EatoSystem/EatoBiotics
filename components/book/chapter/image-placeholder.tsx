import { ImageIcon, LayoutTemplate, BarChart3, Camera, Sparkles } from "lucide-react"

type ImageType = "diagram" | "photo" | "illustration" | "chart" | "infographic"

interface ImagePlaceholderProps {
  type?: ImageType
  idea: string
  caption?: string
  aspectRatio?: "wide" | "square" | "portrait"
}

const typeConfig: Record<ImageType, {
  label: string
  Icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>
  gradient: string
  borderColor: string
  bg: string
  textColor: string
}> = {
  diagram: {
    label: "Diagram",
    Icon: LayoutTemplate,
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
    borderColor: "#9ED9C3",
    bg: "#F0FAF6",
    textColor: "var(--icon-teal)",
  },
  photo: {
    label: "Photo",
    Icon: Camera,
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-lime))",
    borderColor: "#C4E8A4",
    bg: "#F3FBE5",
    textColor: "var(--icon-green)",
  },
  illustration: {
    label: "Illustration",
    Icon: Sparkles,
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    borderColor: "#D4F0A4",
    bg: "#F7FCEE",
    textColor: "var(--icon-lime)",
  },
  chart: {
    label: "Chart",
    Icon: BarChart3,
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    borderColor: "#FAE68A",
    bg: "#FEFAE5",
    textColor: "var(--icon-yellow)",
  },
  infographic: {
    label: "Infographic",
    Icon: ImageIcon,
    gradient: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
    borderColor: "#FACB88",
    bg: "#FEF5E8",
    textColor: "var(--icon-orange)",
  },
}

const aspectMap: Record<string, string> = {
  wide: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
}

export function ImagePlaceholder({
  type = "illustration",
  idea,
  caption,
  aspectRatio = "wide",
}: ImagePlaceholderProps) {
  const cfg = typeConfig[type]
  const { Icon } = cfg

  return (
    <figure className="my-10">
      <div
        className={`relative flex w-full flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center ${aspectMap[aspectRatio]}`}
        style={{ borderColor: cfg.borderColor, backgroundColor: cfg.bg }}
      >
        {/* Type badge — top left */}
        <div
          className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white"
          style={{ background: cfg.gradient }}
        >
          <Icon size={10} />
          {cfg.label}
        </div>

        {/* Icon circle */}
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-white"
          style={{ background: cfg.gradient }}
        >
          <Icon size={26} />
        </div>

        {/* Idea text */}
        <p
          className="max-w-lg text-sm font-medium leading-relaxed"
          style={{ color: cfg.textColor }}
        >
          {idea}
        </p>

        {/* Bottom gradient line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{ background: cfg.gradient }}
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
