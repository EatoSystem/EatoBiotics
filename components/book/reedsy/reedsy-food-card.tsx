interface ReedsyFoodCardProps {
  emoji: string
  name: string
  type: string
  benefit: string
  howToEat?: string
}

export function ReedsyFoodCard({ emoji, name, type, benefit, howToEat }: ReedsyFoodCardProps) {
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1)

  return (
    <blockquote className="my-4 border-l-4 border-gray-300 pl-5">
      <p className="font-bold text-gray-900">
        {emoji} {name}{" "}
        <span className="font-normal text-gray-500">({typeLabel})</span>
      </p>
      <p className="mt-1 text-gray-700">{benefit}</p>
      {howToEat && (
        <p className="mt-1 italic text-gray-500">On your plate: {howToEat}</p>
      )}
    </blockquote>
  )
}
