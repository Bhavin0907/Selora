import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { hasWebGL } from '../lib/webgl'

/**
 * UI-only preferences. Completely separate from the game store —
 * this never touches spends/savings/soul/advisor data or logic.
 */
export type MapMode = 'gps' | '2d' | '3d'

interface UiState {
  crtEnabled: boolean
  muted: boolean
  mapMode: MapMode
  toggleCrt: () => void
  toggleMute: () => void
  setMuted: (muted: boolean) => void
  setMapMode: (mode: MapMode) => void
}

function migrateMapMode(raw: unknown): MapMode {
  if (raw === 'gps' || raw === '2d' || raw === '3d') return raw
  // Migrate removed modes (overworld, 16bit, etc.) to a safe default.
  return hasWebGL() ? '3d' : '2d'
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      crtEnabled: true,
      muted: true,
      mapMode: hasWebGL() ? '3d' : '2d',
      toggleCrt: () => set((s) => ({ crtEnabled: !s.crtEnabled })),
      toggleMute: () => set((s) => ({ muted: !s.muted })),
      setMuted: (muted) => set({ muted }),
      setMapMode: (mapMode) => set({ mapMode }),
    }),
    {
      name: 'selora-ui',
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<UiState>
        return { ...current, ...p, mapMode: migrateMapMode(p.mapMode) }
      },
    },
  ),
)

/** Effective mode accounting for WebGL availability. */
export function effectiveMapMode(stored: MapMode): MapMode {
  if (stored === '3d' && !hasWebGL()) return '2d'
  return stored
}
