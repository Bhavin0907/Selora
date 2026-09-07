import type { Saving, Spend, TimeRange } from '../types'
import {
  getMonthEnd,
  getMonthStart,
  getWeekEnd,
  getWeekStart,
  isInRange,
} from './dates'

export function filterByRange<T extends { date: string }>(
  items: T[],
  range: TimeRange,
  refDate: Date = new Date(),
): T[] {
  if (range === 'week') {
    const start = getWeekStart(refDate)
    const end = getWeekEnd(start)
    return items.filter((i) => isInRange(i.date, start, end))
  }
  const start = getMonthStart(refDate)
  const end = getMonthEnd(refDate)
  return items.filter((i) => isInRange(i.date, start, end))
}

export function sumAmount(items: { amount: number }[]): number {
  return items.reduce((s, i) => s + i.amount, 0)
}

export function groupByField(
  spends: Spend[],
  field: 'location' | 'reason',
): Record<string, number> {
  const groups: Record<string, number> = {}
  for (const s of spends) {
    groups[s[field]] = (groups[s[field]] ?? 0) + s.amount
  }
  return groups
}

export function getImpulseRatio(spends: Spend[]): number {
  const total = sumAmount(spends)
  if (total === 0) return 0
  const impulse = sumAmount(spends.filter((s) => s.reason === 'Impulse'))
  return impulse / total
}

export function getNetFlow(
  spends: Spend[],
  savings: Saving[],
  range: TimeRange = 'week',
): number {
  const filteredSpends = filterByRange(spends, range)
  const filteredSavings = filterByRange(savings, range)
  return sumAmount(filteredSavings) - sumAmount(filteredSpends)
}

export function getTotalSavings(savings: Saving[]): number {
  return sumAmount(savings)
}

export function getWeekdaySpending(spends: Spend[]): Record<string, number> {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const result: Record<string, number> = {}
  for (const d of days) result[d] = 0
  for (const s of spends) {
    const day = days[new Date(s.date).getDay()]
    result[day] += s.amount
  }
  return result
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}
