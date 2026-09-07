import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import type { BuildingState } from '../../types'
import { formatINR } from '../Card'

interface IsometricCityFallbackProps {
  buildings: BuildingState[]
  totalSpend: number
  totalSavings: number
  isEmpty: boolean
  reason?: string
}

export function IsometricCityFallback({
  buildings,
  totalSpend,
  totalSavings,
  isEmpty,
  reason,
}: IsometricCityFallbackProps) {
  const [selected, setSelected] = useState<BuildingState | null>(null)
  const active = buildings.filter((b) => b.totalSpend > 0)

  const pct =
    selected && totalSpend > 0
      ? Math.round((selected.totalSpend / totalSpend) * 100)
      : 0

  return (
    <div className="relative h-[340px] overflow-hidden bg-[#12122a] rounded-xl">
      {reason && (
        <div className="absolute top-2 left-2 right-2 z-20 px-2 py-1 rounded-lg bg-danger-red/15 border border-danger-red/30 text-[10px] text-danger-red/90 text-center">
          3D map failed to load — showing 2.5D view
        </div>
      )}

      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 rounded-full bg-coin-gold/50"
            style={{
              left: `${(i * 17 + 5) % 100}%`,
              top: `${(i * 13 + 3) % 45}%`,
            }}
          />
        ))}
      </div>

      {/* CSS 3D isometric stage */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ perspective: '700px' }}
      >
        <div
          className="relative w-[280px] h-[200px]"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'rotateX(52deg) rotateZ(-45deg)',
          }}
        >
          {/* Island base */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-soul-violet/40"
            style={{
              width: 220,
              height: 220,
              background: 'linear-gradient(135deg, #1a1a3e 0%, #252550 100%)',
              boxShadow: '0 0 30px #9b5de530, inset 0 0 20px #9b5de515',
              transform: 'translateZ(0px)',
            }}
          />

          {/* Grid lines */}
          <svg
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-30"
            width="220"
            height="220"
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <g key={i}>
                <line x1={i * 27.5} y1={0} x2={i * 27.5} y2={220} stroke="#9b5de5" strokeWidth="0.5" />
                <line x1={0} y1={i * 27.5} x2={220} y2={i * 27.5} stroke="#9b5de5" strokeWidth="0.5" />
              </g>
            ))}
          </svg>

          {/* Savings monument (center) */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ transform: 'translateZ(20px)' }}
          >
            <div
              className="rounded-full bg-heal-green/30 border border-heal-green/50 animate-pulse"
              style={{
                width: 24 + Math.min(totalSavings / 200, 40),
                height: 24 + Math.min(totalSavings / 200, 40),
                boxShadow: '0 0 16px #3ddc9760',
              }}
            />
            <div
              className="w-2 bg-heal-green rounded-t-sm mt-0.5"
              style={{ height: 12 + Math.min(totalSavings / 500, 24) }}
            />
          </div>

          {/* Buildings */}
          {active.map((building, i) => {
            const angle = (i / Math.max(active.length, 1)) * Math.PI * 2
            const radius = 70
            const x = 110 + Math.cos(angle) * radius - 14
            const y = 110 + Math.sin(angle) * radius - 14
            const h = Math.min(20 + building.totalSpend / 80, 80)

            return (
              <motion.button
                key={building.location}
                type="button"
                onClick={() => setSelected(building)}
                className="absolute cursor-pointer border-0 p-0 bg-transparent"
                style={{
                  left: x,
                  top: y - h,
                  width: 28,
                  transform: `translateZ(${8 + i * 2}px)`,
                }}
                initial={{ height: 0 }}
                animate={{ height: h }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
              >
                <div
                  className="w-full rounded-t-sm relative overflow-hidden"
                  style={{
                    height: h,
                    backgroundColor: building.color,
                    opacity: building.mood === 'ominous' ? 0.9 : 0.75,
                    boxShadow:
                      building.mood === 'ominous'
                        ? '0 0 12px #ff6b6b80'
                        : `0 0 8px ${building.color}40`,
                  }}
                >
                  {building.mood !== 'tidy' &&
                    Array.from({ length: Math.floor(h / 14) }).map((_, wi) => (
                      <div
                        key={wi}
                        className="absolute left-1.5 w-2 h-1 bg-coin-gold/50 rounded-sm"
                        style={{ top: 4 + wi * 14 }}
                      />
                    ))}
                  {building.mood === 'tidy' && (
                    <div
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0"
                      style={{
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderBottom: `8px solid ${building.color}`,
                      }}
                    />
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-white/70 text-center px-6 py-3 rounded-xl bg-vault-indigo/80 border border-soul-violet/30 max-w-[240px]">
            Your city is waiting — log a spend to build it
          </p>
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-3 left-3 right-3 z-20 p-3 rounded-xl bg-vault-indigo/95 border border-coin-gold/30"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-coin-gold text-sm">{selected.location}</p>
                <p className="text-white font-bold">{formatINR(selected.totalSpend)}</p>
                <p className="text-xs text-white/50">{pct}% of total spending</p>
                <p className="text-xs text-white/70 mt-1">{selected.tip}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-white/40 hover:text-white text-lg leading-none"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
