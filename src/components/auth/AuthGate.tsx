import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { EntryScreen } from './EntryScreen'

/**
 * Gates the game behind the entry/login screen. Runs auth init once on mount,
 * shows a brief boot splash while resolving the session, then either the
 * EntryScreen (no player) or the app (children).
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status)
  const player = useAuthStore((s) => s.player)
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    void init()
  }, [init])

  if (status === 'loading') return <BootSplash />
  if (!player) return <EntryScreen />
  return <>{children}</>
}

function BootSplash() {
  return (
    <div className="min-h-screen overworld-bg font-body flex items-center justify-center">
      <div className="text-center select-none">
        <h1 className="font-pixel text-2xl text-coin-gold pixel-shadow tracking-wider">SELORA</h1>
        <p className="font-pixel text-[0.5rem] text-ink/60 mt-4 animate-blink">LOADING…</p>
      </div>
    </div>
  )
}
