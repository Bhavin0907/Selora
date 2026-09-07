import { Canvas } from '@react-three/fiber'
import type { BuildingState } from '../../types'
import { CityScene } from './CityScene'

interface SpendingWorld3DProps {
  buildings: BuildingState[]
  totalSpend: number
  totalSavings: number
  isEmpty: boolean
}

export function SpendingWorld3D({
  buildings,
  totalSpend,
  totalSavings,
  isEmpty,
}: SpendingWorld3DProps) {
  return (
    <div className="h-[340px] w-full relative">
      <Canvas
        camera={{ position: [8, 7, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <CityScene
          buildings={buildings}
          totalSpend={totalSpend}
          totalSavings={totalSavings}
          isEmpty={isEmpty}
        />
      </Canvas>
    </div>
  )
}
