import type { Saving, SoulMood, SoulState, Spend } from '../types'
import { getNetFlow, getImpulseRatio } from './stats'
import { computeConsistency, computeSavingsStreak } from './streak'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

const MOOD_COLORS: Record<SoulMood, string> = {
  thriving: '#3ddc97',
  content: '#9b5de5',
  worried: '#f5c518',
  distressed: '#ff6b6b',
}

export function computeSoulState(spends: Spend[], savings: Saving[]): SoulState {
  const savingsStreak = computeSavingsStreak(savings)
  const impulseRatio = getImpulseRatio(spends)
  const consistency = computeConsistency(savings)
  const netFlow = getNetFlow(spends, savings, 'week')

  const netFlowScaled = netFlow / 100
  const health = clamp(
    50 + netFlowScaled + savingsStreak * 3 - impulseRatio * 40,
    0,
    100,
  )

  const mood: SoulMood =
    health > 75 ? 'thriving' : health > 50 ? 'content' : health > 25 ? 'worried' : 'distressed'

  const auraColor = MOOD_COLORS[mood]
  const factors = buildFactors(savingsStreak, impulseRatio, consistency, netFlow)

  return {
    health,
    mood,
    auraColor,
    factors,
    savingsStreak,
    impulseRatio,
    consistency,
    netFlow,
  }
}

function buildFactors(
  streak: number,
  impulseRatio: number,
  consistency: number,
  netFlow: number,
): string[] {
  const factors: { text: string; weight: number }[] = []

  if (streak >= 3) {
    factors.push({ text: `${streak}-day savings streak — keep it going!`, weight: streak })
  } else if (streak === 0) {
    factors.push({ text: 'No savings streak yet — log a deposit today', weight: 10 })
  } else {
    factors.push({ text: `${streak}-day streak — building momentum`, weight: streak })
  }

  if (impulseRatio > 0.3) {
    factors.push({
      text: `Impulse spending is ${Math.round(impulseRatio * 100)}% of total — try pausing before buys`,
      weight: impulseRatio * 100,
    })
  } else if (impulseRatio > 0) {
    factors.push({
      text: `Impulse ratio is low at ${Math.round(impulseRatio * 100)}% — nice control`,
      weight: 5,
    })
  }

  if (consistency >= 70) {
    factors.push({ text: `${consistency}% deposit consistency this week`, weight: consistency })
  } else if (consistency < 30) {
    factors.push({ text: `Only ${consistency}% of days had deposits — consistency helps`, weight: 100 - consistency })
  }

  if (netFlow > 0) {
    factors.push({ text: `Positive net flow of ₹${netFlow.toLocaleString('en-IN')} this week`, weight: netFlow / 100 })
  } else if (netFlow < 0) {
    factors.push({
      text: `Spending exceeded savings by ₹${Math.abs(netFlow).toLocaleString('en-IN')} this week`,
      weight: Math.abs(netFlow) / 100,
    })
  }

  return factors
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((f) => f.text)
}

export function getMoodLabel(mood: SoulMood): string {
  const labels: Record<SoulMood, string> = {
    thriving: 'Thriving',
    content: 'Content',
    worried: 'Worried',
    distressed: 'Distressed',
  }
  return labels[mood]
}

export function getMoodEmoji(mood: SoulMood): string {
  const emojis: Record<SoulMood, string> = {
    thriving: '✨',
    content: '😊',
    worried: '😟',
    distressed: '😰',
  }
  return emojis[mood]
}
