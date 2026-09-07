import { motion, AnimatePresence } from 'framer-motion'
import type { BuildingState } from '../types'
import { formatINR } from '../components/Card'
import { useState } from 'react'

interface SpendingMapProps {
  buildings: BuildingState[]
}

export function SpendingMap({ buildings }: SpendingMapProps) {
  const [selected, setSelected] = useState<BuildingState | null>(null)
  const activeBuildings = buildings.filter((b) => b.totalSpend > 0 || buildings.indexOf(b) < 7)

  return (
    <div className="relative">
      <svg viewBox="0 0 400 220" className="w-full" style={{ minHeight: 200 }}>
        {/* Sky gradient */}
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1a3e" />
            <stop offset="100%" stopColor="#252550" />
          </linearGradient>
        </defs>
        <rect width="400" height="220" fill="url(#skyGrad)" rx="12" />

        {/* Ground */}
        <rect x="0" y="190" width="400" height="30" fill="#1a1a3e" />
        <rect x="0" y="190" width="400" height="2" fill="#3ddc9730" />

        {/* Stars */}
        {[30, 80, 150, 220, 300, 360].map((x, i) => (
          <circle key={i} cx={x} cy={20 + (i % 3) * 15} r="1" fill="#f5c518" opacity={0.4 + (i % 3) * 0.2} />
        ))}

        {activeBuildings.map((building, i) => {
          const x = 20 + i * 52
          const h = building.height
          const y = 190 - h
          const w = 40

          return (
            <g key={building.location} onClick={() => setSelected(building)} className="cursor-pointer">
              <motion.rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={building.color}
                fillOpacity={building.mood === 'ominous' ? 0.85 : 0.6}
                stroke={building.color}
                strokeWidth={1}
                rx={building.mood === 'tidy' ? 6 : 2}
                initial={{ height: 0, y: 190 }}
                animate={{ height: h, y }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
              />
              {/* Windows */}
              {building.mood !== 'tidy' &&
                Array.from({ length: Math.floor(h / 20) }).map((_, wi) => (
                  <rect
                    key={wi}
                    x={x + 8}
                    y={y + 8 + wi * 20}
                    width={8}
                    height={6}
                    fill="#f5c518"
                    opacity={0.3}
                    rx={1}
                  />
                ))}
              <text
                x={x + w / 2}
                y={205}
                textAnchor="middle"
                fill="#e8e8f0"
                fontSize="7"
                opacity={0.7}
              >
                {building.location.length > 8
                  ? building.location.slice(0, 7) + '…'
                  : building.location}
              </text>
            </g>
          )
        })}
      </svg>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-3 p-3 rounded-xl bg-vault-indigo-light border border-white/10"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-coin-gold">{selected.location}</p>
                <p className="text-sm text-white/70 mt-1">{formatINR(selected.totalSpend)} total</p>
                <p className="text-xs text-white/50 mt-2">{selected.tip}</p>
              </div>
              <button
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
