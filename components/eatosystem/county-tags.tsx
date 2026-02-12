"use client"

const counties = [
  "Carlow", "Cavan", "Clare", "Cork", "Donegal", "Dublin", "Galway", "Kerry",
  "Kildare", "Kilkenny", "Laois", "Leitrim", "Limerick", "Longford", "Louth",
  "Mayo", "Meath", "Monaghan", "Offaly", "Roscommon", "Sligo", "Tipperary",
  "Waterford", "Westmeath", "Wexford", "Wicklow", "Antrim", "Armagh", "Derry",
  "Down", "Fermanagh", "Tyrone",
]

const iconColors = [
  "var(--icon-lime)",
  "var(--icon-green)",
  "var(--icon-teal)",
  "var(--icon-yellow)",
  "var(--icon-orange)",
]

export function CountyTags() {
  return (
    <div className="flex flex-wrap gap-3">
      {counties.map((county, i) => (
        <span
          key={county}
          className="cursor-default rounded-full border-2 px-4 py-2 text-sm font-medium text-foreground transition-all hover:text-white hover:border-transparent"
          style={{
            borderColor: iconColors[i % iconColors.length],
            backgroundColor: `color-mix(in srgb, ${iconColors[i % iconColors.length]} 8%, transparent)`,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLSpanElement).style.backgroundColor = iconColors[i % iconColors.length]
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLSpanElement).style.backgroundColor = `color-mix(in srgb, ${iconColors[i % iconColors.length]} 8%, transparent)`
          }}
        >
          {county}
        </span>
      ))}
    </div>
  )
}
