export interface Spend {
  id: string
  amount: number
  location: string
  reason: string
  date: string // ISO date YYYY-MM-DD
  timestamp: number
}

export interface Saving {
  id: string
  amount: number
  note?: string
  date: string
  timestamp: number
}

export interface WeeklyPact {
  targetAmount: number
  weekStart: string // ISO date of Monday
  completed: boolean
  failed: boolean
  badgeEarned: boolean
}

export type SoulMood = 'thriving' | 'content' | 'worried' | 'distressed'

export interface SoulState {
  health: number
  mood: SoulMood
  auraColor: string
  factors: string[]
  savingsStreak: number
  impulseRatio: number
  consistency: number
  netFlow: number
}

export interface BuildingState {
  location: string
  totalSpend: number
  height: number
  mood: 'tidy' | 'moderate' | 'ominous'
  color: string
  tip: string
}

export interface AdvisorTip {
  id: string
  text: string
  impact: number
}

export type TimeRange = 'week' | 'month'

export type { AvatarConfig } from '../lib/avatar'
