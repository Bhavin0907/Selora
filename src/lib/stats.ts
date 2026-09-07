import type { Saving, Spend, TimeRange } from '../types'
import {
  getMonthEnd,
  getMonthStart,
  getWeekEnd,
  getWeekStart,
  isInRange,
  toDateString,
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

export interface NetFlowTrendPoint {
  label: string
  date: string
  savings: number
  spends: number
  netFlow: number
}

/**
 * Computes cumulative savings, spends, and net flow series for the selected range.
 * In 'week': 7 daily buckets (Mon-Sun).
 * In 'month': weekly milestone buckets (W1-W5).
 */
export function getNetFlowTrendSeries(
  spends: Spend[],
  savings: Saving[],
  range: TimeRange,
  refDate: Date = new Date(),
): NetFlowTrendPoint[] {
  const points: NetFlowTrendPoint[] = []

  if (range === 'week') {
    const startStr = getWeekStart(refDate)
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    for (let i = 0; i < 7; i++) {
      const d = new Date(startStr)
      d.setDate(d.getDate() + i)
      const currentDayStr = toDateString(d)

      // Cumulative within the week up to this day
      const cumSpends = sumAmount(
        spends.filter((s) => s.date >= startStr && s.date <= currentDayStr),
      )
      const cumSavings = sumAmount(
        savings.filter((s) => s.date >= startStr && s.date <= currentDayStr),
      )

      points.push({
        label: dayLabels[i],
        date: currentDayStr,
        savings: cumSavings,
        spends: cumSpends,
        netFlow: cumSavings - cumSpends,
      })
    }
  } else {
    const monthStart = getMonthStart(refDate)
    const monthEnd = getMonthEnd(refDate)
    const totalDays = new Date(monthEnd).getDate()

    // 4 to 5 week buckets: 1-7 (W1), 8-14 (W2), 15-21 (W3), 22-28 (W4), 29-end (W5)
    const bucketDefs = [
      { label: 'W1', endDay: 7 },
      { label: 'W2', endDay: 14 },
      { label: 'W3', endDay: 21 },
      { label: 'W4', endDay: 28 },
    ]
    if (totalDays > 28) {
      bucketDefs.push({ label: 'W5', endDay: totalDays })
    }

    const yearMonth = monthStart.slice(0, 7)

    for (const b of bucketDefs) {
      const dayPad = String(b.endDay).padStart(2, '0')
      const bucketEndStr = `${yearMonth}-${dayPad}`

      const cumSpends = sumAmount(
        spends.filter((s) => s.date >= monthStart && s.date <= bucketEndStr),
      )
      const cumSavings = sumAmount(
        savings.filter((s) => s.date >= monthStart && s.date <= bucketEndStr),
      )

      points.push({
        label: b.label,
        date: bucketEndStr,
        savings: cumSavings,
        spends: cumSpends,
        netFlow: cumSavings - cumSpends,
      })
    }
  }

  return points
}

export interface SpendCategoryShare {
  name: string
  amount: number
  percent: number
}

/**
 * Computes location spend distribution and percentage share for donut charts.
 */
export function getSpendCategoryShare(
  spends: Spend[],
  range: TimeRange,
  refDate: Date = new Date(),
): SpendCategoryShare[] {
  const filtered = filterByRange(spends, range, refDate)
  const total = sumAmount(filtered)
  if (total === 0) return []

  const groups = groupByField(filtered, 'location')
  return Object.entries(groups)
    .map(([name, amount]) => ({
      name,
      amount,
      percent: Math.round((amount / total) * 100),
    }))
    .sort((a, b) => b.amount - a.amount)
}

export interface ImpulseTrendPoint {
  label: string
  date: string
  impulseAmount: number
  totalAmount: number
  ratio: number
  percentage: number
}

/**
 * Calculates impulse spending ratio per time bucket (daily in week, weekly in month).
 */
export function getImpulseRatioTrendSeries(
  spends: Spend[],
  range: TimeRange,
  refDate: Date = new Date(),
): ImpulseTrendPoint[] {
  const points: ImpulseTrendPoint[] = []

  if (range === 'week') {
    const startStr = getWeekStart(refDate)
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    for (let i = 0; i < 7; i++) {
      const d = new Date(startStr)
      d.setDate(d.getDate() + i)
      const dateStr = toDateString(d)

      const daySpends = spends.filter((s) => s.date === dateStr)
      const total = sumAmount(daySpends)
      const impulse = sumAmount(daySpends.filter((s) => s.reason === 'Impulse'))
      const ratio = total > 0 ? impulse / total : 0

      points.push({
        label: dayLabels[i],
        date: dateStr,
        impulseAmount: impulse,
        totalAmount: total,
        ratio,
        percentage: Math.round(ratio * 100),
      })
    }
  } else {
    const monthStart = getMonthStart(refDate)
    const monthEnd = getMonthEnd(refDate)
    const totalDays = new Date(monthEnd).getDate()
    const yearMonth = monthStart.slice(0, 7)

    const buckets = [
      { label: 'W1', start: 1, end: 7 },
      { label: 'W2', start: 8, end: 14 },
      { label: 'W3', start: 15, end: 21 },
      { label: 'W4', start: 22, end: 28 },
    ]
    if (totalDays > 28) {
      buckets.push({ label: 'W5', start: 29, end: totalDays })
    }

    for (const b of buckets) {
      const startStr = `${yearMonth}-${String(b.start).padStart(2, '0')}`
      const endStr = `${yearMonth}-${String(b.end).padStart(2, '0')}`

      const bucketSpends = spends.filter(
        (s) => s.date >= startStr && s.date <= endStr,
      )
      const total = sumAmount(bucketSpends)
      const impulse = sumAmount(bucketSpends.filter((s) => s.reason === 'Impulse'))
      const ratio = total > 0 ? impulse / total : 0

      points.push({
        label: b.label,
        date: endStr,
        impulseAmount: impulse,
        totalAmount: total,
        ratio,
        percentage: Math.round(ratio * 100),
      })
    }
  }

  return points
}

export interface WeekdaySpendingItem {
  day: string
  shortDay: string
  amount: number
}

const ORDERED_DAYS = [
  { day: 'Monday', shortDay: 'Mon' },
  { day: 'Tuesday', shortDay: 'Tue' },
  { day: 'Wednesday', shortDay: 'Wed' },
  { day: 'Thursday', shortDay: 'Thu' },
  { day: 'Friday', shortDay: 'Fri' },
  { day: 'Saturday', shortDay: 'Sat' },
  { day: 'Sunday', shortDay: 'Sun' },
]

/**
 * Aggregates total spend by day-of-week (Mon-Sun) across all historical data.
 * All-time is used here because weekday patterns require multi-week transaction volume
 * to avoid sparse 0-spend days common in single-week views.
 */
export function getOrderedWeekdaySpending(spends: Spend[]): WeekdaySpendingItem[] {
  const spendingByDay = getWeekdaySpending(spends)
  return ORDERED_DAYS.map((d) => ({
    day: d.day,
    shortDay: d.shortDay,
    amount: spendingByDay[d.day] ?? 0,
  }))
}
