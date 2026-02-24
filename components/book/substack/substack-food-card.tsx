interface SubstackFoodCardProps {
  emoji: string
  name: string
  type: string
  benefit: string
  howToEat?: string
}

export function SubstackFoodCard({ emoji, name, type, benefit, howToEat }: SubstackFoodCardProps) {
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1)

  return (
    <div className="my-4 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
      <p>
        <strong>
          {emoji} {name}{" "}
          <span className="font-normal text-gray-500">({typeLabel})</span>
        </strong>
      </p>
      <p className="mt-1 text-sm text-gray-700">{benefit}</p>
      {howToEat && (
        <p className="mt-1 text-sm text-gray-500">
          <em>On your plate: {howToEat}</em>
        </p>
      )}
    </div>
  )
}
