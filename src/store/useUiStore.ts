import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * UI-only preferences. Completely separate from the game store —
 * this never touches spends/savings/soul/advisor data or logic.
 */
interface UiState {
  crtEnabled: boolean
  muted: boolean
  toggleCrt: () => void
  toggleMute: () => void
  setMuted: (muted: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      crtEnabled: true,
      muted: true, // audio muted by default per spec
      toggleCrt: () => set((s) => ({ crtEnabled: !s.crtEnabled })),
      toggleMute: () => set((s) => ({ muted: !s.muted })),
      setMuted: (muted) => set({ muted }),
    }),
    { name: 'selora-ui' },
  ),
)
