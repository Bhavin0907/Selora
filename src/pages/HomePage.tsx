import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef } from 'react'
import { SoulAvatar } from '../components/SoulAvatar'
import { Card } from '../components/Card'
import { computeSoulState } from '../lib/soul'
import { useStore } from '../store/useStore'
import { formatINR } from '../lib/stats'
import { anchorOf, fx } from '../lib/fx'
import type { SoulMood } from '../types'

const MOOD_RANK: Record<SoulMood, number> = {
  distressed: 0,
  worried: 1,
  content: 2,
  thriving: 3,
}

export function HomePage() {
  const spends = useStore((s) => s.spends)
  const savings = useStore((s) => s.savings)

  const soul = useMemo(() => computeSoulState(spends, savings), [spends, savings])

  // A3: sparkle/coin burst around the soul when its mood improves.
  const soulRef = useRef<HTMLDivElement>(null)
  const prevMood = useRef<SoulMood | null>(null)
  useEffect(() => {
    const prev = prevMood.current
    if (prev && MOOD_RANK[soul.mood] > MOOD_RANK[prev]) {
      fx.emit('soulBurst', { anchor: anchorOf(soulRef.current) })
    }
    prevMood.current = soul.mood
  }, [soul.mood])

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-ink">Selora</h1>
        <p className="text-sm text-ink/70">Your savings soul</p>
      </header>

      <Card glow="green" className="flex flex-col items-center py-6">
        <div ref={soulRef}>
          <SoulAvatar mood={soul.mood} health={soul.health} auraColor={soul.auraColor} />
        </div>
      </Card>

      <Card glow="violet">
        <h2 className="text-sm font-semibold text-soul-violet mb-3">Why your Soul feels this way</h2>
        <ul className="space-y-2">
          {soul.factors.map((factor, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-sm text-ink/85 flex items-start gap-2"
            >
              <span className="text-coin-gold-deep mt-0.5">•</span>
              {factor}
            </motion.li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card glow="green" className="text-center">
          <p className="text-xs text-ink/60">Streak</p>
          <p className="text-xl font-bold text-heal-green">{soul.savingsStreak} days</p>
        </Card>
        <Card glow="green" className="text-center">
          <p className="text-xs text-ink/60">Net Flow (week)</p>
          <p className={`text-xl font-bold ${soul.netFlow >= 0 ? 'text-heal-green' : 'text-danger-red'}`}>
            {formatINR(soul.netFlow)}
          </p>
        </Card>
        <Card glow="violet" className="text-center">
          <p className="text-xs text-ink/60">Consistency</p>
          <p className="text-xl font-bold text-soul-violet">{soul.consistency}%</p>
        </Card>
        <Card glow="gold" className="text-center">
          <p className="text-xs text-ink/60">Impulse Ratio</p>
          <p className="text-xl font-bold text-coin-gold-deep">{Math.round(soul.impulseRatio * 100)}%</p>
        </Card>
      </div>
    </div>
  )
}
