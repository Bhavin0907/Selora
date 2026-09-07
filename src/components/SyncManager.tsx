import { useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { startCloudSync, stopCloudSync } from '../lib/cloudSync'

/**
 * Headless controller: starts background cloud sync when a cloud player is
 * active, stops it on sign-out / switch. No-op in local-only mode.
 */
export function SyncManager() {
  const playerId = useAuthStore((s) => s.player?.id)
  const player = useAuthStore((s) => s.player)
  const mode = useAuthStore((s) => s.mode)

  useEffect(() => {
    if (player && mode === 'cloud') {
      void startCloudSync(player, mode)
      return () => stopCloudSync()
    }
    return undefined
    // Re-run when the player identity or mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, mode])

  return null
}
