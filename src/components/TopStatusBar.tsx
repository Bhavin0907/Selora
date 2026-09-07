import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useUiStore } from '../store/useUiStore'
import { Avatar } from './Avatar'
import { computeSavingsStreak } from '../lib/streak'
import { getTotalSavings } from '../lib/stats'
import { computeLevel } from '../lib/level'
import { CoinIcon, FlameIcon } from './PixelIcon'
import { RollingNumber } from './RollingNumber'
import { sfx } from '../lib/sfx'

export function TopStatusBar() {
  const savings = useStore((s) => s.savings)
  const avatar = useStore((s) => s.avatar)
  const navigate = useNavigate()

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
    <div className="sticky top-0 z-40 bg-[#e8cf8f] shadow-[inset_0_-3px_0_#8a5a2b,inset_0_-6px_0_#3a2410]">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-2 px-3 py-2">
        {/* Avatar portrait — tap to edit */}
        <button
          type="button"
          onClick={() => {
            sfx.blip()
            navigate('/create')
          }}
          title="Edit avatar"
          className="shrink-0 bg-[#d8f0ff] p-[2px] shadow-[0_0_0_2px_#3a2410,inset_0_0_0_2px_#8a5a2b] active:translate-y-[1px] overflow-hidden"
        >
          <Avatar config={avatar} size={26} />
        </button>

        {/* Level */}
        <div className="flex items-center gap-1.5">
          <span className="font-pixel text-[0.5rem] text-soul-violet pixel-shadow-sm">LVL</span>
          <RollingNumber
            value={level}
            className="font-pixel text-[0.6rem] text-ink pixel-shadow-sm"
          />
        </div>

        {/* Streak */}
        <div className="flex items-center gap-1">
          <FlameIcon size={15} />
          <RollingNumber
            value={streak}
            className="font-pixel text-[0.6rem] text-coin-gold-deep pixel-shadow-sm"
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
            className="font-pixel text-[0.4rem] px-1.5 py-1 bg-[#8a5a2b] text-[#fff7e0] shadow-[0_0_0_2px_#3a2410] active:translate-y-[1px]"
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
            className={`font-pixel text-[0.4rem] px-1.5 py-1 shadow-[0_0_0_2px_#3a2410] active:translate-y-[1px] ${
              crtEnabled ? 'bg-coin-gold text-[#4a3319]' : 'bg-[#8a5a2b] text-[#fff7e0]/70'
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
