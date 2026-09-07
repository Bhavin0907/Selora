import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Avatar } from '../components/Avatar'
import { Card } from '../components/Card'
import { useStore } from '../store/useStore'
import { computeSoulState, getMoodLabel } from '../lib/soul'
import { sfx } from '../lib/sfx'
import {
  CATEGORIES,
  optionLabel,
  randomAvatar,
  swatchColor,
  type AvatarConfig,
  type CategoryDef,
} from '../lib/avatar'

/** A single option thumbnail — a mini avatar with just this category swapped. */
function OptionThumb({
  base,
  category,
  optionId,
  selected,
  onSelect,
}: {
  base: AvatarConfig
  category: CategoryDef
  optionId: string
  selected: boolean
  onSelect: () => void
}) {
  const preview = useMemo<AvatarConfig>(
    () => ({ ...base, [category.id]: optionId }),
    [base, category.id, optionId],
  )

  return (
    <button
      type="button"
      onClick={onSelect}
      title={optionLabel(optionId)}
      className={`relative shrink-0 bg-[#0a0a0f] p-1 ${
        selected ? 'avatar-opt-selected' : 'shadow-[0_0_0_2px_#000,0_0_0_3px_#2a2a3e]'
      }`}
    >
      <Avatar config={preview} size={40} />
      {category.kind === 'color' && (
        <span
          className="absolute bottom-1 right-1 block w-2 h-2 shadow-[0_0_0_1px_#000]"
          style={{ background: swatchColor(category.id, optionId) }}
        />
      )}
    </button>
  )
}

export function CreatePage() {
  const navigate = useNavigate()
  const savedAvatar = useStore((s) => s.avatar)
  const setAvatar = useStore((s) => s.setAvatar)
  const spends = useStore((s) => s.spends)
  const savings = useStore((s) => s.savings)

  const [draft, setDraft] = useState<AvatarConfig>(savedAvatar)
  const [activeCat, setActiveCat] = useState<CategoryDef>(CATEGORIES[0])

  const soul = useMemo(() => computeSoulState(spends, savings), [spends, savings])

  const options = activeCat.options
  const currentId = draft[activeCat.id]
  const currentIndex = Math.max(0, options.indexOf(currentId))

  const setOption = (id: string) => {
    setDraft((d) => ({ ...d, [activeCat.id]: id }))
    sfx.blip()
  }

  const cycle = (dir: 1 | -1) => {
    const next = options[(currentIndex + dir + options.length) % options.length]
    setOption(next)
  }

  const handleTab = (cat: CategoryDef) => {
    setActiveCat(cat)
    sfx.blip()
  }

  const handleRandomize = () => {
    setDraft(randomAvatar())
    sfx.select()
  }

  const handleSave = () => {
    setAvatar(draft)
    sfx.levelUp()
    navigate('/')
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Create Your Soul</h1>
          <p className="text-sm text-white/50">Build your pixel avatar</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="font-pixel text-[0.5rem] px-2 py-1.5 bg-[#1b1b2e] text-white/70 shadow-[0_0_0_2px_#000] active:translate-y-[1px]"
          title="Cancel"
        >
          ✕
        </button>
      </header>

      {/* Live preview */}
      <Card glow="violet" className="flex flex-col items-center py-6">
        <div className="p-2 bg-[#0a0a0f] shadow-[0_0_0_3px_#000,0_0_0_5px_#9b5de5]">
          <Avatar config={draft} size={176} auraColor={soul.auraColor} bob />
        </div>
        <p
          className="mt-3 font-pixel text-[0.5rem] pixel-shadow-sm"
          style={{ color: soul.auraColor }}
        >
          MOOD: {getMoodLabel(soul.mood).toUpperCase()}
        </p>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={handleRandomize}
            className="retro-btn retro-btn--gold flex items-center gap-1"
          >
            <span aria-hidden>🎲</span> Random
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="retro-btn retro-btn--green flex items-center gap-1"
          >
            <span aria-hidden>💾</span> Save
          </button>
        </div>
      </Card>

      {/* Category tabs */}
      <div className="grid grid-cols-4 gap-1.5">
        {CATEGORIES.map((cat) => {
          const isActive = cat.id === activeCat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleTab(cat)}
              className={`font-pixel text-[0.4rem] leading-tight px-1 py-2 shadow-[0_0_0_2px_#000] active:translate-y-[1px] ${
                isActive ? 'bg-soul-violet text-black' : 'bg-[#1b1b2e] text-white/60'
              }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Active category selector */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-coin-gold">{activeCat.label}</h2>
          <span className="font-body text-white/50 text-lg">
            {optionLabel(currentId)} ({currentIndex + 1}/{options.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => cycle(-1)}
            className="font-pixel text-sm text-coin-gold px-2 py-3 bg-[#0a0a0f] shadow-[0_0_0_2px_#000,inset_0_0_0_2px_#2a2a3e] active:translate-y-[1px]"
            aria-label={`Previous ${activeCat.label}`}
          >
            ◀
          </button>

          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-2 py-1">
              {options.map((optId) => (
                <OptionThumb
                  key={optId}
                  base={draft}
                  category={activeCat}
                  optionId={optId}
                  selected={optId === currentId}
                  onSelect={() => setOption(optId)}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => cycle(1)}
            className="font-pixel text-sm text-coin-gold px-2 py-3 bg-[#0a0a0f] shadow-[0_0_0_2px_#000,inset_0_0_0_2px_#2a2a3e] active:translate-y-[1px]"
            aria-label={`Next ${activeCat.label}`}
          >
            ▶
          </button>
        </div>
      </Card>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-white/40 font-body text-base"
      >
        Mood only tints the aura — your look is yours.
      </motion.p>
    </div>
  )
}
