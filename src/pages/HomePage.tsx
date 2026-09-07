import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { SoulAvatar } from '../components/SoulAvatar'
import { Card } from '../components/Card'
import { computeSoulState } from '../lib/soul'
import { useStore } from '../store/useStore'
import { formatINR } from '../lib/stats'

export function HomePage() {
  const spends = useStore((s) => s.spends)
  const savings = useStore((s) => s.savings)

  const soul = useMemo(() => computeSoulState(spends, savings), [spends, savings])

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-white">Selora</h1>
        <p className="text-sm text-white/50">Your savings Soul</p>
      </header>

      <Card glow="violet" className="flex flex-col items-center py-6">
        <SoulAvatar mood={soul.mood} health={soul.health} auraColor={soul.auraColor} />
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-soul-violet mb-3">Why your Soul feels this way</h2>
        <ul className="space-y-2">
          {soul.factors.map((factor, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-sm text-white/80 flex items-start gap-2"
            >
              <span className="text-coin-gold mt-0.5">•</span>
              {factor}
            </motion.li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <p className="text-xs text-white/50">Streak</p>
          <p className="text-xl font-bold text-heal-green">{soul.savingsStreak} days</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-white/50">Net Flow (week)</p>
          <p className={`text-xl font-bold ${soul.netFlow >= 0 ? 'text-heal-green' : 'text-danger-red'}`}>
            {formatINR(soul.netFlow)}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-white/50">Consistency</p>
          <p className="text-xl font-bold text-soul-violet">{soul.consistency}%</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-white/50">Impulse Ratio</p>
          <p className="text-xl font-bold text-coin-gold">{Math.round(soul.impulseRatio * 100)}%</p>
        </Card>
      </div>
    </div>
  )
}
