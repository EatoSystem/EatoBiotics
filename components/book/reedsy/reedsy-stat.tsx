interface ReedsyStatProps {
  value: string
  label: string
  sublabel?: string
  color?: string
}

export function ReedsyStat({ value, label, sublabel }: ReedsyStatProps) {
  return (
    <div className="my-6 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 font-semibold text-gray-800">{label}</p>
      {sublabel && (
        <p className="mt-1 text-sm italic text-gray-500">{sublabel}</p>
      )}
    </div>
  )
}
