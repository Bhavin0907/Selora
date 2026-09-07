import { useMemo } from 'react'
import { Card } from '../components/Card'
import { computeBuildings } from '../lib/map'
import { getAllLocations, useStore } from '../store/useStore'
import { MapErrorBoundary } from '../components/Map3D/MapErrorBoundary'
import { IsoWorld } from '../components/IsoWorld/IsoWorld'

export function MapPage() {
  const spends = useStore((s) => s.spends)
  const savings = useStore((s) => s.savings)
  const customLocations = useStore((s) => s.customLocations)

  const locations = useMemo(
    () => getAllLocations({ customLocations }),
    [customLocations],
  )

  const buildings = useMemo(
    () => computeBuildings(spends, savings, locations),
    [spends, savings, locations],
  )

  const activeBuildings = buildings.filter((b) => b.totalSpend > 0)
  const totalSpend = spends.reduce((s, sp) => s + sp.amount, 0)
  const totalSavings = savings.reduce((s, sv) => s + sv.amount, 0)
  const isEmpty = totalSpend === 0

  return (
    <div className="space-y-4">
      <header>
        <h1>Spending Map</h1>
        <p className="font-body text-base text-white/50">Your city grows with every spend</p>
      </header>

      <Card glow="violet" className="!p-1 overflow-hidden">
        <MapErrorBoundary
          fallback={
            <div className="h-[300px] flex items-center justify-center">
              <p className="font-body text-lg text-danger-red">Map failed to load</p>
            </div>
          }
        >
          <IsoWorld
            buildings={activeBuildings}
            totalSpend={totalSpend}
            totalSavings={totalSavings}
            isEmpty={isEmpty}
          />
        </MapErrorBoundary>
      </Card>

      <Card>
        <h2 className="mb-3">Legend</h2>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1.5 p-2 bg-heal-green/10 shadow-[inset_0_0_0_2px_#3ddc9740]">
            <div className="w-4 h-3 bg-heal-green" />
            <span className="font-body text-sm text-heal-green/80 text-center">Tidy cottage</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2 bg-coin-gold/10 shadow-[inset_0_0_0_2px_#f5c51840]">
            <div className="w-3 h-5 bg-coin-gold" />
            <span className="font-body text-sm text-coin-gold/80 text-center">Moderate</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2 bg-danger-red/10 shadow-[inset_0_0_0_2px_#ff6b6b40]">
            <div className="w-2.5 h-7 bg-danger-red iso-lamp" />
            <span className="font-body text-sm text-danger-red/80 text-center">Ominous tower</span>
          </div>
        </div>
        <p className="font-body text-sm text-white/40 mt-3">
          Tap a building for its spend, share & a tip. Savings grow the central crystal.
        </p>
      </Card>
    </div>
  )
}
