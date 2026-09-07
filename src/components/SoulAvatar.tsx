import type { SoulMood } from '../types'
import { getMoodLabel } from '../lib/soul'
import { SoulSprite } from './SoulSprite'

interface SoulAvatarProps {
  mood: SoulMood
  health: number
  auraColor: string
}

const SEGMENTS = 10

export function SoulAvatar({ mood, health, auraColor }: SoulAvatarProps) {
  const filled = Math.round((health / 100) * SEGMENTS)

  return (
    <div className="relative flex flex-col items-center">
      <SoulSprite mood={mood} size={150} />

      <div className="mt-4 text-center">
        <p
          className="font-pixel text-xs pixel-shadow-sm"
          style={{ color: auraColor }}
        >
          {getMoodLabel(mood).toUpperCase()}
        </p>

        {/* Segmented retro health bar */}
        <div className="mt-3 flex items-center gap-2">
          <span className="font-pixel text-[0.45rem] text-white/60">HP</span>
          <div className="flex gap-[2px] p-[3px] bg-black shadow-[0_0_0_2px_#000,inset_0_0_0_2px_#2a2a3e]">
            {Array.from({ length: SEGMENTS }).map((_, i) => (
              <div
                key={i}
                className="w-[10px] h-[14px]"
                style={{
                  background: i < filled ? auraColor : '#1a1a2e',
                  boxShadow: i < filled ? 'inset 0 2px 0 rgba(255,255,255,0.35)' : 'none',
                }}
              />
            ))}
          </div>
        </div>
        <p className="font-pixel text-[0.45rem] text-white/50 mt-2">
          {Math.round(health)}%
        </p>
      </div>
    </div>
  )
}
