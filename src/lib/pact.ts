import type { Saving, WeeklyPact } from '../types'
import { getWeekEnd, getWeekStart, isInRange } from './dates'
import { sumAmount } from './stats'

export function createDefaultPact(): WeeklyPact {
  return {
    targetAmount: 2000,
    weekStart: getWeekStart(),
    completed: false,
    failed: false,
    badgeEarned: false,
  }
}

export function getPactProgress(
  pact: WeeklyPact,
  savings: Saving[],
): { saved: number; progress: number; remaining: number } {
  const weekEnd = getWeekEnd(pact.weekStart)
  const weekSavings = savings.filter((s) =>
    isInRange(s.date, pact.weekStart, weekEnd),
  )
  const saved = sumAmount(weekSavings)
  const progress = pact.targetAmount > 0 ? Math.min(saved / pact.targetAmount, 1) : 0
  const remaining = Math.max(pact.targetAmount - saved, 0)
  return { saved, progress, remaining }
}

export function evaluatePact(
  pact: WeeklyPact,
  savings: Saving[],
  today: string = new Date().toISOString().slice(0, 10),
): WeeklyPact {
  const weekEnd = getWeekEnd(pact.weekStart)
  const { progress } = getPactProgress(pact, savings)

  if (pact.completed || pact.failed) return pact

  if (progress >= 1) {
    return { ...pact, completed: true, badgeEarned: true }
  }

  if (today > weekEnd) {
    return { ...pact, failed: true }
  }

  return pact
}

export function resetPactForNewWeek(targetAmount?: number): WeeklyPact {
  return {
    targetAmount: targetAmount ?? 2000,
    weekStart: getWeekStart(),
    completed: false,
    failed: false,
    badgeEarned: false,
  }
}

export function getRedemptionQuest(pact: WeeklyPact): string {
  const halfTarget = Math.round(pact.targetAmount / 2)
  return `Redemption Quest: Save ${halfTarget.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).replace('INR', '₹')} in the next 3 days to heal your Soul. You've got this!`
}
