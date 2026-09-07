import type { Saving } from '../types'

/**
 * Presentation-only level derivation from total verified savings.
 * Pure + deterministic. Does NOT affect any game logic or the store —
 * it's purely a HUD flourish. Each level needs progressively more savings.
 */
export function computeLevel(totalSavings: number): number {
  if (totalSavings <= 0) return 1
  // level grows with the square root of savings for a satisfying curve
  return Math.floor(Math.sqrt(totalSavings / 500)) + 1
}

export function levelProgress(totalSavings: number): number {
  const lvl = computeLevel(totalSavings)
  const curr = Math.pow(lvl - 1, 2) * 500
  const next = Math.pow(lvl, 2) * 500
  if (next === curr) return 0
  return Math.max(0, Math.min(1, (totalSavings - curr) / (next - curr)))
}

export interface SavingsGrowthPoint {
  date: string
  label: string
  amount: number
  depositAmount: number
  level?: number
  levelLabel?: string
}

/**
 * Computes cumulative lifetime savings over chronological time, annotating points
 * where new level thresholds were achieved.
 */
export function getSavingsGrowthWithLevelMarkers(savings: Saving[]): SavingsGrowthPoint[] {
  if (savings.length === 0) return []

  const sorted = [...savings].sort((a, b) => a.timestamp - b.timestamp)

  let cumulative = 0
  let prevLevel = 1
  const series: SavingsGrowthPoint[] = []

  // Add initial zero baseline point based on first deposit's date
  series.push({
    date: sorted[0].date,
    label: 'Start',
    amount: 0,
    depositAmount: 0,
  })

  for (const s of sorted) {
    cumulative += s.amount
    const currentLevel = computeLevel(cumulative)
    const crossedLevel = currentLevel > prevLevel

    const point: SavingsGrowthPoint = {
      date: s.date,
      label: s.date.slice(5),
      amount: cumulative,
      depositAmount: s.amount,
    }

    if (crossedLevel) {
      point.level = currentLevel
      point.levelLabel = `Lv. ${currentLevel}`
      prevLevel = currentLevel
    }

    series.push(point)
  }

  return series
}
