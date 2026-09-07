import { Canvas } from '@react-three/fiber'
import { EffectComposer, Pixelation } from '@react-three/postprocessing'
import type { BuildingState } from '../../types'
import { usePrefersReducedMotion } from '../../lib/useReducedMotion'
import { OverworldScene, type ControlsApi, type Greeting } from './OverworldScene'

interface Overworld3DProps {
  buildings: BuildingState[]
  totalSavings: number
  currentLocation?: string
  focusId?: string
  greeting: Greeting
  onSelect: (b: BuildingState) => void
  controlsApi: { current: ControlsApi | null }
}

/**
 * 3D overworld canvas. Renders at full res with AA, then a Pixelation
 * post-process gives a clean, consistent 16-bit look (no edge shimmer from
 * fractional resolutions). Lazy-loaded and error-bounded so the 2D map is
 * always the safety net. Default export so it can be React.lazy()'d.
 */
export default function Overworld3D({
  buildings,
  totalSavings,
  currentLocation,
  focusId,
  greeting,
  onSelect,
  controlsApi,
}: Overworld3DProps) {
  const reduced = usePrefersReducedMotion()

  return (
    <div className="h-[340px] w-full relative">
      <Canvas
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={reduced ? 1 : [1, 2]}
        camera={{ position: [7.5, 7.5, 11], fov: 38 }}
      >
        <OverworldScene
          buildings={buildings}
          totalSavings={totalSavings}
          currentLocation={currentLocation}
          focusId={focusId}
          greeting={greeting}
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
