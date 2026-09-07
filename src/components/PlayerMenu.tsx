import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { sfx } from '../lib/sfx'

/**
 * Compact HUD player menu: shows current player + mode, and lets them sign out
 * / switch player. Returns to the entry screen after sign-out.
 */
export function PlayerMenu() {
  const player = useAuthStore((s) => s.player)
  const mode = useAuthStore((s) => s.mode)
  const busy = useAuthStore((s) => s.busy)
  const signOut = useAuthStore((s) => s.signOut)

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  if (!player) return null

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          sfx.blip()
          setOpen((o) => !o)
        }}
        className="font-pixel text-[0.4rem] px-1.5 py-1 bg-[#8a5a2b] text-[#fff7e0] shadow-[0_0_0_2px_#3a2410] active:translate-y-[1px]"
        title="Player menu"
      >
        ⚙
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-44 retro-panel retro-panel--blue !p-3">
          <p className="font-pixel text-[0.5rem] text-ink truncate">{player.displayName}</p>
          <p className="font-body text-sm text-ink/60 truncate">{player.playerId}</p>
          <p className="font-body text-xs text-ink/50 mt-1">
            {mode === 'cloud' ? '☁ Cloud save' : '💾 Local save'}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              sfx.blip()
              setOpen(false)
              void signOut()
            }}
            className="retro-btn retro-btn--danger w-full mt-3 !py-2 !text-[0.5rem] disabled:opacity-60"
          >
            {busy ? '…' : 'SIGN OUT'}
          </button>
        </div>
      )}
    </div>
  )
}
