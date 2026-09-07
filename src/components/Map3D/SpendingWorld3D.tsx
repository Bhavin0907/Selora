import { Canvas } from '@react-three/fiber'
import { EffectComposer, Pixelation } from '@react-three/postprocessing'
import type { BuildingState } from '../../types'
import { usePrefersReducedMotion } from '../../lib/useReducedMotion'
import { CityScene, type CityControlsApi } from './CityScene'

interface SpendingWorld3DProps {
  buildings: BuildingState[]
  totalSpend: number
  totalSavings: number
  isEmpty: boolean
  currentLocation?: string
  onSelect: (b: BuildingState) => void
  controlsApi: { current: CityControlsApi | null }
}

/** Lazy-loaded 3D spending city — low-poly, pixelated, retro. */
export default function SpendingWorld3D({
  buildings,
  totalSpend,
  totalSavings,
  isEmpty,
  currentLocation,
  onSelect,
  controlsApi,
}: SpendingWorld3DProps) {
  const reduced = usePrefersReducedMotion()

  return (
    <div className="h-[340px] w-full relative">
      <Canvas
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={reduced ? 1 : [1, 2]}
        camera={{ position: [8, 7, 8], fov: 42 }}
      >
        <CityScene
          buildings={buildings}
          totalSpend={totalSpend}
          totalSavings={totalSavings}
          isEmpty={isEmpty}
          currentLocation={currentLocation}
          reduced={reduced}
          onSelect={onSelect}
          controlsApi={controlsApi}
        />
        <EffectComposer>
          <Pixelation granularity={reduced ? 3 : 5} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}

export type { CityControlsApi }
