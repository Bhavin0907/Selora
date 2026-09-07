import { Suspense, lazy, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { BuildingState } from '../../types'
import { formatINR } from '../Card'
import { hasWebGL } from '../../lib/webgl'
import { sfx } from '../../lib/sfx'
import { MapErrorBoundary } from '../Map3D/MapErrorBoundary'
import { OverworldMap } from './OverworldMap'
import type { ControlsApi, Greeting } from './OverworldScene'

const Overworld3D = lazy(() => import('./Overworld3D'))

interface MapViewProps {
  buildings: BuildingState[]
  totalSpend: number
  totalSavings: number
  isEmpty: boolean
  currentLocation?: string
  greeting: Greeting
}

function LoadingWorld() {
  return (
    <div className="h-[340px] flex items-center justify-center">
      <div className="retro-panel retro-panel--blue text-center">
        <p className="font-pixel text-[0.55rem] text-ink animate-blink">LOADING WORLD…</p>
      </div>
    </div>
  )
}

export function MapView(props: MapViewProps) {
  const { buildings, totalSpend, totalSavings, isEmpty, currentLocation, greeting } = props
  const webgl = hasWebGL()
  const [mode, setMode] = useState<'3d' | '2d'>(webgl ? '3d' : '2d')
  const [selected, setSelected] = useState<BuildingState | null>(null)
  const controlsApi = useRef<ControlsApi | null>(null)

  const twoD = (
    <OverworldMap
      buildings={buildings}
      totalSpend={totalSpend}
      totalSavings={totalSavings}
      isEmpty={isEmpty}
      currentLocation={currentLocation}
    />
  )

  const pct = (b: BuildingState) =>
    totalSpend > 0 ? Math.round((b.totalSpend / totalSpend) * 100) : 0

  const select = (b: BuildingState) => {
    setSelected(b)
    sfx.select()
  }

  const toggle = () => {
    setSelected(null)
    setMode((m) => (m === '3d' ? '2d' : '3d'))
    sfx.blip()
  }

  return (
    <div className="relative">
      {/* control buttons */}
      {webgl && (
        <div className="absolute top-2 right-2 z-30 flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              controlsApi.current?.recenter()
              sfx.blip()
            }}
            className={`font-pixel text-[0.45rem] px-2 py-1.5 bg-[#fffaf0] text-wood-dark shadow-[0_0_0_2px_#3a2410] active:translate-y-[1px] ${
              mode === '3d' ? '' : 'hidden'
            }`}
            title="Recenter camera"
          >
            ⟳
          </button>
          <button
            type="button"
            onClick={toggle}
            className="font-pixel text-[0.45rem] px-2 py-1.5 bg-[#8a5a2b] text-[#fff7e0] shadow-[0_0_0_2px_#3a2410] active:translate-y-[1px]"
            title="Toggle 2D / 3D view"
          >
            {mode === '3d' ? '3D' : '2D'}
          </button>
        </div>
      )}

      {mode === '2d' ? (
        twoD
      ) : (
        <MapErrorBoundary fallback={twoD}>
          <Suspense fallback={<LoadingWorld />}>
            <Overworld3D
              buildings={buildings}
              totalSavings={totalSavings}
              currentLocation={currentLocation}
              focusId={selected?.location}
              greeting={greeting}
              onSelect={select}
              controlsApi={controlsApi}
            />
          </Suspense>

          {/* Empty state */}
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
              <div className="retro-panel retro-panel--blue text-center">
                <p className="font-body text-lg leading-tight text-ink">
                  Uncharted waters —<br />log a spend to grow your world
                </p>
              </div>
            </div>
          )}

          {/* SNES message box on node tap (spring pop) */}
          <AnimatePresence>
            {selected && (
              <motion.div
                key={selected.location}
                initial={{ opacity: 0, scale: 0.7, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                className="absolute left-3 right-3 bottom-3 retro-panel retro-panel--gold z-20"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-pixel text-[0.6rem] text-wood-dark pixel-shadow-sm">
                      {selected.location.toUpperCase()}
                    </p>
                    <p className="font-body text-xl text-ink mt-1">
                      {formatINR(selected.totalSpend)}
                    </p>
                    <p className="font-body text-base text-ink/60">
                      {pct(selected)}% of total spending
                    </p>
                    <p className="font-body text-base text-ink/80 mt-1 leading-tight">
                      {selected.tip}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="font-pixel text-[0.6rem] text-wood-dark hover:text-ink shrink-0"
                  >
                    X
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </MapErrorBoundary>
      )}
    </div>
  )
}
