import type { Saving } from '../types'
import { daysAgo, toDateString } from './dates'

export function computeSavingsStreak(savings: Saving[]): number {
  if (savings.length === 0) return 0

  const depositDates = new Set(savings.map((s) => s.date))
  let streak = 0
  const today = toDateString()

  // Start from today or yesterday if no deposit today
  let checkDate = today
  if (!depositDates.has(today)) {
    checkDate = daysAgo(1)
  }

  while (depositDates.has(checkDate)) {
    streak++
    const d = new Date(checkDate)
    d.setDate(d.getDate() - 1)
    checkDate = toDateString(d)
  }

  return streak
}

export function computeConsistency(savings: Saving[]): number {
  const depositDates = new Set(savings.map((s) => s.date))
  let daysWithDeposit = 0
  for (let i = 0; i < 7; i++) {
    if (depositDates.has(daysAgo(i))) daysWithDeposit++
  }
  return Math.round((daysWithDeposit / 7) * 100)
}

export interface DepositCalendarCell {
  date: string
  dayOfWeek: number
  hasDeposit: boolean
  depositCount: number
  totalAmount: number
  label: string
}

export interface DepositCalendarSummary {
  cells: DepositCalendarCell[]
  activeDays: number
  totalSaved: number
  activePercent: number
  currentStreak: number
}

/**
 * Generates a 30-day chronological grid for deposit consistency heatmap.
 */
export function getDepositCalendarGrid(
  savings: Saving[],
  daysCount: number = 30,
): DepositCalendarSummary {
  const depositMap = new Map<string, { count: number; total: number }>()
  for (const s of savings) {
    const existing = depositMap.get(s.date) ?? { count: 0, total: 0 }
    depositMap.set(s.date, { count: existing.count + 1, total: existing.total + s.amount })
  }

  const cells: DepositCalendarCell[] = []
  let activeDays = 0
  let totalSaved = 0

  for (let i = daysCount - 1; i >= 0; i--) {
    const dateStr = daysAgo(i)
    const d = new Date(dateStr)
    const dayOfWeek = d.getDay()
    const entry = depositMap.get(dateStr)
    const hasDeposit = !!entry && entry.count > 0
    const count = entry?.count ?? 0
    const total = entry?.total ?? 0

    if (hasDeposit) {
      activeDays++
      totalSaved += total
    }

    cells.push({
      date: dateStr,
      dayOfWeek,
      hasDeposit,
      depositCount: count,
      totalAmount: total,
      label: `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`,
    })
  }

  return {
    cells,
    activeDays,
    totalSaved,
    activePercent: Math.round((activeDays / daysCount) * 100),
    currentStreak: computeSavingsStreak(savings),
  }
}
