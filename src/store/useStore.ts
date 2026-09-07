import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AvatarConfig, Saving, Spend, WeeklyPact } from '../types'
import { createDefaultPact, evaluatePact, resetPactForNewWeek } from '../lib/pact'
import { DEFAULT_AVATAR, normalizeAvatar } from '../lib/avatar'
import {
  createSeedSavings,
  createSeedSpends,
  DEFAULT_LOCATIONS,
  DEFAULT_REASONS,
} from '../lib/seed'
import { toDateString } from '../lib/dates'

interface SeloraState {
  spends: Spend[]
  savings: Saving[]
  customLocations: string[]
  customReasons: string[]
  recentLocations: string[]
  recentReasons: string[]
  pact: WeeklyPact
  userName: string
  avatar: AvatarConfig
  seeded: boolean

  addSpend: (amount: number, location: string, reason: string) => void
  addSaving: (amount: number, note?: string) => void
  addLocation: (location: string) => void
  addReason: (reason: string) => void
  setPactTarget: (amount: number) => void
  resetPact: () => void
  setAvatar: (avatar: AvatarConfig) => void
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function bumpRecent(list: string[], item: string): string[] {
  return [item, ...list.filter((i) => i !== item)].slice(0, 5)
}

function mergeById<T extends { id: string; timestamp: number }>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of [...a, ...b]) map.set(item.id, item)
  return Array.from(map.values()).sort((x, y) => y.timestamp - x.timestamp)
}

export function getAllLocations(state: Pick<SeloraState, 'customLocations'>): string[] {
  return [...new Set([...DEFAULT_LOCATIONS, ...state.customLocations])]
}

export function getAllReasons(state: Pick<SeloraState, 'customReasons'>): string[] {
  return [...new Set([...DEFAULT_REASONS, ...state.customReasons])]
}

export function getSortedLocations(state: Pick<SeloraState, 'customLocations' | 'recentLocations'>): string[] {
  const all = getAllLocations(state)
  const recent = state.recentLocations
  const rest = all.filter((l) => !recent.includes(l))
  return [...recent, ...rest]
}

export function getSortedReasons(state: Pick<SeloraState, 'customReasons' | 'recentReasons'>): string[] {
  const all = getAllReasons(state)
  const recent = state.recentReasons
  const rest = all.filter((r) => !recent.includes(r))
  return [...recent, ...rest]
}

export const useStore = create<SeloraState>()(
  persist(
    (set) => ({
      spends: [],
      savings: [],
      customLocations: [],
      customReasons: [],
      recentLocations: [],
      recentReasons: [],
      pact: createDefaultPact(),
      userName: 'You',
      avatar: DEFAULT_AVATAR,
      seeded: false,

      addSpend: (amount, location, reason) => {
        const spend: Spend = {
          id: genId(),
          amount,
          location,
          reason,
          date: toDateString(),
          timestamp: Date.now(),
        }
        set((s) => ({
          spends: [spend, ...s.spends],
          recentLocations: bumpRecent(s.recentLocations, location),
          recentReasons: bumpRecent(s.recentReasons, reason),
          pact: evaluatePact(s.pact, s.savings),
        }))
      },

      addSaving: (amount, note) => {
        const saving: Saving = {
          id: genId(),
          amount,
          note,
          date: toDateString(),
          timestamp: Date.now(),
        }
        set((s) => {
          const newSavings = [saving, ...s.savings]
          return {
            savings: newSavings,
            pact: evaluatePact(s.pact, newSavings),
          }
        })
      },

      addLocation: (location) => {
        const trimmed = location.trim()
        if (!trimmed) return
        set((s) => ({
          customLocations: s.customLocations.includes(trimmed)
            ? s.customLocations
            : [...s.customLocations, trimmed],
        }))
      },

      addReason: (reason) => {
        const trimmed = reason.trim()
        if (!trimmed) return
        set((s) => ({
          customReasons: s.customReasons.includes(trimmed)
            ? s.customReasons
            : [...s.customReasons, trimmed],
        }))
      },

      setPactTarget: (amount) => {
        set((s) => ({
          pact: { ...s.pact, targetAmount: amount },
        }))
      },

      resetPact: () => {
        set((s) => ({
          pact: resetPactForNewWeek(s.pact.targetAmount),
        }))
      },

      setAvatar: (avatar) => {
        set({ avatar: normalizeAvatar(avatar) })
      },
    }),
    {
      name: 'selora-storage',
      partialize: (state) => ({
        spends: state.spends,
        savings: state.savings,
        customLocations: state.customLocations,
        customReasons: state.customReasons,
        recentLocations: state.recentLocations,
        recentReasons: state.recentReasons,
        pact: state.pact,
        userName: state.userName,
        avatar: state.avatar,
        seeded: state.seeded,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<SeloraState> | undefined
        if (!p) return current
        return {
          ...current,
          ...p,
          spends: mergeById(p.spends ?? [], current.spends),
          savings: mergeById(p.savings ?? [], current.savings),
          avatar: normalizeAvatar(p.avatar),
        }
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[Selora] Failed to rehydrate store:', error)
          return
        }
        if (!state) return
        try {
          // Mutate `state` directly — this callback runs synchronously during
          // create(), so the `useStore` binding is still in the TDZ here.
          if (!state.seeded && state.spends.length === 0 && state.savings.length === 0) {
            state.spends = createSeedSpends()
            state.savings = createSeedSavings()
            state.seeded = true
          }
          state.pact = evaluatePact(state.pact, state.savings)
        } catch (err) {
          console.error('[Selora] Error during store seed/evaluate:', err)
        }
      },
    },
  ),
)
