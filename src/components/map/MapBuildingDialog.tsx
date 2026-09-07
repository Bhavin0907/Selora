import { AnimatePresence, motion } from 'framer-motion'
import type { BuildingState } from '../../types'
import { formatINR } from '../Card'

interface MapBuildingDialogProps {
  building: BuildingState | null
  totalSpend: number
  onClose: () => void
}

export function MapBuildingDialog({ building, totalSpend, onClose }: MapBuildingDialogProps) {
  const pct =
    building && totalSpend > 0 ? Math.round((building.totalSpend / totalSpend) * 100) : 0

  return (
    <AnimatePresence>
      {building && (
        <motion.div
          key={building.location}
          initial={{ opacity: 0, scale: 0.7, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          className="absolute left-3 right-3 bottom-3 retro-panel retro-panel--gold z-30 pointer-events-auto"
        >
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <p className="font-pixel text-[0.6rem] text-wood-dark pixel-shadow-sm">
                {building.location.toUpperCase()}
              </p>
              <p className="font-body text-xl text-ink mt-1">{formatINR(building.totalSpend)}</p>
              <p className="font-body text-base text-ink/60">{pct}% of total spending</p>
              <p className="font-body text-base text-ink/80 mt-1 leading-tight">{building.tip}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="font-pixel text-[0.6rem] text-wood-dark hover:text-ink shrink-0"
            >
              X
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
