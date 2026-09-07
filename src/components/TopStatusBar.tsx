import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { useUiStore } from '../store/useUiStore'
import { computeSavingsStreak } from '../lib/streak'
import { getTotalSavings } from '../lib/stats'
import { computeLevel } from '../lib/level'
import { CoinIcon, FlameIcon } from './PixelIcon'
import { RollingNumber } from './RollingNumber'
import { sfx } from '../lib/sfx'

export function TopStatusBar() {
  const savings = useStore((s) => s.savings)

  const { streak, total, level } = useMemo(() => {
    const total = getTotalSavings(savings)
    return {
      streak: computeSavingsStreak(savings),
      total,
      level: computeLevel(total),
    }
  }, [savings])

  const crtEnabled = useUiStore((s) => s.crtEnabled)
  const muted = useUiStore((s) => s.muted)
  const toggleCrt = useUiStore((s) => s.toggleCrt)
  const toggleMute = useUiStore((s) => s.toggleMute)

  const handleMute = () => {
    const wasMuted = muted
    toggleMute()
    if (wasMuted) sfx.blip() // was muted → now on, give feedback
  }

  return (
    <div className="sticky top-0 z-40 bg-[#0a0a0f] shadow-[inset_0_-3px_0_#f5c518,inset_0_-5px_0_#000]">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-2 px-3 py-2">
        {/* Level */}
        <div className="flex items-center gap-1.5">
          <span className="font-pixel text-[0.5rem] text-soul-violet pixel-shadow-sm">LVL</span>
          <RollingNumber
            value={level}
            className="font-pixel text-[0.6rem] text-white pixel-shadow-sm"
          />
        </div>

        {/* Streak */}
        <div className="flex items-center gap-1">
          <FlameIcon size={15} />
          <RollingNumber
            value={streak}
            className="font-pixel text-[0.6rem] text-coin-gold pixel-shadow-sm"
          />
        </div>

        {/* Savings */}
        <div className="flex items-center gap-1">
          <CoinIcon size={14} />
          <RollingNumber
            value={total}
            prefix="₹"
            className="font-pixel text-[0.55rem] text-heal-green pixel-shadow-sm"
          />
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleMute}
            className="font-pixel text-[0.4rem] px-1.5 py-1 bg-[#1b1b2e] text-white shadow-[0_0_0_2px_#000] active:translate-y-[1px]"
            title="Toggle sound"
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button
            type="button"
            onClick={() => {
              toggleCrt()
              if (!muted) sfx.blip()
            }}
            className={`font-pixel text-[0.4rem] px-1.5 py-1 shadow-[0_0_0_2px_#000] active:translate-y-[1px] ${
              crtEnabled ? 'bg-soul-violet text-black' : 'bg-[#1b1b2e] text-white/60'
            }`}
            title="Toggle CRT overlay"
          >
            CRT
          </button>
        </div>
      </div>
    </div>
  )
}
