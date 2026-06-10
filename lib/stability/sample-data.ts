import type { StabilityDailyLog, BowelEvent, StoolType } from "./types"

function dateOffset(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

let idc = 0
function ev(time: string, stoolType: StoolType, urgency: number, accident = false): BowelEvent {
  return { id: `seed-${idc++}`, time, stoolType, urgency, accident, pain: false, bloating: urgency >= 3 }
}

/**
 * 14 days of realistic, improving sample logs — used to populate the
 * tracker/insights/report empty states so users can see the value immediately.
 */
export function sampleLogs(): StabilityDailyLog[] {
  const rows: Array<Partial<StabilityDailyLog> & { d: number; events: BowelEvent[]; stability: number }> = [
    { d: 13, sleepQuality: 4, stress: 8, caffeine: 4, water: 3, richFatty: true, fibreRich: false, fermented: false, events: [ev("08:10", 6, 4, true), ev("13:20", 6, 3)], stability: 3 },
    { d: 12, sleepQuality: 5, stress: 7, caffeine: 4, water: 4, richFatty: true, fibreRich: false, fermented: false, events: [ev("07:50", 6, 4), ev("19:00", 5, 2)], stability: 4 },
    { d: 11, sleepQuality: 6, stress: 6, caffeine: 3, water: 5, richFatty: false, fibreRich: true, fermented: true, events: [ev("08:30", 5, 2)], stability: 5 },
    { d: 10, sleepQuality: 5, stress: 7, caffeine: 4, water: 4, richFatty: true, fibreRich: false, fermented: false, events: [ev("08:00", 6, 3), ev("14:10", 6, 4, true)], stability: 3 },
    { d: 9,  sleepQuality: 7, stress: 5, caffeine: 2, water: 6, richFatty: false, fibreRich: true, fermented: true, events: [ev("08:40", 4, 1)], stability: 7 },
    { d: 8,  sleepQuality: 7, stress: 4, caffeine: 2, water: 7, richFatty: false, fibreRich: true, fermented: true, events: [ev("09:00", 4, 1)], stability: 8 },
    { d: 7,  sleepQuality: 6, stress: 6, caffeine: 3, water: 5, richFatty: true, fibreRich: false, fermented: false, events: [ev("08:15", 5, 3)], stability: 5 },
    { d: 6,  sleepQuality: 7, stress: 5, caffeine: 2, water: 6, richFatty: false, fibreRich: true, fermented: true, events: [ev("08:20", 4, 1)], stability: 7 },
    { d: 5,  sleepQuality: 8, stress: 4, caffeine: 1, water: 7, richFatty: false, fibreRich: true, fermented: true, events: [ev("08:30", 4, 0)], stability: 9 },
    { d: 4,  sleepQuality: 6, stress: 6, caffeine: 3, water: 5, richFatty: true, fibreRich: false, fermented: false, events: [ev("08:00", 5, 3), ev("18:30", 5, 2)], stability: 5 },
    { d: 3,  sleepQuality: 7, stress: 5, caffeine: 2, water: 6, richFatty: false, fibreRich: true, fermented: true, events: [ev("08:25", 4, 1)], stability: 7 },
    { d: 2,  sleepQuality: 8, stress: 3, caffeine: 1, water: 8, richFatty: false, fibreRich: true, fermented: true, events: [ev("08:35", 4, 0)], stability: 9 },
    { d: 1,  sleepQuality: 7, stress: 4, caffeine: 2, water: 7, richFatty: false, fibreRich: true, fermented: true, events: [ev("08:30", 4, 1)], stability: 8 },
    { d: 0,  sleepQuality: 8, stress: 3, caffeine: 1, water: 7, richFatty: false, fibreRich: true, fermented: true, events: [ev("08:20", 4, 0)], stability: 9 },
  ]
  return rows.map((row) => ({
    date: dateOffset(row.d),
    sleepQuality: row.sleepQuality ?? 6,
    stress: row.stress ?? 5,
    energy: Math.max(1, 11 - (row.stress ?? 5)),
    caffeine: row.caffeine ?? 1,
    alcohol: 0,
    water: row.water ?? 5,
    dairy: false,
    spicy: false,
    richFatty: row.richFatty ?? false,
    sweeteners: false,
    fibreRich: row.fibreRich ?? true,
    fermented: row.fermented ?? false,
    events: row.events,
    confidenceLeavingHouse: Math.min(10, (row.stability ?? 5) + 1),
    overallStability: row.stability,
    updatedAt: new Date().toISOString(),
  }))
}
