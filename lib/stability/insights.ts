import type { StabilityDailyLog, StabilityInsight, StabilityReportData, StoolType } from "./types"

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const r1 = (n: number | null) => (n == null ? null : Math.round(n * 10) / 10)

function withinDays(logs: StabilityDailyLog[], days: number): StabilityDailyLog[] {
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - (days - 1))
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  return logs.filter((l) => l.date >= cutoffStr)
}

function eventStats(logs: StabilityDailyLog[]) {
  let urgency = 0, accidents = 0
  const stoolCounts: Record<number, number> = {}
  for (const l of logs) {
    for (const e of l.events) {
      if (e.urgency >= 3) urgency++
      if (e.accident) accidents++
      stoolCounts[e.stoolType] = (stoolCounts[e.stoolType] ?? 0) + 1
    }
  }
  let commonStoolType: StoolType | null = null
  let max = 0
  for (const [k, v] of Object.entries(stoolCounts)) if (v > max) { max = v; commonStoolType = Number(k) as StoolType }
  return { urgency, accidents, commonStoolType }
}

/**
 * Rule-based insights over the last `days` of logs. Deliberately uses
 * associative, non-diagnostic language ("appears more common", "may be").
 */
export function generateInsights(logs: StabilityDailyLog[], days = 14): StabilityInsight[] {
  const recent = withinDays(logs, days)
  const out: StabilityInsight[] = []
  if (recent.length < 3) return out

  const push = (id: string, text: string, tone: StabilityInsight["tone"]) => out.push({ id, text, tone })

  // Split days into "symptom" vs "stable" by accidents/urgency on the day.
  const daySymptom = (l: StabilityDailyLog) =>
    l.events.some((e) => e.accident || e.urgency >= 3) || l.overallStability <= 4
  const symptomDays = recent.filter(daySymptom)
  const stableDays = recent.filter((l) => !daySymptom(l))

  if (symptomDays.length && stableDays.length) {
    const cafS = avg(symptomDays.map((d) => d.caffeine)) ?? 0
    const cafSt = avg(stableDays.map((d) => d.caffeine)) ?? 0
    if (cafS - cafSt >= 1) push("caffeine", "Urgency appears more common on higher-caffeine days. It may be worth tracking caffeine timing.", "watch")

    const slpS = avg(symptomDays.map((d) => d.sleepQuality)) ?? 0
    const slpSt = avg(stableDays.map((d) => d.sleepQuality)) ?? 0
    if (slpSt - slpS >= 1.5) push("sleep", "Looser, more urgent days appear more common after lower-sleep nights.", "watch")

    const richS = symptomDays.filter((d) => d.richFatty).length / symptomDays.length
    const richSt = stableDays.filter((d) => d.richFatty).length / Math.max(1, stableDays.length)
    if (richS - richSt >= 0.25) push("rich", "Symptoms appear more frequent after rich or fatty meals.", "watch")

    const watS = avg(symptomDays.map((d) => d.water)) ?? 0
    const watSt = avg(stableDays.map((d) => d.water)) ?? 0
    if (watSt - watS >= 1.5) push("hydration", "Your most stable days include more consistent hydration.", "positive")

    const fibSt = stableDays.filter((d) => d.fibreRich).length / Math.max(1, stableDays.length)
    if (fibSt >= 0.6) push("fibre", "Your most stable days more often include fibre-rich foods.", "positive")
  }

  // Trend: plant/fermented presence
  const fermentedRate = recent.filter((d) => d.fermented).length / recent.length
  if (fermentedRate >= 0.5) push("fermented", "You've kept up fermented foods on most days this period — nice consistency.", "positive")

  return out.slice(0, 5)
}

/** Aggregate a report for the most recent `days` window with a previous-period comparison. */
export function computeReport(logs: StabilityDailyLog[], days = 30): StabilityReportData {
  const recent = withinDays(logs, days)
  const prevCutoffStart = new Date(); prevCutoffStart.setUTCDate(prevCutoffStart.getUTCDate() - (days * 2 - 1))
  const prevCutoffEnd = new Date(); prevCutoffEnd.setUTCDate(prevCutoffEnd.getUTCDate() - days)
  const prev = logs.filter((l) => l.date >= prevCutoffStart.toISOString().slice(0, 10) && l.date <= prevCutoffEnd.toISOString().slice(0, 10))

  const stab = recent.map((l) => l.overallStability)
  const best = recent.reduce<{ date: string; stability: number } | null>((b, l) => (!b || l.overallStability > b.stability ? { date: l.date, stability: l.overallStability } : b), null)
  const worst = recent.reduce<{ date: string; stability: number } | null>((b, l) => (!b || l.overallStability < b.stability ? { date: l.date, stability: l.overallStability } : b), null)
  const ev = eventStats(recent)
  const evPrev = eventStats(prev)

  const focus: string[] = []
  if (ev.accidents > 0) focus.push("Reduce accident/leakage episodes by steadying fibre and meal timing.")
  if ((avg(recent.map((l) => l.water)) ?? 3) < 5) focus.push("Build a consistent daily hydration habit.")
  if ((avg(recent.map((l) => l.sleepQuality)) ?? 6) < 6) focus.push("Protect sleep consistency.")
  if (ev.urgency > recent.length) focus.push("Track caffeine and rich-meal timing against urgency.")
  if (!focus.length) focus.push("Maintain your current routine and keep logging to hold your gains.")

  return {
    rangeDays: days,
    logCount: recent.length,
    avgStability: r1(avg(stab)),
    avgStabilityPrev: r1(avg(prev.map((l) => l.overallStability))),
    bestDay: best,
    worstDay: worst,
    commonStoolType: ev.commonStoolType,
    urgencyEpisodes: ev.urgency,
    accidentEpisodes: ev.accidents,
    accidentEpisodesPrev: evPrev.accidents,
    avgWater: r1(avg(recent.map((l) => l.water))),
    avgSleep: r1(avg(recent.map((l) => l.sleepQuality))),
    avgStress: r1(avg(recent.map((l) => l.stress))),
    insights: generateInsights(logs, days),
    focusNextMonth: focus.slice(0, 4),
  }
}
