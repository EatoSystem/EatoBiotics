interface SubstackStatProps {
  value: string
  label: string
  sublabel?: string
  color?: string
}

export function SubstackStat({ value, label, sublabel }: SubstackStatProps) {
  return (
    <div className="my-8 rounded-xl border border-gray-200 bg-gray-50 px-6 py-5">
      {/* hr + semantic elements survive paste into Substack */}
      <hr className="border-gray-300" />
      <p className="mt-4 text-4xl font-black tracking-tight text-gray-900">
        <strong>{value}</strong>
      </p>
      <p className="mt-1 text-base font-semibold text-gray-800">
        <strong>{label}</strong>
      </p>
      {sublabel && (
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          <em>{sublabel}</em>
        </p>
      )}
      <hr className="mt-4 border-gray-300" />
    </div>
  )
}
