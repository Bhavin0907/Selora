import { create } from 'zustand'

export type CloudHealth = 'idle' | 'syncing' | 'ok' | 'error' | 'local'

interface CloudHealthState {
  health: CloudHealth
  message: string | null
  lastOkAt: number | null
  setHealth: (health: CloudHealth, message?: string | null) => void
}

/** Live cloud-sync status for HUD / notices. Not persisted. */
export const useCloudHealth = create<CloudHealthState>((set) => ({
  health: 'idle',
  message: null,
  lastOkAt: null,
  setHealth: (health, message = null) =>
    set((s) => ({
      health,
      message,
      lastOkAt: health === 'ok' ? Date.now() : s.lastOkAt,
    })),
}))
