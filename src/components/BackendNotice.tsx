import { useState } from 'react'
import { isSupabaseConfigured } from '../lib/supabase'

/**
 * Tiny retro pill shown only when no Supabase backend is configured, so demos
 * know they're in offline/local-only mode. Dismissible; never blocks the app.
 */
export function BackendNotice() {
  const [dismissed, setDismissed] = useState(false)

  if (isSupabaseConfigured || dismissed) return null

  return (
    <div className="fixed bottom-[76px] left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
      <div className="flex items-center gap-2 bg-[#fffaf0] text-wood-dark shadow-[0_0_0_2px_#3a2410,0_3px_0_#3a2410] px-2.5 py-1.5">
        <span className="font-pixel text-[0.4rem] leading-none">LOCAL-ONLY MODE</span>
        <span className="font-body text-sm text-ink/70 hidden xs:inline">saved on this device</span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="font-pixel text-[0.5rem] text-wood-dark hover:text-ink leading-none"
          aria-label="Dismiss"
        >
          X
        </button>
      </div>
    </div>
  )
}
