import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Card } from '../components/Card'
import { generateAdvisorTips } from '../lib/advisor'
import type { TimeRange } from '../types'
import { useStore } from '../store/useStore'

export function AdvisorPage() {
  const [range, setRange] = useState<TimeRange>('month')
  const spends = useStore((s) => s.spends)
  const savings = useStore((s) => s.savings)

  const tips = useMemo(
    () => generateAdvisorTips(spends, savings, range),
    [spends, savings, range],
  )

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Advisor</h1>
          <p className="text-sm text-ink/70">Personalised tips from your data</p>
        </div>
        <div className="flex bg-vault-indigo-light p-0.5 shadow-[0_0_0_2px_#3a2410]">
          {(['week', 'month'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                range === r ? 'bg-coin-gold text-vault-indigo' : 'text-ink/60'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-3">
        {tips.map((tip, i) => (
          <motion.div
            key={tip.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card glow={i === 0 ? 'gold' : 'none'}>
              <div className="flex gap-3">
                <span className="text-2xl shrink-0">
                  {i === 0 ? '🎯' : i === 1 ? '💡' : '📌'}
                </span>
                <div>
                  {i === 0 && (
                    <p className="text-xs text-coin-gold-deep font-semibold mb-1">Highest Impact</p>
                  )}
                  <p className="text-sm text-ink/85 leading-relaxed">{tip.text}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
