import type { Saving, Spend } from '../types'
import { daysAgo } from './dates'

export const DEFAULT_LOCATIONS = [
  'Home',
  'College',
  'Mall',
  'Café',
  'Metro',
  'Online',
  'Restaurant',
]

export const DEFAULT_REASONS = [
  'Food',
  'Transport',
  'Shopping',
  'Impulse',
  'Subscriptions',
  'Bills',
  'Delivery',
]

let idCounter = 0
function genId(): string {
  return `seed-${++idCounter}-${Date.now()}`
}

export function createSeedSpends(): Spend[] {
  return [
    { id: genId(), amount: 120, location: 'Café', reason: 'Food', date: daysAgo(0), timestamp: Date.now() - 3600000 },
    { id: genId(), amount: 45, location: 'Metro', reason: 'Transport', date: daysAgo(0), timestamp: Date.now() - 7200000 },
    { id: genId(), amount: 899, location: 'Online', reason: 'Shopping', date: daysAgo(1), timestamp: Date.now() - 86400000 },
    { id: genId(), amount: 350, location: 'Mall', reason: 'Impulse', date: daysAgo(1), timestamp: Date.now() - 90000000 },
    { id: genId(), amount: 180, location: 'Restaurant', reason: 'Food', date: daysAgo(2), timestamp: Date.now() - 172800000 },
    { id: genId(), amount: 299, location: 'Online', reason: 'Subscriptions', date: daysAgo(3), timestamp: Date.now() - 259200000 },
    { id: genId(), amount: 75, location: 'College', reason: 'Food', date: daysAgo(3), timestamp: Date.now() - 262800000 },
    { id: genId(), amount: 550, location: 'Mall', reason: 'Shopping', date: daysAgo(4), timestamp: Date.now() - 345600000 },
    { id: genId(), amount: 220, location: 'Home', reason: 'Bills', date: daysAgo(5), timestamp: Date.now() - 432000000 },
    { id: genId(), amount: 150, location: 'Online', reason: 'Delivery', date: daysAgo(6), timestamp: Date.now() - 518400000 },
  ]
}

export function createSeedSavings(): Saving[] {
  return [
    { id: genId(), amount: 1000, note: 'Monthly SIP', date: daysAgo(0), timestamp: Date.now() - 1800000 },
    { id: genId(), amount: 500, note: 'Side hustle', date: daysAgo(2), timestamp: Date.now() - 172800000 },
    { id: genId(), amount: 750, note: 'Birthday gift saved', date: daysAgo(4), timestamp: Date.now() - 345600000 },
  ]
}
