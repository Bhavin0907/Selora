import { useNavigate } from 'react-router-dom'
import type { SoulMood } from '../types'
import { getMoodLabel } from '../lib/soul'
import { useStore } from '../store/useStore'
import { Avatar } from './Avatar'
import { sfx } from '../lib/sfx'

interface SoulAvatarProps {
  mood: SoulMood
  health: number
  auraColor: string
}

const SEGMENTS = 10

export function SoulAvatar({ mood, health, auraColor }: SoulAvatarProps) {
  const filled = Math.round((health / 100) * SEGMENTS)
  const avatar = useStore((s) => s.avatar)
  const navigate = useNavigate()

  const goEdit = () => {
    sfx.blip()
    navigate('/create')
  }

  return (
    <div className="relative flex flex-col items-center">
      {/* User-chosen avatar. Mood only tints the aura/effects, never the parts. */}
      <button
        type="button"
        onClick={goEdit}
        title="Edit avatar"
        className="relative bg-transparent"
      >
        <Avatar config={avatar} size={150} auraColor={auraColor} bob />
      </button>

      <div className="mt-4 text-center">
        <p
          className="font-pixel text-xs pixel-shadow-sm"
          style={{ color: auraColor }}
        >
          {getMoodLabel(mood).toUpperCase()}
        </p>

        {/* Segmented retro health bar */}
        <div className="mt-3 flex items-center gap-2">
          <span className="font-pixel text-[0.45rem] text-ink/70">HP</span>
          <div className="flex gap-[2px] p-[3px] bg-[#5e3c1a] shadow-[0_0_0_2px_#3a2410,inset_0_0_0_2px_#8a5a2b]">
            {Array.from({ length: SEGMENTS }).map((_, i) => (
              <div
                key={i}
                className="w-[10px] h-[14px]"
                style={{
                  background: i < filled ? auraColor : '#3a2a18',
                  boxShadow: i < filled ? 'inset 0 2px 0 rgba(255,255,255,0.35)' : 'none',
                }}
              />
            ))}
          </div>
        </div>
        <p className="font-pixel text-[0.45rem] text-ink/60 mt-2">
          {Math.round(health)}%
        </p>

        <button
          type="button"
          onClick={goEdit}
          className="mt-3 font-pixel text-[0.45rem] px-2 py-1.5 bg-soul-violet text-[#fff7e0] shadow-[0_0_0_2px_#3a2410] active:translate-y-[1px]"
        >
          ✎ EDIT AVATAR
        </button>
      </div>
    </div>
  )
}
