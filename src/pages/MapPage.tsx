import { useMemo } from 'react'
import { Card } from '../components/Card'
import { computeBuildings } from '../lib/map'
import { getAllLocations, useStore } from '../store/useStore'
import { MapView } from '../components/IsoWorld/MapView'

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
  const currentLocation = spends[0]?.location

  // Entrance greeting for the world avatar, derived from existing state only:
  // whichever activity is most recent (big spend ≥ ₹2000 reads as worried).
  const greeting = useMemo<'save' | 'spend' | 'bigspend' | 'none'>(() => {
    const lastSpend = spends[0]
    const lastSaving = savings[0]
    if (!lastSpend && !lastSaving) return 'none'
    const saveNewer = (lastSaving?.timestamp ?? -1) >= (lastSpend?.timestamp ?? -1)
    if (saveNewer && lastSaving) return 'save'
    if (lastSpend) return lastSpend.amount >= 2000 ? 'bigspend' : 'spend'
    return 'none'
  }, [spends, savings])

  return (
    <div className="space-y-4">
      <header>
        <h1>World Map</h1>
        <p className="font-body text-base text-ink/70">Your islands grow with every spend</p>
      </header>

      <Card glow="green" className="!p-1 overflow-hidden">
        <MapView
          buildings={activeBuildings}
          totalSpend={totalSpend}
          totalSavings={totalSavings}
          isEmpty={isEmpty}
          currentLocation={currentLocation}
          greeting={greeting}
        />
      </Card>

      <Card>
        <h2 className="mb-3">Legend</h2>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1.5 p-2 bg-grass/15 shadow-[inset_0_0_0_2px_#2e7d3266]">
            <span className="text-xl">🏡</span>
            <span className="font-body text-sm text-grass-dark text-center">Cozy cottage</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2 bg-coin-gold/15 shadow-[inset_0_0_0_2px_#b5860b66]">
            <span className="text-xl">🏠</span>
            <span className="font-body text-sm text-coin-gold-deep text-center">Busy house</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2 bg-danger-red/15 shadow-[inset_0_0_0_2px_#d6454566]">
            <span className="text-xl">🏰</span>
            <span className="font-body text-sm text-danger-red text-center">Storm fortress</span>
          </div>
        </div>
        <p className="font-body text-sm text-ink/60 mt-3">
          Tap a node for its spend, share & a tip. Savings grow the golden tree; your hero stands on the latest node.
        </p>
      </Card>
    </div>
  )
}
