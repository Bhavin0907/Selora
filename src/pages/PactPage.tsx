import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Card, formatINR } from '../components/Card'
import { buildLeaderboard } from '../lib/leaderboard'
import { getPactProgress, getRedemptionQuest } from '../lib/pact'
import { getTotalSavings } from '../lib/stats'
import { useStore } from '../store/useStore'

export function PactPage() {
  const pact = useStore((s) => s.pact)
  const savings = useStore((s) => s.savings)
  const userName = useStore((s) => s.userName)
  const setPactTarget = useStore((s) => s.setPactTarget)
  const resetPact = useStore((s) => s.resetPact)
  const [editingTarget, setEditingTarget] = useState(false)
  const [newTarget, setNewTarget] = useState(String(pact.targetAmount))

  const progress = useMemo(() => getPactProgress(pact, savings), [pact, savings])
  const leaderboard = useMemo(
    () => buildLeaderboard(getTotalSavings(savings), userName),
    [savings, userName],
  )

  const handleSaveTarget = () => {
    const num = parseInt(newTarget, 10)
    if (num > 0) setPactTarget(num)
    setEditingTarget(false)
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-white">Pact & Leaderboard</h1>
        <p className="text-sm text-white/50">Commit, compete, grow</p>
      </header>

      {/* Weekly Pact */}
      <Card glow={pact.completed ? 'green' : 'gold'}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-coin-gold">Weekly Savings Pact</h2>
          {pact.completed && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-xs bg-heal-green/20 text-heal-green px-2 py-0.5 rounded-full"
            >
              🏅 Badge Earned!
            </motion.span>
          )}
        </div>

        {editingTarget ? (
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              className="flex-1 bg-vault-indigo border border-white/10 rounded-lg px-3 py-2 text-white"
            />
            <button onClick={handleSaveTarget} className="px-3 py-2 bg-coin-gold text-vault-indigo rounded-lg font-semibold text-sm">Save</button>
          </div>
        ) : (
          <p className="text-white/60 text-sm mb-1">
            Target: <button onClick={() => setEditingTarget(true)} className="text-coin-gold font-bold hover:underline">{formatINR(pact.targetAmount)}</button>
          </p>
        )}

        <div className="mt-3">
          <div className="flex justify-between text-xs text-white/50 mb-1">
            <span>{formatINR(progress.saved)} saved</span>
            <span>{Math.round(progress.progress * 100)}%</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-soul-violet to-heal-green"
              initial={{ width: 0 }}
              animate={{ width: `${progress.progress * 100}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          {!pact.completed && progress.remaining > 0 && (
            <p className="text-xs text-white/40 mt-2">{formatINR(progress.remaining)} to go</p>
          )}
        </div>

        {pact.completed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-sm text-heal-green"
          >
            ✨ Pact fulfilled! Your Soul heals with pride.
          </motion.p>
        )}

        {pact.failed && !pact.completed && (
          <div className="mt-3 p-3 rounded-xl bg-soul-violet/10 border border-soul-violet/30">
            <p className="text-sm text-soul-violet font-medium">Gentle Redemption Quest</p>
            <p className="text-xs text-white/60 mt-1">{getRedemptionQuest(pact)}</p>
            <button
              onClick={resetPact}
              className="mt-2 text-xs text-coin-gold hover:underline"
            >
              Start fresh this week →
            </button>
          </div>
        )}
      </Card>

      {/* Leaderboard */}
      <Card>
        <h2 className="text-sm font-semibold text-soul-violet mb-1">Leaderboard</h2>
        <p className="text-xs text-white/40 mb-4">
          Ranked on verified savings only — spending never affects your rank
        </p>

        <div className="space-y-2">
          {leaderboard.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-2.5 rounded-xl ${
                entry.isUser
                  ? 'bg-coin-gold/10 border border-coin-gold/30'
                  : 'bg-white/5'
              }`}
            >
              <span className="text-sm font-bold text-white/40 w-6 text-center">
                {i + 1}
              </span>
              <span className="text-xl">{entry.avatar}</span>
              <span className={`flex-1 text-sm font-medium ${entry.isUser ? 'text-coin-gold' : 'text-white/80'}`}>
                {entry.name}
              </span>
              <span className="text-sm font-semibold text-heal-green">
                {formatINR(entry.verifiedSavings)}
              </span>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  )
}
