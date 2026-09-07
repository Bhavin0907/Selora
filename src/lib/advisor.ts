import type { AdvisorTip, Saving, Spend, TimeRange } from '../types'
import {
  filterByRange,
  formatINR,
  getWeekdaySpending,
  groupByField,
  sumAmount,
} from './stats'

export function generateAdvisorTips(
  spends: Spend[],
  savings: Saving[],
  range: TimeRange = 'month',
): AdvisorTip[] {
  const tips: AdvisorTip[] = []
  const filteredSpends = filterByRange(spends, range)
  const filteredSavings = filterByRange(savings, range)
  const totalSpend = sumAmount(filteredSpends)

  if (totalSpend === 0 && filteredSavings.length === 0) {
    return [
      {
        id: 'welcome',
        text: 'Start logging your spends and savings — your Soul and city will come alive!',
        impact: 0,
      },
    ]
  }

  // Tip 1: Top location
  const byLocation = groupByField(filteredSpends, 'location')
  const topLocation = Object.entries(byLocation).sort((a, b) => b[1] - a[1])[0]
  if (topLocation) {
    const [loc, amount] = topLocation
    const pct = Math.round((amount / totalSpend) * 100)
    const cap = Math.round(amount * 0.8)
    tips.push({
      id: 'location',
      text: `You've spent ${formatINR(amount)} at ${loc} this ${range} — that's ${pct}% of your spending. Try capping it at ${formatINR(cap)} next ${range}.`,
      impact: amount,
    })
  }

  // Tip 2: Top reason
  const byReason = groupByField(filteredSpends, 'reason')
  const topReason = Object.entries(byReason).sort((a, b) => b[1] - a[1])[0]
  if (topReason) {
    const [reason, amount] = topReason
    const weeklyCut = Math.round((amount / (range === 'week' ? 1 : 4)) * 0.25)
    tips.push({
      id: 'reason',
      text: `${reason} is your #1 drain (${formatINR(amount)}). Cutting it twice a week could save ~${formatINR(weeklyCut * 2)}.`,
      impact: amount,
    })
  }

  // Tip 3: Weekday pattern
  const weekdaySpend = getWeekdaySpending(filteredSpends)
  const topDay = Object.entries(weekdaySpend).sort((a, b) => b[1] - a[1])[0]
  if (topDay && topDay[1] > 0) {
    tips.push({
      id: 'weekday',
      text: `You spend most on ${topDay[0]}s (${formatINR(topDay[1])}). Set a save-first reminder that morning.`,
      impact: topDay[1],
    })
  }

  // Tip 4: Savings encouragement
  const totalSaved = sumAmount(filteredSavings)
  if (totalSaved > 0 && filteredSavings.length > 0) {
    const avgDeposit = Math.round(totalSaved / filteredSavings.length)
    tips.push({
      id: 'savings',
      text: `You've saved ${formatINR(totalSaved)} this ${range} (avg ${formatINR(avgDeposit)}/deposit). Bump your next deposit by ₹${Math.round(avgDeposit * 0.1)}.`,
      impact: totalSaved,
    })
  }

  // Tip 5: Impulse warning
  const impulseSpend = sumAmount(filteredSpends.filter((s) => s.reason === 'Impulse'))
  if (impulseSpend > 0) {
    tips.push({
      id: 'impulse',
      text: `Impulse buys total ${formatINR(impulseSpend)}. Try a 24-hour rule before non-essential purchases.`,
      impact: impulseSpend,
    })
  }

  return tips.sort((a, b) => b.impact - a.impact).slice(0, 5)
}
