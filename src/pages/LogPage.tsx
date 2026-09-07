import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Card } from '../components/Card'
import {
  getSortedLocations,
  getSortedReasons,
  useStore,
} from '../store/useStore'
import { anchorOf, fx } from '../lib/fx'
import { computeSoulState } from '../lib/soul'

type LogMode = 'spend' | 'save'

interface FormErrors {
  amount?: string
  location?: string
  reason?: string
}

export function LogPage() {
  const [mode, setMode] = useState<LogMode>('spend')
  const [amount, setAmount] = useState('')
  const [location, setLocation] = useState('')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [success, setSuccess] = useState(false)
  const [showAddLocation, setShowAddLocation] = useState(false)
  const [showAddReason, setShowAddReason] = useState(false)
  const [newLocation, setNewLocation] = useState('')
  const [newReason, setNewReason] = useState('')
  const submitRef = useRef<HTMLButtonElement>(null)

  const addSpend = useStore((s) => s.addSpend)
  const addSaving = useStore((s) => s.addSaving)
  const addLocation = useStore((s) => s.addLocation)
  const addReasonToStore = useStore((s) => s.addReason)
  const customLocations = useStore((s) => s.customLocations)
  const customReasons = useStore((s) => s.customReasons)
  const recentLocations = useStore((s) => s.recentLocations)
  const recentReasons = useStore((s) => s.recentReasons)

  const sortedLocations = useMemo(
    () => getSortedLocations({ customLocations, recentLocations }),
    [customLocations, recentLocations],
  )

  const sortedReasons = useMemo(
    () => getSortedReasons({ customReasons, recentReasons }),
    [customReasons, recentReasons],
  )

  const validate = (): FormErrors => {
    const next: FormErrors = {}
    const num = parseFloat(amount)

    if (!amount.trim() || Number.isNaN(num) || num <= 0) {
      next.amount = 'Enter an amount greater than ₹0'
    }

    if (mode === 'spend') {
      if (!location.trim()) {
        next.location = 'Pick a location'
      }
      if (!reason.trim()) {
        next.reason = 'Pick a reason'
      }
    }

    return next
  }

  const resetForm = () => {
    setAmount('')
    setNote('')
    if (mode === 'spend') {
      setLocation('')
      setReason('')
    }
  }

  const triggerSuccess = () => {
    setSuccess(true)
    setTimeout(() => setSuccess(false), 1400)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate()
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const num = parseFloat(amount)

    if (mode === 'spend') {
      addSpend(num, location.trim(), reason.trim())
    } else {
      addSaving(num, note.trim() || undefined)
    }

    // Coin-arc feedback (A2): coins arc up from the button + "+₹X" pixel text.
    fx.emit('coins', {
      kind: mode === 'save' ? 'save' : 'spend',
      amount: num,
      anchor: anchorOf(submitRef.current),
    })

    // Companion reaction thought bubble:
    const updatedSpends = useStore.getState().spends
    const updatedSavings = useStore.getState().savings
    const currentMood = computeSoulState(updatedSpends, updatedSavings).mood

    fx.emit('companionThought', {
      kind: mode === 'save' ? 'save' : 'spend',
      mood: currentMood,
      amount: num,
      reason: mode === 'spend' ? reason.trim() : undefined,
    })

    resetForm()
    triggerSuccess()
  }

  const handleAddLocation = () => {
    const trimmed = newLocation.trim()
    if (!trimmed) return
    addLocation(trimmed)
    setLocation(trimmed)
    setNewLocation('')
    setShowAddLocation(false)
    setErrors((prev) => ({ ...prev, location: undefined }))
  }

  const handleAddReason = () => {
    const trimmed = newReason.trim()
    if (!trimmed) return
    addReasonToStore(trimmed)
    setReason(trimmed)
    setNewReason('')
    setShowAddReason(false)
    setErrors((prev) => ({ ...prev, reason: undefined }))
  }

  const switchMode = (next: LogMode) => {
    setMode(next)
    setErrors({})
  }

  return (
    <div className="space-y-4 relative">
      <header>
        <h1 className="text-2xl font-bold text-ink">Log</h1>
        <p className="text-sm text-ink/70">Track spending & savings</p>
      </header>

      <div className="flex bg-vault-indigo-light p-1 shadow-[0_0_0_2px_#3a2410]">
        <button
          type="button"
          onClick={() => switchMode('spend')}
          className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
            mode === 'spend'
              ? 'bg-danger-red text-[#fff7e0]'
              : 'text-ink/60 hover:text-ink'
          }`}
        >
          Log Spend
        </button>
        <button
          type="button"
          onClick={() => switchMode('save')}
          className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
            mode === 'save'
              ? 'bg-heal-green text-[#fff7e0]'
              : 'text-ink/60 hover:text-ink'
          }`}
        >
          Log Savings
        </button>
      </div>

      <Card glow={mode === 'save' ? 'green' : 'none'}>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="log-amount" className="text-xs text-ink/60 block mb-1">
              Amount (₹)
            </label>
            <input
              id="log-amount"
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setErrors((prev) => ({ ...prev, amount: undefined }))
              }}
              placeholder="0"
              className={`w-full px-4 py-3 text-xl font-bold ${
                errors.amount ? 'shadow-[0_0_0_2px_#3a2410,inset_0_0_0_2px_#d64545]' : ''
              }`}
              min="0.01"
              step="any"
            />
            {errors.amount && (
              <p className="text-xs text-danger-red mt-1">{errors.amount}</p>
            )}
          </div>

          {mode === 'spend' ? (
            <>
              <div>
                <label htmlFor="log-location" className="text-xs text-ink/60 block mb-1">
                  Location
                </label>
                <select
                  id="log-location"
                  value={location}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '__add__') {
                      setShowAddLocation(true)
                      return
                    }
                    setLocation(val)
                    setErrors((prev) => ({ ...prev, location: undefined }))
                  }}
                  className={`w-full px-4 py-3 ${
                    errors.location ? 'shadow-[0_0_0_2px_#3a2410,inset_0_0_0_2px_#d64545]' : ''
                  }`}
                >
                  <option value="">Select location</option>
                  {sortedLocations.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                  <option value="__add__">+ Add new</option>
                </select>
                {errors.location && (
                  <p className="text-xs text-danger-red mt-1">{errors.location}</p>
                )}
              </div>

              <div>
                <label htmlFor="log-reason" className="text-xs text-ink/60 block mb-1">
                  Reason
                </label>
                <select
                  id="log-reason"
                  value={reason}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '__add__') {
                      setShowAddReason(true)
                      return
                    }
                    setReason(val)
                    setErrors((prev) => ({ ...prev, reason: undefined }))
                  }}
                  className={`w-full px-4 py-3 ${
                    errors.reason ? 'shadow-[0_0_0_2px_#3a2410,inset_0_0_0_2px_#d64545]' : ''
                  }`}
                >
                  <option value="">Select reason</option>
                  {sortedReasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                  <option value="__add__">+ Add new</option>
                </select>
                {errors.reason && (
                  <p className="text-xs text-danger-red mt-1">{errors.reason}</p>
                )}
              </div>
            </>
          ) : (
            <div>
              <label htmlFor="log-note" className="text-xs text-ink/60 block mb-1">
                Note (optional)
              </label>
              <input
                id="log-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Monthly SIP"
                className="w-full px-4 py-3"
              />
            </div>
          )}

          <button
            ref={submitRef}
            type="submit"
            className={`w-full py-3 font-semibold text-vault-indigo transition-transform active:scale-[0.98] ${
              mode === 'save' ? 'bg-heal-green glow-green' : 'bg-coin-gold glow-gold'
            }`}
          >
            {mode === 'save' ? 'Deposit Savings' : 'Log Spend'}
          </button>
        </form>
      </Card>

      {showAddLocation && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <h3 className="font-semibold mb-3">Add Location</h3>
            <input
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
              placeholder="e.g. Gym"
              className="w-full px-4 py-2 mb-3"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddLocation(false)}
                className="flex-1 py-2 bg-[#8a5a2b] text-[#fff7e0] shadow-[0_0_0_2px_#3a2410]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddLocation}
                className="flex-1 py-2 bg-coin-gold text-vault-indigo font-semibold shadow-[0_0_0_2px_#3a2410]"
              >
                Add
              </button>
            </div>
          </Card>
        </div>
      )}

      {showAddReason && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <h3 className="font-semibold mb-3">Add Reason</h3>
            <input
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddReason()}
              placeholder="e.g. Entertainment"
              className="w-full px-4 py-2 mb-3"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddReason(false)}
                className="flex-1 py-2 bg-[#8a5a2b] text-[#fff7e0] shadow-[0_0_0_2px_#3a2410]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddReason}
                className="flex-1 py-2 bg-coin-gold text-vault-indigo font-semibold shadow-[0_0_0_2px_#3a2410]"
              >
                Add
              </button>
            </div>
          </Card>
        </div>
      )}

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -30 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="flex flex-col items-center gap-2">
              <motion.div
                initial={{ y: -80, rotate: -20 }}
                animate={{ y: 0, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="text-6xl"
              >
                {mode === 'save' ? '💰' : '🪙'}
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: 'spring' }}
                className="flex items-center gap-2 bg-heal-green/20 border border-heal-green/40 rounded-full px-4 py-2"
              >
                <span className="text-heal-green text-lg">✓</span>
                <span className="text-sm font-medium text-heal-green">
                  {mode === 'save' ? 'Savings logged!' : 'Spend logged!'}
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
