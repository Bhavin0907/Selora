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
