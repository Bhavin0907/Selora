import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Card, formatINR } from '../components/Card'
import { Avatar } from '../components/Avatar'
import { buildLeaderboard } from '../lib/leaderboard'
import { getPactProgress, getRedemptionQuest } from '../lib/pact'
import { getTotalSavings } from '../lib/stats'
import { useStore } from '../store/useStore'

export function PactPage() {
  const pact = useStore((s) => s.pact)
  const savings = useStore((s) => s.savings)
  const userName = useStore((s) => s.userName)
  const avatar = useStore((s) => s.avatar)
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
        <h1 className="text-2xl font-bold text-ink">Pact & Leaderboard</h1>
        <p className="text-sm text-ink/70">Commit, compete, grow</p>
      </header>

      {/* Weekly Pact */}
      <Card glow={pact.completed ? 'green' : 'gold'}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-coin-gold-deep">Weekly Savings Pact</h2>
          {pact.completed && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-xs bg-heal-green/20 text-heal-green px-2 py-0.5 shadow-[inset_0_0_0_2px_#2e9e4f55]"
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
              className="flex-1 px-3 py-2"
            />
            <button onClick={handleSaveTarget} className="px-3 py-2 bg-coin-gold text-vault-indigo font-semibold text-sm shadow-[0_0_0_2px_#3a2410]">Save</button>
          </div>
        ) : (
          <p className="text-ink/70 text-sm mb-1">
            Target: <button onClick={() => setEditingTarget(true)} className="text-coin-gold-deep font-bold hover:underline">{formatINR(pact.targetAmount)}</button>
          </p>
        )}

        <div className="mt-3">
          <div className="flex justify-between text-xs text-ink/60 mb-1">
            <span>{formatINR(progress.saved)} saved</span>
            <span>{Math.round(progress.progress * 100)}%</span>
          </div>
          <div className="h-3 bg-[#8a5a2b]/25 overflow-hidden shadow-[inset_0_0_0_2px_#3a2410]">
            <motion.div
              className="h-full bg-gradient-to-r from-soul-violet to-heal-green"
              initial={{ width: 0 }}
              animate={{ width: `${progress.progress * 100}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          {!pact.completed && progress.remaining > 0 && (
            <p className="text-xs text-ink/50 mt-2">{formatINR(progress.remaining)} to go</p>
          )}
        </div>

        {pact.completed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-sm text-heal-green"
          >
            ✨ Pact fulfilled! Your hero heals with pride.
          </motion.p>
        )}

        {pact.failed && !pact.completed && (
          <div className="mt-3 p-3 bg-soul-violet/10 shadow-[inset_0_0_0_2px_#7a5bd055]">
            <p className="text-sm text-soul-violet font-medium">Gentle Redemption Quest</p>
            <p className="text-xs text-ink/70 mt-1">{getRedemptionQuest(pact)}</p>
            <button
              onClick={resetPact}
              className="mt-2 text-xs text-coin-gold-deep hover:underline"
            >
              Start fresh this week →
            </button>
          </div>
        )}
      </Card>

      {/* Leaderboard */}
      <Card glow="violet">
        <h2 className="text-sm font-semibold text-soul-violet mb-1">Leaderboard</h2>
        <p className="text-xs text-ink/50 mb-4">
          Ranked on verified savings only — spending never affects your rank
        </p>

        <div className="space-y-2">
          {leaderboard.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-2.5 ${
                entry.isUser
                  ? 'bg-coin-gold/15 shadow-[inset_0_0_0_2px_#b5860b66]'
                  : 'bg-[#8a5a2b]/10'
              }`}
            >
              <span className="text-sm font-bold text-ink/50 w-6 text-center">
                {i + 1}
              </span>
              {entry.isUser ? (
                <span className="block bg-[#d8f0ff] p-[2px] shadow-[0_0_0_2px_#3a2410]">
                  <Avatar config={avatar} size={28} />
                </span>
              ) : (
                <span className="text-xl">{entry.avatar}</span>
              )}
              <span className={`flex-1 text-sm font-medium ${entry.isUser ? 'text-coin-gold-deep' : 'text-ink/80'}`}>
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
